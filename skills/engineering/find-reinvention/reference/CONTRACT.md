# Bookkeeping tool contract

The skill's one deterministic tool. It counts and checks. It never reads source files, never measures
similarity, and never judges. Build it from [ALGORITHM.md](ALGORITHM.md) in whatever runtime the machine
has, then run every fixture in [fixtures/](fixtures/). Any failing fixture stops the run.

## Invocation

```
<tool> slice [--max-bytes N]
<tool> strings
<tool> group [--max-stem N]
<tool> verify --check ids
<tool> verify --check rows
<tool> verify --check map
<tool> verify --check groups
<tool> verify --check coverage [--min-basis-points N] [--max-adjusted-basis-points N]
<tool> tally
```

Input is JSON Lines on standard input. Output is JSON Lines on standard output. Nothing is written to
standard error that a caller must read.

Options are `--name value` pairs, in any order. The value of `--check` is one of `ids`, `rows`, `map`,
`groups`, `coverage`. Every other value is one or more ASCII digits, read as a decimal integer (leading
zeros allowed). Defaults: `--max-bytes 100000`, `--max-stem 25`, `--min-basis-points 9800`,
`--max-adjusted-basis-points 200`. These are usage errors: an unknown subcommand; an unknown check name;
an unknown or repeated option; an option not listed for that subcommand or check; a missing value; a
numeric value that is not digits or is above 9007199254740991; `--max-bytes` or `--max-stem` equal to 0; `verify` without `--check`;
any other argument left over.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Input valid, and the check found no problem (always 0 for valid `slice`, `strings`, `group` and `tally` input) |
| 1 | Input valid, and the check found at least one problem or failed its threshold |
| 2 | Usage error or malformed input. Output is exactly one error record |

## Input lines

Split standard input on LF. Ignore the empty string after a final LF. Remove one trailing CR from each
line if present. A byte order mark is not stripped, so a line starting with one is `bad_json`. Every
other line must be valid UTF-8 holding one JSON object with a string field `t`
naming the record type. Fields not listed for a type are ignored. Line numbers count from 1 at the first
line of standard input. Records may come in any order: a record that refers to another (a `row` to its
`file`, a `part` to its `group`) is checked against every record in the input, not only earlier ones.

Field types used below:

- `str`: a JSON string, possibly empty.
- `name`: a JSON string, non-empty.
- `int`: a JSON number whose value is a whole number from 0 to 9007199254740991 (`1.0` counts as 1).
- `names`: a JSON array of `name`, with no value repeated.

## Output format

