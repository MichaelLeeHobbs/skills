# The catalog: what is kept in the repo, and how a re-run uses it

## Where

A folder inside the target repo: the folder your agent already keeps project configuration in, with a
`reinvention/` folder under it (for example `.claude/reinvention/`), or `.reinvention/` at the repo root
if your agent has none. Use the same folder on every run; the report header names it.

The skill writes this folder and nothing else in the repo. It never commits.

## What goes in it

| File | Content | Sorted by |
|---|---|---|
| `rows.jsonl` | one line per function: the inventory fields from ROWS.md plus the described slots | `id` |
| `domains.jsonl` | the frozen domain list: `id`, `name`, `def`; append-only, IDs permanent | `id` |
| `mapping.jsonl` | `domain_in` string to domain ID | `value` |
| `nojob.jsonl` | domain IDs that get no job key (meaning "no input") | `domain` |
| `verdicts.jsonl` | judge and run results, each with the content hashes of the members it covers | group, member |
| `report.md` | the last report | |
| `history.jsonl` | one line per run: date, commit, rows, jobs implemented 2+ times | date |

Write every JSONL file sorted and one object per line, so a re-run's changes show as a readable diff.

**Never in the catalog:** the built tool, slices, worker outputs, harnesses, run output and anything else
temporary. Those live in a work folder outside the repo. Rebuild the tool from the spec and prove it
against the fixtures on every run.

## Re-running

1. Build and prove the tool (step 0). Enumerate and check coverage as on a first run (step 1).
2. Run `reuse` with the saved `rows.jsonl` as `old` records and this run's inventory as `new` records,
   using `id` and the content hash.
   - `reuse`: copy the saved slots to the new ID.
   - `changed` and `added`: describe these rows (step 2). Only these go to workers.
   - `removed`: drop the row.
3. Map only the new `domain_in` strings against the saved domain list (step 3). Add domains only through
   the reviewed unmatched list; never renumber.
4. Group as usual (step 4). Reuse a saved verdict only when every member hash it covers is unchanged and
   the group's membership is the same; judge every other group again.
5. Report the since-last-run line, list resolved groups (a group that lost all but one member), and add
   a line to `history.jsonl`. Replace the catalog files with this run's versions.

## Size

About 600 bytes per function: a 6,500-function package gives a `rows.jsonl` near 4 MB. If that is too
large to commit, keep `domains.jsonl`, `mapping.jsonl`, `nojob.jsonl` and `history.jsonl` (small, and
the part that keeps the metric comparable) and regenerate rows each run.
