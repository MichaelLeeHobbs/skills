# The catalog: what is kept in the repo, and how a re-run uses it

## Where

A folder named `component-reinvention/` inside the folder your agent keeps project configuration in (for
example `.claude/component-reinvention/`), or `.component-reinvention/` at the repo root if your agent has
none. If find-reinvention's `reinvention/` folder exists, put this folder beside it, never inside it, and
never write a file in it. Use the same folder on every run; the report header names it.

The skill writes this folder and nothing else in the repo. It never commits.

## What goes in it

| File | Content | Sorted by |
|---|---|---|
| `components.jsonl` | one line per component: the inventory fields and the described slots from ROWS.md | `id` |
| `adapters.jsonl` | one line per member and state: `id`, `hash`, `state`, `props` (data with the three markers only) | `id`, `state` |
| `verdicts.jsonl` | judge results with the hashes of the members they cover, and the last run's evidence for reading only | group, member |
| `states.jsonl` | the frozen state tables: class, state, payload | class, state |
| `report.md` | the last report | |
| `history.jsonl` | one line per run: date, commit, rows, families implemented 2+ times, visual proof rendered or not | date |

Write every JSONL file sorted and one object per line, so a re-run's changes show as a readable diff.
Never write payloads or adapters holding anything copied from real data (STATES.md "Payload rules").

**Never in the catalog:** screenshots, sheets, pixel files, the built tool, the harness, the build
configuration, the export, logs, environment values, and URLs with query strings. They live in the work
folder outside the repo. Rebuild the tool from the spec and prove it against the fixtures on every run.

## Re-running

1. Build and prove the tool (step 0). Enumerate and check coverage as on a first run (step 1).
2. Run `reuse` with the saved `components.jsonl` as `old` and this inventory as `new`, by `id` and `hash`.
   - `reuse`: copy the saved slots to the new ID.
   - `changed` and `added`: describe these rows (step 2). Only these go to workers.
   - `removed`: drop the row.
3. Group as usual (step 3). Reuse a saved SAME, VARIANT or DIFFERENT verdict and its look labels only
   when every member hash it covers is unchanged, the membership is the same and the state table is
   unchanged; judge every other group again.
4. Reuse an adapter only when its member's hash and its state's payload are unchanged.
5. Render every planned cell again. Never reuse evidence, captures or sheets: a theme or global style
   change leaves every component hash unchanged and still changes every render.
6. Report the since-last-run line, list resolved families, add a line to `history.jsonl`, and replace the
   catalog files with this run's versions.
