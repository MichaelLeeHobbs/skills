#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve, sep } from 'node:path';

const USAGE = `Usage: node srs-coverage.mjs <srs-dir> --tests <path>... [--write-summary] [--date YYYY-MM-DD] [--json]

Maps requirement IDs in test names to the SRS: Accepted requirements with Verify Test and no test,
tests citing unknown or superseded IDs, and per-area counts. --write-summary rewrites the block
between the srs-summary markers in the SRS README.
Exit 0 clean, 1 findings (or the summary could not be written), 2 usage error.`;

// ---- SRS parsing. srs/scripts/srs-lint.mjs carries its own copy of this block because each skill
// ---- installs on its own. Change both together; each copy is pinned by its own skill's tests.

const ID_RE = /^[A-Z][A-Z0-9]*-[A-Z][A-Z0-9]*-\d{2,}$/;
const PRI = ['P1', 'P2', 'P3'];
const VERIFY = ['Test', 'Demonstration', 'Inspection', 'Analysis'];
const STATUS = ['Proposed', 'Accepted', 'Deferred', 'Rejected', 'Superseded'];
const VERDICTS = ['Met', 'Partial', 'Not met', 'Regressed', 'Cannot verify'];
const REQ_COLUMNS = ['id', 'requirement', 'pri', 'verify', 'status'];
const SUMMARY_START = '<!-- srs-summary:start -->';
const SUMMARY_END = '<!-- srs-summary:end -->';

function splitRow(line) {
  const t = line.trim();
  if (!t.startsWith('|')) return null;
  const cells = [];
  let cur = '';
  for (let i = 1; i < t.length; i++) {
    const c = t[i];
    if (c === '\\' && t[i + 1] === '|') {
      cur += '|';
      i++;
    } else if (c === '|') {
      cells.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  if (cur.trim() !== '') cells.push(cur.trim());
  return cells;
}

const isSeparator = (cells) => cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c));

function parseTables(text) {
  const lines = text.split(/\r?\n/);
  const tables = [];
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(```|~~~)/.test(lines[i])) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const header = splitRow(lines[i]);
    const sepCells = i + 1 < lines.length ? splitRow(lines[i + 1]) : null;
    if (!header || !sepCells || !isSeparator(sepCells)) continue;
    const table = { line: i + 1, header: header.map((h) => h.toLowerCase()), rows: [] };
    let j = i + 2;
    for (; j < lines.length; j++) {
      const cells = splitRow(lines[j]);
      if (!cells) break;
      table.rows.push({ line: j + 1, cells });
    }
    tables.push(table);
    i = j - 1;
  }
  return tables;
}

function listMarkdown(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listMarkdown(full));
    else if (name.toLowerCase().endsWith('.md')) out.push(full);
  }
  return out;
}

function parseStatus(cell) {
  const m = /^Superseded(?:\s+by\s+(\S+?))?\.?$/.exec(cell);
  if (m) return { status: 'Superseded', supersededBy: m[1] ?? null };
  return { status: STATUS.includes(cell) ? cell : null, supersededBy: null };
}

function sections(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let inFence = false;
  lines.forEach((l, i) => {
    if (/^\s*(```|~~~)/.test(l)) inFence = !inFence;
    const m = !inFence && /^##\s+(.+?)\s*#*\s*$/.exec(l);
    if (m) out.push({ name: m[1].trim().toLowerCase(), line: i + 1, body: [] });
    else if (out.length) out[out.length - 1].body.push({ line: i + 1, text: l });
  });
  return out;
}

