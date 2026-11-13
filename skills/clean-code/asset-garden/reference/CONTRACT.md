# Bookkeeping tool contract

The skill's one deterministic tool. It joins, counts, checks, and computes two kinds of similarity that
depend only on text: SVG normal forms and the bit distance between perceptual hashes it is given. It
never opens a file, never decodes or renders an image, never computes a perceptual hash, and never
judges. Build it from [ALGORITHM.md](ALGORITHM.md) in whatever runtime the machine has, then run every
fixture in [fixtures/](fixtures/). Any failing fixture stops the run.

## Invocation

```
<tool> svgnorm
<tool> refs
<tool> dupes [--max-distance N] [--neighbours N] [--max-pairs N] [--aspect-basis-points N]
<tool> size [--dpr N] [--factor-basis-points N] [--min-saving-bytes N] [--min-saving-basis-points N]
            [--cap-svg N] [--cap-raster N] [--cap-font N] [--cap-other N]
<tool> meanings
<tool> verify --check inventory
<tool> verify --check refcov [--min-basis-points N]
<tool> verify --check audit
<tool> verify --check labels
<tool> verify --check canaries
```

Input is JSON Lines on standard input. Output is JSON Lines on standard output. Nothing is written to
standard error that a caller must read.

Options are `--name value` pairs, in any order. The value of `--check` is one of `inventory`, `refcov`,
`audit`, `labels`, `canaries`. Every other value is one or more ASCII digits, read as a decimal integer
(leading zeros allowed). Defaults: `--max-distance 4`, `--neighbours 3`, `--max-pairs 200`,
`--aspect-basis-points 200`, `--dpr 2`, `--factor-basis-points 15000`, `--min-saving-bytes 10240`,
`--min-saving-basis-points 2000`, `--cap-svg 20480`, `--cap-raster 512000`, `--cap-font 153600`,
`--cap-other 2097152`, `--min-basis-points 9800`. These are usage errors: an unknown subcommand; an
unknown check name; an unknown or repeated option; an option not listed for that subcommand or check; a
missing value; a numeric value that is not digits or is above 9007199254740991; `--neighbours`,
`--max-pairs` or `--dpr` equal to 0; `verify` without `--check`; any other argument left over.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Input valid, and nothing that subcommand treats as a problem was found |
| 1 | Input valid, and a check found at least one problem or failed its threshold |
| 2 | Usage error or malformed input. Output is exactly one error record |

`svgnorm`, `dupes`, `size` and `meanings` always exit 0 on valid input. `refs` exits 1 when it prints a
`bad_pattern` record. Every `verify` check exits 1 when it prints a problem or fails.

## Input lines

Split standard input on LF. Ignore the empty string after a final LF. Remove one trailing CR from each
line if present. A byte order mark at the start of a line is not stripped, so that line is `bad_json`.
Every other line must be valid UTF-8 holding one JSON object with a string field `t` naming the record
type. Fields not listed for a type are ignored. Line numbers count from 1 at the first line of standard
input. Records may come in any order: a record that refers to another is checked against every record in
the input, not only earlier ones.

Field types used below:

- `str`: a JSON string, possibly empty.
- `name`: a JSON string, non-empty.
- `int`: a JSON number whose value is a whole number from 0 to 9007199254740991 (`1.0` counts as 1).
- `pos`: an `int` of at least 1.
- `bool`: `true` or `false`.
- `names`: a JSON array of `name`, with no value repeated.
- `sha`: a string of exactly 64 characters from `0-9a-f`.
- `hex64`: a string of exactly 16 characters from `0-9a-f`.
- `enum`: a `name` from the closed list given with the field. Any other value is `bad_field`.

## Output format

