# The catalog: what is kept in the repo, and how a re-run uses it

## Where

Use `clean-code/` inside your agent's project configuration folder, or `.clean-code/` at the repo root if your agent has none. If a `clean-code/` folder already exists in another folder at the repo root, use that one; if two exist, stop and name both. This skill's files go in `clean-code/find-dependency-overlap/`; for a package scope, in `clean-code/find-dependency-overlap/<repo path of the package>/` (for example `clean-code/find-dependency-overlap/apps/web/`). Write this folder and the shared `clean-code/ledger.jsonl` and nothing else in the repo; never commit.

Ask the user once before the first write, naming the folder and the shared `clean-code/ledger.jsonl`. Use the same folder on every run; the report header names it.

**Legacy folder.** On the first write, if `dependency-overlap/` exists beside `clean-code/` (or `.dependency-overlap/` at the repo root), copy the whole folder into the new home: catalogs, history and user-owned files. A legacy package subfolder named after a package goes to that package's repo path; if more than one could match, stop and name the candidates. Say in the report header that you copied it and that the user can delete the legacy folder. Never read the legacy folder again, and never delete it yourself.

## Run record

Replace `report.md` only after this run's own checks are done. Then append exactly one line to `clean-code/ledger.jsonl`, pass or fail:

```
{"skill":"find-dependency-overlap","scope":".","at":"2026-11-15T14:02:00Z","commit":"<full hash>","check":"pass","degraded":false,"metric":"real_families","value":<n>,"comparable":"mode=full;apps=<measured apps>","report":"<path to report.md>"}
```

| Field | Value |
|---|---|
| `skill` | `find-dependency-overlap` |
| `scope` | `.` for the whole repo, else the package's repo-relative path with `/` separators |
| `at` | UTC time the run finished, `YYYY-MM-DDTHH:MM:SSZ` |
| `commit` | the full commit hash read at the start of the run, with `+dirty` appended if the working tree had changes; `none` without version control |
| `check` | `fail` if the report says the run failed; `partial` if any check line reads PARTIAL, UNCONFIRMED, not run, or user's word; otherwise `pass` |
| `degraded` | `false`, or the one missing thing: `browser`, `runtime-evidence`, `ci-history`, `build`, `parser`. This skill records `build` when no app was built, so every `Bundle` entry reads `not measured`, and otherwise `false` |
| `metric` | `real_families` |
| `value` | the integer on the report's `Families` line (the REAL count), or `null` when the run stopped before `families` and judging produced it |
| `comparable` | `mode=full` or `mode=degraded`, then `;` and this skill's fields sorted by key: `apps` (the measured apps, sorted and joined with `,`, or `none`) |
| `report` | repo-relative path of this run's `report.md` |

After appending, check that the file grew by exactly one line and that no earlier line changed. Order in the file does not matter.

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
