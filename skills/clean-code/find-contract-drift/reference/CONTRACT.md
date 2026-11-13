# Drift tool contract

The skill's one deterministic tool. It never reads source files and never judges. It resolves config
scopes, applies the closed naming and date transforms in [ALGORITHM.md](ALGORITHM.md), groups shapes,
diffs fields, and counts and checks. Build it from ALGORITHM.md in whatever runtime the machine has, then
run every fixture in [fixtures/](fixtures/). Any failing fixture stops the run.

## Invocation

```
<tool> keys
<tool> group [--max-members N] [--max-bytes N] [--max-stem N] [--max-partners N] [--max-routes N] [--min-stop N]
<tool> diff
<tool> verify --check rows
<tool> verify --check coverage [--min-basis-points N] [--max-adjusted-basis-points N]
<tool> verify --check groups
<tool> verify --check evidence
<tool> reuse
<tool> tally
```

Input is JSON Lines on standard input. Output is JSON Lines on standard output. Nothing is written to
standard error that a caller must read.

Options are `--name value` pairs, in any order. The value of `--check` is one of `rows`, `coverage`,
`groups`, `evidence`. Every other value is one or more ASCII digits, read as a decimal integer (leading
zeros allowed). Defaults: `--max-members 25`, `--max-bytes 150000`, `--max-stem 25`,
`--max-partners 15`, `--max-routes 25`, `--min-stop 5`, `--min-basis-points 9800`, `--max-adjusted-basis-points 200`.
These are usage errors: an unknown subcommand; an unknown check name; an unknown or repeated option; an
option not listed for that subcommand or check; a missing value; a numeric value that is not digits or is
above 9007199254740991; any `group` option equal to 0; `verify` without `--check`; any other argument
left over.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Input valid, and the check found no problem (always 0 for valid `keys`, `group`, `diff`, `reuse` and `tally` input) |
| 1 | Input valid, and the check found at least one problem or failed its threshold |
| 2 | Usage error or malformed input. Output is exactly one error record |

## Input lines

Split standard input on LF. Ignore the empty string after a final LF. Remove one trailing CR from each
line if present. A byte order mark is not stripped, so a line starting with one is `bad_json`. Every
other line must be valid UTF-8 holding one JSON object with a string field `t` naming the record type.
Fields not listed for a type are ignored. Line numbers count from 1 at the first line of standard input.
Records may come in any order: a record that refers to another is checked against every record in the
input, not only earlier ones.

Field types used below:

- `str`: a JSON string, possibly empty.
- `name`: a JSON string, non-empty.
- `int`: a JSON number whose value is a whole number from 0 to 9007199254740991 (`1.0` counts as 1).
- `bool`: `true` or `false`.
- `names`: a JSON array of `name`, with no value repeated.
- `members`: a JSON array of objects, each with `id` (name), `hash` (name) and `eff` (str), with no `id`
  repeated. An element that is not an object or lacks one of these is `bad_field`.
- `word`: a `name` that must be one of a closed list given for that field. Outside `verify --check rows`,
  a value outside its list is `bad_field`.
- `id`: a `name` holding a shape ID, `path:line:name`, so it has at least two `:`. Fewer is `bad_field`.
  Its **path** is everything before the second-to-last `:`, and its **name** everything after the last
  `:`. Only fields listed as `id` are checked this way: group `members` arrays, `alone`, `keep`, `reuse`
  members and every record of `verify --check groups` are plain names.

## Closed lists

