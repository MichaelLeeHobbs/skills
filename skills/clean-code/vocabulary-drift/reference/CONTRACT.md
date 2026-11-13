# Bookkeeping tool contract

The skill's one deterministic tool. It tokenizes, counts, samples and checks. It never reads source
files and never judges. Build it from [ALGORITHM.md](ALGORITHM.md) in whatever runtime the machine has,
then run every fixture in [fixtures/](fixtures/). Any failing fixture stops the run.

## Invocation

```
<tool> terms
<tool> sample [--per-term N]
<tool> reuse
<tool> tally
<tool> verify --check coverage [--min-basis-points N]
<tool> verify --check map [--min-sites N]
<tool> verify --check evidence
```

Input is JSON Lines on standard input. Output is JSON Lines on standard output. Nothing is written to
standard error that a caller must read.

Options are `--name value` pairs, in any order. The value of `--check` is one of `coverage`, `map`,
`evidence`. Every other value is one or more ASCII digits, read as a decimal integer (leading zeros
allowed). Defaults: `--per-term 12`, `--min-basis-points 9800`, `--min-sites 5`. These are usage
errors: an unknown subcommand; an unknown check name; an unknown or repeated option; an option not listed
for that subcommand or check; a missing value; a numeric value that is not digits or is above
9007199254740991; `--per-term` equal to 0; `--min-basis-points` above 10000; `verify` without
`--check`; any other argument left over.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Input valid, and the check found no problem (always 0 for valid `terms`, `sample` and `reuse` input) |
| 1 | Input valid, and the check found at least one problem (for `tally`: a seed file not read in full) |
| 2 | Usage error or malformed input. Output is exactly one error record |

## Input lines

Split standard input on LF. Ignore the empty string after a final LF. Remove one trailing CR from each
line if present. Skip a line that is empty after that. A byte order mark is not stripped, so a line
starting with one is `bad_json`. Every other line must be valid UTF-8 holding one JSON object with a
string field `t` naming the record type. Fields not listed for a type are ignored. Line numbers count
from 1 at the first line of standard input. Records may come in any order: a record that refers to
another is checked against every record in the input, not only earlier ones.

Field types:

- `str`: a JSON string, possibly empty.
- `name`: a JSON string, non-empty.
- `int`: a JSON number whose value is a whole number from 0 to 9007199254740991 (`1.0` counts as 1).
- `names`: a JSON array of `name`, possibly empty, with no value repeated.
- `strs`: a JSON array of `str`, possibly empty, repeats allowed.
- `counts`: a JSON object whose every value is an `int`.
- `surface`: a `name` that is one of `code`, `type`, `schema`, `route`, `ui`, `doc`.
- A closed list written as `"A"|"B"`: a `str` equal to one of the values.

A value of the right JSON type that breaks the type's rule (an empty `name`, a repeated `names` value, a
`surface` or closed-list value outside its list, a negative or fractional `int`) is `bad_field`.

## Output format

