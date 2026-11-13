# Bookkeeping tool contract

The skill's one deterministic tool. It builds sites from the scanner's records, counts families, checks
conventions, draws samples, compares audit labels and resolves owners. It never reads source files and
never judges. Build it from [ALGORITHM.md](ALGORITHM.md) in whatever runtime the machine has, then run
every fixture in [fixtures/](fixtures/). Any failing fixture stops the run.

## Invocation

```
<tool> close
<tool> census
<tool> sample
<tool> audit
<tool> owners
<tool> verify --check scan
```

Input is JSON Lines on standard input. Output is JSON Lines on standard output. Nothing is written to
standard error that a caller must read.

The subcommand is the first argument. The only option is `--check`, only for `verify`, given as two
arguments (`--check scan`; the `--check=scan` form is not accepted), and its only value is `scan`. These
are usage errors: an unknown subcommand; `verify` without `--check`; `--check` with a value other than
`scan`; `--check` given twice; `--check` on any other subcommand; a missing value; any other argument.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Input valid, and nothing failed (always 0 for valid `sample` and `owners` input) |
| 1 | Input valid, and a check found a problem or a threshold failed |
| 2 | Usage error or malformed input. Output is exactly one error record |

## Input lines

Split standard input on LF. Ignore the empty string after a final LF. Remove one trailing CR from each
line if present. A byte order mark is not stripped, so a line starting with one is `bad_json`. Every
other line must be valid UTF-8 holding one JSON object with a string field `t` naming the record type.
Fields not listed for a type are ignored. An empty line (including one that held only a CR) is
`bad_json`. `NaN`, `Infinity` and other extensions are not JSON. When an object repeats a key, the last
value wins. Inputs never contain lone surrogate escapes; behaviour on them is outside this contract.
Line numbers count from 1 at the first line of standard input.
Records may come in any order: a record that refers to another is checked against every record in the
input, not only earlier ones.

Field types used below:

- `str`: a JSON string, possibly empty.
- `name`: a JSON string, non-empty.
- `int`: a JSON number whose numeric value is a whole number from 0 to 9007199254740991 (`1.0`, `1e0`
  and `-0` are accepted as 1, 1 and 0).
- `bool`: `true` or `false`.
- `names`: a JSON array of `name`, possibly empty, with no value repeated. Elements are checked in
  order and the first problem met decides: `[1,"a","a"]` is `bad_field`, `["a","a",1]` is `duplicate`.
- `one of a, b`: a `name` from that closed list. Any other value is `bad_field`.

## Output format

