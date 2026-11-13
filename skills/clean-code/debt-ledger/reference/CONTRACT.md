# Bookkeeping tool contract

The skill's one deterministic tool. It parses baselines, keys items, classifies baseline change, resolves
owners, checks coverage and counts. It never reads the repo, runs version control or judges. Build it from
[ALGORITHM.md](ALGORITHM.md) in whatever runtime the machine has, then run every fixture in
[fixtures/](fixtures/). Any failing fixture stops the run.

## Invocation

```
<tool> adapt --format eslint|basedpyright|rubocop|phpstan
<tool> reuse
<tool> baseline
<tool> owner
<tool> verify --check coverage [--min-basis-points N] [--max-adjusted-basis-points N]
<tool> tally
```

`adapt` reads one baseline file, byte for byte, on standard input. Every other subcommand reads JSON Lines
on standard input. Output is always JSON Lines on standard output. Nothing is written to standard error
that a caller must read.

Options are `--name value` pairs, in any order. `--format` takes one of the four names above; `--check`
takes `coverage`. A numeric value is one or more ASCII digits, read as a decimal integer (leading zeros
allowed), at most 9007199254740991. Defaults: `--min-basis-points 9800`, `--max-adjusted-basis-points 200`.
These are usage errors: no subcommand or an unknown one; an unknown format or check; an unknown or
repeated option; an option not listed for that subcommand; a missing value; a bad numeric value; `adapt`
without `--format`; `verify` without `--check`; any other argument left over.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Input valid, and the check found no problem (always 0 for valid `adapt`, `reuse`, `baseline`, `owner` and `tally` input) |
| 1 | Input valid, and `verify` failed its threshold |
| 2 | Usage error or malformed input. Output is exactly one error record |

## Input lines

Split standard input on LF. Ignore the empty string after a final LF. Remove one trailing CR from each
line if present. Line numbers count from 1. For every subcommand except `adapt`: a byte order mark is not
stripped, so a line starting with one is `bad_json`. Every line must be valid UTF-8 holding one JSON object
with a string field `t` naming the record type. Fields not listed for a type are ignored. Records may come
in any order unless a type says otherwise.

Field types:

- `str`: a JSON string, possibly empty.
- `name`: a JSON string, non-empty.
- `int`: a JSON number whose value is a whole number from 0 to 9007199254740991 (`1.0` counts as 1).
- `bool`: `true` or `false`.

Closed lists, checked as `bad_field` while reading (ALGORITHM.md common step 2.5):

| Type and field | Allowed values |
|---|---|
| `new.kind`, `old.kind` (reuse), `item.kind` (tally) | `marker`, `inline`, `blanket` |
| `source.unit` (baseline, tally) | `violations`, `pairs` |
| `inline.scope` (baseline) | `line`, `block` |
| `item.dated` (tally), `run.date` (tally) | `run.date` a valid date `YYYY-MM-DD`; `item.dated` the same or empty |

## Output format