function loadSrs(srsDir) {
  const files = listMarkdown(srsDir);
  const rel = (f) => relative(srsDir, f).split(sep).join('/');
  const srs = { readme: null, trace: null, areaFiles: [], requirements: [], tables: [] };
  for (const f of files) {
    const r = rel(f);
    const text = readFileSync(f, 'utf8');
    if (r.toLowerCase() === 'readme.md') {
      srs.readme = { file: r, text };
      continue;
    }
    if (r.toLowerCase() === 'trace.md') {
      srs.trace = { file: r, text, tables: parseTables(text) };
      continue;
    }
    srs.areaFiles.push(r);
    for (const t of parseTables(text)) {
      if (t.header[0] !== 'id' || !t.header.includes('requirement')) continue;
      const col = Object.fromEntries(REQ_COLUMNS.map((c) => [c, t.header.indexOf(c)]));
      srs.tables.push({ file: r, line: t.line, col });
      for (const row of t.rows) {
        const cell = (c) => (col[c] >= 0 ? (row.cells[col[c]] ?? '') : null);
        const st = cell('status') === null ? { status: null, supersededBy: null } : parseStatus(cell('status'));
        srs.requirements.push({
          file: r,
          line: row.line,
          id: cell('id'),
          text: cell('requirement'),
          pri: cell('pri'),
          verify: cell('verify'),
          statusCell: cell('status'),
          status: st.status,
          supersededBy: st.supersededBy,
        });
      }
    }
  }
  return srs;
}

