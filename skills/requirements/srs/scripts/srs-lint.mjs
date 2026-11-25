#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const USAGE = `Usage: node srs-lint.mjs <srs-dir> [--json]

Checks the format of a Software Requirements Specification folder (usually docs/srs).
Exit 0 clean, 1 findings, 2 usage error or the script could not run.`;

// ---- SRS parsing. srs-verify/scripts/srs-coverage.mjs carries its own copy of this block because each
// ---- skill installs on its own. Change both together; each copy is pinned by its own skill's tests.

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

// CommonMark: a fence closes only on the same character, at least as long as the opener.
function fenceTracker() {
  let open = null;
  return (line) => {
    const m = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (m && (!open || (m[1][0] === open[0] && m[1].length >= open.length && /^\s{0,3}[`~]+\s*$/.test(line)))) {
      open = open ? null : m[1];
      return true;
    }
    return open !== null;
  };
}

function parseTables(text) {
  const lines = text.split(/\r?\n/);
  const tables = [];
  const fenced = fenceTracker();
  for (let i = 0; i < lines.length; i++) {
    if (fenced(lines[i])) continue;
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

function statOrNull(path) {
  try {
    return statSync(path);
  } catch {
    return null;
  }
}

function listMarkdown(dir, skipped) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    const st = statOrNull(full);
    if (!st) skipped.push(full);
    else if (st.isDirectory()) out.push(...listMarkdown(full, skipped));
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
  const fenced = fenceTracker();
  lines.forEach((l, i) => {
    const m = !fenced(l) && /^##\s+(.+?)\s*#*\s*$/.exec(l);
    if (m) out.push({ name: m[1].trim().toLowerCase(), line: i + 1, body: [] });
    else if (out.length) out[out.length - 1].body.push({ line: i + 1, text: l });
  });
  return out;
}

function loadSrs(srsDir) {
  const skipped = [];
  const files = listMarkdown(srsDir, skipped);
  const rel = (f) => relative(srsDir, f).split(sep).join('/');
  const srs = { readme: null, trace: null, areaFiles: [], requirements: [], tables: [], unreadable: skipped.map(rel) };
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
      if (!t.header.includes('id') || !t.header.includes('requirement')) continue;
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

function lint(srsDir) {
  const srs = loadSrs(srsDir);
  const findings = [];
  const add = (rule, file, line, message, id) => findings.push({ rule, file, line, message, ...(id ? { id } : {}) });

  for (const u of srs.unreadable) add('unreadable', u, 0, 'cannot be read (a broken link or a permissions problem), so it was not checked');

  if (srs.requirements.length === 0) {
    add('no-requirements', '.', 0, 'no requirement tables found (a table whose header starts | ID | Requirement |)');
  }

  for (const t of srs.tables) {
    const missing = REQ_COLUMNS.filter((c) => t.col[c] < 0);
    if (missing.length) add('missing-column', t.file, t.line, `requirement table lacks column(s): ${missing.join(', ')}`);
  }

  const byId = new Map();
  for (const r of srs.requirements) {
    if (!r.id || !ID_RE.test(r.id)) {
      add('bad-id', r.file, r.line, `ID "${r.id ?? ''}" is not AREA-SUB-NN (capitals, two or more digits)`);
      continue;
    }
    if (byId.has(r.id)) {
      const first = byId.get(r.id);
      add('duplicate-id', r.file, r.line, `${r.id} is already defined at ${first.file}:${first.line}; IDs are never reused`, r.id);
      continue;
    }
    byId.set(r.id, r);
  }

  for (const r of srs.requirements) {
    if (r.text !== null && r.text === '') add('empty-requirement', r.file, r.line, 'requirement text is empty', r.id);
    if (r.pri !== null && !PRI.includes(r.pri)) add('bad-pri', r.file, r.line, `Pri "${r.pri}" is not one of ${PRI.join(', ')}`, r.id);
    if (r.verify !== null && !VERIFY.includes(r.verify)) {
      add('bad-verify', r.file, r.line, `Verify "${r.verify}" is not one of ${VERIFY.join(', ')}`, r.id);
    }
    if (r.statusCell !== null && r.status === null) {
      add('bad-status', r.file, r.line, `Status "${r.statusCell}" is not one of ${STATUS.join(', ')} (Superseded reads "Superseded by ID")`, r.id);
    }
    if (r.status === 'Superseded') {
      if (!r.supersededBy) add('supersede-target', r.file, r.line, 'Superseded row does not name its replacement ("Superseded by ID")', r.id);
      else if (r.supersededBy === r.id) add('supersede-target', r.file, r.line, `${r.id} is superseded by itself`, r.id);
      else if (!byId.has(r.supersededBy)) add('supersede-target', r.file, r.line, `superseded by ${r.supersededBy}, which does not exist`, r.id);
      else if (!['Accepted', 'Superseded'].includes(byId.get(r.supersededBy).status)) {
        const target = byId.get(r.supersededBy);
        add('supersede-target', r.file, r.line, `superseded by ${r.supersededBy}, which is ${target.status}; a row is superseded only once its replacement is Accepted`, r.id);
      }
    }
    const interfaceRow = r.file.startsWith('interfaces/');
    if (!interfaceRow && r.text && !/\b(shall|should|may)\b/i.test(r.text) && ['Proposed', 'Accepted'].includes(r.status)) {
      add('wording', r.file, r.line, 'requirement uses none of shall / should / may', r.id);
    }
  }

  if (!srs.readme) {
    add('readme', 'README.md', 0, 'README.md is missing; it carries the purpose, scope, conventions, area index and change log');
  } else {
    const file = srs.readme.file;
    const secs = sections(srs.readme.text);
    const find = (name) => secs.find((s) => s.name === name);
    for (const name of ['purpose', 'scope', 'out of scope', 'user classes', 'conventions', 'areas', 'completeness summary', 'change log']) {
      if (!find(name)) add('readme-section', file, 0, `README has no "## ${name[0].toUpperCase()}${name.slice(1)}" section`);
    }
    const starts = srs.readme.text.split(SUMMARY_START).length - 1;
    const ends = srs.readme.text.split(SUMMARY_END).length - 1;
    if (starts !== 1 || ends !== 1 || srs.readme.text.indexOf(SUMMARY_START) > srs.readme.text.indexOf(SUMMARY_END)) {
      add('summary-markers', file, 0, `README needs exactly one ${SUMMARY_START} followed by one ${SUMMARY_END}`);
    }

    const areas = find('areas');
    if (areas) {
      const body = areas.body.map((b) => b.text).join('\n');
      for (const a of srs.areaFiles) {
        const named = new RegExp(`(^|[^\\w./-])(\\./)?${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\w.-])`, 'm');
        if (!named.test(body)) add('area-index', file, areas.line, `area file ${a} is not listed in the Areas section`);
      }
      for (const b of areas.body) {
        for (const m of b.text.matchAll(/\]\(([^)#\s]+\.md)\)/g)) {
          const target = m[1].replace(/^\.\//, '');
          if (!existsSync(join(srsDir, target))) add('area-index', file, b.line, `Areas section links ${target}, which does not exist`);
        }
      }
    }

    const log = find('change log');
    if (log) {
      const items = [];
      for (const b of log.body) {
        if (/^\s*[-*+]\s/.test(b.text) || !items.length) items.push(b.text);
        else if (b.text.trim()) items[items.length - 1] += ` ${b.text.trim()}`;
      }
      for (const r of byId.values()) {
        if (r.status !== 'Accepted') continue;
        const acceptedRe = new RegExp(`\\baccept[a-z]*\\b[^.;"]*?(^|[^A-Z0-9-])${r.id}([^0-9]|$)`, 'i');
        const ok = items.some((t) => acceptedRe.test(t) && /\b\d{4}-\d{2}-\d{2}\b/.test(t));
        if (!ok) add('change-log', r.file, r.line, `${r.id} is Accepted but no dated change-log line says "Accepted ... ${r.id}"`, r.id);
      }
    }
  }

  if (srs.trace) {
    const file = srs.trace.file;
    const seen = new Map();
    const traceTables = srs.trace.tables.filter((t) => t.header.includes('id'));
    if (traceTables.length === 0 && /[A-Z][A-Z0-9]*-[A-Z][A-Z0-9]*-\d{2,}/.test(srs.trace.text)) {
      add('trace-unparsed', file, 0, 'trace.md names requirement IDs but holds no | ID | Verdict | Evidence | table');
    }
    for (const t of traceTables) {
      const col = Object.fromEntries(['id', 'verdict', 'evidence', 'notes'].map((c) => [c, t.header.indexOf(c)]));
      const missing = ['verdict', 'evidence'].filter((c) => col[c] < 0);
      if (missing.length) add('missing-column', file, t.line, `trace table lacks column(s): ${missing.join(', ')}`);
      if (col.verdict < 0) continue;
      for (const row of t.rows) {
        const cell = (c) => (col[c] >= 0 ? (row.cells[col[c]] ?? '').trim() : '');
        const id = cell('id');
        const verdict = cell('verdict');
        const filled = (v) => v !== '' && !/^[-–—]+$/.test(v);
        const req = byId.get(id);
        if (!req) {
          add('trace-unknown-id', file, row.line, `trace cites ${id || '(empty)'}, which is not a requirement in this SRS`, id || undefined);
        } else if (req.status !== 'Accepted') {
          add('trace-stale', file, row.line, `${id} is ${req.status}; only Accepted requirements carry a verdict`, id);
        }
        if (seen.has(id)) add('trace-duplicate', file, row.line, `${id} already has a verdict at line ${seen.get(id)}`, id);
        else seen.set(id, row.line);
        if (!VERDICTS.includes(verdict)) {
          add('bad-verdict', file, row.line, `verdict "${verdict}" is not one of ${VERDICTS.join(', ')}`, id);
        } else if (['Met', 'Partial', 'Regressed'].includes(verdict) && !filled(cell('evidence'))) {
          add('trace-evidence', file, row.line, `${id} is ${verdict} but names no evidence`, id);
        } else if (verdict === 'Cannot verify' && !filled(cell('notes')) && !filled(cell('evidence'))) {
          add('trace-evidence', file, row.line, `${id} is Cannot verify but does not say why`, id);
        }
      }
    }
  }

  return { srs, findings };
}

function main(argv) {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(USAGE);
    return 0;
  }
  const json = args.includes('--json');
  const rest = args.filter((a) => a !== '--json');
  const unknown = rest.filter((a) => a.startsWith('-'));
  if (unknown.length || rest.length !== 1) {
    console.error(unknown.length ? `Unknown option: ${unknown.join(' ')}` : 'Expected exactly one <srs-dir>.');
    console.error(USAGE);
    return 2;
  }
  const dir = resolve(rest[0]);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    console.error(`Not a directory: ${rest[0]}`);
    return 2;
  }
  const { srs, findings } = lint(dir);
  if (json) {
    console.log(JSON.stringify({ ok: findings.length === 0, requirements: srs.requirements.length, files: srs.areaFiles.length, findings }, null, 2));
  } else {
    for (const f of findings) console.log(`${f.file}:${f.line}: ${f.rule}: ${f.message}`);
    console.log(
      findings.length
        ? `srs-lint: ${findings.length} finding(s); ${srs.requirements.length} requirement row(s) in ${srs.areaFiles.length} file(s)`
        : `srs-lint: clean; ${srs.requirements.length} requirement row(s) in ${srs.areaFiles.length} file(s)`,
    );
  }
  return findings.length ? 1 : 0;
}

try {
  process.exitCode = main(process.argv);
} catch (err) {
  console.error(`srs-lint could not run: ${err?.message ?? err}`);
  process.exitCode = 2;
}
