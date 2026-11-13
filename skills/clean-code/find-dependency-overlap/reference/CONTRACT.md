# Bookkeeping tool contract

The skill's one deterministic tool. It resolves, counts, attributes and checks. It never reads source
files or build output from disk, never decides what job a package does, and never judges. Build it from
[ALGORITHM.md](ALGORITHM.md) in whatever runtime the machine has, then run every fixture in
[fixtures/](fixtures/). Any failing fixture stops the run.

This spec is self-contained on purpose: a skill installs as one folder, so nothing here may depend on
another skill's files.

## Invocation

```
<tool> sites
<tool> families
<tool> pins
<tool> bytes [--min-basis-points N]
<tool> verify --check coverage [--min-basis-points N] [--max-adjusted-basis-points N]
```

Input is JSON Lines on standard input. Output is JSON Lines on standard output. Nothing is written to
standard error that a caller must read.

Options are `--name value` pairs, in any order. The value of `--check` is `coverage`. Every other value is
one or more ASCII digits, read as a decimal integer (leading zeros allowed). Defaults: `bytes
--min-basis-points 9500`; `verify --min-basis-points 9800 --max-adjusted-basis-points 200`. These are
usage errors: an unknown subcommand; an unknown check name; an unknown or repeated option; an option not
listed for that subcommand; a missing value; a numeric value that is not digits or is above
9007199254740991; `verify` without `--check`; any other argument left over.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Input valid, and the subcommand found no problem |
| 1 | Input valid, and: `sites` found an `unknown` specifier; `families` found a problem; `bytes` or `verify` failed its threshold. `pins` never exits 1, and `unused` or `undeclared` records alone never make `sites` exit 1 |
| 2 | Usage error or malformed input. Output is exactly one error record |

## Input lines

Split standard input on LF. Ignore the empty string after a final LF. Remove one trailing CR from each
line if present. A byte order mark is not stripped, so a line starting with one is `bad_json`. Every
other line must be valid UTF-8 holding one JSON object with a string field `t` naming the record type.
Fields not listed for a type are ignored. Line numbers count from 1 at the first line of standard input.
Records may come in any order: a record that refers to another is checked against every record in the
input, not only earlier ones.

Field types:

- `str`: a JSON string, possibly empty.
- `name`: a JSON string, non-empty.
- `int`: a JSON number whose value is a whole number from 0 to 9007199254740991 (`1.0` counts as 1).
- `bool`: `true` or `false`.
- `names`: a JSON array of `name`, with no value repeated.
- `strs`: a JSON array of `str`, repeats allowed.
- `ints`: a JSON array of `int`.

A field marked *closed* must hold one of the listed values; any other value is `bad_field`.

## Output format

