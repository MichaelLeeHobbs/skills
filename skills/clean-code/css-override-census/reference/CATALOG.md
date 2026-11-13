# The catalog: what is kept in the repo, and how a re-run uses it

## Where

A `css-census/` folder inside the folder your agent already keeps project configuration in, or
`.css-census/` at the repo root if it has none. Use the same folder on every run; the report header
names it. The skill writes this folder and nothing else in the repo. It never commits.

## What goes in it

| File | Content | Sorted by |
|---|---|---|
| `prefixes.jsonl` | the judged `prefix` records, each with the library version and the cited file | `prefix` |
| `causes.jsonl` | `cause` records with `why`, each with the content hash of its rule's source line | `id` |
| `layers.jsonl` | the proposed `layer` and `assign` records | order, value |
| `report.md` | the last report | |
| `history.jsonl` | one line per run: date, commit, and every count in the `census` summary plus `layers` | date |

Write every JSONL file sorted, one object per line, so a re-run shows as a readable diff.

**Never in the catalog:** the built tool, the inventory, census output, slices and worker returns.
Those live in the work folder. Rebuild the tool from the spec and prove it on every run.

## Re-running

1. Build and prove the tool. Inventory and check coverage as on a first run.
2. Reuse `prefixes.jsonl` for every library whose installed version is unchanged. Judge again the
   libraries that changed version or are new.
3. Reuse a saved cause when the declaration id and the hash of its rule's source line are unchanged.
   Send only the rest to workers.
4. Propose layers again from this run's ladder; show the change from the saved `layers.jsonl`.
5. Write the since-last-run line from the previous `history.jsonl` entry, append this run's entry, and
   replace the other files with this run's versions.