- One JSON object per line, LF after every line including the last. No BOM.
- Compact: no spaces between tokens. Keys in exactly the order shown in this file.
- Strings escaped as JSON requires: `"` and `\` escaped, control characters as `\b \f \n \r \t` or
  `\u00XX` with lowercase hex, every other character written as itself in UTF-8. This matches
  `JSON.stringify` and Python's `json.dumps(value, ensure_ascii=False, separators=(",", ":"))`.
- Integers in plain decimal. Sums use exact integer arithmetic, even past 9007199254740991. Ratios are strings: see `coverage` and the basis-point rule in ALGORITHM.md.
- Booleans as `true` or `false`.
- Objects with computed keys (`by_kind`, `by_reason`, `by_phase`) list keys in byte order. Build them as
  ordered pairs: some runtimes reorder number-like keys such as `"10"` and `"9"` in a native object.

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
| `bad_field` | a required field has the wrong type, or a closed-list value is invalid in `tally` |
| `duplicate` | a value that must be unique repeats |
| `unknown_path` | a record names a path no `file` or `count` record declared |
| `unknown_group` | a record names a group no `group` record declared |
| `unmapped` | a `group` input row's `domain_in` has no `map` record |

## Record types per subcommand

### slice

Input:
- `{"t":"file","path":name,"bytes":int}`: a source file and its size in bytes at the recorded commit.
- `{"t":"row","id":name,"path":name}`: one inventory row and the file it lives in.

Output, in order: one `slice` record per slice, then one `summary`.
```
{"t":"slice","slice":"S0001","bytes":90,"files":["src/a.ts","src/b.ts"],"rows":["src/a.ts:1:fmtA"]}
{"t":"summary","slices":2,"files":3,"rows":4,"bytes":120}
```

### strings

Input: `{"t":"row","id":name,"domain_in":str}`

Output: one `string` record per distinct trimmed, non-empty `domain_in`, then `summary`. The `string`
records are valid input for `verify --check map`.
```
{"t":"string","value":"byte count","rows":1}
{"t":"summary","rows":4,"strings":2}
```

### group

Input:
- `{"t":"row","id":name,"name":name,"kind":str,"domain_in":str,"domain_out":str}`
- `{"t":"map","value":name,"domain":name}`: the saved domain mapping.

Output: `group` records, then `stopstem` records, then `summary`. The `group` records are valid input for
`verify --check groups`.
```
{"t":"group","id":"G0001","key":"job:D0001>text","members":["a.ts:1:formatDate","c.ts:2:formatDay"]}
{"t":"stopstem","stem":"date","rows":3}
{"t":"summary","rows":9,"eligible":8,"groups":2,"stopstems":1}
```

### verify --check ids

Input:
- `{"t":"expect","slice":name,"id":name}`: an ID the slice was given.
- `{"t":"got","slice":name,"id":name}`: an ID a worker returned for that slice.

Output: `problem` records, then `summary`.
```
{"t":"problem","slice":"S0001","id":"a.ts:5:g","kind":"missing"}
{"t":"summary","expected":3,"got":4,"problems":3}
```
`kind` is `missing`, `extra` or `duplicate`.

### verify --check rows

Input: `{"t":"row","id":name,"name":name,"kind":str,"visibility":str,"verb":str,"domain_in":str,
"domain_out":str,"empty":str,"invalid":str,"zone_or_units":str,"effects":str}`

Closed lists (the same lists appear in ROWS.md):

| Field | Allowed values |
|---|---|
| `kind` | `utility`, `method`, `framework-bound`, `override`, `component`, `handler` |
| `visibility` | `exported`, `private`, `inner` |
| `verb` | `format`, `parse`, `convert`, `validate`, `check`, `compare`, `sort`, `filter`, `group`, `map`, `merge`, `build`, `extract`, `normalize`, `compute`, `count`, `find`, `generate`, `render`, `wrap`, `guard` |
| `domain_out` | `text`, `number`, `boolean`, `date`, `collection`, `record`, `markup`, `none` |
| `effects` | `pure`, `clock`, `locale`, `framework`, `io` |

Output: `problem` records, then `summary`.
```
{"t":"problem","id":"b.ts:2:toLabel","kind":"bad_verb"}
{"t":"problem","id":"b.ts:2:toLabel","kind":"empty","field":"invalid"}
{"t":"summary","rows":5,"rejected":4,"problems":8}
```
`kind` is one of `bad_kind`, `bad_visibility`, `bad_verb`, `bad_domain_out`, `bad_effects`, `empty`,
`na_not_allowed`, `restates_name`. Only `empty` and `na_not_allowed` carry `field`.

### verify --check map

Input:
- `{"t":"domain","id":name,"name":name}`: a canonical domain.
- `{"t":"string","value":name}`: a `domain_in` string seen in the rows. Repeats are allowed.
- `{"t":"map","value":name,"domain":name}`: a mapping from a string to a domain ID.

Output: `problem` records, then `summary`.
```
{"t":"problem","kind":"unmapped","value":"user id"}
{"t":"summary","strings":5,"mapped":2,"domains":2,"problems":3}
```
`kind` is `unmapped`, `unknown_domain` or `conflict`.

### verify --check groups

Input:
- `{"t":"group","id":name,"members":names}`: a candidate group of row IDs.
- `{"t":"part","group":name,"id":name,"members":names}`: one part of a group that was split.
- `{"t":"keep","a":name,"b":name}`: two overlapping groups the caller could not merge (the merge would
  exceed the size cap). Order of `a` and `b` does not matter.

Output: `problem` records, then `summary`.
```
{"t":"problem","group":"G2","kind":"lost","id":"m4"}
{"t":"problem","group":"G1","kind":"overlap","other":"G2","shared":2}
{"t":"summary","groups":4,"split":1,"problems":2}
```
`lost` and `foreign` carry `id`. `overlap` carries `other` and `shared`.

### verify --check coverage

Input:
- `{"t":"count","path":name,"parser":int,"pattern":int}`: for one file, how many named callables the
  parser found before any were excluded, and how many the language's count pattern matched.
- `{"t":"adjust","path":name,"reason":name}`: a file whose counts are known to disagree for a stated
  reason. Adjusted files leave both sums.

Output: `short` records, then `adjusted` records, then `summary`.
```
{"t":"short","path":"src/b.ts","parser":8,"pattern":10}
{"t":"adjusted","path":"m/models.py","reason":"pattern counts def inside docstrings"}
{"t":"summary","files":3,"adjusted":0,"parser":51,"pattern":50,"covered":48,"coverage":"0.9600","adjusted_share":"0.0000","pass":false}
```

### tally

Input (every type optional, any order):
- `{"t":"row","kind":str,"visibility":str}`: `kind` and `visibility` from the closed lists above.
- `{"t":"excluded","reason":name,"count":int}`
- `{"t":"slice","status":str}`: `done` or `blocked`.
- `{"t":"verdict","job":name,"verdict":str}`: `SAME`, `VARIANT` or `DIFFERENT`.
- `{"t":"evidence","result":str}`: `CONFIRMED`, `REFUTED` or `BLOCKED`.
- `{"t":"spend","phase":name,"usd_cents":int}`
- `{"t":"cap","usd_cents":int}`: at most one.

A value outside its closed list is `bad_field`. A second `cap` record is `duplicate`.

Output: exactly seven records in this order.
```
{"t":"rows","total":3,"by_kind":{"component":1,"utility":2},"by_visibility":{"exported":2,"private":1}}
{"t":"excluded","total":54,"by_reason":{"callback":12,"test":42}}
{"t":"slices","done":2,"blocked":1}
{"t":"verdicts","SAME":2,"VARIANT":1,"DIFFERENT":1}
{"t":"evidence","CONFIRMED":1,"REFUTED":0,"BLOCKED":1}
{"t":"jobs","reinvented":2}
{"t":"spend","total_cents":1025,"cap_cents":2500,"over_cap":false,"by_phase":{"describe":125,"judge":900}}
```

## Fixtures

Each fixture is three files with the same stem in `fixtures/`:

- `NN-name.in`: line 1 is the arguments after the tool name, separated by single spaces. Every following
  line is standard input, byte for byte.
- `NN-name.out`: the exact expected standard output.
- `NN-name.exit`: the expected exit code followed by LF.

A fixture passes when standard output matches `.out` byte for byte and the exit code matches `.exit`.
Read fixture files as bytes. A checkout that converted line endings to CRLF fails every fixture; convert
the fixture files to LF in your working copy (never edit their content) and say so in the report.