- One JSON object per line, LF after every line including the last. No BOM.
- Compact: no spaces between tokens. Keys in exactly the order shown in this file.
- Strings escaped as JSON requires: `"` and `\` escaped, control characters as `\b \f \n \r \t` or
  `\u00XX` with lowercase hex, every other character written as itself in UTF-8. This matches
  `JSON.stringify` and Python's `json.dumps(value, ensure_ascii=False, separators=(",", ":"))`.
- Integers in plain decimal, summed with exact integer arithmetic. Ratios are strings (see the
  basis-point rule in ALGORITHM.md).
- Objects with computed keys (`forms`, `areas`) list keys in byte order and only keys that occurred.

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
| `bad_field` | a required field has the wrong type, a closed field has a value outside its list, or a value breaks a rule ALGORITHM.md names as `bad_field` |
| `duplicate` | a value that must be unique repeats |
| `unknown_workspace` | a record names a workspace no `workspace` or `runtime` record declared |
| `unknown_app` | a record names an app no `app` record declared |
| `unknown_path` | an `adjust` names a path no `count` record declared |

## sites

Resolves every import to a package and counts sites per package.

Input:
- `{"t":"workspace","name":name,"package":str}`: a workspace (`.` is the repo root) and the package name
  it publishes, or `""` if none.
- `{"t":"pkg","workspace":name,"name":name,"kind":name,"real":str}`: a declared direct dependency.
  `kind` is closed: `prod`, `dev`, `peer`, `optional`. `real` is the package an alias installs
  (`"my-lodash": "npm:lodash@4"` gives name `my-lodash`, real `lodash`), or `""` when it is `name`.
- `{"t":"alias","prefix":name,"target":str}`: a path alias from the build or compiler config. `target`
  is a package name, or `""` for a local path.
- `{"t":"builtin","lang":name,"prefix":name}`: a module the platform provides (`fs`, `os`).
- `{"t":"module","lang":name,"prefix":name,"package":name}`: for languages other than `js`, a module
  prefix and the package that provides it.
- `{"t":"import","file":name,"workspace":name,"lang":name,"spec":name,"form":name,"area":name,"refs":int}`:
  one import statement. `form` is closed: `static`, `type_only`, `side_effect`, `reexport`, `dynamic`,
  `require`, `config_ref`. `area` is closed: `shipped`, `test`, `tooling`. `refs` is how many times the
  imported bindings are referenced in the file, 0 for none.
- `{"t":"edge","from":name,"to":name,"form":name}`: repo file `from` imports or re-exports repo file
  `to`. `form` is closed: `import`, `reexport`.

Output: `package` records, then `unused`, then `undeclared`, then `unknown`, then `summary`.
```
{"t":"package","package":"luxon","files":2,"statements":3,"refs":7,"forms":{"static":2,"type_only":1},"areas":{"shipped":2},"workspaces":["apps/web"],"carriers":0,"affected":2}
{"t":"unused","workspace":"apps/web","package":"left-pad"}
{"t":"undeclared","workspace":"apps/web","package":"zod"}
{"t":"unknown","file":"apps/api/main.py","spec":"yaml"}
{"t":"summary","imports":9,"ignored":2,"packages":3,"unused":1,"undeclared":1,"unknown":1}
```

## families

Checks the job mapping and forms families: a job in one runtime with two or more primaries.

Input:
- `pkg`: as in `sites`.
- `{"t":"runtime","workspace":name,"runtime":name}`: the runtime a workspace ships to (`browser:web`,
  `node:api`). Development dependencies always count under the runtime `tooling`.
- `{"t":"job","id":name,"name":name}`
- `{"t":"map","package":name,"job":name,"role":name,"extends":str}`: one job a package does. `role` is
  closed: `primary`, `complement`, `adapter`, `types`. `extends` names the primary it extends, `""` for a
  primary. A package may have one `map` per job.

Output: `problem` records, then `family` records, then `summary`.
```
{"t":"problem","kind":"unmapped","package":"left-pad","job":""}
{"t":"family","id":"F0001","job":"J01","runtime":"browser:web","primaries":["luxon","moment"],"attached":["moment-timezone"]}
{"t":"summary","packages":5,"mapped":4,"families":1,"problems":1}
```
`kind` is `unmapped`, `unknown_job` or `bad_extends`.

## pins

Works out, per app and per drop set, what else still needs a package and what removing it deletes.

Input:
- `{"t":"dep","from":name,"to":name,"kind":name}`: an edge of the resolved graph between instances
  written `name@version`. `kind` is closed: `prod`, `dev`, `peer`, `optional`, `peer_optional`.
- `{"t":"local","id":name}`: an instance that is a workspace of this repo.
- `{"t":"app","app":name,"root":name}`: a shipped app and its root instance.
- `{"t":"drop","app":name,"names":names}`: package names (no versions) to remove together: the loser
  plus its complements, adapters and types.
- `{"t":"size","app":name,"package":name,"initial":int,"lazy":int}`: attributed size, as `bytes`
  prints it.

Output: one `drop` record per `drop` input, in input order, then `summary`.
```
{"t":"drop","app":"web","names":["moment","moment-timezone"],"status":"pinned","pinned_by":["chartjs-adapter-moment@1.0.1"],"closure":[],"initial":0,"lazy":0}
{"t":"summary","drops":1,"gross":0,"pinned":1,"absent":0}
```
`status` is `gross`, `pinned` or `absent`.

## bytes

Decodes the source maps of a production build and attributes generated output to packages.

Input:
- `{"t":"chunk","app":name,"chunk":name,"initial":bool,"sources":strs,"mappings":str,"lines":ints}`:
  one output file. `sources` and `mappings` are copied from its source map. `lines` holds the length of
  each line of the output file in UTF-16 code units, the unit source-map columns count in.
- `{"t":"rename","alias":name,"package":name}`: a folder name under `node_modules` that installs another
  package (an `npm:` alias).

Output, per app in byte order: its `size` records, then its `app` record. Then `summary`.
```
{"t":"size","app":"web","package":"moment","initial":5120,"lazy":0,"copies":1}
{"t":"app","app":"web","total":10000,"first_party":4000,"unattributed":300,"coverage":"0.9700","pass":true}
{"t":"summary","apps":1,"chunks":2,"failed":0}
```

## verify --check coverage

Checks that the import extractor saw every file and every import a plain pattern sees.

Input:
- `{"t":"count","path":name,"workspace":name,"parser":int,"pattern":int}`: for one file, the import
  statements the parser found and the lines the count pattern matched.
- `{"t":"adjust","path":name,"reason":name}`: a file whose counts are known to disagree. Adjusted files
  leave every sum.
- `{"t":"tracked","path":name}`: a file version control tracks with an import-capable extension.
- `{"t":"exclude","path":name,"reason":name}`: a tracked file left out on purpose.

Output: `unlisted`, then `short`, then `adjusted`, then `workspace` records, then `summary`.
```
{"t":"unlisted","path":"apps/web/src/Card.vue"}
{"t":"short","path":"apps/web/src/a.ts","parser":3,"pattern":4}
{"t":"adjusted","path":"apps/api/gen.py","reason":"pattern matches import inside docstrings"}
{"t":"workspace","workspace":"apps/web","parser":40,"pattern":41,"covered":40,"coverage":"0.9756","pass":false}
{"t":"summary","files":12,"adjusted":1,"unlisted":1,"parser":90,"pattern":91,"covered":90,"coverage":"0.9890","adjusted_share":"0.0833","pass":false}
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
