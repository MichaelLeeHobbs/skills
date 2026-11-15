# Ledger tool contract

The steward's one deterministic tool. It reduces ledger lines to one row per skill and scope, with a
status word, a trend, dueness and coverage counts. It never reads a file, never runs version control and
never judges: you read the ledger, the reports and the history, and feed it facts. Build it from
[ALGORITHM.md](ALGORITHM.md) in whatever runtime the machine has, then run every fixture in
[fixtures/](fixtures/). Any failing fixture stops the run.

## Invocation

```
<tool> reduce
```

Input is JSON Lines on standard input. Output is JSON Lines on standard output. Nothing is written to
standard error that a caller must read. Any other argument, a missing subcommand or an option is a usage
error.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Input valid, and every ledger line was read (duplicates are not problems) |
| 1 | Input valid, and at least one ledger line was rejected |
| 2 | Usage error or malformed input. Output is exactly one error record |

## Input lines

Split standard input on LF. Ignore the empty string after a final LF; any other empty line is
`bad_json`. Remove one trailing CR from each
line if present. A byte order mark is not stripped, so a line starting with one is `bad_json`. Every
other line must be valid UTF-8 holding one JSON object with a string field `t` naming the record type.
Fields not listed for a type are ignored. Line numbers count from 1 at the first line of standard input.
Records may come in any order.

Field types used below:

- `str`: a JSON string, possibly empty.
- `name`: a JSON string, non-empty.
- `int`: a JSON number whose value is a whole number from 0 to 9007199254740991 (`1.0` counts as 1).
- `bool`: `true` or `false`.
- `names`: a JSON array of `name`, with no value repeated.
- `time`: a `name` of the form `YYYY-MM-DDTHH:MM:SSZ` that is a real UTC time (ALGORITHM.md "Times").
- `scope`: a `name` that is `.` or a relative path with `/` separators: no leading or trailing `/`, no
  `\`, and no segment that is empty, `.` or `..`.

## Input records

All five types go to `reduce`. Required fields, in the order they are checked:

- `{"t":"now","at":time}`: the current UTC time. Exactly one.
- `{"t":"unit","skill":name,"scope":scope,"kind":str,"due":int,"applies":bool,"absent":names}`: one
  Survey unit, one per installed skill and scope. `kind` is `source`, `runtime` or `none` (a skill with
  no metric). `due` is the threshold: commits for `source`, days for `runtime`, at least 1 for both;
  any `int` for `none`. `applies` is the Survey verdict. `absent` names the setup the Survey found
  missing; an empty array means nothing is missing.
- `{"t":"ledger","line":int,"text":str}`: one non-empty line of `ledger.jsonl`, exactly as read, and its
  line number in that file (at least 1).
- `{"t":"report","line":int,"found":bool}` plus, when `found` is true, `"commit":str,"value":int|null,
  "date":str`: what the header of the report named by ledger line `line` says. `found` is false when
  that file does not exist. `date` is the report's run date as `YYYY-MM-DD`.
- `{"t":"git","line":int,"ancestor":bool,"commits":int}`: for ledger line `line`, whether its commit
  (without `+dirty`) is an ancestor of the current commit, and if so how many commits touching its scope
  came after it. Send `ancestor` false, `commits` 0 for a commit that cannot be found.

A `kind` outside its list, a `due` of 0 for `source` or `runtime`, a `scope` or `time` of the wrong form,
or a ledger `line` of 0 is `bad_field`. A `report` with `found` true that lacks `commit`, `value` or
`date` is `missing_field`.

Semantic checks, run only when every line passed the checks above, in input order: a second `now` is
`duplicate`; a second `unit` with the same `skill` and `scope` is `duplicate`; a second `ledger` with the
same `line` is `duplicate`; a `report` or `git` whose `line` has no `ledger` record is `unknown_line`; a
second `report` or a second `git` for the same `line` is `duplicate`. After those, no `now` record at
all is `no_now` on line 0.

Send a `report` and a `git` record for every ledger line you can. A missing `report` fact makes a row
`unverified (unchecked)`; a missing `git` fact makes its age unknown. Neither is an error.

## Ledger records

The tool parses each `ledger` record's `text` itself (after removing one trailing CR). A text that fails
any check below is rejected, listed as a `problem`, and otherwise ignored. Checks, in order, the first
failure deciding:

1. Not valid JSON (a leading byte order mark included): `bad_json`.
2. Not an object: `not_object`.
3. For each field in this order, absent is `missing_field`, wrong is `bad_field`:

| Field | Valid |
|---|---|
| `skill` | `name` |
| `scope` | `scope` |
| `at` | `time` |
| `commit` | `none`, or 7 to 64 characters of `0-9a-f` optionally followed by `+dirty` |
| `check` | `pass`, `partial` or `fail` |
| `degraded` | `false`, or one of `browser`, `runtime-evidence`, `ci-history`, `build`, `parser` |
| `metric` | `name` or `null` |
| `value` | `int` or `null` |
| `comparable` | `name` made of `key=value` pairs joined by `;`, split at each pair's first `=`; every key non-empty and distinct, a value may be empty; the first pair `mode=full` or `mode=degraded` |
| `report` | `name` or `null` |

A ledger text identical to the text of a ledger record with a smaller `line` (after removing one
trailing CR from both) is a duplicate: dropped before any check, never rejected.

## Output format

- One JSON object per line, LF after every line including the last. No BOM.
- Compact: no spaces between tokens. Keys in exactly the order shown in this file, every key always
  present unless this file says otherwise.
- Strings escaped as JSON requires: `"` and `\` escaped, control characters as `\b \f \n \r \t` or
  `\u00XX` with lowercase hex, every other character written as itself in UTF-8. This matches
  `JSON.stringify` and Python's `json.dumps(value, ensure_ascii=False, separators=(",", ":"))`.
