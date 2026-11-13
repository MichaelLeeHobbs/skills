# Proving a drift

## Evidence ladder

Each judged cell gets one `evidence` record with a verdict (CONFIRMED, REFUTED, BLOCKED) and a basis,
strongest first:

| Basis | What ran | May be CONFIRMED |
|---|---|---|
| `run` | the producer shape serialized by its real serializer in the bare runtime, then parsed by a copy of the consumer's validator or checked against the consumer's type | yes, any kind |
| `typecheck` | two shapes in one language checked against each other (`declare const a: A; const b: B = a;`), or a consumer type checked against a `run` output | static kinds; config kinds only when its class also ran |
| `sample` | a payload built by hand from the cited config lines, then parsed or type-checked by the consumer | no; report it as "predicted from config at file:line; consumer rejects it" |
| `diffed` | nothing ran; the judge cited the deciding line on both sides | no; static kinds only |
| `uncited` | a cell in a group nobody judged | no |

**Static kinds** (`MISSING`, `EXTRA`, `PRESENCE`, `NULLABILITY`, `TYPE`, `ENUM_VALUES`) follow from the
declarations. **Config kinds** (`WIRE_NAME`, `ENUM_SPELLING`, `FORMAT`, `WIDTH`) depend on what the
serializer does, so only a producer `run` confirms them. `verify --check evidence` enforces both rules.

- **CONFIRMED**: the run produced the cell's difference.
- **REFUTED**: the run contradicted it. The run wins: report the cell as refuted, not as drift.
- **BLOCKED**: not run, with the reason (the serializer needs the framework running, a profile cannot be
  resolved, a validator cannot be copied). Keep the cell, labelled with its basis.

A config kind whose only support is a `sample` or a `documented-default` setting is BLOCKED. The header
counts those cells separately.

## Proof classes

Group cells into classes of (kind, producer config scope, consumer validator or type checker, the two
types). One harness proves a class. Run at most 30 classes plus every canary. Classes past the cap are
BLOCKED and counted. Put every type check in one batched file. Each evidence record names its class, and
each class whose harness ran gets one `run` record.

## The harness

Do this in a fresh context, or hand it to a worker with this file and the class list.

1. In the work folder, write one throwaway harness per class, never in the repo. Copy in the producer
   shape, the consumer shape or validator, and the serializer setup the cited config lines describe,
   renaming copies so they cannot collide.
2. Build one producer instance per input class: every enum value, `null` in each nullable field, each
   optional field absent, a long past 2^53 for a width cell, a fixed instant (`2026-03-08T07:30:00Z`) for
   a date cell.
3. Serialize with the real serializer library the repo already has installed, read only, in the bare
   runtime: no test runner, no framework start, no install. If the serializer needs the framework to
   build it, the class's basis is `sample`.
4. Parse the output with the copied consumer validator, or type-check it against the consumer type.
5. Turn network access off for the harness process if the platform lets you; if it does not, say so in
   the report header.
6. Never start the application, its servers or its database, and never run code that is not a copied
   shape, validator or serializer setup.

## Output

For each class, one table: rows are input instances, columns are the producer output and the consumer
result, each cell the exact text with invisible characters shown. Mark each cell `run` or `predicted`.
Then write the `evidence` records.
