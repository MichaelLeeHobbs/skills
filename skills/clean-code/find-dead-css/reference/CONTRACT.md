# Bookkeeping tool contract

The skill's one deterministic tool. It splits selectors into tokens, searches text it is given, decides
verdicts, lints the crawl plan and checks the proof diff. It never opens files, never drives a browser
and never judges. Build it from [ALGORITHM.md](ALGORITHM.md) in whatever runtime the machine has, then
run every fixture in [fixtures/](fixtures/). Any failing fixture stops the run.

## Invocation

```
<tool> members
<tool> refs
<tool> classify [--mode crawl|static] [--fold-case yes|no] [--max-blocked-basis-points N]
<tool> verify --check plan
<tool> proof
```

Input is JSON Lines on standard input. Output is JSON Lines on standard output. Nothing is written to
standard error that a caller must read.

Options are `--name value` pairs, in any order. Defaults: `--mode crawl`, `--fold-case no`,
`--max-blocked-basis-points 500`. A numeric value is one or more ASCII digits, read as a decimal integer
(leading zeros allowed), at most 10000. These are usage errors: an unknown subcommand; an unknown or
repeated option; an option not listed for that subcommand; a missing value; a value outside its list or
range; `verify` without `--check plan`; any other argument left over.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Input valid, and no problem found (always 0 for valid `members` and `refs` input) |
| 1 | Input valid, and at least one `problem` record was printed |
| 2 | Usage error or malformed input. Output is exactly one error record |

## Input lines

Split standard input on LF. Ignore the empty string after a final LF. Remove one trailing CR from each
line if present. A byte order mark is not stripped, so a line starting with one is `bad_json`. Every
other line must be valid UTF-8 holding one JSON object with a string field `t` naming the record type.
Fields not listed for a type are ignored. Line numbers count from 1 at the first line of standard input.
Records may come in any order; a record that refers to another is checked against the whole input.

Field types:

- `str`: a JSON string, possibly empty.
- `name`: a JSON string, non-empty.
- `int`: a JSON number whose value is a whole number from 0 to 9007199254740991 (`1.0` counts as 1).
- `names`: a JSON array of `name`, with no value repeated.
- `steps`: a JSON array whose every item is a non-empty JSON array of `str`.
- `enum(...)`: a `name` that must be one of the listed values.

## Output format

