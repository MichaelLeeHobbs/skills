# Bookkeeping tool contract

The skill's one deterministic tool. It counts, checks and measures pixel difference. It never reads source
files, never reads image files, never renders and never judges. Build it from [ALGORITHM.md](ALGORITHM.md)
in whatever runtime the machine has, then run every fixture in [fixtures/](fixtures/). Any failing fixture
stops the run.

`slice`, `reuse`, `verify --check ids`, `verify --check groups` and `verify --check coverage` behave exactly
as the subcommands of the same name in the find-reinvention skill, and their fixtures are the same bytes.
They are restated here because a skill is installed alone.

## Invocation

```
<tool> slice [--max-bytes N]
<tool> group [--max-members N]
<tool> reuse
<tool> diff [--min-region N]
<tool> verify --check ids
<tool> verify --check rows [--max-other-basis-points N]
<tool> verify --check groups
<tool> verify --check coverage [--min-basis-points N] [--max-adjusted-basis-points N]
<tool> tally
```

Input is JSON Lines on standard input. Output is JSON Lines on standard output. Nothing is written to
standard error that a caller must read.

Options are `--name value` pairs, in any order. The value of `--check` is one of `ids`, `rows`, `groups`,
`coverage`. Every other value is one or more ASCII digits, read as a decimal integer (leading zeros
allowed). Defaults: `--max-bytes 100000`, `--max-members 12`, `--min-region 16`,
`--max-other-basis-points 1000`, `--min-basis-points 9800`, `--max-adjusted-basis-points 200`. These are
usage errors: an unknown subcommand; an unknown check name; an unknown or repeated option; an option not
listed for that subcommand or check; a missing value; a numeric value that is not digits or is above
9007199254740991; `--max-bytes`, `--max-members` or `--min-region` equal to 0; `verify` without `--check`;
any other argument left over.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Input valid, and the check found no problem (always 0 for valid `slice`, `group`, `reuse` and `tally` input) |
| 1 | Input valid, and the check found at least one problem or failed its threshold |
| 2 | Usage error or malformed input. Output is exactly one error record |

## Input lines

Split standard input on LF. Ignore the empty string after a final LF. Remove one trailing CR from each
line if present. A byte order mark is not stripped, so a line starting with one is `bad_json`. Every
other line must be valid UTF-8 holding one JSON object with a string field `t` naming the record type.
Fields not listed for a type are ignored. Line numbers count from 1 at the first line of standard input.
Records may come in any order: a record that refers to another (a `row` to its `file`, a `px` to its
`image`) is checked against every record in the input, not only earlier ones.

Field types used below:

- `str`: a JSON string, possibly empty.
- `name`: a JSON string, non-empty.
- `int`: a JSON number whose value is a whole number from 0 to 9007199254740991 (`1.0` counts as 1).
- `names`: a JSON array of `name`, with no value repeated. It may be empty.

## Output format

