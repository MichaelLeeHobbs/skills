---
name: find-contract-drift
disable-model-invocation: true
description: >-
  Use for "find DTO drift", "client and server types disagree", "are our interfaces in sync with the
  API", "compare duplicate schemas", "which copies of User differ", "audit contract drift", "re-run the
  contract drift audit". Finds hand-written copies of one data shape (DTO, interface, schema, model) on
  client and server or across features whose fields drifted apart: renamed, optional on one side,
  nullable, different types, widths, date formats or enum values. Proves each drift with a
  field-by-field table and a run where one is possible, and keeps a catalog in the repo for re-runs.
  Expensive and user-invoked. NOT for comparing a spec with an older version of itself (use a spec
  breaking-change checker), a generated client against its own spec (the compiler covers that),
  runtime contract testing, a pull-request review, or fixing the copies.
---

# Find contract drift

Find every data shape a repo defines more than once, show field by field where the copies disagree on
the wire, and rank what breaks. A shared name or field overlap proposes a group; the parsed definitions,
the serializer config and a run decide it.

**What it writes.** In the target repo, only its catalog folder ([reference/CATALOG.md](reference/CATALOG.md)).
It edits no code and commits nothing. Everything temporary goes in a work folder outside the repo.

## Prerequisites

Stop before any cost and say which is missing:
- You can run commands and write files.
- Every in-scope language has a parser you can drive (compiler API, tree-sitter grammar, AST module).
  A language without one fails the run unless the user excludes it at the budget approval; the header
  then names it and its producers show as `unparsed producer`.

**Where code goes.** Source goes only to the model provider you already use. Proof uses copied shapes and
copied serializer setup in the bare runtime. Never start the application, call an endpoint or open a
database.

## Roles

You coordinate. You hold the plan and the tool's counts, never the rows: the tool reads and writes the
row files. Start each step from the tool's output with a fresh context. A cheaper model is enough for
extracting config rows; judging needs the most capable model available to you. With one model, use it
for everything. Start workers in waves no larger than your agent's limit on concurrent work. If you
cannot start fresh contexts, continue in one and say in the report header that steps and calibration
passes were not independent.

## 0. Build and prove the tool

The tool does what a model must not do for itself: resolving config scopes, wire names, grouping, the
field diff and its direction table, verdict reuse, the checks and the report's counts. Pick a runtime.
Implement [reference/ALGORITHM.md](reference/ALGORITHM.md) to satisfy
[reference/CONTRACT.md](reference/CONTRACT.md) in the work folder. Run every fixture in
`reference/fixtures/`. **If any fixture fails, stop and report which.** Never edit a fixture to make it
pass, and never continue with a partly passing tool.

## 1. Route and pin

Record the commit and read all source at that commit for the whole run. Classify the repo with
[reference/SCOPE.md](reference/SCOPE.md): what is hand-written, generated or derived, and which parts an
existing tool covers better. Routing sets the scope that coverage counts; it never stops the run. If
nothing is left in scope, the canaries still run and the header says "real inventory empty".

## 2. Inventory

Enumerate with the parser, following [reference/ROWS.md](reference/ROWS.md) and
[reference/TYPES.md](reference/TYPES.md): one `shape` row per declaration, one `field` row per field,
one `binding` row per route or topic a shape is sent or received on (follow one hop through a wrapper or
hook). Derived shapes are aliases, not rows. Count exclusions by reason.

Grep the candidate config files and give them to config workers with the brief in ROWS.md: one `config`
row per scope and setting, each citing `file:line`. A setting the repo does not state is `unknown`, or a
labelled `documented-default`; never a remembered framework default.

Run `verify --check rows` and `verify --check coverage` (shape declarations per file against the count
pattern). Both must pass.

## 3. Canaries and budget

Plant the canaries (see Check) in the work folder and write their expected results to
`canaries.expected` before any tool pass. Inventory them the same way; keep their shape IDs in a separate
list.

Estimate judge and proof cost from the real counts: tokens per call times the provider's published
price. Show it, get one approval and a cap (default 1.25 times the estimate). If you cannot see real
spend, enforce the cap in tokens and label spend estimated. Reaching the cap stops the run cleanly; it
resumes from the work folder.