- Integers in plain decimal, negative with a leading `-`. Ratios are strings (ALGORITHM.md "Basis
  points"). Absent values are `null`.

## Output records

In order: one `row` per skill and scope, sorted by `skill` then `scope`; one `coverage` per scope that
has at least one applicable unit, sorted by `scope`; one `total`; one `problem` per dropped or rejected
ledger line, sorted by `line`; one `summary`.

```
{"t":"row","skill":"find-reinvention","scope":"apps/web","unit":"applies","status":"measured","reason":null,"metric":"jobs_2plus","value":9,"trend":"down","delta":-3,"prev_line":1,"trend_key":null,"at":"2026-11-01T10:00:00Z","commit":"a1b2c3d4e5f6a7b8c9d0a1b2c3d4e5f6a7b8c9d0","days":14,"commits":4,"ratio":"0.1600","due":false,"rank":null,"good_line":3,"good_value":9,"line":3}
{"t":"coverage","scope":"apps/web","units":2,"measured":1,"clean":0,"due":1,"needs_setup":0}
{"t":"total","units":2,"measured":1,"clean":0,"due":1,"needs_setup":0}
{"t":"problem","line":4,"reason":"duplicate","of":2}
{"t":"problem","line":5,"reason":"bad_field","field":"check"}
{"t":"summary","read":5,"shown":2,"duplicates":1,"superseded":1,"rejected":1,"rows":2,"due":1,"through":"2026-11-01T10:00:00Z"}
```

`row` fields:

| Field | Meaning |
|---|---|
| `unit` | `applies`, `not_applicable`, `no_metric` (kind `none`), or `unknown` (ledger lines but no unit) |
| `status` | `unmeasured`, `failed`, `unverified`, `unproven`, `needs_setup`, `clean`, `was_clean`, `measured` |
| `reason` | why, for `failed` (the degraded thing), `unverified`, `unproven`, `needs_setup`; else `null` |
| `metric`, `value`, `at`, `commit` | from the latest valid record, or `null` |
| `trend` | `down`, `up`, `same`, `new_baseline`, `not_comparable` or `none` |
| `delta` | latest value minus previous value, for `down`, `up` and `same` |
| `prev_line` | ledger line of the previous record the trend used |
| `trend_key` | for `not_comparable`, the first `comparable` key that differs |
| `days` | whole days from the latest valid record's `at` to `now` |
| `commits` | commits touching the scope since the latest valid record; `null` when its age is unknown |
| `ratio` | age over threshold, for a measured row of an applicable unit |
| `due` | whether the row is due |
| `rank` | the recommendation order among due rows, from 1 |
| `good_line`, `good_value` | the latest clean-evidence record (pass, full, not dirty) and its value |
| `line` | ledger line of the latest valid record; `null` only for `unmeasured` |

`problem` carries `field` only for `missing_field` and `bad_field`, and `of` (the earlier line) only for
`duplicate`. `reason` is `duplicate`, `bad_json`, `not_object`, `missing_field` or `bad_field`.

`summary`: `read` (ledger records), `shown` (rows with a latest valid record), `duplicates`,
`superseded` (valid records that are not a row's latest), `rejected`, `rows`, `due` (rows due), and
`through` (the greatest `at` among valid records, or `null`). Always `read` equals `shown + duplicates +
superseded + rejected`.

## Error record

```
{"t":"error","line":3,"reason":"bad_json"}
```

`line` is 0 for `usage` and `no_now`. `reason` is one of:

| Reason | When |
|---|---|
| `usage` | bad command line |
| `bad_json` | the input line is not valid UTF-8 or not valid JSON |
| `not_object` | valid JSON but not an object |
| `unknown_type` | `t` missing, not a string, or not one of the five types |
| `missing_field` | a required field is absent |
| `bad_field` | a required field has the wrong type or form |
| `duplicate` | a value that must be unique repeats |
| `unknown_line` | a `report` or `git` record names a line no `ledger` record has |
| `no_now` | no `now` record |

## Fixtures

Each fixture is three files with the same stem in `fixtures/`:

- `NN-name.in`: line 1 is the arguments after the tool name, separated by single spaces. Every following
  line is standard input, byte for byte.
- `NN-name.out`: the exact expected standard output.
- `NN-name.exit`: the expected exit code followed by LF.

A fixture passes when standard output matches `.out` byte for byte and the exit code matches `.exit`.
Read fixture files as bytes. A checkout that converted line endings to CRLF fails every fixture; convert
the fixture files to LF in your working copy (never edit their content) and say so.
