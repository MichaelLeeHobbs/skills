# Census tool contract

The skill's one deterministic tool. It parses selectors, counts and checks. It never reads source
files, never reads a package, and never judges. Build it from [ALGORITHM.md](ALGORITHM.md) in whatever
runtime the machine has, then run every fixture in [fixtures/](fixtures/). Any failing fixture stops the
run.

## Invocation

```
<tool> census [--deep N] [--top N]
<tool> slice [--max-bytes N]
<tool> verify --check coverage [--min-basis-points N]
<tool> verify --check causes
<tool> verify --check layers
```

Input is JSON Lines on standard input. Output is JSON Lines on standard output. Nothing is written to
standard error that a caller must read.

Options are `--name value` pairs, in any order. The value of `--check` is one of `coverage`, `causes`,
`layers`. Every other value is one or more ASCII digits, read as a decimal integer (leading zeros
allowed). Defaults: `--deep 4`, `--top 20`, `--max-bytes 100000`, `--min-basis-points 9900`. These are
usage errors: no subcommand; an unknown subcommand; an unknown check name; an unknown or repeated
option; an option not listed for that subcommand or check; a missing value; a numeric value that is not
digits or is above 9007199254740991; `--deep`, `--top` or `--max-bytes` equal to 0; `verify` without
`--check`; any other argument left over.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Input valid, and the check found no problem (always 0 for valid `census` and `slice` input) |
| 1 | Input valid, and the check found at least one problem or failed its threshold |
| 2 | Usage error or malformed input. Output is exactly one error record |

## Input lines

Split standard input on LF. Ignore the empty string after a final LF. Remove one trailing CR from each
line if present. A byte order mark is not stripped, so a line starting with one is `bad_json`. Every
other line must be valid UTF-8 holding one JSON object with a string field `t` naming the record type.
Fields not listed for a type are ignored, so one `file` record can carry every field any subcommand
needs. Line numbers count from 1 at the first line of standard input. Records may come in any order: a
record that refers to another (a `rule` to its `file`, a `decl` to its `rule`) is checked against every
record in the input, not only earlier ones.

Field types used below:

- `str`: a JSON string, possibly empty.
- `name`: a JSON string, non-empty.
- `int`: a JSON number whose value is a whole number from 0 to 9007199254740991 (`1.0` counts as 1).
- `sint`: a JSON number whose value is a whole number from -9007199254740991 to 9007199254740991.
- `bool`: `true` or `false`.

## Output format

