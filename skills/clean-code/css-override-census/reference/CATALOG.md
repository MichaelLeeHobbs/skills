# The catalog: what is kept in the repo, and how a re-run uses it

## Where

Use `clean-code/` inside your agent's project configuration folder, or `.clean-code/` at the repo root if your agent has none. If a `clean-code/` folder already exists in another folder at the repo root, use that one; if two exist, stop and name both. This skill's files go in `clean-code/css-override-census/`; for a package scope, in `clean-code/css-override-census/<repo path of the package>/` (for example `clean-code/css-override-census/apps/web/`). Write this folder and the shared `clean-code/ledger.jsonl` and nothing else in the repo; never commit.

**Legacy folder.** On the first write, if `css-census/` exists beside `clean-code/` (or `.css-census/` at the repo root), copy the whole folder into the new home: catalogs, history and user-owned files. A legacy package subfolder named after a package goes to that package's repo path; if more than one could match, stop and name the candidates. Say in the report header that you copied it and that the user can delete the legacy folder. Never read the legacy folder again, and never delete it yourself.

## Run record

Replace `report.md` only after this run's own checks are done. Then append exactly one line to `clean-code/ledger.jsonl`, pass or fail:

```
{"skill":"css-override-census","scope":".","at":"2026-11-15T14:02:00Z","commit":"<full hash>","check":"pass","degraded":false,"metric":"important","value":<n>,"comparable":"mode=full;deep=<n>","report":"<path to report.md>"}
```

| Field | Value |
|---|---|
| `skill` | `css-override-census` |
| `scope` | `.` for the whole repo, else the package's repo-relative path with `/` separators |
| `at` | UTC time the run finished, `YYYY-MM-DDTHH:MM:SSZ` |
| `commit` | the full commit hash read at the start of the run, with `+dirty` appended if the working tree had changes; `none` without version control |
| `check` | `fail` if the report says the run failed; `partial` if any check line reads PARTIAL, UNCONFIRMED, not run, or user's word; otherwise `pass` |
| `degraded` | `false`, or the one missing thing: `browser`, `runtime-evidence`, `ci-history`, `build`, `parser`. This skill has no degraded mode (a missing parser stops it), so it always records `false` |
| `metric` | `important` |
| `value` | the `!important` count on the report's `!important` line, or `null` when the run stopped before the census of record |
| `comparable` | `mode=full` or `mode=degraded`, then `;` and this skill's fields sorted by key: `deep` (the `--deep` value passed to `census`) |
| `report` | repo-relative path of this run's `report.md` |

After appending, check that the file grew by exactly one line and that no earlier line changed. Order in the file does not matter.

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