| Field | Values |
|---|---|
| `side` | `client`, `server`, `shared`, `spec` |
| `origin` | `hand`, `generated` |
| `type` | `string`, `int32`, `int53`, `int64`, `bigint`, `decimal`, `number`, `boolean`, `date-iso`, `date-epoch-s`, `date-epoch-ms`, `date`, `date-object`, `enum`, `array`, `object`, `map`, `function`, `any`, `unknown` |
| `presence` | `required`, `optional`, `unknown` |
| `nullable` | `yes`, `no`, `unknown` |
| `validated` | `yes`, `no` |
| `direction` | `request`, `response`, `event` |
| `role` | `produces`, `consumes` |
| `setting` | `naming`, `inclusion`, `unknown_properties`, `unknown_enum`, `date_write` |
| `naming` values | `identity`, `snake`, `upper_snake`, `kebab`, `lower_camel`, `upper_camel`, `lower`, `unknown` |
| `inclusion` values | `always`, `non-null`, `unknown` |
| `unknown_properties` values | `ignore`, `fail`, `strip`, `unknown` |
| `unknown_enum` values | `fail`, `null`, `default`, `unknown` |
| `date_write` values | `iso`, `epoch-s`, `epoch-ms`, `unknown` |
| `basis` (config) | `stated`, `documented-default` |
| `verdict` | `CONFIRMED`, `REFUTED`, `BLOCKED` |
| `basis` (evidence) | `run`, `typecheck`, `sample`, `diffed`, `uncited` |
| `kind` (cell) | `MISSING`, `EXTRA`, `PRESENCE`, `NULLABILITY`, `TYPE`, `WIDTH`, `FORMAT`, `ENUM_VALUES`, `ENUM_SPELLING`, `WIRE_NAME` |
| `dir` | `BREAKING`, `LATENT`, `LOOSE`, `DISAGREE`, `UNRESOLVED` |

## Output format