- One JSON object per line, LF after every line including the last. No BOM.
- Compact: no spaces between tokens. Keys in exactly the order shown in this file.
- Strings escaped as JSON requires: `"` and `\` escaped, control characters as `\b \f \n \r \t` or
  `\u00XX` with lowercase hex, every other character written as itself in UTF-8. This matches
  `JSON.stringify` and Python's `json.dumps(value, ensure_ascii=False, separators=(",", ":"))`.
- Integers in plain decimal, computed with exact integer arithmetic. Ratios are basis-point strings
  (ALGORITHM.md).
- Booleans as `true` or `false`.

## Error record

```
{"t":"error","line":3,"reason":"bad_json"}
```

`line` is 0 for a usage error and for `no_seed`. `reason` is one of:

| Reason | When |
|---|---|
| `usage` | bad command line |
| `bad_json` | the line is not valid UTF-8 or not valid JSON |
| `not_object` | valid JSON but not an object |
| `unknown_type` | `t` missing, not a string, or not a type this subcommand accepts |
| `missing_field` | a required field is absent |
| `bad_field` | a field has the wrong type or a value outside its closed list, a convention key is malformed, or a `stratum` reads more files than it has |
| `duplicate` | a value that must be unique repeats |
| `unknown_fn` | a record names a function no `fn` record declares |
| `unknown_call` | a record names a call no `call` record declares |
| `unknown_hit` | a `disposition` names an ID no `unresolved` record declares |
| `unknown_job` | a record names a job no `job` record declares |
| `unknown_stratum` | an `escape` names a stratum no `stratum` record declares |
| `unknown_id` | an audit `label` or `ruling` names an ID it may not (ALGORITHM.md) |
| `no_seed` | `sample` input has no `seed` record |

## close

Builds sites from the scanner's records ([SCAN.md](SCAN.md) says what each record means).

Input:
- `{"t":"sink","symbol":name,"job":name,"marker":name}`
- `{"t":"conduit","symbol":name,"job":name,"terminal":name}`: a conduit the user declared at the gate.
- `{"t":"fn","symbol":name,"path":name,"component":bool,"wraps":str}`
- `{"t":"call","id":name,"path":name,"callee":str,"in_fn":str,"in_site":str,"trigger":trigger}`
- `{"t":"ref","id":name,"path":name,"symbol":name,"in_fn":str,"in_site":str,"trigger":trigger}`
- `{"t":"opaque","path":name}`
- `{"t":"unresolved","id":name,"path":name,"job":name,"key":name,"trigger":trigger}`
- `{"t":"disposition","id":name,"key":name,"job":name,"marker":name}`

`trigger` is one of `query-hook`, `effect`, `handler`, `thunk`, `render`, `module`, `server`, `other`.

Output, in order: `site` records, `conduit` records, `problem` records, `count` records, `summary`.
```
{"t":"site","id":"src/a.ts:4:1:fetch","job":"fetch","family":"query-hook:react-query>apiClient","path":"src/a.ts"}
{"t":"conduit","symbol":"src/api.ts#getUser","job":"fetch","terminal":"apiClient","source":"auto","uses":3}
{"t":"problem","id":"src/c.ts:9:1","kind":"undisposed"}
{"t":"count","job":"fetch","sites":3,"same_as":2,"inside_conduit":1,"blocked":1}
{"t":"summary","calls":9,"refs":2,"unresolved":2,"opaque":1,"hits":7,"sites":3,"blocked":1,"not_site":1,"problems":1}
```
`problem` `kind` is `undisposed` or `stale`. `conduit` `source` is `declared` or `auto`.

## census

Input:
- `{"t":"job","job":name,"grade":one of closed, partial}`
- `{"t":"site","id":name,"job":name,"family":name,"path":name}`: `close` output records, unchanged.
- `{"t":"blocked","job":name,"count":int}`: at most one per job; the `blocked` value of `close`'s `count`
  record.
- `{"t":"convention","id":name,"job":name,"status":one of stated, vague,"allow":names,"deny":names,"scope":names}`
- `{"t":"stratum","name":name,"files":int,"read":int}`
- `{"t":"escape","stratum":name,"job":name,"path":name}`: a file in the escape sample that held a site the
  scan missed.

Output, in order: `family` records, `convention` records, `job` records, `summary`.
```
{"t":"family","job":"fetch","family":"query-hook:react-query>apiClient","sites":3}
{"t":"convention","id":"C1","job":"fetch","in_scope":5,"conforming":3,"low":"0.5000","high":"0.6666","withheld":""}
{"t":"job","job":"fetch","grade":"closed","sites":5,"blocked":0,"files":4,"escapes":0,"bound":1,"state":"ok"}
{"t":"summary","jobs":1,"sites":5,"conventions":1,"withheld":0,"pass":true}
```
`withheld` is `""` or one of `not_applicable`, `vague`, `stale`, `unsampled`, `escapes`, `residual`,
`range`. `state` is `ok`, `unsampled` or `escapes`. `low` and `high` are `""` when they cannot be computed.

## sample

Input:
- `{"t":"seed","value":name}`: exactly one.
- `{"t":"item","id":name,"stratum":name}`
- `{"t":"quota","stratum":name,"n":int}`

Output: `pick` records, then `summary`.
```
{"t":"pick","stratum":"hit","id":"src/a.ts","rank":1,"hash":"0c2f9a17"}
{"t":"summary","items":4,"strata":2,"picked":3}
```

## audit

Input:
- `{"t":"scan","id":name,"family":name}`: a sampled site and the family `close` gave it.
- `{"t":"label","id":name,"family":name}`: the family a blind reader gave it.
- `{"t":"ruling","id":name,"winner":one of scanner, worker}`: the strongest model's ruling on a
  disagreement.

Output: `disagree` records, `missing` records, then `summary`.
```
{"t":"disagree","id":"src/b.ts:7:1:fetch","scanner":"effect:apiClient>apiClient","worker":"handler:apiClient>apiClient","ruling":"worker"}
{"t":"missing","id":"src/c.ts:2:1:fetch"}
{"t":"summary","sampled":3,"labelled":2,"agree":1,"disagree":1,"upheld":1,"unruled":0,"missing":1,"pass":false}
```
`ruling` is `scanner`, `worker` or `""` when there is none.

## owners

Input:
- `{"t":"rule","line":int,"pattern":name,"owners":names,"section":str}`: one CODEOWNERS line. `section` is
  `""` outside any section.
- `{"t":"history","path":name,"owners":names}`: owners from version-control history, for files no rule
  matches.
- `{"t":"site","id":name,"job":name,"family":name,"path":name}`

Output: `owner` records, then `summary`.
```
{"t":"owner","job":"fetch","family":"effect:fetch>fetch","owner":"@web-team","source":"codeowners","sites":2}
{"t":"summary","sites":3,"codeowners":2,"history":0,"unowned":1}
```
`source` is `codeowners`, `history` or `none` (owner `unowned`).

## verify --check scan

Input:
- `{"t":"expect","case":name,"id":name,"family":name}`: a site a scanner case expects.
- `{"t":"got","case":name,"id":name,"family":name}`: a site the generated scanner produced for that case.

Output: `problem` records, then `summary`.
```
{"t":"problem","case":"barrel-alias","id":"app.ts:3:1:fetch","kind":"missing","expected":"effect:fetch>fetch","got":""}
{"t":"summary","cases":2,"expected":3,"got":2,"problems":1}
```
`kind` is `missing`, `extra` or `family`.

## Fixtures

Each fixture is three files with the same stem in `fixtures/`:

- `NN-name.in`: line 1 is the arguments after the tool name, separated by single spaces (empty for none).
  Every following line is standard input, byte for byte.
- `NN-name.out`: the exact expected standard output.
- `NN-name.exit`: the expected exit code followed by LF.

A fixture passes when standard output matches `.out` byte for byte and the exit code matches `.exit`.
Read fixture files as bytes. A checkout that converted line endings to CRLF fails every fixture; convert
the fixture files to LF in your working copy (never edit their content) and say so in the report.
