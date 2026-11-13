# Bookkeeping tool contract

The skill's one deterministic tool. It never reads source or reports, never measures and never runs a
test. It counts, joins, ranks and classifies records the agent already measured, by fixed rules. Build
it from [ALGORITHM.md](ALGORITHM.md) in whatever runtime the machine has, then run the fixtures for every
subcommand the chosen lanes need (see "Fixtures"). Any failing fixture stops the run.

Two subcommands, `flaky` and `verdict`, classify. They do it by table lookup on measured outcomes, so the
verdict a report prints is never a model's opinion.

## Invocation

```
<tool> verify --check coverage
<tool> verify --check reports
<tool> rank
<tool> flaky [--min-events N] [--burst-min N] [--burst-bp N]
<tool> verdict
<tool> group [--max-stem N]
```

Input is JSON Lines on standard input. Output is JSON Lines on standard output. Nothing is written to
standard error that a caller must read.

Options are `--name value` pairs, in any order. The value of `--check` is `coverage` or `reports`. Every
other value is one or more ASCII digits, read as a decimal integer (leading zeros allowed). Defaults:
`--min-events 2`, `--burst-min 5`, `--burst-bp 200`, `--max-stem 25`. These are usage errors: no
subcommand or an unknown one; an unknown check name; an unknown or repeated option; an option not listed
for that subcommand; a missing value; a numeric value that is not digits or is above 9007199254740991;
`--min-events`, `--burst-min` or `--max-stem` equal to 0; `--burst-bp` above 10000; `verify` without
`--check`; any other argument left over.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Input valid, and no problem found (always 0 for valid `rank`, `flaky`, `verdict` and `group` input) |
| 1 | Input valid, and a `verify` check found at least one problem |
| 2 | Usage error or malformed input. Output is exactly one error record |

## Input lines

Split standard input on LF. Ignore the empty string after a final LF. Remove one trailing CR from each
line if present. A byte order mark is not stripped, so a line starting with one is `bad_json`. Every
other line must be valid UTF-8 holding one JSON object with a string field `t` naming the record type.
Fields not listed for a type are ignored. Line numbers count from 1 at the first line of standard input.
Records may come in any order: a record that refers to another is checked against every record in the
input, not only earlier ones.

Field types:

- `str`: a JSON string, possibly empty.
- `name`: a JSON string, non-empty.
- `int`: a JSON number whose value is a whole number from 0 to 9007199254740991 (`1.0` counts as 1).
- `bool`: `true` or `false`.
- `enum(a|b|c)`: a JSON string equal to one of the listed values.

## Output format