- One JSON object per line, LF after every line including the last. No BOM.
- Compact: no spaces between tokens. Keys in exactly the order shown in this file.
- Strings escaped as JSON requires: `"` and `\` escaped, control characters as `\b \f \n \r \t` or
  `\u00XX` with lowercase hex, every other character written as itself in UTF-8. Input never holds an
  unpaired surrogate (it is `bad_json`), so this matches both `JSON.stringify` and Python's
  `json.dumps(value, ensure_ascii=False, separators=(",", ":"))`.
- Integers in plain decimal, negative where a delta is negative. Booleans as `true` or `false`.
- Objects with computed keys (`by_tag`, `by_owner`, `by_source`, `sources`) list keys in byte order.
  Build them as ordered pairs: some runtimes reorder number-like keys in a native object.

## Error record

```
{"t":"error","line":3,"reason":"bad_json"}
```

`line` is 0 for a usage error and for an `adapt` error that has no line (a JSON baseline with the wrong
shape). `reason` is one of:

| Reason | When |
|---|---|
| `usage` | bad command line |
| `bad_json` | the line (or, for a JSON baseline, the whole input) is not valid UTF-8 or not valid JSON |
| `not_object` | valid JSON but not an object |
| `unknown_type` | `t` missing, not a string, or not a type this subcommand accepts |
| `missing_field` | a required field is absent |
| `bad_field` | a required field has the wrong type, or a closed-list value is invalid |
| `duplicate` | a value or record that must be unique repeats |
| `unknown_source` | a baseline `old` or `new` names a source no `source` record declared |
| `unknown_path` | a coverage `adjust` names a path no `count` record declared |
| `missing_run` | `tally` input has no `run` record |
| `unsupported_pattern` | a code-owners pattern uses syntax outside the supported grammar |
| `bad_format` | an `adapt` input does not have the shape its format requires |

## adapt

Input: the baseline file. Output: `entry` records sorted by `path`, then `rule`; then, for `rubocop` only,
`ruleoff` records sorted by `rule`; then one `summary`.

```
{"t":"entry","path":"src/a.ts","rule":"no-console","count":2}
{"t":"ruleoff","rule":"Style/Documentation"}
{"t":"summary","format":"rubocop","unit":"pairs","entries":5,"units":5,"ruleoffs":1}
```

`unit` is `pairs` for `rubocop` and `violations` for the others. `ruleoffs` is 0 for every format but
`rubocop`.

## reuse

Input:
- `{"t":"old","path":name,"kind":str,"rule":name,"hash":name,"ordinal":int,"dated":str,"first_seen":str}`:
  an item from the saved ledger.
- `{"t":"new","path":name,"line":int,"kind":str,"rule":name,"text":str}`: an item found this run, with
  its comment text.
- `{"t":"rename","from":name,"to":name}`: a path renamed since the last run.

Output: one record per new item, then one `removed` per old item that is gone, then `summary`. The comment
text never appears in output.
```
{"t":"reuse","path":"a.ts","line":9,"kind":"marker","rule":"TODO","hash":"5d41402abc4b2a76","ordinal":0,"dated":"2024-02-29","first_seen":"2025-01-06"}
{"t":"redate","path":"a.ts","line":12,"kind":"inline","rule":"no-console","hash":"9e107d9d372bb682","ordinal":0,"first_seen":"2025-01-06"}
{"t":"added","path":"b.py","line":3,"kind":"blanket","rule":"*","hash":"e4d909c290d0fb1c","ordinal":0}
{"t":"removed","path":"c.ts","kind":"marker","rule":"FIXME","hash":"0cc175b9c0f1b6a8","ordinal":0,"dated":"2023-05-01","first_seen":"2025-01-06"}
{"t":"summary","old":4,"new":3,"reused":1,"redated":1,"added":1,"removed":2,"renamed":1}
```
`reuse` keeps its dates. `redate` keeps `first_seen` but must be blamed again. `added` gets both dates
this run.

## baseline

Input:
- `{"t":"source","source":name,"linter":name,"unit":str}`: one baseline file and the linter it belongs to.
- `{"t":"old","source":name,"path":name,"rule":name,"count":int}`: an entry from the last run.
- `{"t":"new","source":name,"path":name,"rule":name,"count":int}`: an entry from this run.
- `{"t":"rename","from":name,"to":name}`: a path renamed since the last run.
- `{"t":"gone","path":name}`: a path deleted since the last run, not renamed.
- `{"t":"inline","linter":name,"path":name,"rule":name,"scope":str,"old":int,"new":int}`: how many inline
  suppressions of one linter, path, rule and scope there were last run and this run. `rule` `*` is a
  blanket suppression.
- `{"t":"config","text":str}`: one added or removed line from a lint configuration file's diff since the
  last run.
- `{"t":"toolchain"}`: the linter or its presets changed version since the last run. At most one.

Output: `change` records, then one `source` record per source, then `summary`.
```
{"t":"change","source":"eslint-suppressions.json","path":"src/a.ts","rule":"no-console","old":5,"new":1,"class":"moved-inline","units":3}
{"t":"source","source":"eslint-suppressions.json","unit":"violations","old":9,"new":6,"in":1,"out":4,"grew":1,"added":0,"deleted_file":0,"moved_inline":3,"moved_blanket":0,"config_changed":0,"fixed":1,"rekeyed":2,"conserved":true}
{"t":"summary","sources":1,"changes":3,"fixed_reliable":true}
```
`class` is one of `grew`, `added`, `deleted-file`, `moved-inline`, `moved-blanket`, `config-changed`,
`fixed`.

## owner

Input:
- `{"t":"line","text":str}`: one line of the code-owners file, in file order.
- `{"t":"package","path":name}`: a folder holding a package manifest, relative to the repo root.
- `{"t":"item","path":name,"tag":str}`: a path to resolve, with the owner tag written in its marker
  (`TODO(PROJ-12)` gives `PROJ-12`) or empty.

Output: one `owner` per item in input order, then `summary`.
```
{"t":"owner","path":"packages/web/a.ts","owner":"@acme/web","source":"codeowners"}
{"t":"summary","items":4,"by_source":{"codeowners":1,"folder":1,"package":1,"tag":1}}
```
`source` is `tag`, `codeowners`, `package` or `folder`. `by_source` holds only sources that occurred.

## verify --check coverage

Input:
- `{"t":"count","path":name,"found":int,"loose":int}`: for one file, the strict items found plus the loose
  hits excluded with a reason, and the loose count.
- `{"t":"adjust","path":name,"reason":name}`: a file whose counts are known to disagree for a stated
  reason. Adjusted files leave both sums.

Output: `short` records, then `adjusted` records, then `summary`.
```
{"t":"short","path":"src/b.ts","found":8,"loose":10}
{"t":"adjusted","path":"vendor/x.js","reason":"minified, one line"}
{"t":"summary","files":3,"adjusted":1,"found":51,"loose":50,"covered":48,"coverage":"0.9600","adjusted_share":"0.3333","pass":false}
```

## tally

Input:
- `{"t":"run","date":str,"commit":name,"spec":name,"descends":bool}`: exactly one. `descends` is true when
  this commit descends from the last run's commit.
- `{"t":"item","path":name,"line":int,"kind":str,"rule":name,"owner":name,"dated":str}`
- `{"t":"pattern","kind":name,"lang":name,"text":str}`: one strict pattern used this run.
- `{"t":"source","source":name,"unit":str,"units":int}`: a baseline's total this run.
- `{"t":"last","date":str,"commit":name,"spec":name,"patterns":name,"markers":int,"inline":int,"blanket":int}`:
  the previous history line. At most one.
- `{"t":"lastsource","source":name,"units":int}`: a baseline's total in the previous history line.

Output: exactly these records in this order, with up to 20 `oldest` records in the middle.
```
{"t":"counts","markers":3,"inline":2,"blanket":1,"by_tag":{"FIXME":1,"TODO":2}}
{"t":"owners","by_owner":{"@acme/web":4,"tools":2}}
{"t":"ages","0-29":1,"30-89":0,"90-364":2,"365-729":1,"730+":1,"unknown":1}
{"t":"oldest","path":"a.ts","line":9,"kind":"marker","rule":"TODO","owner":"@acme/web","days":1047}
{"t":"history","date":"2025-03-01","commit":"abc123","spec":"1","patterns":"<64 hex>","markers":3,"inline":2,"blanket":1,"sources":{"eslint-suppressions.json":6}}
{"t":"trend","comparable":true,"reason":"ok","markers":-1,"inline":0,"blanket":1,"sources":{"eslint-suppressions.json":-3}}
```
`reason` is `ok`, `first_run`, `spec_changed`, `patterns_changed` or `not_descendant`.

## Fixtures

Each fixture is three files with the same stem in `fixtures/`:

- `NN-name.in`: line 1 is the arguments after the tool name, separated by single spaces. Every following
  byte is standard input.
- `NN-name.out`: the exact expected standard output.
- `NN-name.exit`: the expected exit code followed by LF.

A fixture passes when standard output matches `.out` byte for byte and the exit code matches `.exit`.
Read fixture files as bytes. A checkout that converted line endings to CRLF fails every fixture; convert
the fixture files to LF in your working copy (never edit their content) and say so in the report.