- One JSON object per line, LF after every line including the last. No BOM.
- Compact: no spaces between tokens. Keys in exactly the order shown in this file.
- Strings escaped as JSON requires: `"` and `\` escaped, control characters as `\b \f \n \r \t` or
  `\u00XX` with lowercase hex, every other character written as itself in UTF-8. This matches
  `JSON.stringify` and Python's `json.dumps(value, ensure_ascii=False, separators=(",", ":"))`.
- Integers in plain decimal. Ratios are strings: see the basis-point rule in ALGORITHM.md.
- Booleans as `true` or `false`.
- Objects with computed keys (`by_surface`, `by_bucket`, `by_phase`) list keys in byte order. Build them
  as ordered pairs: some runtimes reorder number-like keys in a native object.

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
| `bad_field` | a required field has the wrong JSON type or breaks its type's rule |
| `duplicate` | a value that must be unique repeats |
| `unknown_path` | a record names a path no `file` record declared (coverage) |
| `unknown_claim` | a `sense` names a claim no `claim` record declared (evidence) |

## The site record

Used by `terms`, `sample`, `verify --check coverage` and `verify --check evidence`:

```
{"t":"site","id":name,"path":name,"surface":surface,"context":name,"text":str}
```

`id` is `path:line:col`. `text` is the declared name or the string found at the site. A second `site`
with the same `id` is `duplicate` in every subcommand that takes sites.

## terms

Input: `site` records.

Output: one `term` record per distinct term, sorted by `term`, then one `summary`.

```
{"t":"term","term":"study","sites":3,"files":2,"by_surface":{"code":1,"type":2},"contexts":["api","web"],"forms":["studies","study"],"names":[{"text":"Study","sites":2},{"text":"loadStudies","sites":1}]}
{"t":"summary","sites":5,"tokens":14,"kept":9,"stopped":3,"short":2,"terms":4}
```

The `term` records are valid input for `verify --check map`.

## sample

Input:
- `site` records.
- `{"t":"want","candidate":name,"term":name,"exclude":strs}`: sample sites of `term` for `candidate`,
  skipping sites whose trimmed `text` equals any trimmed `exclude` value. A second `want` with the same
  `candidate` and `term` is `duplicate`.

Output: for each candidate in rank order, one `candidate` record followed by one `pick` record per term
of that candidate, terms in byte order. Then one `summary`.

```
{"t":"candidate","candidate":"K01","rank":1,"sites":5,"surfaces":3,"terms":["exam","study"]}
{"t":"pick","candidate":"K01","term":"exam","sites":2,"cells":2,"cells_picked":2,"picks":["a.ts:3:1","b.json:9:5"]}
{"t":"summary","candidates":1,"picks":5}
```

The `pick` records are valid input for `verify --check evidence`.

## reuse

Input:
- `{"t":"old","concept":name,"names":names,"cells":names}`: a concept summary from the saved catalog.
- `{"t":"new","concept":name,"names":names,"cells":names}`: the same concept from this run.

A second `old`, or a second `new`, with the same `concept` is `duplicate`.

Output: one `concept` record per concept in either set, sorted by `concept`, then `summary`. `status` is
`reuse`, `rejudge`, `added` or `removed`; `reason` is `names`, `cells` or `""`.

```
{"t":"concept","concept":"C0001","status":"rejudge","reason":"cells"}
{"t":"summary","reuse":3,"rejudge":1,"added":0,"removed":0}
```

## tally

Input (every type optional, any order):
- `{"t":"claim","verdict":"SYNONYM"|"DISTINCT"|"HOMONYM"|"GENERIC","strength":"structural"|"usage"}`
- `{"t":"candidate","status":"judged"|"cut"}`
- `{"t":"seed","file":name,"lines":int,"read":int}`: a file read from a find-reinvention catalog, its
  non-empty line count, and the records parsed from it. A second `seed` with the same `file` is
  `duplicate`.
- `{"t":"spend","phase":name,"usd_cents":int}`
- `{"t":"cap","usd_cents":int}`: at most one; a second is `duplicate`.

The `claim` records `verify --check evidence` prints are valid input (extra fields are ignored).

Output: exactly five records in this order.

```
{"t":"verdicts","SYNONYM":2,"DISTINCT":1,"HOMONYM":1,"GENERIC":0}
{"t":"strength","structural":3,"usage":1}
{"t":"candidates","judged":4,"total":5}
{"t":"seeds","files":2,"lines":40,"read":40,"pass":true}
{"t":"spend","total_cents":1025,"cap_cents":2500,"over_cap":false,"by_phase":{"judge":900,"map":125}}
```

With no `cap` record, `cap_cents` is 0 and `over_cap` is false. Exit 1 when `seeds` has `pass` false.

## verify --check coverage

Input:
- `{"t":"tracked","path":name}`: every file version control tracks. A second with the same path is
  `duplicate`.
- `{"t":"file","path":name,"bucket":name}`: the bucket the agent put a file in (a source kind, or
  `excluded-<reason>`). Repeats of a path are allowed and reported.
- `{"t":"count","path":name,"surface":surface,"pattern":int}`: the cross-check count for one file and
  surface. A second with the same `path` and `surface` is `duplicate`. A `path` with no `file` record is
  `unknown_path`.
- `site` records. A `path` with no `file` record is `unknown_path`.

Output: `problem` records, then one `group` record per surface and extension with a pattern total above
0, sorted by `surface` then `ext`, then `summary`.

```
{"t":"problem","kind":"no_sites","path":"src/b.ts","surface":"code","pattern":3,"sites":0}
{"t":"group","surface":"code","ext":"ts","pattern":10,"sites":9,"matched":9,"coverage":"0.9000","pass":false}
{"t":"summary","tracked":4,"files":4,"by_bucket":{"doc":1,"source":3},"groups":1,"failed_groups":1,"problems":1,"pass":false}
```

Problem `kind` is one of `unbucketed`, `double`, `untracked`, `uncounted`, `unmeasured`, `no_sites`.
Fields that do not apply are `""` or 0. Exit 1 when `pass` is false.

## verify --check map

Input:
- `term` records as `terms` prints them; only `term`, `sites` and `by_surface` are required here.
  A second with the same `term` is `duplicate`.
- `{"t":"concept","id":name,"name":name}`. A second with the same `id` is `duplicate`.
- `{"t":"map","term":name,"to":name}`: `to` is a concept `id` or `not-domain`. A term may have several.
  A second `map` with the same `term` and `to` is `duplicate`.

Output: `problem` records, then `summary`.

```
{"t":"problem","kind":"unmapped","term":"exam","concept":""}
{"t":"summary","terms":5,"required":3,"mapped":2,"concepts":2,"multi":1,"pass":false}
```

Problem `kind` is one of `unmapped`, `unknown_term`, `unknown_concept`, `unused_concept`. Exit 1 when
`pass` is false.

## verify --check evidence

Input:
- `site` records.
- `pick` records as `sample` prints them; only `candidate`, `term` and `picks` (`names`) are required.
  A second with the same `candidate` and `term` is `duplicate`.
- `{"t":"claim","id":name,"candidate":name,"verdict":"SYNONYM"|"DISTINCT"|"HOMONYM"|"GENERIC","names":names,"cites":names,"relation":""|"parent-of"|"child-of"|"attribute-of"|"peer"}`.
  A second with the same `id` is `duplicate`.
- `{"t":"sense","claim":name,"term":name,"concept":name,"prefix":str}`: one sense of a homonym, in
  priority order. A `claim` no `claim` record declares is `unknown_claim`.
- `{"t":"expect","claim":name,"verdict":"SYNONYM"|"DISTINCT"|"HOMONYM"|"GENERIC"}`: a canary's planted
  verdict. A second with the same `claim` is `duplicate`.

Output: one `claim` record per claim sorted by `id`, each followed by its `sense` records in input
order; then `problem` records; then `summary`.

```
{"t":"claim","id":"V01","verdict":"HOMONYM","strength":"usage","cites":2,"problems":0}
{"t":"sense","claim":"V01","term":"exam","concept":"C0002","prefix":"apps/scheduling/","sites":4}
{"t":"problem","kind":"not_sampled","claim":"V02","detail":"c.ts:4:1"}
{"t":"summary","claims":2,"structural":1,"usage":1,"canaries":1,"canaries_passed":1,"problems":1,"pass":false}
```

Problem `kind` is one of `no_cites`, `unknown_site`, `not_sampled`, `name_not_cited`, `too_few_names`,
`no_relation`, `bad_relation`, `too_few_cites`, `no_senses`, `no_catch_all`, `empty_sense`,
`bad_sense`, `missing`, `canary_wrong`. Exit 1 when `pass` is false.

## Fixtures

Each fixture is three files with the same stem in `fixtures/`:

- `NN-name.in`: line 1 is the arguments after the tool name, separated by single spaces. Every following
  line is standard input, byte for byte.
- `NN-name.out`: the exact expected standard output.
- `NN-name.exit`: the expected exit code followed by LF.

A fixture passes when standard output matches `.out` byte for byte and the exit code matches `.exit`.
Read fixture files as bytes. A checkout that converted line endings to CRLF fails every fixture; convert
the fixture files to LF in your working copy (never edit their content) and say so in the report.