// ---- end of the SRS parsing block.

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', 'vendor', 'target', '.venv', 'venv', '__pycache__', '.next']);
const CODE_EXT = /\.(c|m)?(j|t)sx?$|\.(py|go|java|kt|kts|cs|rb|rs|php|swift|scala|exs?|feature)$/i;
const TEST_NAME = /([._-](test|spec)s?\.[a-z]+$)|(^test_.*\.py$)|(_test\.(go|py|rs|exs)$)|(Tests?\.(java|kt|cs|swift|scala)$)|(\.feature$)/i;
const TEST_DIR = new Set(['test', 'tests', '__tests__', 'spec', 'specs', 'e2e']);
const DECLARATION = [
  /\b(it|test|describe|context|suite|specify|scenario|feature)\b(\.\w+)*\s*[(\s]\s*[`'"]/i,
  /^\s*(Scenario|Scenario Outline|Feature|Rule|Example):/,
  /\.Run\s*\(\s*[`'"]/,
  /\bdef\s+test\w*/i,
  /\bclass\s+Test\w*/,
  /\bfunc\s+Test\w*/,
  /\bfn\s+\w+\s*\(/,
  /\bvoid\s+\w+\s*\(/,
  /\bfun\s+`/,
  /DisplayName\s*[(=]/,
];
const HYPHEN_ID = /(?<![A-Za-z0-9-])[A-Z][A-Z0-9]*-[A-Z][A-Z0-9]*-\d{2,}(?![0-9])/g;
const UNDERSCORE_ID = /(?<![A-Za-z0-9])([A-Za-z][A-Za-z0-9]*)_([A-Za-z][A-Za-z0-9]*)_(\d{2,})(?![0-9])/g;

function collectTestFiles(target, explicit, out) {
  const st = statSync(target);
  if (st.isFile()) {
    if (explicit || CODE_EXT.test(target)) out.push({ path: target, explicit });
    return;
  }
  for (const name of readdirSync(target).sort()) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(target, name);
    if (statSync(full).isDirectory()) collectTestFiles(full, false, out);
    else if (CODE_EXT.test(name)) out.push({ path: full, explicit: false });
  }
}

function isTestFile(path, root) {
  const parts = relative(root, path).split(sep);
  const name = parts[parts.length - 1];
  return TEST_NAME.test(name) || parts.slice(0, -1).some((p) => TEST_DIR.has(p.toLowerCase())) || TEST_DIR.has(basename(root).toLowerCase());
}

function findCitations(testRoots, knownIds, cwd) {
  const citations = [];
  let scanned = 0;
  for (const root of testRoots) {
    const files = [];
    collectTestFiles(root, true, files);
    for (const f of files) {
      if (!f.explicit && !isTestFile(f.path, root)) continue;
      scanned++;
      const display = shown(cwd, f.path);
      readFileSync(f.path, 'utf8').split(/\r?\n/).forEach((line, i) => {
        if (!DECLARATION.some((re) => re.test(line))) return;
        const ids = new Set();
        for (const m of line.matchAll(HYPHEN_ID)) ids.add(m[0]);
        for (const m of line.matchAll(UNDERSCORE_ID)) {
          const id = `${m[1]}-${m[2]}-${m[3]}`.toUpperCase();
          if (knownIds.has(id)) ids.add(id);
        }
        for (const id of ids) citations.push({ id, file: display, line: i + 1, name: line.trim().slice(0, 160) });
      });
    }
  }
  return { citations, scanned };
}

function shown(cwd, path) {
  return relative(cwd, path).split(sep).join('/') || '.';
}

function readVerdicts(srs) {
  const verdicts = new Map();
  if (!srs.trace) return verdicts;
  for (const t of srs.trace.tables) {
    const idCol = t.header.indexOf('id');
    const vCol = t.header.indexOf('verdict');
    if (idCol !== 0 || vCol < 0) continue;
    for (const row of t.rows) verdicts.set((row.cells[idCol] ?? '').trim(), (row.cells[vCol] ?? '').trim());
  }
  return verdicts;
}

function coverage(srsDir, testRoots, cwd) {
  const srs = loadSrs(srsDir);
  const byId = new Map();
  for (const r of srs.requirements) if (r.id && ID_RE.test(r.id) && !byId.has(r.id)) byId.set(r.id, r);
  const { citations, scanned } = findCitations(testRoots, new Set(byId.keys()), cwd);
  const verdicts = readVerdicts(srs);
  const findings = [];
  const add = (rule, message, extra = {}) => findings.push({ rule, message, ...extra });

  if (byId.size === 0) add('no-requirements', `no requirement rows found under ${shown(cwd, srsDir)}`);
  if (scanned === 0) add('no-tests', `no test files found under ${testRoots.map((t) => shown(cwd, t)).join(', ')}`);

  const citedBy = new Map();
  for (const c of citations) {
    const req = byId.get(c.id);
    if (!req) {
      add('unknown-id', `${c.file}:${c.line} cites ${c.id}, which is not in the SRS`, { id: c.id, file: c.file, line: c.line });
      continue;
    }
    if (req.status === 'Superseded') {
      const by = req.supersededBy ? `; it was superseded by ${req.supersededBy}` : '';
      add('superseded-id', `${c.file}:${c.line} cites ${c.id}${by}`, { id: c.id, file: c.file, line: c.line });
      continue;
    }
    if (!citedBy.has(c.id)) citedBy.set(c.id, []);
    citedBy.get(c.id).push(c);
  }

  const uncovered = { P1: [], P2: [], P3: [], other: [] };
  for (const r of byId.values()) {
    if (r.status !== 'Accepted' || r.verify !== 'Test' || citedBy.has(r.id)) continue;
    (uncovered[r.pri] ?? uncovered.other).push(r.id);
    add('uncovered', `${r.id} (${r.pri}) is Accepted with Verify Test, and no test name cites it`, { id: r.id, pri: r.pri, file: r.file, line: r.line });
  }

  const areas = new Map();
  for (const f of srs.areaFiles) {
    areas.set(f, { area: f, accepted: 0, testVerified: 0, withTest: 0, met: 0, partial: 0, notMet: 0, cannot: 0, unverified: 0, proposed: 0 });
  }
  for (const r of byId.values()) {
    const a = areas.get(r.file);
    if (r.status === 'Proposed') a.proposed++;
    if (r.status !== 'Accepted') continue;
    a.accepted++;
    if (r.verify === 'Test') {
      a.testVerified++;
      if (citedBy.has(r.id)) a.withTest++;
    }
    const v = verdicts.get(r.id);
    if (v === 'Met') a.met++;
    else if (v === 'Partial') a.partial++;
    else if (v === 'Not met' || v === 'Regressed') a.notMet++;
    else if (v === 'Cannot verify') a.cannot++;
    else a.unverified++;
  }
  const rows = [...areas.values()].filter((a) => a.accepted || a.proposed);
  const total = { area: 'Total' };
  for (const k of Object.keys(areas.values().next().value ?? {})) if (k !== 'area') total[k] = rows.reduce((s, a) => s + a[k], 0);

  const covered = Object.fromEntries([...citedBy].map(([id, cs]) => [id, cs.map(({ file, line, name }) => ({ file, line, name }))]));
  return { srs, findings, uncovered, covered, areas: rows, total, scanned };
}

function summaryBlock(result, date) {
  const lines = [
    `Generated by srs-coverage on ${date}. Do not edit by hand.`,
    '',
    '| Area | Accepted | Met | Partial | Not met or regressed | Cannot verify | Not yet verified | Test-verified with a test | Proposed |',
    '|---|---|---|---|---|---|---|---|---|',
  ];
  for (const a of [...result.areas, ...(result.areas.length ? [result.total] : [])]) {
    const name = a.area === 'Total' ? '**Total**' : a.area;
    lines.push(`| ${name} | ${a.accepted} | ${a.met} | ${a.partial} | ${a.notMet} | ${a.cannot} | ${a.unverified} | ${a.withTest}/${a.testVerified} | ${a.proposed} |`);
  }
  return lines.join('\n');
}

function writeSummary(srsDir, result, date) {
  if (!result.srs.readme) return 'README.md is missing';
  const path = join(srsDir, result.srs.readme.file);
  const text = result.srs.readme.text;
  const s = text.indexOf(SUMMARY_START);
  const e = text.indexOf(SUMMARY_END);
  if (s < 0 || e < 0 || e < s || text.indexOf(SUMMARY_START, s + 1) >= 0 || text.indexOf(SUMMARY_END, e + 1) >= 0) {
    return `README needs exactly one ${SUMMARY_START} followed by one ${SUMMARY_END}`;
  }
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const block = summaryBlock(result, date).split('\n').join(eol);
  writeFileSync(path, `${text.slice(0, s + SUMMARY_START.length)}${eol}${block}${eol}${text.slice(e)}`);
  return null;
}

function parseArgs(args) {
  const opts = { json: false, write: false, tests: [], date: new Date().toISOString().slice(0, 10), positional: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--json') opts.json = true;
    else if (a === '--write-summary') opts.write = true;
    else if (a === '--date') {
      opts.date = args[++i];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(opts.date ?? '')) return { error: '--date needs YYYY-MM-DD' };
    } else if (a === '--tests') {
      let n = 0;
      while (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        opts.tests.push(args[++i]);
        n++;
      }
      if (n === 0) return { error: '--tests needs at least one path' };
    } else if (a.startsWith('-')) return { error: `Unknown option: ${a}` };
    else opts.positional.push(a);
  }
  if (opts.positional.length !== 1) return { error: 'Expected exactly one <srs-dir>.' };
  if (opts.tests.length === 0) return { error: '--tests <path>... is required' };
  return opts;
}

function main(argv) {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(USAGE);
    return 0;
  }
  const opts = parseArgs(args);
  if (opts.error) {
    console.error(opts.error);
    console.error(USAGE);
    return 2;
  }
  const cwd = process.cwd();
  const srsDir = resolve(opts.positional[0]);
  if (!existsSync(srsDir) || !statSync(srsDir).isDirectory()) {
    console.error(`Not a directory: ${opts.positional[0]}`);
    return 2;
  }
  const roots = opts.tests.map((t) => resolve(t));
  const missing = opts.tests.filter((t, i) => !existsSync(roots[i]));
  if (missing.length) {
    console.error(`No such test path: ${missing.join(', ')}`);
    return 2;
  }

  const result = coverage(srsDir, roots, cwd);
  let wrote = false;
  if (opts.write) {
    const err = writeSummary(srsDir, result, opts.date);
    if (err) result.findings.push({ rule: 'summary-not-written', message: `${err}; summary not written` });
    else wrote = true;
  }

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          ok: result.findings.length === 0,
          testFilesScanned: result.scanned,
          summaryWritten: wrote,
          uncovered: result.uncovered,
          covered: result.covered,
          areas: result.areas,
          total: result.total,
          findings: result.findings,
        },
        null,
        2,
      ),
    );
  } else {
    for (const f of result.findings) console.log(`${f.rule}: ${f.message}`);
    if (result.areas.length) {
      console.log('');
      console.log(summaryBlock(result, opts.date).split('\n').slice(2).join('\n'));
    }
    console.log('');
    console.log(
      `srs-coverage: ${result.findings.length ? `${result.findings.length} finding(s)` : 'clean'}; ` +
        `${Object.keys(result.covered).length} requirement(s) cited by tests in ${result.scanned} test file(s)` +
        (opts.write ? (wrote ? '; summary written' : '; summary NOT written') : ''),
    );
  }
  return result.findings.length ? 1 : 0;
}

process.exitCode = main(process.argv);
