# Parity tool contract

The skill's one deterministic tool. It does every number in the run: compositing, luminance, contrast,
buckets, cross-theme joins, clusters, fix candidates and the run checks. It never opens a browser, never
reads source and never judges. Build it from [ALGORITHM.md](ALGORITHM.md) in whatever runtime the machine
has, in the work folder outside the repo, then run every fixture in [fixtures/](fixtures/). Any failing
fixture stops the run.

## Invocation

```
<tool> table
<tool> measure [--level AA|AAA] [--max-undecided-basis-points N] [--max-colour-basis-points N]
<tool> parity
<tool> cluster
<tool> candidates [--level AA|AAA]
<tool> verify --check coverage [--min-basis-points N]
<tool> verify --check canaries
<tool> verify --check truth [--max-channel-delta N] [--max-off-basis-points N]
```

Input is JSON Lines on standard input (`table` reads none). Output is JSON Lines on standard output.
Nothing is written to standard error that a caller must read.

Options are `--name value` pairs, in any order. `--level` is `AA` or `AAA`. `--check` is `coverage`,
`canaries` or `truth`. Every other value is one or more ASCII digits, read as a decimal integer (leading
zeros allowed), at most 9007199254740991. Defaults: `--level AA`, `--max-undecided-basis-points 500`,
`--max-colour-basis-points 100`, `--min-basis-points 9500`, `--max-channel-delta 2`,
`--max-off-basis-points 1000`. These are usage errors: an unknown subcommand or check; an unknown or
repeated option; an option not listed for that subcommand or check; a missing or invalid value; `verify`
without `--check`; any other argument left over.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Input valid, and the subcommand found no problem (always 0 for valid `table`, `cluster` and `candidates` input) |
| 1 | Input valid, and the check found a problem: `measure` result FAIL, `parity` with fewer than two themes, any `verify` result FAIL |
| 2 | Usage error or malformed input. Output is exactly one error record |

## Input lines

Split standard input on LF. Ignore the empty string after a final LF. Remove one trailing CR from each
line if present. A byte order mark is not stripped, so a line starting with one is `bad_json`. Every
other line must be valid UTF-8 holding one JSON object with a string field `t` naming the record type.
Fields not listed for a type are ignored. When an object repeats a key, the last value wins. Line numbers
count from 1 at the first line of standard input. Records may come in any order: a record that refers to
another (a `render` to its `screen`) is checked against every record in the input, not only earlier ones.

Field types:

- `str`: a JSON string, possibly empty.
- `name`: a JSON string, non-empty.
- `int`: a JSON number whose value is a whole number from 0 to 9007199254740991 (`1.0` counts as 1).
  Judge it from the number's JSON text, not a rounded double: `9007199254740993` and `3.4` are
  `bad_field`; `-0` counts as 0.
- `bool`: `true` or `false`.
- `names`: a JSON array of `name`, with no value repeated. Check the types first: an array holding a
  value that is not a `name` is `bad_field`, even if a value also repeats; an array of names that repeats
  one is `duplicate`.
- `dec`: a JSON string matching `[0-9]+(\.[0-9]+)?` or `\.[0-9]+`, read as an exact decimal.
- `unit`: a `dec` whose value is at most 1.
- `layers`: a JSON array of objects, each with `color` (`str`), `opacity` (`unit`) and `src` (`str`).
  Anything else, including a missing member, is `bad_field` for the whole field.
- one of: a `str` whose value must be in the listed set.

## Colour strings

A colour string is parsed by the grammar in ALGORITHM.md "Colours". A string that does not parse is not
an input error: the node it belongs to becomes UNDECIDED with reason `colour`. The exceptions, which are
`bad_field`, are `candidate.color`, `sample.computed` and `sample.pixel`.

## Output format