- One JSON object per line, LF after every line including the last. No BOM.
- Compact: no spaces between tokens. Keys in exactly the order shown in this file.
- Strings escaped as JSON requires: `"` and `\` escaped, control characters as `\b \f \n \r \t` or
  `\u00XX` with lowercase hex, every other character written as itself in UTF-8. This matches
  `JSON.stringify` and Python's `json.dumps(value, ensure_ascii=False, separators=(",", ":"))`.
- Integers in plain decimal, negative with a leading `-`. Specificity is an array of three integers.
- Booleans as `true` or `false`, a missing value as `null`.
- `by_cause` lists its keys in byte order. Build it as ordered pairs: never rely on a runtime's object
  key order.

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
| `unknown_type` | `t` missing, not a string, or not a type this subcommand or check accepts |
| `missing_field` | a required field is absent |
| `bad_field` | a required field has the wrong type, or a closed-list value is outside its list |
| `duplicate` | a value that must be unique repeats |
| `unknown_path` | a record names a path no `file` record declared |
| `unknown_rule` | a `decl` names a rule no `rule` record declared |
| `unknown_token` | a `presence` names a token that no rule uses as an internal class |
| `unknown_layer` | an `assign` names a layer no `layer` record declared |

## census

Input:
- `{"t":"file","path":name,"canary":bool}`: one in-scope file. `canary` is true only for a planted
  canary file.
- `{"t":"rule","id":name,"path":name,"line":int,"selector":name}`: one style rule. `selector` is the
  full selector list as written, with nesting already flattened.
- `{"t":"decl","id":name,"rule":name,"prop":name,"value":str,"important":bool}`: one declaration that is
  `!important`, or whose property is `z-index`. `value` excludes the `!important`.
- `{"t":"prefix","prefix":name,"library":name,"status":name}`: a judged class-name prefix. `status` is
  `internal`, `public` or `hashed`. Optional, repeatable.
- `{"t":"presence","token":name,"present":bool}`: whether an internal class token occurs in the
  installed package files. Optional, repeatable.

Output, in this order:
1. One `m` record per rule, sorted by `id`.
2. One `token` record per distinct internal class token, sorted by `token`.
3. One `head` record per distinct class-name head in non-canary rules, sorted by `head`.
4. One `z` record per distinct literal z-index value outside canary files, ascending by value.
5. One `zname` record per distinct named z-index value outside canary files, sorted by `value`.
6. Up to `--top` `hot` records, by rank.
7. One `filestat` record per non-canary file holding at least one flagged rule, sorted by `path`.
8. One `summary`, then one `canaries`.

```
{"t":"m","id":"a.css:3","path":"a.css","line":3,"selectors":2,"spec":[0,2,1],"depth":2,"important":1,"internal":["MuiButton-root"],"bad":false,"canary":false}
{"t":"token","token":"MuiButton-root","library":"mui","status":"internal","rules":3,"canary":false,"present":true}
{"t":"head","head":"MuiButton-","rules":3}
{"t":"z","value":1300,"uses":4,"files":3}
{"t":"zname","value":"var(--z-modal)","uses":2}
{"t":"hot","rank":1,"id":"b.css:9","spec":[1,1,0],"depth":3}
{"t":"filestat","path":"a.css","rules":12,"important":4,"internal_rules":2,"deep_rules":1,"id_rules":0}
{"t":"summary","files":3,"rules":20,"selectors":31,"bad":1,"important":6,"important_rules":5,"internal_rules":4,"internal_tokens":3,"dead_tokens":1,"unchecked_tokens":0,"deep_rules":2,"id_rules":1,"max_spec":[1,1,0],"z_uses":7,"z_distinct":4,"z_named_uses":2,"z_named_distinct":1,"z_expression_uses":1,"z_keyword_uses":0}
{"t":"canaries","files":1,"rules":4,"bad":0,"important":2,"internal_rules":2,"dead_tokens":1,"deep_rules":1,"id_rules":0,"max_spec":[0,4,1],"z_uses":1,"z_named_uses":0}
```

A `token` record's `rules` counts every rule using it, canary or not; `canary` is true when every one
of those rules is in a canary file; `present` is `null` when no `presence` record names it.

## slice

Input:
- `{"t":"file","path":name,"bytes":int}`: a file and its size in bytes at the recorded commit.
- `{"t":"item","id":name,"path":name}`: one item to classify (an `!important` declaration) and its file.

Output: one `slice` record per slice, then one `summary`.
```
{"t":"slice","slice":"S0001","bytes":900,"files":["a.css","b.scss"],"items":["a.css:3:color","b.scss:7:z-index"]}
{"t":"summary","slices":2,"files":3,"items":5,"bytes":2400}
```

## verify --check coverage

Input:
- `{"t":"count","path":name}`: a file the scope walk found.
- `{"t":"file","path":name,"canary":bool,"parsed":bool}`: a file the inventory recorded, and whether its
  parser succeeded.

Output: `problem` records sorted by `path` then `kind`, then one `summary`.
```
{"t":"problem","path":"b.less","kind":"unparsed"}
{"t":"summary","counted":50,"parsed":49,"unparsed":1,"missing":0,"extra":0,"coverage":"0.9800","pass":false}
```
`kind` is `missing` (counted, no `file` record), `unparsed` (counted, `parsed` false) or `extra` (a
non-canary `file` record nobody counted). Canary `file` records are ignored. The exit code follows
`pass`, not the problem list: `unparsed` files within the threshold are listed and still exit 0.

## verify --check causes

Input:
- `{"t":"decl","id":name,"important":bool}`: every inventoried declaration.
- `{"t":"cause","id":name,"cause":name}`: a worker's classification of one declaration. `cause` is one
  of `library`, `own-code`, `utility`, `inline-style`, `a11y-print`, `unknown`.

Output: `problem` records sorted by `id` then `kind`, then one `summary`.
```
{"t":"problem","id":"a.css:3:color","kind":"missing"}
{"t":"summary","important":4,"classified":3,"problems":1,"by_cause":{"a11y-print":0,"inline-style":0,"library":2,"own-code":1,"unknown":0,"utility":0}}
```
`kind` is `missing` (important, no cause), `not_important` (a cause on a non-important declaration) or
`unknown` (a cause naming no declaration). `by_cause` counts causes on important declarations and
always lists all six keys.

## verify --check layers

Input:
- `{"t":"z","value":sint,"uses":int}`: the `z` records `census` printed.
- `{"t":"layer","name":name,"order":int}`: one proposed layer. Lower `order` stacks lower.
- `{"t":"assign","value":sint,"layer":name}`: one ladder value placed in a layer.

Output: `problem` records, then one `summary`.
```
{"t":"problem","kind":"inversion","value":1200,"after":1100}
{"t":"summary","values":9,"layers":4,"assigned":9,"problems":1}
```
`kind` is `unassigned` (a `z` value with no `assign`), `unused` (an `assign` for no `z` value),
`inversion` (a value placed in a lower layer than a smaller value before it) or `empty_layer` (a layer
with no value). Only `inversion` carries `after`; only `empty_layer` carries `layer` instead of `value`.
