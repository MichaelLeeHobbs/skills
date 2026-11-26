import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, 'srs-lint.mjs');
const fixture = (name) => join(here, 'fixtures', name);

function run(...args) {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

function rules(name) {
  const r = run(fixture(name), '--json');
  const json = JSON.parse(r.out);
  return { code: r.code, json, rules: json.findings.map((f) => f.rule).sort() };
}

test('clean SRS has no findings and exits 0', () => {
  const r = rules('clean');
  assert.equal(r.code, 0);
  assert.deepEqual(r.rules, []);
  assert.equal(r.json.ok, true);
  assert.equal(r.json.requirements, 7, 'fenced example rows are not counted');
});

test('text output names the file and line of each finding', () => {
  const r = run(fixture('duplicate-id'));
  assert.equal(r.code, 1);
  assert.match(r.out, /^auth\.md:19: duplicate-id: AUTH-SES-01 is already defined at auth\.md:18/m);
});

const cases = {
  'duplicate-id': ['duplicate-id'],
  'bad-status': ['bad-status'],
  'bad-values': ['bad-id', 'bad-pri', 'bad-verify', 'empty-requirement'],
  'dangling-supersede': ['supersede-target', 'supersede-target'],
  'missing-column': ['missing-column'],
  wording: ['wording'],
  'accepted-no-changelog': ['change-log', 'change-log'],
  'readme-problems': ['area-index', 'area-index', 'readme-section', 'summary-markers'],
  'no-readme': ['readme'],
  'bad-trace': ['bad-verdict', 'trace-duplicate', 'trace-evidence', 'trace-evidence', 'trace-stale', 'trace-unknown-id'],
  empty: ['area-index', 'area-index', 'no-requirements'],
  'trace-shape': ['missing-column'],
  'trace-unparsed': ['trace-unparsed'],
  'supersede-proposed': ['supersede-target'],
  'change-log-shapes': ['change-log'],
  'fence-and-column-order': ['bad-pri', 'bad-verify'],
};

test('a wrapped change-log item counts, a dated mention without "Accepted" does not', () => {
  const { json } = rules('change-log-shapes');
  assert.deepEqual(json.findings.map((f) => f.id), ['AUTH-USR-01']);
});

test('a broken link inside the SRS is a finding, not a crash or a clean pass', () => {
  const dir = mkdtempSync(join(tmpdir(), 'srs-lint-'));
  try {
    cpSync(fixture('clean'), dir, { recursive: true });
    const target = join(dir, 'gone-target');
    mkdirSync(target);
    symlinkSync(target, join(dir, 'gone'), 'junction');
    rmSync(target, { recursive: true });
    const r = run(dir, '--json');
    assert.equal(r.code, 1, r.err);
    assert.deepEqual(JSON.parse(r.out).findings.map((f) => f.rule), ['unreadable']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

for (const [name, expected] of Object.entries(cases)) {
  test(`${name} fixture reports exactly ${expected.join(', ')} and exits 1`, () => {
    const r = rules(name);
    assert.equal(r.code, 1);
    assert.equal(r.json.ok, false);
    assert.deepEqual(r.rules, expected.slice().sort());
  });
}

test('supersede findings name the missing target', () => {
  const { json } = rules('dangling-supersede');
  assert.ok(json.findings.some((f) => f.id === 'AUTH-USR-02' && f.message.includes('AUTH-USR-09')));
});

test('an escaped pipe stays inside the requirement cell', () => {
  const { json } = rules('clean');
  assert.equal(json.findings.length, 0, 'AUTH-USR-04 contains \\| and still parses as five columns');
});

test('the area index must name the file itself, not a longer name that contains it', () => {
  const dir = mkdtempSync(join(tmpdir(), 'srs-lint-'));
  try {
    cpSync(fixture('clean'), dir, { recursive: true });
    const readme = join(dir, 'README.md');
    writeFileSync(readme, readFileSync(readme, 'utf8').replace('[auth.md](auth.md)', '[oauth.md](oauth.md)'));
    const json = JSON.parse(run(dir, '--json').out);
    assert.deepEqual(json.findings.map((f) => f.message).sort(), [
      'Areas section links oauth.md, which does not exist',
      'area file auth.md is not listed in the Areas section',
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

const decisions = (records) => {
  const r = run(fixture('decisions/srs'), '--decisions', fixture(`decisions/${records}`), '--json');
  return { code: r.code, json: JSON.parse(r.out) };
};

test('decision records cited by file name or ID line, opted out, inactive, index or template: clean', () => {
  const { code, json } = decisions('records-clean');
  assert.equal(code, 0, JSON.stringify(json.findings));
  assert.deepEqual(json.findings, []);
  assert.equal(json.decisions, 3, 'only 0001, 0002 and 0006 are active decisions that need a citation');
});

test('text output says how many decision records were checked', () => {
  const r = run(fixture('decisions/srs'), '--decisions', fixture('decisions/records-clean'));
  assert.equal(r.code, 0);
  assert.match(r.out, /; 3 decision record\(s\) checked$/m);
});

test('a decisions folder with no records is a finding, not a clean pass', () => {
  const { code, json } = decisions('records-empty');
  assert.equal(code, 1);
  assert.deepEqual(json.findings.map((f) => f.rule), ['decisions-empty']);
});

test('--decisions-since skips records whose file name sorts before it', () => {
  const r = run(fixture('decisions/srs'), '--decisions', fixture('decisions/records-uncited'), '--decisions-since', '0011', '--json');
  assert.equal(r.code, 1);
  assert.deepEqual(JSON.parse(r.out).findings.map((f) => f.decision).sort(), ['0001-lock', '0011-fenced-status']);
});

test('an unreadable decision record is a finding', () => {
  const dir = mkdtempSync(join(tmpdir(), 'srs-lint-dec-'));
  try {
    cpSync(fixture('decisions/records-clean'), dir, { recursive: true });
    const target = join(dir, 'gone-target');
    mkdirSync(target);
    symlinkSync(target, join(dir, 'gone'), 'junction');
    rmSync(target, { recursive: true });
    const r = run(fixture('decisions/srs'), '--decisions', dir, '--json');
    assert.equal(r.code, 1, r.err);
    assert.deepEqual(JSON.parse(r.out).findings.map((f) => f.rule), ['unreadable']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a decisions folder that contains or sits inside the SRS folder exits 2', () => {
  assert.equal(run(fixture('decisions/srs'), '--decisions', fixture('decisions')).code, 2);
  assert.equal(run(fixture('decisions/srs'), '--decisions', fixture('decisions/srs/interfaces')).code, 2);
});

test('an uncited decision, a status only inside a fence, and a prefix-only match are each decision-uncited', () => {
  const { code, json } = decisions('records-uncited');
  assert.equal(code, 1);
  assert.deepEqual(json.findings.map((f) => `${f.rule} ${f.decision}`).sort(), [
    'decision-uncited 0001-lock',
    'decision-uncited 0010-hex-switch',
    'decision-uncited 0011-fenced-status',
  ]);
});

test('without --decisions, decision records are not checked', () => {
  const r = run(fixture('decisions/srs'), '--json');
  assert.equal(r.code, 0);
  assert.equal(JSON.parse(r.out).decisions, undefined);
});

test('usage errors exit 2', () => {
  assert.equal(run(fixture('clean'), '--decisions').code, 2);
  assert.equal(run(fixture('clean'), '--decisions-since', '0001').code, 2);
  assert.equal(run(fixture('decisions/srs'), '--decisions', fixture('decisions/records-clean'), '--decisions-since').code, 2);
  assert.equal(run(fixture('clean'), '--decisions', join(here, 'fixtures', 'does-not-exist')).code, 2);
  assert.equal(run().code, 2);
  assert.equal(run(fixture('clean'), '--bogus').code, 2);
  assert.equal(run(join(here, 'fixtures', 'does-not-exist')).code, 2);
  assert.equal(run(fixture('clean'), fixture('clean')).code, 2);
});

test('--help exits 0', () => {
  assert.equal(run('--help').code, 0);
});