## 4. Keys, groups and diff

Run `keys` (effective settings, match keys, wire keys), `group`, then `verify --check groups`; it must
pass. Run `diff` with the `accept` records from the catalog, then `reuse` against the saved verdicts.
Every cell has a kind and a direction (BREAKING, LATENT, LOOSE, DISAGREE, UNRESOLVED); LATENT and LOOSE
cells are only counted.

## 5. Judge

Calibrate, then judge from source as [reference/JUDGE.md](reference/JUDGE.md) describes, every group
whose `gdiff` says `judge: true` and that `reuse` did not reuse, in rank order under the cap. The judge
gives each member SAME_CONTRACT, PROJECTION or DIFFERENT and each cell REAL or TRANSFORMED, citing the
deciding lines on both sides. Only source decides a verdict.

## 6. Prove

Prove by class as [reference/PROVE.md](reference/PROVE.md) describes: a producer serialized by its real
serializer and parsed by a copy of the consumer is `run`; weaker bases never confirm a config kind. Then
run `verify --check evidence`; it must pass.

## 7. Report and save the catalog

Run `tally`. Write the report as [reference/REPORT.md](reference/REPORT.md) lays out, every number from
tool output, and the catalog files as CATALOG.md lists them. Hand back the report path, header and
decision list.

## Check

Plant seven canaries in one folder that mirrors the repo's client and server paths, in the repo's own
languages, each with its own producer, consumer, binding and config scoped to its shapes:

| # | Plant | Expected |
|---|---|---|
| 1 | Bound response; producer field with an explicit snake_case alias; consumer field camelCase and optional | `WIRE_NAME` BREAKING, judged REAL |
| 2 | Bound response; producer enum with one extra value; consumer parses a list; a decoy mapper beside it that maps another field | `ENUM_VALUES` BREAKING, REAL, never TRANSFORMED citing the decoy |
| 3 | Bound response; producer `postalCode`, consumer optional `zip`, the only unmatched strings; names share no stem | grouped by binding; rename candidate; REAL |
| 4 | Unbound client copy of a real shape with 5 to 12 fields (a generated one if the repo has any), named to share no stem, at least 5 non-stop fields, one nullability in an uncommon spelling (`.nullish()`, `T \| undefined`, `Optional[T]`) | grouped by containment; `NULLABILITY` DISAGREE |
| 5 | Producer field nullable under a shape-scoped non-null inclusion; consumer `T \| null`, required | `PRESENCE` BREAKING, not `NULLABILITY` BREAKING |
| 6 | Negative: producer `createdAt` under a shape-scoped snake strategy; consumer `created_at` | no cell |
| 7 | Negative: a response consumer declaring five aligned fields of a larger producer, `unknown_properties` `ignore` | only LOOSE cells; `gdiff` `judge: false` |

At planting, probe once whether the producer's serializer runs in the bare runtime: the expected
evidence basis is then `run`, otherwise `sample`. A canary consumer uses the repo's validator library if
it has one, otherwise a static type with expected basis `typecheck`. The judge never sees canaries during
calibration. Canary rows stay out of coverage, `tally`, the decision list and the catalog.

**The run fails**, and the report says so above the header, when any of these happens:
- a canary's grouping, kind, direction, verdict or evidence basis differs from `canaries.expected`, or a
  positive canary's cell does not show in its proof;
- any `verify` check fails at its step;
- none of the top 10 BREAKING cells has evidence beyond `uncited` although at least one was provable;
- a group holding an UNRESOLVED, BLOCKED or `uncited` cell is reported as clean;
- the user supplied a list of known drifts and one is missing from every group (name the step that lost
  it).

A run that could not perform one of these checks has failed it.

## Fallbacks

- **No parallel work:** run the same steps one group or proof class at a time. The work folder is the
  progress record: a step is done when its output passes `verify`, so a stopped run resumes by asking the
  tool what is missing.
- **No validator library on the consumer side:** prove with a type check (`typecheck`).
- **No type checker either:** static kinds are `diffed`; config kinds are BLOCKED.
- **Producer serializer cannot run in the bare runtime:** the basis is `sample`, never CONFIRMED.