- One JSON object per line, LF after every line including the last. No BOM.
- Compact: no spaces between tokens. Keys in exactly the order shown in this file.
- Strings escaped as JSON requires: `"` and `\` escaped, control characters as `\b \f \n \r \t` or
  `\u00XX` with lowercase hex, every other character written as itself in UTF-8. This matches
  `JSON.stringify` and Python's `json.dumps(value, ensure_ascii=False, separators=(",", ":"))`.
- Integers in plain decimal, computed with exact integer arithmetic. Ratios are basis-point strings
  (ALGORITHM.md). Booleans as `true` or `false`.

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
| `bad_field` | a required field has the wrong type or an `enum` value outside its list |
| `duplicate` | a value that must be unique repeats |
| `unknown_path` | a record names a path that no record declaring paths for this subcommand declared |
| `unlabelled` | `meanings` only: a `use` names an icon with no `label` |

## Records per subcommand

### svgnorm

Input: `{"t":"svg","path":name,"text":str}`: one SVG file's full text. `path` is unique.

Output: per input in path order, a `norm` or `unparsed` record, then `summary`.
```
{"t":"norm","path":"a.svg","strict":"<svg viewBox=\"0 0 24 24\"><path d=\"M 1 2\"/></svg>","loose":"<svg viewBox=\"0 0 24 24\"><path d=\"M 1 2\"/></svg>","sprite":false,"raster":false}
{"t":"unparsed","path":"b.svg","reason":"doctype"}
{"t":"summary","svgs":2,"normalised":1,"unparsed":1}
```
`reason` is one of `doctype`, `cdata`, `pi`, `entity`, `script`, `not_svg`, `malformed`.

### refs

Input:
- `{"t":"asset","path":name,"unit":str}`: an asset file. `unit` names a vendored library it belongs to, or
  is empty. `path` is unique.
- `{"t":"root","dir":str,"url":name}`: files under `dir` are served at URL prefix `url`. The pair is
  unique.
- `{"t":"alias","prefix":name,"dir":str}`: an import prefix the build maps to `dir`. `prefix` is unique.
- `{"t":"ref","from":name,"value":name}`: a reference string found in file `from`.
- `{"t":"pattern","from":name,"glob":name}`: a string-built reference in `from`, written as a glob.
- `{"t":"hit","value":name}`: a URL path seen in a request recording or a log.
- `{"t":"keep","path":name,"reason":name}`: a deliberate keep. `path` is unique and names an asset.

Output: `asset` records, then `dangling`, then `pattern` and `bad_pattern` records together, then `unit`,
then `summary`.
```
{"t":"asset","path":"public/logo.svg","status":"served"}
{"t":"dangling","from":"src/App.tsx","value":"./Logo.svg","reason":"case_only","other":"src/logo.svg"}
{"t":"pattern","from":"src/Flag.tsx","glob":"src/flags/*.svg","matched":3}
{"t":"bad_pattern","from":"src/Any.tsx","glob":"**/*.png"}
{"t":"unit","unit":"vendor-icons","files":900,"used":63}
{"t":"summary","assets":1512,"referenced":900,"convention":6,"hit":0,"pattern":312,"served":180,"kept":3,"weak":2,"unreferenced":109,"candidates":48,"dangling":4,"unmatched_hits":0,"external":12,"pattern_share":"0.2063"}
```
`status` is one of `referenced`, `convention`, `hit`, `pattern`, `served`, `kept`, `weak`,
`unreferenced`. `reason` is `no_asset`, `escapes` or `case_only`; only `case_only` carries `other`.

### dupes

Input:
- `{"t":"file","path":name,"sha":sha,"bytes":int}`: every asset. `path` is unique.
- `{"t":"norm","path":name,"strict":name,"loose":name,"sprite":bool}`: `svgnorm` output.
- `{"t":"hash","path":name,"algo":name,"hash":hex64,"width":pos,"height":pos}`: a raster's
  perceptual hash and pixel size. The pair `path`, `algo` is unique.

`norm` and `hash` paths must name a `file` (`unknown_path`). `svgnorm`'s `unparsed` and `summary`
records are accepted and ignored.

Output: `group` records, then `pair` records, then `summary`.
```
{"t":"group","id":"B0001","tier":"bytes","members":["a/close.svg","b/x.svg"],"reclaim":512}
{"t":"group","id":"S0001","tier":"strict","members":["a/menu.svg","c/burger.svg"],"reclaim":0}
{"t":"pair","algo":"dhash","a":"img/hero.png","b":"img/hero-small.jpg","distance":2}
{"t":"summary","files":20,"bytes_groups":1,"strict_groups":1,"loose_groups":0,"pairs":1,"capped":false,"degenerate":0,"reclaim":512}
```
`tier` is `bytes`, `strict` or `loose`.

### size

Input:
- `{"t":"file","path":name,"kind":enum,"bytes":int}`: `kind` is `svg`, `raster`, `font` or `other`.
  `path` is unique.
- `{"t":"dims","path":name,"width":pos,"height":pos}`: a raster's pixel size. One per path.
- `{"t":"render","path":name,"width":pos,"height":pos}`: a measured rendered box in CSS pixels. Repeatable.
- `{"t":"optimised","path":name,"bytes":int}`: a lossless optimiser's output size. One per path.
- `{"t":"norm","path":name,"raster":bool}`: `svgnorm` output.

Every non-`file` record's path must name a `file`. `svgnorm`'s `unparsed` and `summary` records are
accepted and ignored.

Output: per file in path order, its `flag` records in rule order, then its `no_render` record; then
`summary`.
```
{"t":"flag","path":"img/hero.png","rule":"pixels","value":4000,"limit":1200}
{"t":"no_render","path":"img/old.png"}
{"t":"summary","files":5,"flagged":1,"flags":1,"no_render":1,"saving":0}
```
`rule` is one of `over_cap`, `pixels`, `optimise`, `embedded_raster`, `legacy_font`.

### meanings

Input:
- `{"t":"use","file":name,"icon":name,"family":name,"design":name}`: one use site. The pair `file`,
  `icon` is unique.
- `{"t":"label","icon":name,"meanings":names}`: one per icon.
- `{"t":"uncounted","file":name,"count":int}`: string-built icon sites in `file` that resolve to no
  single icon.

Output: `meaning` records, then `summary`.
```
{"t":"meaning","meaning":"close","families":[{"family":"lib-a","sites":40,"designs":1},{"family":"custom","sites":3,"designs":2}]}
{"t":"summary","icons":140,"sites":610,"meanings":31,"mixed":18,"other":4,"uncounted":7}
```

### verify --check inventory

Input: `{"t":"listed","by":enum,"path":name}`: `by` is `vcs` or `walk`. The pair `by`, `path` is unique.

Output: `problem` records, then `summary`.
```
{"t":"problem","kind":"case_only","path":"img/Logo.png","other":"img/logo.png"}
{"t":"problem","kind":"missing_from_walk","path":"img/gone.png"}
{"t":"summary","vcs":3,"walk":3,"problems":2}
```
`kind` is `empty`, `missing_from_walk`, `missing_from_vcs` or `case_only`. `empty` carries only `by`
(`{"t":"problem","kind":"empty","by":"walk"}`); `case_only` also carries `other`.

### verify --check refcov

Input: `{"t":"count","path":name,"kind":name,"extracted":int,"pattern":int}`: for one file of a file kind,
how many references the extraction found and how many a broader line pattern matched. `path` is unique.

Output: `short` records, then `kind` records, then `summary`.
```
{"t":"short","path":"src/a.html","kind":"html","extracted":3,"pattern":5}
{"t":"kind","kind":"html","files":2,"extracted":9,"pattern":10,"covered":8,"coverage":"0.8000","pass":false}
{"t":"summary","files":2,"kinds":1,"pass":false}
```

### verify --check audit

Input:
- `{"t":"candidate","path":name}`: an asset `refs` made a candidate. `path` is unique.
- `{"t":"audit","path":name,"stem":str,"hits":int,"read":int,"result":enum}`: `result` is `none`,
  `noise`, `gap` or `skipped`. `path` is unique.

Output: `problem` records, then `summary`.
```
{"t":"problem","kind":"underread","path":"img/close.svg"}
{"t":"summary","candidates":2,"audited":2,"gaps":0,"problems":1}
```
`kind` is `missing`, `extra`, `gap`, `inconsistent`, `underread` or `bad_skip`.

### verify --check labels

Input:
- `{"t":"vocab","meaning":name}`: the frozen vocabulary. `meaning` is unique.
- `{"t":"use",...}` and `{"t":"label",...}` as for `meanings`, without the uniqueness checks.

Output: `problem` records, then `summary`.
```
{"t":"problem","kind":"unknown_meaning","icon":"pkg:Trash2","meaning":"bin"}
{"t":"summary","icons":3,"labels":3,"problems":1}
```
`kind` is `unlabelled`, `extra`, `unknown_meaning`, `too_many` or `repeated`; only `unknown_meaning`
carries `meaning`.

### verify --check canaries

Input, expectations:
- `{"t":"expect_status","path":name,"status":name}`
- `{"t":"expect_group","a":name,"b":name,"tier":enum}`: `tier` is `bytes`, `strict`, `loose` or `pair`.
- `{"t":"expect_apart","a":name,"b":name}`
- `{"t":"expect_meaning","icon":name,"meaning":name}`

Input, results from the other subcommands, used as given: `asset` (`path` name, `status` name), `group`
(`tier` name, `members` names), `pair` (`a` name, `b` name), `label` (`icon` name, `meanings` names). Records of types `summary`, `dangling`,
`pattern`, `bad_pattern`, `unit`, `norm`, `unparsed`, `flag`, `no_render`, `meaning`, `use`, `vocab` are
accepted and ignored.

Output: one `canary` record per expectation in input order, then `summary`.
```
{"t":"canary","line":4,"expect":"status","pass":false}
{"t":"summary","canaries":3,"passed":2,"failed":1}
```
`expect` is `status`, `group`, `apart` or `meaning`.

## Fixtures

Each fixture is three files with the same stem in `fixtures/`:

- `NN-name.in`: line 1 is the arguments after the tool name, separated by single spaces. Every following
  line is standard input, byte for byte.
- `NN-name.out`: the exact expected standard output.
- `NN-name.exit`: the expected exit code followed by LF.

A fixture passes when standard output matches `.out` byte for byte and the exit code matches `.exit`.
Read fixture files as bytes. A checkout that converted line endings to CRLF fails every fixture; convert
the fixture files to LF in your working copy (never edit their content) and say so in the report.