- One JSON object per line, LF after every line including the last. No BOM.
- Compact: no spaces between tokens. Keys in exactly the order shown in this file.
- Strings escaped as JSON requires: `"` and `\` escaped, control characters as `\b \f \n \r \t` or
  `\u00XX` with lowercase hex, every other character written as itself in UTF-8. This matches
  `JSON.stringify` and Python's `json.dumps(value, ensure_ascii=False, separators=(",", ":"))`.
- Integers in plain decimal, computed with exact integer arithmetic.
- Objects with computed keys (`undecided_by_reason`) list keys in byte order.
- Ratios print as `D.DD` (see ALGORITHM.md "Contrast"). Basis-point shares print as `D.DDDD`.

## Error record

```
{"t":"error","line":3,"reason":"bad_json"}
```

`line` is 0 for a usage error and for `no_target`. `reason` is one of:

| Reason | When |
|---|---|
| `usage` | bad command line |
| `bad_json` | the line is not valid UTF-8 or not valid JSON |
| `not_object` | valid JSON but not an object |
| `unknown_type` | `t` missing, not a string, or not a type this subcommand accepts |
| `missing_field` | a required field is absent |
| `bad_field` | a required field has the wrong type or a value outside its set |
| `duplicate` | a value that must be unique repeats |
| `unknown_screen` | a `render` names a screen and theme no `screen` record planned |
| `no_target` | `candidates` input has no `target` record |

## Record types per subcommand

Required fields in the order they are checked.

### measure, and the node part of candidates

`node`: `id` name, `screen` name, `theme` name, `key` name, `fg` str, `layers` layers, `canvas` str,
`size` dec, `weight` int, `flags` names, `skip` str, `exempt` str, `fg_src` str.

`layers` lists, innermost first, every element from the text's own element out to the root that has a
background colour that is not fully transparent or an opacity below 1. `canvas` is the colour behind the
root. `key` joins the same text across themes. The collector rules are in [COLLECT.md](COLLECT.md).

Output: one `pair` per node in input order, then one `summary`.

```
{"t":"pair","id":"n1","screen":"home","theme":"dark","key":"home|main>p:1|9f2c","bucket":"FAIL","reason":"","ratio":"3.03","need":"4.5","large":false,"fg":"#6b7280","bg":"#1f2937","fg_src":"--text-muted","bg_src":"--surface"}
{"t":"summary","nodes":5,"PASS":2,"FAIL":1,"UNDECIDED":1,"SKIPPED":1,"EXEMPT":0,"undecided_by_reason":{"gradient":1},"undecided_share":"0.2500","colour_share":"0.0000","result":"FAIL"}
```

`bucket` is one of `PASS`, `FAIL`, `UNDECIDED`, `SKIPPED`, `EXEMPT`. `reason`, `ratio`, `need`, `fg` and
`bg` are `""` where ALGORITHM.md says so.

### parity

`pair`: `id` name, `theme` name, `key` name, `bucket` one of the five buckets, `fg` str, `bg` str,
`fg_src` str, `bg_src` str.

Output: one `fixed` per fixed key in key byte order, then one `summary`.

```
{"t":"fixed","key":"home|main>p:2|07aa","side":"fg","value":"#333333","src":"literal","fails_in":["dark"]}
{"t":"summary","themes":2,"keys":4,"joined":2,"missing":1,"undecided":1,"fixed_fg":1,"fixed_bg":0,"fixed_both":0,"fixed_failing":1}
```

`side` is `fg`, `bg` or `both`.

### cluster

`pair`: `id` name, `screen` name, `theme` name, `bucket` one of the five buckets, `reason` str, `ratio`
str, `need` str, `fg` str, `bg` str, `fg_src` str, `bg_src` str. For a `PASS` or `FAIL` record, a `ratio`
not matching `[0-9]+\.[0-9]{2}`, a `need` not matching `[0-9]\.[0-9]`, or an `fg` or `bg` not matching
`#[0-9a-f]{6}` is `bad_field`.

Output: every `cluster`, then every `undecided`, then one `summary`.

```
{"t":"cluster","id":"C0001","theme":"dark","fg":"--text-muted","bg":"--surface","pairs":212,"screens":31,"worst":"3.03","need":"4.5"}
{"t":"undecided","theme":"dark","reason":"gradient","bg":"--hero","pairs":40,"screens":2}
{"t":"summary","pairs":900,"fail":297,"clusters":9,"top3":271,"top3_share":"0.9124"}
```

### candidates

`node` records as for `measure`; exactly one `target`: `src` name, `theme` name, `side` one of `fg`,
`bg`; `candidate`: `name` name, `color` str.

Output: one `before`, then one `candidate` per candidate record in input order.

```
{"t":"before","affected":214,"fail":212,"worst":"3.03"}
{"t":"candidate","name":"gray-400","color":"#9ca3af","fixed":212,"regressed":0,"still_failing":0,"worst":"6.99"}
```

### verify --check coverage

`screen`: `screen` name, `theme` name. `render`: `screen` name, `theme` name, `status` one of
`collected`, `blocked`, `skipped`; `reason` str, `nodes` int, `root` str, `sentinel` str.

Output: one `problem` per problem in the order ALGORITHM.md gives, then one `summary`.

```
{"t":"problem","screen":"settings","theme":"dark","reason":"switch","with":"light"}
{"t":"summary","planned":4,"collected":3,"blocked":1,"skipped":0,"missing":0,"problems":1,"coverage":"0.7500","result":"FAIL"}
```

### verify --check canaries

`pair`: `id` name, `bucket` one of the five buckets, `fg_src` str. `fixed`: `key` name, `side` one of
`fg`, `bg`, `both`. `expect`: `id` name, `bucket` one of the five buckets, `fg_src` str.
`expect_fixed`: `key` name, `side` one of `fg`, `bg`, `both`.

Output: one `problem` per failed expectation in input order, then one `summary`.

```
{"t":"problem","id":"canary-opacity","reason":"bucket","want":"FAIL","got":"PASS"}
{"t":"summary","expected":6,"behaved":5,"result":"FAIL"}
```

### verify --check truth

`sample`: `id` name, `computed` str, `pixel` str.

Output: one `problem` per sample off by more than the delta, in input order, then one `summary`.

```
{"t":"problem","id":"n812","reason":"off","delta":5}
{"t":"summary","samples":20,"off":1,"result":"PASS"}
```

### table

No input. Output: 256 `lin` records, `c` from 0 to 255.

```
{"t":"lin","c":118,"v":181164244}
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