- One JSON object per line, LF after every line including the last. No BOM.
- Compact: no spaces between tokens. Keys in exactly the order shown in this file.
- Strings escaped as JSON requires: `"` and `\` escaped, control characters as `\b \f \n \r \t` or
  `\u00XX` with lowercase hex, every other character written as itself in UTF-8. This matches
  `JSON.stringify` and Python's `json.dumps(value, ensure_ascii=False, separators=(",", ":"))`.
- Integers in plain decimal. Ratios are strings (see the basis-point rule in ALGORITHM.md).
- Objects with computed keys (`by_side`, `by_cause` and the like) list keys in byte order. Build them as
  ordered pairs: some runtimes reorder number-like keys in a native object.

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
| `bad_field` | a required field has the wrong type or a value outside its closed list |
| `duplicate` | a value that must be unique repeats |
| `unknown_shape` | a record names a shape no `shape` record declared |
| `unknown_path` | an `adjust` names a path no `count` record declared |
| `unknown_group` | a record names a group no `group` record declared |

## Record types per subcommand

### keys

Input:
- `{"t":"shape","id":id,"side":word}`
- `{"t":"field","shape":id,"name":name,"alias":str,"type":word,"presence":word,"nullable":word,"validated":word,"enum":names,"pos":int}`:
  `alias` is the explicit wire name or `""`; `enum` lists the declared values (empty unless `type` is
  `enum`); `pos` is the declared position within the shape, from 0.
- `{"t":"config","scope":name,"setting":word,"value":name,"basis":word,"source":name}`: `scope` is
  `shape:<id>` or `path:<prefix>`. `value` must be in its setting's list.

Output: one `eff` record per shape in id order, then one `field` record per field (shapes in id order,
fields by `pos`, then `name`), then `summary`.
```
{"t":"eff","shape":"s/U.kt:3:UserResponse","naming":"snake","naming_at":"path:s/","inclusion":"always","inclusion_at":"path:s/","unknown_properties":"unknown","unknown_properties_at":"*","unknown_enum":"unknown","unknown_enum_at":"*","date_write":"iso","date_write_at":"path:s/"}
{"t":"field","shape":"s/U.kt:3:UserResponse","name":"createdAt","type":"date-iso","presence":"required","nullable":"no","validated":"no","enum":[],"pos":2,"match":"created at","wire":"created_at","note":""}
{"t":"summary","shapes":2,"fields":9,"ambiguous":1,"naming_unknown":0}
```
`note` is `""`, `ambiguous` or `naming_unknown`. Output `field` records are valid input for `group`
and `diff`.

### group

Input:
- `{"t":"shape","id":id,"side":word,"origin":word,"bytes":int,"importers":int,"hash":name}`
- `{"t":"field","shape":id,"name":name,"type":word,"match":str}` (the output of `keys`; other fields
  ignored)
- `{"t":"binding","shape":id,"route":name,"direction":word,"role":word,"source":name}`

Output: `group` records, then `keep`, `stopstem`, `hub`, `wrapper` and `alone` records, then `summary`.
```
{"t":"group","id":"G0001","keys":["bind:GET /users response"],"members":["c/user.ts:1:UserDto","s/U.kt:3:UserResponse"]}
{"t":"keep","a":"G0002","b":"G0004","shared":2}
{"t":"stopstem","stem":"item","shapes":31}
{"t":"hub","shape":"c/base.ts:1:Entity","partners":19}
{"t":"wrapper","shape":"s/Page.kt:1:Page","routes":40}
{"t":"alone","shape":"c/x.ts:4:Props","reason":"no_key"}
{"t":"summary","shapes":9,"groups":3,"alone":2,"stopstems":1,"hubs":1,"wrappers":1,"keeps":1}
```

### diff

Input:
- `shape` and `binding` as for `group`.
- `{"t":"eff","shape":id,"naming":word,"naming_at":name,"inclusion":word,"inclusion_at":name,"unknown_properties":word,"unknown_properties_at":name,"unknown_enum":word,"unknown_enum_at":name,"date_write":word,"date_write_at":name}`:
  each setting's value from its list.
- `{"t":"field","shape":id,"name":name,"type":word,"presence":word,"nullable":word,"validated":word,"enum":names,"pos":int,"match":str,"wire":name,"note":str}`:
  `note` must be one of `""`, `ambiguous`, `naming_unknown`; any other value is `bad_field`.
- `{"t":"group","id":name,"keys":names,"members":names}` as `group` prints them.
- `{"t":"accept","anchor":id,"member":id,"a_field":str,"m_field":str,"kind":word,"anchor_hash":name,"member_hash":name}`:
  a difference the team marked intended.

Output, per group in id order: one `gdiff` record, then its `cell` records (each followed by a
`reopened` record when an accept no longer matches), then its `rename` records. Then `summary`.
```
{"t":"gdiff","group":"G0001","mode":"directional","anchor":"s/U.kt:3:UserResponse","members":[{"id":"c/user.ts:1:UserDto","hash":"h2","eff":"naming=unknown;inclusion=unknown;unknown_properties=unknown;unknown_enum=unknown;date_write=unknown"},{"id":"s/U.kt:3:UserResponse","hash":"h1","eff":"naming=snake;inclusion=always;unknown_properties=unknown;unknown_enum=unknown;date_write=iso"}],"hints":0,"judge":true}
{"t":"cell","group":"G0001","anchor":"s/U.kt:3:UserResponse","member":"c/user.ts:1:UserDto","a_field":"role","m_field":"role","kind":"ENUM_VALUES","dir":"BREAKING","cause":""}
{"t":"reopened","group":"G0001","member":"c/user.ts:1:UserDto","a_field":"role","m_field":"role","kind":"ENUM_VALUES"}
{"t":"rename","group":"G0001","member":"c/user.ts:1:UserDto","a_field":"postalCode","m_field":"zip","shared":0}
{"t":"summary","groups":1,"cells":1,"BREAKING":1,"LATENT":0,"LOOSE":0,"DISAGREE":0,"UNRESOLVED":0,"renames":1,"accepted":0,"reopened":1,"judge":1}
```

### verify --check rows

Input: `shape` and `binding` as listed for `group`; `field` and `config` as listed for `keys`. Here
`word` fields are only required to be non-empty strings, and a config `scope` or `value` any non-empty
string; their values are checked as problems.

Output: `problem` records, then `summary`.
```
{"t":"problem","record":"field","key":"c/a.ts:1:A.when","kind":"bad_value","field":"type"}
{"t":"summary","shapes":2,"fields":5,"bindings":1,"configs":1,"problems":1}
```
`kind` is `bad_value`, `unknown_shape`, `bad_scope`, `duplicate_field` or `duplicate_config`.

### verify --check coverage

Input:
- `{"t":"count","path":name,"parser":int,"pattern":int}`: for one file, how many shape declarations the
  parser found before any were excluded, and how many the language's count pattern matched.
- `{"t":"adjust","path":name,"reason":name}`

Output: `short` records, then `adjusted` records, then `summary`.
```
{"t":"short","path":"src/b.ts","parser":8,"pattern":10}
{"t":"adjusted","path":"m/models.py","reason":"pattern counts class inside docstrings"}
{"t":"summary","files":3,"adjusted":0,"parser":51,"pattern":50,"covered":48,"coverage":"0.9600","adjusted_share":"0.0000","pass":false}
```

### verify --check groups

Input:
- `{"t":"shape","id":name}`
- `{"t":"group","id":name,"members":names}`
- `{"t":"alone","shape":name,"reason":name}`
- `{"t":"keep","a":name,"b":name}`

Output: `problem` records, then `summary`.
```
{"t":"problem","kind":"unplaced","id":"c/x.ts:9:Y"}
{"t":"problem","kind":"overlap","id":"G0002","other":"G0004","shared":2}
{"t":"summary","shapes":9,"groups":3,"alone":2,"problems":2}
```
`kind` is `unplaced`, `unknown_member`, `both` or `overlap`. Only `overlap` carries `other` and
`shared`.

### verify --check evidence

Input:
- `{"t":"cell","group":name,"member":id,"a_field":str,"m_field":str,"kind":word,"dir":word,"cause":str}`:
  as `diff` prints them; other fields ignored.
- `{"t":"evidence","group":name,"member":id,"a_field":str,"m_field":str,"kind":word,"verdict":word,"basis":word,"class":str}`
- `{"t":"run","class":name}`: a proof class whose harness ran and whose output is in the work folder.
- `{"t":"transform","group":name,"member":id,"a_field":str,"m_field":str,"kind":word,"cite":name}`:
  the judge's TRANSFORMED citation, `cite` as `path:line`.
- `{"t":"file","path":name,"lines":int}`: an inventoried source file and its line count.

Output: `problem` records, then `summary`.
```
{"t":"problem","kind":"confirmed_without_run","group":"G0001","member":"c/u.ts:1:U","a_field":"role","m_field":"role","cell_kind":"ENUM_VALUES"}
{"t":"summary","cells":4,"evidence":3,"transforms":1,"problems":1}
```
`kind` is `unknown_cell`, `no_evidence`, `confirmed_without_run`, `not_confirmable`, `diffed_config_kind`
or `bad_cite`.

### reuse

Input:
- `{"t":"old","group":name,"members":members}`: a saved verdict's group, from the catalog.
- `{"t":"new","group":name,"members":members}`: this run's `gdiff` group.

Output: one record per new group in group order, then `summary`.
```
{"t":"reuse","group":"G0003","from":"G0007"}
{"t":"judge","group":"G0001","reason":"hash"}
{"t":"summary","old":5,"new":4,"reused":1,"judge":3}
```
`reason` is `new`, `hash` or `config`.

### tally

Input (every type optional, any order):
- `{"t":"shape","side":word,"origin":word}`
- `{"t":"excluded","reason":name,"count":int}`
- `{"t":"gdiff","group":name,"judge":bool}` (other `gdiff` fields ignored)
- `{"t":"cell","dir":word,"cause":str}` (other `cell` fields ignored)
- `{"t":"reuse","group":name}`
- `{"t":"evidence","verdict":word,"basis":word}` (other fields ignored)
- `{"t":"spend","phase":name,"usd_cents":int}`
- `{"t":"cap","usd_cents":int}`: at most one; a second is `duplicate`.

Output: exactly seven records in this order.
```
{"t":"shapes","total":3,"by_side":{"client":2,"server":1},"by_origin":{"hand":3}}
{"t":"excluded","total":12,"by_reason":{"generated":12}}
{"t":"groups","total":4,"judge":2,"reused":1}
{"t":"cells","BREAKING":2,"LATENT":1,"LOOSE":5,"DISAGREE":1,"UNRESOLVED":3}
{"t":"causes","local":1,"by_cause":{"config:naming@*":1,"lang-nullability":1}}
{"t":"evidence","CONFIRMED":1,"REFUTED":0,"BLOCKED":1,"by_basis":{"diffed":1,"run":1}}
{"t":"spend","total_cents":1025,"cap_cents":2500,"over_cap":false,"by_phase":{"judge":900,"prove":125}}
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
