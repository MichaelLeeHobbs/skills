# Rows: what the inventory records

The parser writes `shape`, `field` and `binding` rows. Config workers write `config` rows. The record
layouts are in [CONTRACT.md](CONTRACT.md) under `keys`, `group` and `verify --check rows`; this file
says what goes in each field. Type, presence and nullability rules per language are in
[TYPES.md](TYPES.md).

## Shape

One row per declaration of a data shape in scope ([SCOPE.md](SCOPE.md)): an interface, an object type
alias, a schema-builder object (`z.object`, `yup.object`, `t.type`), a DTO class or record, a data
class, a pydantic model, a dataclass, a `TypedDict`, a struct with serialization tags, a spec schema
component.

| Field | Content |
|---|---|
| `id` | `path:line:name`, the line of the declaration |
| `side` | `client`, `server`, `shared` (a package both import), `spec` (a schema file) |
| `origin` | `hand` or `generated` |
| `bytes` | bytes of the declaration's source text |
| `importers` | number of files that import it (re-exports count as importers of the source) |
| `hash` | a content hash of the declaration's source with whitespace collapsed |

A schema builder and the type inferred from it are one shape: the builder is the row and the inferred
type is a derived alias.

## Field

One row per declared field, in declaration order (`pos` from 0). Inherited fields are rows of the
declaring parent only; the child shape gets an alias to its parent plus its own fields.

| Field | Content |
|---|---|
| `name` | the declared name |
| `alias` | the explicit wire name from an annotation, tag or option (`@JsonProperty("x")`, `@SerialName`, `Field(alias=...)`, `json:"x"`), else `""` |
| `type` | from the closed list, mapped as TYPES.md says |
| `presence`, `nullable`, `validated` | as TYPES.md says for the language |
| `enum` | for `enum`, the values as written on the wire: a constant's own wire-name annotation if it has one, else its declared name; `[]` otherwise |

## Binding

One row per place a shape is sent or received. Find them from route handlers (the declared return or
body type), client calls (`get<T>(url)`, a typed fetch wrapper, a query hook's type argument), message
publishers and consumers.

| Field | Content |
|---|---|
| `route` | `METHOD /path` with every path parameter written `{}` and the client's base prefix removed, or a topic name |
| `direction` | `request` (a body sent to the server), `response`, `event` (a message on a topic) |
| `role` | `produces` or `consumes` |
| `source` | `file:line` of the handler, call or publisher |

**One hop.** When a call goes through a wrapper or hook (`useResource<UserDto>('users')`, `useUser()`
whose body calls `get<UserDto>('/users/{}')`), follow it once to the URL and record the binding on the
shape. If the URL is built at run time beyond one hop, record no binding; the shape is still grouped by
stem and containment.

**Envelopes.** For a generic envelope (`Page<T>`, `ApiResponse<T>`, `ResponseEntity<T>`), bind the type
argument, not the envelope. An envelope bound directly to more than 25 routes is logged by `group` as a
wrapper.

## Config

Grep the repo for the files that configure serializers and validators: framework property files,
serializer builder code, global mapper or naming-policy setup, validation setup, class-level serializer
annotations, and the client's request and response interceptors. Give the list to config workers.

**Config worker brief.** Give each worker one batch of files and this brief, and nothing else from the
run:

> Read every file listed below in full. Return one JSON line per setting each file states, with `scope`,
> `setting`, `value`, `basis` and `source`. Settings and values: `naming` (identity, snake, upper_snake,
> kebab, lower_camel, upper_camel, lower), `inclusion` (always, non-null), `unknown_properties`
> (ignore, fail, strip), `unknown_enum` (fail, null, default), `date_write` (iso, epoch-s, epoch-ms).
> `scope` is `shape:<id>` for a setting on one class, or `path:<prefix>` for the source folder the
> setting governs. `source` is `file:line` of the line that states it. Report only what a line in these
> files states; `basis` is `stated`. If a framework default applies and the build file pins the
> framework version, you may report it with `basis` `documented-default`, citing the build file line.
> Never report a default you remember without that citation. Write the lines to `<batch>.out.jsonl` under
> a temporary name, then rename it when complete. Return one line: the batch ID and the row count.

A setting for which no worker returned a row stays `unknown`; `keys` reports it at scope `*`.

## Coverage count pattern

The coverage check compares, per file, how many candidate declarations the parser found before any were
excluded with how many a line pattern matches. The parser counts every declaration of the kinds the
pattern targets, then excludes the ones that are not data shapes with reason `not_a_shape`. Write a
`count` record for every file in scope.

| Language | Count a line when it matches |
|---|---|
| TypeScript, JavaScript | `^\s*(export\s+)?(declare\s+)?interface\s+[A-Za-z_$]`; `^\s*(export\s+)?type\s+[A-Za-z_$][\w$]*(<[^=]*>)?\s*=\s*\{`; `^\s*(export\s+)?const\s+[A-Za-z_$][\w$]*\s*=\s*(z\|yup\|t)\.(object\|type)\(` |
| Python | `^\s*class\s+\w+` |
| Java | `^\s*((public\|protected\|private\|static\|final\|abstract\|sealed)\s+)*(class\|record\|interface)\s+\w` |
| Kotlin | `^\s*((public\|internal\|private\|data\|open\|sealed\|abstract\|value)\s+)*(class\|interface\|object)\s+\w` |
| C# | `^\s*((public\|internal\|private\|protected\|sealed\|abstract\|partial\|static\|readonly)\s+)*(class\|record\|struct\|interface)\s+\w` |
| Go | `^\s*type\s+\w+\s+struct\b` |

In this table `\|` stands for a plain `|` (escaped for the table).

TypeScript classes are not in the pattern, so a file with DTO classes shows parser surplus, which the
check allows. A Python `class` inside a docstring is matched by the pattern; adjust that file with that
reason. For another language, write one pattern per declaration form before step 2 and list it in the
report. If you cannot write one, coverage cannot be checked and the run fails.
