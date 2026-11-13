# Bookkeeping tool contract

The skill's deterministic tool. It checks captures, assigns roles, grades values against the scale and
counts. It never opens a page, never reads source and never judges. Build it from
[ALGORITHM.md](ALGORITHM.md) in whatever runtime the machine has, then run every fixture in
[fixtures/](fixtures/). Any failing fixture stops the run.

## Invocation

```
<tool> verify --check captures
<tool> verify --check canaries [--tolerance N]
<tool> unmatched
<tool> tally [--tolerance N] [--max-unassigned-basis-points N]
```

Input is JSON Lines on standard input. Output is JSON Lines on standard output. Nothing is written to
standard error that a caller must read.

Options are `--name value` pairs, in any order. The value of `--check` is `captures` or `canaries`.
Every other value is one or more ASCII digits, read as a decimal integer (leading zeros allowed).
Defaults: `--tolerance 5` (hundredths of a pixel), `--max-unassigned-basis-points 500`. These are usage
errors: an unknown subcommand; an unknown check name; an unknown or repeated option; an option not listed
for that subcommand or check; a missing value; a numeric value that is not digits or is above
9007199254740991; `verify` without `--check`; any other argument left over.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Input valid, and the check found no problem (always 0 for valid `unmatched` input) |
| 1 | Input valid, and the check found at least one problem, or `tally`'s unassigned gate failed |
| 2 | Usage error or malformed input. Output is exactly one error record |

## Input lines

Split standard input on LF. Ignore the empty string after a final LF. Remove one trailing CR from each
line if present. A byte order mark is not stripped, so a line starting with one is `bad_json`. Every
other line must be valid UTF-8 holding one JSON object with a string field `t` naming the record type.
Fields not listed for a type are ignored. Line numbers count from 1 at the first line of standard input.
Records may come in any order: a record that refers to another (a `text` to its `capture`) is checked
against every record in the input, not only earlier ones.

Every subcommand accepts every record type below and validates it, then uses only the types it needs.
That lets a caller pipe a whole work folder in.

Field types:

- `str`: a JSON string, possibly empty.
- `name`: a JSON string, non-empty.
- `key`: a `name` that is safe (ALGORITHM.md, "Safe keys"). An unsafe value is `unsafe_key`.
- `int`: a JSON number whose value is a whole number from 0 to 9007199254740991 (`1.0` counts as 1).
- `pos`: an `int` of at least 1.
- `sint`: a JSON number whose value is a whole number from -9007199254740991 to 9007199254740991.
- `bool`: JSON `true` or `false`.
- `names`: a JSON array of `name`, with no value repeated.

Lengths are integer hundredths of a CSS pixel: `1400` is 14px, `1333` is 13.33px.

## Output format