- One JSON object per line, LF after every line including the last. No BOM.
- Compact: no spaces between tokens. Keys in exactly the order shown in this file.
- Strings escaped as JSON requires: `"` and `\` escaped, control characters as `\b \f \n \r \t` or
  `\u00XX` with lowercase hex, a lone surrogate as `\udXXX` with lowercase hex, every other character
  written as itself in UTF-8. This matches `JSON.stringify`.
- Integers in plain decimal. Ratios use the basis-point rule in ALGORITHM.md and print as strings.
- Booleans as `true` or `false`.
- Objects with computed keys (`by_unproven`) list keys in byte order.

## Error record

```
{"t":"error","line":3,"reason":"bad_json"}
```

`line` is 0 for a usage error. `reason` is one of:

| Reason | When |
|---|---|
| `usage` | bad command line |
| `bad_json` | the line is not valid UTF-8 or not valid JSON |
| `not_object` | the JSON value is not an object |
| `unknown_type` | `t` missing, not a string, or not accepted by this subcommand or mode |
| `missing_field` | a required field is absent |
| `bad_field` | a required field has the wrong type or a value outside its list |
| `duplicate` | a key that must be unique repeats, or a `names` array repeats a value |
| `bad_selector` | `members`: a selector the tokenizer rejects |
| `unknown_path` | `refs`: a `want` lists a path with no `src` record |
| `unknown_rule` | `classify`: a `canary` names a rule with no `member` record |
| `unknown_cell` | `classify`: a `cell` names a cell with no `plan` record |
| `missing_ref` | `classify`: a member needs a `ref` for a token and none was given |

## members

Input:

```
{"t":"rule","id":name,"sheet":name,"file":str,"line":int,"selector":name}
```

`id` is unique. `file` and `line` are the source location (`""` and 0 when unmapped). `selector` is the
rule's full selector list, already flattened (no nesting).

Output: one `member` per selector-list member, sorted by `rule` then `n`, then one summary.

```
{"t":"member","rule":"r1","n":0,"sheet":"app.css","file":"src/a.scss","line":4,"selector":".a .b","tokens":["c:a","c:b"]}
{"t":"summary","rules":1,"members":1,"untokened":0}
```

`n` counts members from 0. `selector` is the member text trimmed of ASCII whitespace. `tokens` are the
member's required tokens, kind-prefixed (`c:` class, `i:` id, `a:` attribute name), unique, sorted.
`untokened` counts members with no tokens.

## refs

Input:

```
{"t":"src","path":name,"text":str}
{"t":"want","token":name}
{"t":"want","token":name,"needle":name,"paths":names}
```

`src.path` is unique and `want.token` is unique. `needle` defaults to the token without its two-character
prefix. `paths`, when present, limits the search to those `src` records.

Output: one `ref` per `want`, sorted by `token`, then one summary.

```
{"t":"ref","token":"c:btn-ghost","kind":"fragment","path":"src/Button.tsx","line":7,"via":"btn-"}
{"t":"summary","wants":1,"exact":0,"fragment":1,"none":0}
```

`kind` is `exact`, `fragment` or `none`. `path` and `line` locate the first match (`""` and 0 for
`none`). `via` is the fragment that matched (`""` unless `fragment`).

## classify

Input, crawl mode:

```
{"t":"member","rule":name,"n":int,"sheet":name,"file":str,"tokens":names}
{"t":"ref","token":name,"kind":enum(exact,fragment,none)}
{"t":"seen","token":name}
{"t":"plan","cell":name,"route":name}
{"t":"cell","cell":name,"status":enum(reached,blocked),"sheets":names}
{"t":"foreign","sheet":name}
{"t":"canary","rule":name,"expect":enum(KEEP,SEEN,DEAD,UNDECIDABLE,UNPROVEN:fragment,UNPROVEN:foreign,UNPROVEN:sheet-not-loaded,UNPROVEN:static-only)}
```

In static mode, `seen`, `plan` and `cell` are `unknown_type`. `member` records are the `members` output
(extra fields ignored); `(rule, n)` is unique. `ref` records are the `refs` output; `ref.token`,
`plan.cell`, `cell.cell`, `foreign.sheet` and `canary.rule` are unique. `seen` may repeat.

Output, in this order: every `member` sorted by `rule` then `n`; `rule` records sorted by `rule`; `file`
records sorted by `file`; `canary` records sorted by `rule`; `problem` records in the order ALGORITHM.md
gives; one summary.

```
{"t":"member","rule":"r1","n":0,"verdict":"DEAD","reason":"","token":"c:old"}
{"t":"rule","rule":"r1","verdict":"DEAD","file":"src/a.scss","dead":[0]}
{"t":"file","file":"src/a.scss","rules":1}
{"t":"canary","rule":"zz1","expect":"DEAD","got":"DEAD","ok":true}
{"t":"problem","reason":"route_unreached","key":"/reports"}
{"t":"summary","mode":"crawl","members":1,"dead":1,"keep":0,"seen":0,"undecidable":0,"unproven":0,"by_unproven":{},"rules_dead":1,"rules_trim":0,"files_dead":1,"cells":1,"reached":1,"blocked":0,"blocked_bp":"0.0000","canaries":1,"canaries_ok":1}
```

`verdict` is `KEEP`, `SEEN`, `DEAD`, `UNDECIDABLE` or `UNPROVEN`. `reason` is the UNPROVEN reason, else
`""`. `token` is the token that decided the verdict, else `""`. Problem `reason` is one of `canary`,
`route_unreached`, `blocked_over`, `no_cells`; `key` names the canary rule, the route, or `""`.

## verify --check plan

Input:

```
{"t":"route","route":name}
{"t":"exclude","route":name,"reason":name}
{"t":"cell","cell":name,"route":name,"role":name,"state":name,"steps":steps,"expect":name}
{"t":"allow","cell":name,"step":int}
```

`route.route`, `exclude.route` and `cell.cell` are unique; `allow` pairs are unique.

Output: `problem` records sorted by `key` then `reason`, then one summary.

```
{"t":"problem","reason":"denied","key":"orders-delete#2"}
{"t":"summary","routes":3,"excluded":1,"cells":4,"steps":11,"problems":1}
```

Problem `reason` is one of `route_unplanned`, `unknown_route`, `bad_step`, `denied`, `unsafe_value`,
`pii_shape`, `unknown_allow`. `key` is a route, a cell, or `<cell>#<step index>`.

## proof

Input:

```
{"t":"before","key":name,"decl":name}
{"t":"after","key":name,"decl":name}
{"t":"expect","key":name}
```

All three may repeat; each record counts once.

Output: `problem` records sorted by `key`, several for one key in the order ALGORITHM.md gives, then one
summary.

```
{"t":"problem","reason":"extra_removed","key":"|.btn-legacy"}
{"t":"summary","keys":4,"before":6,"after":4,"expected":1,"removed":2,"problems":1}
```

Problem `reason` is one of `expect_absent`, `not_removed`, `extra_removed`, `changed`.

## Fixtures

Each fixture is three files with the same stem in `fixtures/`:

- `NN-name.in`: line 1 is the arguments after the tool name, separated by single spaces. Every following
  line is standard input, byte for byte.
- `NN-name.out`: the exact expected standard output.
- `NN-name.exit`: the expected exit code followed by LF.

A fixture passes when standard output matches `.out` byte for byte and the exit code matches `.exit`.
Read fixture files as bytes. A checkout that converted line endings to CRLF fails every fixture; convert
the fixture files to LF in your working copy (never edit their content) and say so in the report.
