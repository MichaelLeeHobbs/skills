# The catalog: what is kept in the repo, and how a re-run uses it

## Where

A folder inside the target repo: the folder your agent already keeps project configuration in, with a
`vocabulary/` folder under it, or `.vocabulary/` at the repo root if your agent has none. Use the same
folder on every run; the report header names it. If a find-reinvention catalog sits beside it, read it
and never write it.

The skill writes this folder and nothing else in the repo. It never commits.

## What goes in it

| File | Content | Sorted by |
|---|---|---|
| `concepts.jsonl` | `id`, `name`, `def`, `test`, `canonical`, `ui_label`, `names` (sorted), `cells` (sorted `surface\|context` values its names occupy); IDs append-only and permanent | `id` |
| `mapping.jsonl` | `term`, `to` (a concept ID or `not-domain`), one line per pair | `term`, then `to` |
| `claims.jsonl` | every verified claim: `id`, `verdict`, `strength`, `names`, `relation`, `senses`, and `cites` as `{"path","text"}` (no line numbers) | `id` |
| `report.md` | the last report | |
| `history.jsonl` | one line per run: `date`, `commit`, `sites`, `terms`, `concepts`, `drifting` (concepts with two or more names judged SYNONYM), `homonyms` | `date` |

Write every JSONL file sorted and one object per line, so a re-run's changes show as a readable diff.
Never store sites, counts, samples or snippets: they are rebuilt each run and would churn on every
commit. Canary concepts and claims never enter the catalog.

**Never in the catalog:** the built tool, site records, tool outputs, snippets and anything else
temporary. Those live in a work folder outside the repo. Rebuild the tool from the spec and prove it
against the fixtures on every run.

## Re-running

1. Build and prove the tool (step 0). Inventory and check coverage as on a first run (step 1).
2. Run `terms`. Map only terms that are new or newly required against the saved concept list (step 2);
   add concepts with new IDs, never renumber. `verify --check map` over the saved and new mapping.
3. For each saved concept, compute its names and occupied cells from this run's mapping and `terms`
   output, and run `reuse` with the saved values as `old` and this run's as `new`.
   - `reuse`: resolve each saved cite to this run's site by `path` and `text`. If every cite resolves,
     keep the claim, with the cites rewritten to the new site IDs, and add those IDs to the candidate's
     picks for `verify --check evidence`. If any cite fails to resolve, rejudge.
   - `rejudge` and `added`: sample and judge as on a first run.
   - `removed`: drop the concept and its claims; list it under "Resolved since last run".
4. Report the since-last-run line and add a line to `history.jsonl`. Replace the catalog files with this
   run's versions.