- One JSON object per line, LF after every line including the last. No BOM.
- Compact: no spaces between tokens. Keys in exactly the order shown in this file.
- Strings escaped as JSON requires: `"` and `\` escaped, control characters as `\b \f \n \r \t` or
  `\u00XX` with lowercase hex, every other character written as itself in UTF-8. This matches
  `JSON.stringify` and Python's `json.dumps(value, ensure_ascii=False, separators=(",", ":"))`.
- Integers in plain decimal. Sums use exact integer arithmetic. Ratios are strings: see the basis-point
  rule in ALGORITHM.md.
- Booleans as `true` or `false`.
- Objects with computed keys (`by_source`) list keys in byte order. Build them as ordered pairs.

## Error record

```
{"t":"error","line":3,"reason":"bad_json"}
```

`line` is 0 for a usage error and for `missing_record`. `reason` is one of:

| Reason | When |
|---|---|
| `usage` | bad command line |
| `bad_json` | the line is not valid UTF-8 or not valid JSON |
| `not_object` | valid JSON but not an object |
| `unknown_type` | `t` missing, not a string, or not a type listed below |
| `missing_field` | a required field is absent |
| `bad_field` | a required field has the wrong type, or a closed-list value is not in its list |
| `unsafe_key` | a `key` field holds an unsafe value |
| `duplicate` | a value that must be unique repeats |
| `unknown_cap` | a record names a capture no `capture` record declared |
| `unplanned` | `verify --check captures`: a non-canary capture of an undeclared screen, viewport or variant |
| `missing_record` | a record the subcommand requires is absent: `routes` for captures, `mode` for canaries and tally |

## Record types

Fields in the order listed. Closed lists are checked by every subcommand.

**Plan and scale**, written by the agent:

```
{"t":"mode","mode":"browser"}                      mode: browser | static
{"t":"scale","kind":"size","value":1400,"viewport":0,"roles":["body"]}
{"t":"rolemap","site":"div.card-title","role":"heading"}
{"t":"exception","site":"h1.hero","reason":"marketing hero"}
{"t":"screen","screen":"orders","route":"/orders"}
{"t":"viewport","width":1440}
{"t":"variant","variant":"base"}
{"t":"routes","count":41}
{"t":"exclude","route":"/logout","reason":"side-effect"}
```

- `scale`: `kind` `name` in size | weight | line | space; `value` `int`; `viewport` `int`, 0 meaning every
  viewport; `roles` `names`, each in heading | body | label | caption | code, empty meaning any role.
- `rolemap`: `site` `key`; `role` `name` in heading | body | label | caption | code.
- `exception`: `site` `key`; `reason` `name`.
- `screen`: `screen` `name`; `route` `name`. `viewport`: `width` `int`. `variant`: `variant` `name` that
  does not start with `canary-`. `routes`: `count` `int`. `exclude`: `route` `name`; `reason` `name`.

**Captures**, written by the collector (COLLECTOR.md):

```
{"t":"capture","screen":"orders","viewport":1440,"variant":"base","width":1440,"auth":true,"login":false,"notfound":false,"url_ok":true,"main":true,"fonts":true,"busy":false}
{"t":"text","cap":"orders@1440/base","site":"main#app p.intro","owner":"main#app","tag":"p","aria":"","ctx":"","size":1600,"weight":400,"line":2400,"canary":"","n":3}
{"t":"box","cap":"orders@1440/base","site":"div.card","family":"padding","value":1600,"border":0,"auto":false,"canary":"","n":4}
{"t":"skip","cap":"orders@1440/base","reason":"hidden","canary":"","n":2}
{"t":"end","cap":"orders@1440/base","text":1,"box":1,"skip":1,"hashed":0}
```

- `capture`: `screen` `name`; `viewport` `int`; `variant` `name`, which if it starts with `canary-` must
  be one of `canary-elements`, `canary-logged-out`, `canary-bad-route`, `canary-static`; `width` `int`;
  `auth`, `login`, `notfound`, `url_ok`, `main`, `fonts`, `busy` `bool`. Its capture key is
  `<screen>@<viewport>/<variant>`, the viewport in plain decimal.
- `text`: `cap` `name`; `site` `key`; `owner` `key`; `tag` `name`; `aria` `str`; `ctx` `str`; `size`
  `int`; `weight` `int`; `line` `sint` of at least -1 (-1 means `normal`); `canary` `str`; `n` `pos`.
- `box`: `cap` `name`; `site` `key`; `family` `name` in margin | padding | gap; `value` `sint`, not 0;
  `border` `int`; `auto` `bool`; `canary` `str`; `n` `pos`.
- `skip`: `cap` `name`; `reason` `name` in excluded | hidden | icon; `canary` `str`; `n` `pos`.
- `end`: `cap` `name`; `text`, `box`, `skip`, `hashed` `int`.

A value outside its range or list is `bad_field`.

## Semantic checks (every subcommand)

In input order; the first failing record decides. A second `mode`, `routes`; a second `scale` with the
same `kind`, `value` and `viewport`; a second `rolemap` or `exception` with the same `site`; a second
`screen`, `viewport`, `variant` or `exclude` with the same identifying field; an `exclude` whose `route`
is some `screen`'s `route`; a second `capture` with the same capture key; a second `end` for a `cap`:
`duplicate`. A `text`, `box`, `skip` or `end` whose `cap` is no capture key: `unknown_cap`. Then the
subcommand's own checks below.

## verify --check captures

Extra checks: a `capture` whose variant does not start with `canary-` and whose screen, viewport or
variant has no declaring record is `unplanned`. No `routes` record is `missing_record`.

Planned captures are every screen x viewport x variant. Output, in order: `problem` records, one
`routes` record, `todo` records, `summary`.

```
{"t":"problem","cap":"orders@1440/base","problem":"auth_lost"}
{"t":"routes","declared":41,"accounted":41,"pass":true}
{"t":"todo","cap":"orders@1440/base"}
{"t":"summary","planned":82,"valid":81,"problems":1}
```

`problem` is one of, in this order within a capture: `missing`, `partial`, `auth_lost`, `login`,
`notfound`, `wrong_page`, `fonts`, `busy`, `viewport`, `empty`. Exit 1 if any `problem` record is
printed or `routes` has `"pass":false`.

## verify --check canaries

Extra check: no `mode` record is `missing_record`. Output: `canary` records, then `summary`.

```
{"t":"canary","cap":"orders@1440/canary-elements","id":"c1","pass":true,"got":"label off"}
{"t":"summary","mode":"browser","entries":12,"passed":12,"failed":0}
```

`id` is one of `capture`, `c1` to `c8`, `logged-out`, `bad-route`. `cap` is a capture key, or a
placeholder for a missing capture (ALGORITHM.md). Exit 1 if any entry has `"pass":false`.

## unmatched

Output: up to 200 `unmatched` records, then `summary`.

```
{"t":"unmatched","site":"main#app div.title","tag":"div","ctx":"","elements":120,"caps":40}
{"t":"summary","text":5200,"unassigned":300,"groups":12,"listed":12,"unassigned_bp":"0.0576"}
```

## tally

Extra check: no `mode` record is `missing_record`. Output, in order: `role` records; `value` records,
each followed by its `site` records; `space` records, each followed by its `spacesite` records; `owner`
records; `stale` records; `summary`.

```
{"t":"role","role":"body","elements":3000,"caps":80,"screens":40,"by_source":{"context":200,"tag":2800},"on_bp":"0.9100"}
{"t":"value","role":"body","prop":"size","value":1500,"status":"off","nearest":1400,"elements":270,"caps":30,"screens":15,"owners":2}
{"t":"site","role":"body","prop":"size","value":1500,"status":"off","site":"table.grid td","owner":"table.grid","elements":260,"caps":30}
{"t":"space","family":"padding","value":1000,"status":"off","nearest":800,"elements":44,"caps":12,"screens":6}
{"t":"spacesite","family":"padding","value":1000,"site":"div.card","elements":40,"caps":12}
{"t":"owner","owner":"table.grid","sizes":[1500],"elements":260,"caps":30,"screens":15}
{"t":"stale","site":"h1.hero","reason":"marketing hero"}
{"t":"summary","mode":"browser","caps":80,"screens":40,"text":5200,"boxes":30000,"skipped":{"excluded":12,"hidden":40,"icon":9},"sizes_in_use":17,"sizes_off":11,"scale_sizes":6,"weights_in_use":4,"weights_off":1,"scale_weights":3,"space_in_use":22,"space_off":9,"scale_space":8,"unassigned_bp":"0.0100","gate":"PASS"}
```

`prop` is size | weight | line. `status` is one of `on`, `off`, `wrong-role`, `excepted`, `unscaled`,
`normal` for text values and `on`, `off`, `compensated`, `auto`, `negative`, `excepted`, `unscaled` for
spacing. `nearest` is -1 when there is no step to name. `gate` is `PASS` or `FAIL`; exit 1 on `FAIL`.

## Fixtures

Each fixture is three files with the same stem in `fixtures/`:

- `NN-name.in`: line 1 is the arguments after the tool name, separated by single spaces. Every following
  line is standard input, byte for byte.
- `NN-name.out`: the exact expected standard output.
- `NN-name.exit`: the expected exit code followed by LF.

A fixture passes when standard output matches `.out` byte for byte and the exit code matches `.exit`.
Read fixture files as bytes. A checkout that converted line endings to CRLF fails every fixture; convert
the fixture files to LF in your working copy (never edit their content) and say so in the report.

The collector's own fixtures live in `fixtures/collector/` and are described in
[COLLECTOR.md](COLLECTOR.md).
