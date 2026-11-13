# Join tool contract

The skill's one deterministic tool. It joins the entry inventory with evidence counts and assigns every
verdict. It never queries a log, never reads source, and never judges. Build it from
[ALGORITHM.md](ALGORITHM.md) in whatever runtime the machine has, then run every fixture in
[fixtures/](fixtures/). Any failing fixture stops the run.

## Invocation

```
<tool> join
```

Each fixture is `NN-name.in`, whose first line holds the command-line arguments separated by single
spaces and whose remaining bytes, after that first LF, are standard input; `NN-name.out`, the exact
standard output; and `NN-name.exit`, the exit code on one line.

Input is JSON Lines on standard input. Output is JSON Lines on standard output. Nothing is written to
standard error that a caller must read. Any other first argument, or any argument after `join`, is a
usage error.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Input valid, every source gate passed, every canary matched, and at least one canary was given |
| 1 | Input valid, and a gate failed on a control, a canary did not match, or no canary was given |
| 2 | Usage error or malformed input. Output is exactly one error record |

## Input lines

Split standard input on LF. Ignore the empty string after a final LF. Remove one trailing CR from each
line if present. A byte order mark is not stripped, so a line starting with one is `bad_json`. Every
other line must be valid UTF-8 holding one JSON object with a string field `t` naming the record type.
Fields not listed for a type are ignored. Line numbers count from 1 at the first line of standard input.
Records may come in any order: a record that refers to another is checked against every record in the
input, not only earlier ones.

Parse each line with the runtime's standard JSON parser: when an object repeats a key, the last value
wins, and string escapes decode as that parser decodes them. `NaN` and `Infinity` are not JSON, so a line
holding them is `bad_json`.

Field types:

- `str`: a JSON string, possibly empty.
- `name`: a JSON string, non-empty.
- `int`: a JSON number whose value is a whole number from 0 to 9007199254740991, in any JSON number
  form (`1.0` and `1e0` count as 1).
- `bool`: JSON `true` or `false`.
- `date`: a JSON string `YYYY-MM-DD` naming a real day of the proleptic Gregorian calendar, year 0001 to
  9999 (`2028-02-29` is valid, `2027-02-29` and `2026-1-05` are not). A UTC day.
- `names`: a JSON array of `name`, with no value repeated.

Closed lists:

- kind: `route`, `handler`, `job`, `flag`, `screen`.
- role: `candidate`, `control_live`, `control_zero`, `canary`.
- demote reason: `external`, `recheck`, `pending`.
- class: `LIVE`, `UNUSED`, `ENTRY_UNUSED`, `STUCK`, `UNPROVEN`.
- reason, in precedence order: `dynamic`, `kept`, `too_new`, `synthetic_only`, `external`, `recheck`,
  `pending`, `no_source`, `control`, `sampled`, `blind_spot`, `short_window`, `no_evidence`.

## Record types

| Record | Fields, in check order |
|---|---|
| `run` | `date`: date. Exactly one |
| `policy` | `kind`: kind; `floor`: int, at least 1. Optional; overrides a default floor |
| `source` | `source`: name; `kinds`: names, each a kind; `sampled`, `success_logged`, `scope_confirmed`, `absent_is_zero`: bool |
| `entry` | `id`: name; `kind`: kind; `role`: role; `source`: str; `callers`, `age_days`, `period_days`: int; `dynamic`: bool; `expect`: str |
| `day` | `source`: name; `date`: date; `records`: int |
| `hit` | `source`: name; `id`: name; `arm`: str; `real`, `synthetic`: int; `last`: str |
| `unmatched` | `source`: name; `kind`: kind; `matched`, `unmatched`: int |
| `demote` | `id`: name; `reason`: demote reason |
| `keep` | `id`: name; `review_by`: date |
| `prior` | `id`: name |

Rules that one record decides alone (checked with its fields, error `bad_field`):

- `entry.source` is non-empty exactly when `role` is `control_live` or `control_zero`.
- `entry.expect` is non-empty exactly when `role` is `canary`. It is a class, or a class, `/` and a
  reason (`UNPROVEN/short_window`). `UNPROVEN` alone is invalid; every other class takes no reason.
- `hit.last` is `""` when `real` is 0, and a valid date when `real` is above 0.

Default floors: `route`, `handler`, `job`, `screen` 110 days; `flag` 30 days.

## Output format

- One JSON object per line, LF after every line including the last. No BOM.
- Compact: no spaces between tokens. Keys in exactly the order shown below.
- Strings escaped as JSON requires: `"` and `\` escaped, control characters as `\b \f \n \r \t` or
  `\u00XX` with lowercase hex, every other character written as itself in UTF-8. This matches
  `JSON.stringify` and Python's `json.dumps(value, ensure_ascii=False, separators=(",", ":"))`.
- Integers in plain decimal. Ratios are strings (basis-point rule in ALGORITHM.md).
- Objects with computed keys (`by_class`, `by_reason`) list keys in byte order. Build them as ordered
  pairs.

## Output records

In this order: one `gate` per source and kind, sorted by source then kind; one `control` per control
entry, sorted by id; one `canary` per canary entry, sorted by id; one `verdict` per candidate, sorted by
id; one `summary`.

```
{"t":"gate","source":"logs","kind":"route","pass":true,"reason":"","live_controls":1,"zero_controls":1,"failed_controls":0,"unmatched":"0.0100"}
{"t":"control","id":"route:GET /healthz","source":"logs","role":"control_live","real":40,"synthetic":0,"pass":true}
{"t":"canary","id":"route:GET /zz-canary","need":110,"expect":"UNUSED","got":"UNUSED","pass":true}
{"t":"verdict","id":"route:GET /legacy","kind":"route","need":110,"class":"UNUSED","reason":"","reasons":[],"revived":false}
{"t":"summary","candidates":3,"by_class":{"ENTRY_UNUSED":0,"LIVE":1,"STUCK":0,"UNPROVEN":1,"UNUSED":1},"by_reason":{"short_window":1},"revived":0,"keep_redundant":0,"keep_expired":0,"keep_orphan":0,"gates_failed":0,"canaries":1,"canaries_failed":0}
```

`gate.reason` is `""`, `control`, `sampled` or `blind_spot`. `gate.unmatched` is `""` when no
`unmatched` record exists for that source and kind.

## Error record

```
{"t":"error","line":3,"reason":"bad_json"}
```

`line` is 0 for `usage` and `missing_run`. Every field error is found before any semantic error, so a
`bad_field` on line 9 wins over an `unknown_entry` on line 3. `reason` is one of:

| Reason | When |
|---|---|
| `usage` | bad command line |
| `bad_json` | the line is not valid UTF-8 or not valid JSON |
| `not_object` | valid JSON but not an object |
| `unknown_type` | `t` missing, not a string, or not a record type above |
| `missing_field` | a required field is absent |
| `bad_field` | a field has the wrong type or value, or breaks a rule above or in ALGORITHM.md |
| `duplicate` | a value that must be unique repeats |
| `unknown_source` | a record names a source no `source` record declared |
| `unknown_entry` | a record names an id no `entry` record declared |
| `missing_run` | no `run` record |
