# Scope: what this skill covers and what it routes elsewhere

## Route first

Classify the repo before the inventory. Each row the repo has goes in the report's routing table with
the tool named for it. Routing never stops the run.

| Situation | Who covers it | What this skill does |
|---|---|---|
| A spec compared with an older version of itself (OpenAPI, protobuf, GraphQL, Avro) | the spec's breaking-change checker | nothing; name the checker in the routing table |
| A client generated from a spec, imported directly by the code | the compiler, once the client is regenerated | treats the generated types as the spec's consumer and as anchors for hand-written shadows |
| A running server against its spec | runtime contract testing or a spec-driven fuzzer | nothing |
| Protobuf and GraphQL schema files | their own tools (v1) | treats them as `spec` shapes only |
| Hand-written client copies of server DTOs | nobody | in scope |
| Per-feature copies of one shape inside one app | nobody | in scope |
| Hand-written shadows of a generated type | nobody | in scope, ranked first after BREAKING cells |
| A hand-kept spec against the server code it describes | nobody | in scope: the spec is a `spec` shape and the server shape outranks it as anchor |

## Hand-written, generated, derived

- **Hand-written** (`origin: hand`): a person maintains it.
- **Generated** (`origin: generated`): written by a code generator. Identify it by a generated-file
  header, a generator config that names its output folder, or a build step that writes it. Generated
  shapes are rows, so a hand-written copy can be compared with them, but a group of only generated
  shapes is dropped.
- **Derived**: built from another shape by the language, not written out: `Pick`, `Omit`, `Partial`,
  mapped and conditional types, `z.infer<typeof X>`, `typing.TypedDict` built from another class by
  inheritance alone. Record it as an alias of its source, never as a row. A derived shape that adds or
  overrides fields is a row with only those fields plus an alias.

## Excluded, counted by reason

Tests and test fixtures, stories, mocks, vendored and build output, declaration files of third-party
packages, and shapes used only inside one function. Each exclusion is counted in the header by reason.