- One JSON object per line, LF after every line including the last. No BOM.
- Compact: no spaces between tokens. Keys in exactly the order shown in this file.
- Strings escaped as JSON requires: `"` and `\` escaped, control characters as `\b \f \n \r \t` or
  `\u00XX` with lowercase hex, every other character written as itself in UTF-8. This matches
  `JSON.stringify` and Python's `json.dumps(value, ensure_ascii=False, separators=(",", ":"))`.
- Integers in plain decimal. Sums use exact integer arithmetic, even past 9007199254740991. Ratios are
  strings: see the basis-point rule in ALGORITHM.md.
- Booleans as `true` or `false`.
- Objects with computed keys (`by_widget`, `by_relation`, `by_reason`, `by_phase`) list keys in byte
  order. Build them as ordered pairs: some runtimes reorder number-like keys such as `"10"` and `"9"` in a
  native object.

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
| `bad_field` | a required field has the wrong type, or a value outside its closed list where this file says so |
| `duplicate` | a value that must be unique repeats |
| `unknown_path` | a record names a path no `file` or `count` record declared |
| `unknown_group` | a record names a group no `group` record declared |
| `unknown_cell` | a `diff` record names a member and state no `cell` record declared |
| `unknown_image` | a `px` record names an image no `image` record declared |
| `missing_row` | an `image` lacks a `px` record for one of its rows |
| `bad_size` | an `image` has a different width or height from the first `image` in the input |

## Closed lists

| List | Values |
|---|---|
| widget, eligible | `accordion`, `alert`, `avatar`, `badge`, `breadcrumb`, `button`, `card`, `chart`, `choice`, `confirm-dialog`, `date-picker`, `drawer`, `empty-state`, `error-state`, `file-upload`, `form-field`, `icon`, `link`, `list`, `loading`, `menu`, `modal`, `pagination`, `popover`, `search`, `select`, `stat-tile`, `stepper`, `table`, `tabs`, `text-field`, `toast`, `tooltip` |
| widget, ineligible | `feature`, `layout`, `other`, `page`, `provider` |
| relation | `library`, `wrapper`, `restyled`, `hand-rolled` |
| styling | `tokens`, `hardcoded`, `mixed`, `inherited` |
| effects | `pure`, `context`, `store`, `router`, `fetch`, `clock`, `storage`, `io` |
| blocked reason | `adapter_inexpressible`, `boundary_hit`, `build_failed`, `cap_reached`, `console_error`, `font_mismatch`, `import_failed`, `needs_network`, `pending_request`, `render_threw`, `timeout` |
| outcome | `ok`, `unreachable`, `unstable`, `blank`, `blocked` |
| verdict | `SAME`, `VARIANT`, `DIFFERENT` |
| evidence | `CONFIRMED`, `REFUTED`, `BLOCKED` |
| family role | `canonical`, `copy`, `wrapper`, `reference` |
| slice status | `done`, `blocked` |

"widget" alone means the union of the eligible and ineligible lists.

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

### group

Input: `{"t":"row","id":name,"widget":name}`. A `widget` outside the widget list is `bad_field`.

Output: `group` records, then `summary`. The `group` records are valid input for `verify --check groups`.
```
{"t":"group","id":"G0001","key":"class:badge","members":["a.tsx:3:StatusBadge","b.tsx:9:Pill"],"oversize":false}
{"t":"summary","rows":9,"eligible":7,"groups":2,"oversize":1,"singles":1}
```

### reuse

Input:
- `{"t":"old","id":name,"hash":name}`: a row from a saved catalog.
- `{"t":"new","id":name,"hash":name}`: a row from this run's inventory.

IDs have the form `path:line:name`.

Output: one record per new row, then one `removed` record per old row that is gone, then `summary`.
```
{"t":"reuse","id":"a.ts:12:formatDate","from":"a.ts:10:formatDate"}
{"t":"changed","id":"a.ts:22:formatBytes","from":"a.ts:20:formatBytes"}
{"t":"added","id":"e.ts:1:slugify"}
{"t":"removed","id":"c.ts:1:legacy"}
{"t":"summary","old":4,"new":5,"reused":3,"changed":1,"added":1,"removed":1}
```

### diff

Input (all records describe one group):
- `{"t":"cell","member":name,"state":name}`: a planned cell.
- `{"t":"blocked","member":name,"state":name,"reason":name}`: a cell not rendered. `reason` is from the
  blocked reason list, else `bad_field`.
- `{"t":"unreachable","member":name,"state":name}`: no props of this member reach this state.
- `{"t":"predict","member":name,"state":name,"look":name}`: the judge's predicted look for the cell.
  Cells with the same `look` in one state are predicted to look alike.
- `{"t":"image","member":name,"state":name,"take":int,"width":int,"height":int}`: one capture. `take` is
  1 or 2, and `width` and `height` are at least 1, else `bad_field`.
- `{"t":"px","member":name,"state":name,"take":int,"y":int,"hex":str}`: row `y` of that capture, top row
  0, as `width` pixels of six lowercase hex digits each (`rrggbb`), else `bad_field`.

Output: `problem` records, then `outcome` records, then `pair`, `looks` and `bridge` records, then
`evidence` records, then `summary`.
```
{"t":"problem","member":"b.tsx:1:Pill","state":"warning","kind":"missing"}
{"t":"outcome","member":"a.tsx:3:StatusBadge","state":"warning","outcome":"ok"}
{"t":"outcome","member":"c.tsx:2:Tag","state":"warning","outcome":"blocked","reason":"render_threw"}
{"t":"pair","state":"warning","a":"a.tsx:3:StatusBadge","b":"d.tsx:5:Chip","pixels":42,"region":40,"box":[2,1,9,5],"noticeable":true}
{"t":"looks","state":"warning","looks":[["a.tsx:3:StatusBadge"],["d.tsx:5:Chip"]]}
{"t":"bridge","state":"warning","member":"e.tsx:1:Dot","look":1}
{"t":"evidence","member":"a.tsx:3:StatusBadge","result":"CONFIRMED","states":1,"mismatch":[]}
{"t":"summary","cells":4,"ok":2,"unreachable":0,"unstable":0,"blank":0,"blocked":1,"problems":1,"pairs":1,"confirmed":2,"refuted":0,"unproven":2}
```
`problem` `kind` is `missing`, `conflict`, `missing_take` or `no_prediction`. Only a `blocked` outcome
carries `reason`. `box` is `[x0,y0,x1,y1]`, or `[]` when no pixel differs.

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

Input: `{"t":"row","id":name,"name":name,"widget":str,"displays":str,"relation":str,"wraps":str,
"styling":str,"effects":names,"imports":names}`

`imports` is what the parser recorded as imported into the row's file; workers never fill it.

Output: `problem` records, then `summary`.
```
{"t":"problem","id":"b.tsx:2:Pill","kind":"bad_widget"}
{"t":"problem","kind":"other_share","share":"0.2500"}
{"t":"summary","rows":4,"rejected":1,"problems":2,"other":1,"other_share":"0.2500"}
```
Row problem `kind` is one of `bad_widget`, `bad_relation`, `bad_styling`, `bad_effects`, `empty_displays`,
`restates_name`, `wraps_not_imported`, `wraps_on_hand_rolled`. The `other_share` problem has no `id`.

### verify --check groups

Input:
- `{"t":"group","id":name,"members":names}`: a candidate group of row IDs.
- `{"t":"part","group":name,"id":name,"members":names}`: one part of a group that was split.
- `{"t":"keep","a":name,"b":name}`: two overlapping groups the caller could not merge. Order of `a` and
  `b` does not matter.

Output: `problem` records, then `summary`.
```
{"t":"problem","group":"G2","kind":"lost","id":"m4"}
{"t":"problem","group":"G1","kind":"overlap","other":"G2","shared":2}
{"t":"summary","groups":4,"split":1,"problems":2}
```
`lost` and `foreign` carry `id`. `overlap` carries `other` and `shared`.

### verify --check coverage

Input:
- `{"t":"count","path":name,"parser":int,"pattern":int}`: for one file, how many components the parser
  found before any were excluded, and how many the count pattern matched.
- `{"t":"adjust","path":name,"reason":name}`: a file whose counts are known to disagree for a stated
  reason. Adjusted files leave both sums.

Output: `short` records, then `adjusted` records, then `summary`.
```
{"t":"short","path":"src/b.ts","parser":8,"pattern":10}
{"t":"adjusted","path":"m/models.py","reason":"pattern counts def inside docstrings"}
{"t":"summary","files":3,"adjusted":0,"parser":51,"pattern":50,"covered":48,"coverage":"0.9600","adjusted_share":"0.0000","pass":false}
```

### tally

Input (every type optional, any order). A value outside its closed list is `bad_field`.
- `{"t":"row","widget":str,"relation":str}`
- `{"t":"excluded","reason":name,"count":int}`
- `{"t":"slice","status":str}`
- `{"t":"verdict","group":name,"verdict":str}`
- `{"t":"evidence","result":str}`
- `{"t":"outcome","outcome":str}`, plus `reason` (name, from the blocked reason list) when `outcome` is
  `blocked`. The `outcome` records `diff` prints are valid input.
- `{"t":"family","group":name,"member":name,"role":str,"importers":int}`
- `{"t":"spend","phase":name,"usd_cents":int}`
- `{"t":"cap","usd_cents":int}`: at most one; a second is `duplicate`.

Output, in this order: `rows`, `excluded`, `slices`, `verdicts`, `evidence`, `cells`, one `family` per
group, `reinvented`, `spend`.
```
{"t":"rows","total":3,"eligible":2,"by_widget":{"badge":2,"page":1},"by_relation":{"hand-rolled":2,"wrapper":1}}
{"t":"excluded","total":54,"by_reason":{"story":12,"test":42}}
{"t":"slices","done":2,"blocked":1}
{"t":"verdicts","SAME":2,"VARIANT":1,"DIFFERENT":1}
{"t":"evidence","CONFIRMED":1,"REFUTED":0,"BLOCKED":1}
{"t":"cells","ok":20,"unreachable":1,"unstable":0,"blank":1,"blocked":2,"by_reason":{"render_threw":2}}
{"t":"family","group":"G0001","copies":3,"wrappers":1,"sites":17}
{"t":"reinvented","groups":1}
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