- One JSON object per line, LF after every line including the last. No BOM.
- Compact: no spaces between tokens. Keys in exactly the order shown in this file.
- Strings escaped as JSON requires: `"` and `\` escaped, control characters as `\b \f \n \r \t` or
  `\u00XX` with lowercase hex, every other character written as itself in UTF-8. This matches
  `JSON.stringify` and Python's `json.dumps(value, ensure_ascii=False, separators=(",", ":"))`.
- Integers in plain decimal. Arithmetic is exact integer arithmetic, even past 9007199254740991.
- Objects with computed keys (`by_reason`) list keys in byte order.

## Error record

```
{"t":"error","line":3,"reason":"bad_json"}
```

`line` is 0 for a usage error. `reason` is one of:

| Reason | When |
|---|---|
| `usage` | bad command line |
| `bad_json` | the line is not valid UTF-8 or not valid JSON |
| `not_object` | valid JSON but not an object |
| `unknown_type` | `t` missing, not a string, or not a type this subcommand accepts |
| `missing_field` | a required field is absent |
| `bad_field` | a required field has the wrong type, or an `enum` value is not in its list |
| `duplicate` | a value that must be unique repeats |
| `unknown_path` | a record names a path no `file` (or, in `rank`, no `test`) record declared |
| `unknown_report` | a `sample` names a report no `report` record declared |
| `unknown_run` | a record names a run no `run` record declared |
| `unknown_job` | a record names a job no `job` record declared |
| `unknown_test` | a record names a test no `test` record declared |
| `no_window` | `rank` or `flaky` input has no `window` record, or its `days` is 0 |

## Record types per subcommand

### verify --check coverage

Input:
- `{"t":"file","path":name,"declared":int}`: a test file and the number of test declarations the
  language's pattern counted in it.
- `{"t":"test","id":name,"path":name}`: one test id the runner listed, and its file.
- `{"t":"except","path":name,"reason":name}`: a file whose shortfall is accepted, with the reason.
- `{"t":"broken","path":name}`: a file the runner could not collect or load.

Output: one record per file with a finding, files in path order, then `summary`.
```
{"t":"never_ran","path":"tests/b.test.ts","declared":4}
{"t":"shortfall","path":"tests/c.test.ts","declared":5,"listed":3,"missing":2}
{"t":"excepted","path":"tests/d.test.ts","declared":6,"listed":2,"reason":"declared in a loop"}
{"t":"broken","path":"tests/e.test.ts"}
{"t":"summary","files":5,"declared":20,"listed":12,"missing":6,"excepted":1,"problems":3}
```

### verify --check reports

Input:
- `{"t":"report","id":name,"tests":int,"ms":int}`: one test report, with the test count and total time
  in milliseconds the agent read from the report's own totals.
- `{"t":"sample","report":name,"test":name,"ms":int,"status":enum(pass|fail|skip|flaky)}`: one test
  result flattened from that report.

Output: problems in report order (count before time), then `summary`.
```
{"t":"count","report":"r2","expected":3,"got":2}
{"t":"time","report":"r3","total_ms":1200,"sum_ms":2}
{"t":"summary","reports":3,"samples":7,"problems":2}
```

### rank

Input:
- `{"t":"window","days":int}`: exactly one; the length of the history window in days.
- `{"t":"job","id":name,"runs":int,"basis":enum(ci|local|user)}`: a job and its qualifying run count in
  the window. `basis` says where that count came from.
- `{"t":"run","id":name,"job":name,"day":int,"attempt":int}`: a run whose reports were flattened, the day
  it ran (any day number, larger is later) and its attempt number.
- `{"t":"test","id":name,"path":name}`: the inventory.
- `{"t":"sample","run":name,"test":name,"ms":int,"status":enum(pass|fail|skip|flaky)}`: one test result.
- `{"t":"filetime","run":name,"path":name,"ms":int}`: a test file's wall time in that run. Optional.
- `{"t":"first","test":name,"day":int}`: the day a test first existed, from version control. Optional.
- `{"t":"ignore","id":name}`: a test or file id the catalog's ignore list accepts as slow. Optional.

Output: `slow` records in rank order, then `summary`.
```
{"t":"slow","id":"tests/a.test.ts > renders","kind":"test","cost_ms_day":480000,"exec_milli":120000,"n":30,"mean":4000,"median":3990,"p90":4100,"max":4300,"basis":"ci","flags":[]}
{"t":"slow","id":"tests/a.test.ts","kind":"file","cost_ms_day":96000,"exec_milli":120000,"n":30,"mean":800,"median":800,"p90":810,"max":900,"basis":"ci","flags":[]}
{"t":"summary","tests":4000,"ranked":3990,"files":120,"unseen":10,"orphans":3,"ids_unstable":false,"samples":120000,"runs":60}
```

### flaky

Input:
- `{"t":"window","days":int}`: exactly one.
- `{"t":"job","id":name,"ms":int}`: a job and its mean duration in milliseconds.
- `{"t":"outcome","test":name,"commit":name,"job":name,"run":name,"attempt":int,"day":int,"status":enum(pass|fail|flaky|skip)}`:
  one test result from CI history. `flaky` is the runner's own passed-on-retry status.

Output: `flaky` records in rank order, then `red` records, then `burst` records, then `summary`.
```
{"t":"flaky","id":"tests/a.test.ts > saves","cost_ms_day":43200,"events":9,"contradicted":7,"retry_passed":2,"observed":140,"rate_bp":642,"first_day":3,"last_day":13}
{"t":"red","id":"tests/b.test.ts > loads","commits":2}
{"t":"burst","commit":"9f2c","events":31,"observed":4000}
{"t":"summary","outcomes":52000,"pairs":30000,"events":40,"burst_commits":1,"flaky":4,"below_min":6,"red":2,"single_fail":5}
```

### verdict

Input:
- `{"t":"test","id":name,"expects_error":bool}`: a weak-lane candidate; `expects_error` is true when the
  test asserts that the code under test raises or returns an error.
- `{"t":"baseline","test":name,"green":int}`: how many baseline runs passed, with the mutant run's
  selection.
- `{"t":"mutant","test":name,"kind":enum(R|A|S|C|B),"attempt":int,"result":enum(reached|not_reached|killed_marker|killed|survived|equivalent|none|invalid|timeout|no_result)}`:
  one mutant outcome for one test. [MUTATE.md](MUTATE.md) defines the kinds and results.

Output: one `verdict` per test in id order, then `summary`.
```
{"t":"verdict","id":"tests/test_price.py::test_total","class":"cannot_fail","proof":"CONFIRMED","reason":"","survivors":0}
{"t":"verdict","id":"tests/test_price.py::test_tax","class":"blocked","proof":"BLOCKED","reason":"unstable","survivors":0}
{"t":"summary","tests":2,"cannot_fail":1,"unreached":0,"weak":0,"ok":0,"blocked":1,"by_reason":{"unstable":1}}
```

### group

Input: `{"t":"helper","id":name,"name":name,"body":str}`: a named fixture, factory, builder or helper in
a test folder, with the full text of its body.

Output: `group` records, then `stopstem` records, then `summary`.
```
{"t":"group","id":"G0001","key":"same:tests/a/factory.ts:3:makeUser","members":["tests/a/factory.ts:3:makeUser","tests/b/util.ts:9:buildUser"]}
{"t":"stopstem","stem":"user","helpers":31}
{"t":"summary","helpers":40,"groups":1,"stopstems":1}
```

## Fixtures

Each fixture is three files with the same stem in `fixtures/`:

- `NN-name.in`: line 1 is the arguments after the tool name, separated by single spaces. Every following
  line is standard input, byte for byte.
- `NN-name.out`: the exact expected standard output.
- `NN-name.exit`: the expected exit code followed by LF.

The fixture name after the number starts with the subcommand it tests (`coverage`, `reports`, `rank`,
`flaky`, `verdict`, `group`) or `common` (argument and input-line handling every build needs). Run every
`common` fixture and every fixture for each subcommand the chosen lanes use: slow needs `coverage`,
`reports` and `rank`; flaky needs `coverage`, `reports` and `flaky`; weak needs `coverage` and `verdict`;
dupes needs `group`.

A fixture passes when standard output matches `.out` byte for byte and the exit code matches `.exit`.
Read fixture files as bytes. A checkout that converted line endings to CRLF fails every fixture; convert
the fixture files to LF in your working copy (never edit their content) and say so in the report.
