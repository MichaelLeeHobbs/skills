# The catalog: what is kept in the repo, and how a re-run uses it

## Where

A folder inside the target repo: the folder your agent already keeps project configuration in, with a
`dependency-overlap/` folder under it, or `.dependency-overlap/` at the repo root if your agent has none.
Ask the user before the first write and use the same folder on every run; the report header names it.
The skill writes this folder and nothing else in the repo. It never commits.

## What goes in it

| File | Content | Sorted by |
|---|---|---|
| `jobs.jsonl` | the job list: `id`, `name`, `def`; append-only, IDs permanent | `id` |
| `packages.jsonl` | one line per map: `package`, `job`, `role`, `extends`, `mapped_at` (commit) | `package`, `job` |
| `verdicts.jsonl` | per family: verdict, keeper, losers, the coverage matrix and translation table, the run results, and the package versions they were judged at | family job, runtime |
| `history.jsonl` | one line per run: date, commit, the set of apps measured, families, REAL families, and per loser its files, refs and gross units | date |
| `report.md` | the last report | |

Write every JSONL file sorted, one object per line, so a re-run's changes show as a readable diff. Never
write tool outputs, extractor output, build output, canaries or harnesses here; they stay in the work
folder.

## Re-running

1. Build and prove the tool (step 0), take a fresh inventory and run `sites` (steps 1 and 2) as on a
   first run.
2. Load `jobs.jsonl` and `packages.jsonl` as the mapping. Map only packages with no line, plus any whose
   major version changed since `mapped_at`. The catalog wins over the seed in JOBS.md.
3. Run `families`. Reuse a saved verdict only when the family's primaries are the same and no primary
   changed major version; judge every other family again.
4. Re-measure every approved app; sizes are never reused.
5. Compare with history only runs whose set of measured apps is the same; otherwise say the bundle
   figures are not comparable. A family whose loser has no sites left is resolved: list it under "since
   last run".
6. Append one line to `history.jsonl` and replace the other files with this run's versions.
