# The catalog: what is kept in the repo, and how a re-run uses it

## Where

Use `clean-code/` inside your agent's project configuration folder, or `.clean-code/` at the repo root if
your agent has none. If a `clean-code/` folder already exists in another folder at the repo root, use
that one; if two exist, stop and name both. This skill's files go in `clean-code/asset-garden/`; for a
package scope, in `clean-code/asset-garden/<repo path of the package>/` (for example
`clean-code/asset-garden/apps/web/`). Write this folder and the shared `clean-code/ledger.jsonl` and
nothing else in the repo; never commit. The report header names the folder and says whether version
control ignores it.

**Legacy folder.** On the first write, if `asset-garden/` exists beside `clean-code/` (or `.asset-garden/`
at the repo root), copy the whole folder into the new home: catalogs, history and user-owned files. A
legacy package subfolder named after a package goes to that package's repo path; if more than one could
match, stop and name the candidates. Say in the report header that you copied it and that the user can
delete the legacy folder. Never read the legacy folder again, and never delete it yourself.

## What goes in it

| File | Content | Sorted by |
|---|---|---|
| `keep.jsonl` | deliberate keeps: `path`, `reason`, `date`; fed to `refs` as `keep` records | `path` |
| `vocab.jsonl` | the frozen meaning vocabulary; append-only | `meaning` |
| `labels.jsonl` | `sha` (or package export), `icon`, `meanings`, `date` | `sha` |
| `history.jsonl` | one line per run: date, commit, candidates, confirmed unused, groups per tier, mixed meanings | `date` |
| `report.md` | the last report | |
| `appendix.md` | the last run's finding rows and verdicts, blocked rows, patterns, label sample results | |

Write every JSONL file sorted, one object per line, so a re-run's changes read as a diff.

**Never in the catalog:** perceptual hashes, renders, the built tool, row files, raw log lines, URLs with
query strings, absolute paths, people's names or email addresses, or raw usage-context text. Before
saving, search the folder for `@`, an IP address pattern, `token=` and absolute path prefixes. Any match
fails the run until it is removed.

## Re-running

1. Build and prove the tool, inventory and measure as on a first run. Nothing measured is reused.
2. Feed `keep.jsonl` to `refs`. A keep whose path no longer exists is dropped and listed in the report.
3. Reuse a label when its `sha` matches; label only new or changed icons.
4. Report the change since the last `history.jsonl` line, then append this run's line.

## Run record

Replace `report.md` only after this run's own checks are done. Then append exactly one line to
`clean-code/ledger.jsonl`, pass or fail:

```
{"skill":"asset-garden","scope":".","at":"2026-11-15T14:02:00Z","commit":"<full hash>","check":"pass","degraded":false,"metric":"unused_confirmed","value":<n>,"comparable":"mode=full;passes=<passes run>","report":"<path to report.md>"}
```

| Field | Value |
|---|---|
| `skill` | `asset-garden` |
| `scope` | `.` for the whole repo, else the package's repo-relative path with `/` separators |
| `at` | UTC time the run finished, `YYYY-MM-DDTHH:MM:SSZ` |
| `commit` | the full commit hash read at the start of the run, with `+dirty` appended if the working tree had changes; `none` without version control |
| `check` | `fail` if the report says the run failed; `partial` if any check line reads PARTIAL, UNCONFIRMED, not run, or user's word; otherwise `pass` |
| `degraded` | `false`, or the one missing thing: `browser`, `runtime-evidence`, `ci-history`, `build`, `parser`. A run with the removal build off (`removal build no` on the Passes line) records `build` |
| `metric` | `unused_confirmed` |
| `value` | the unused confirmed count on the report's `Findings` line |
| `comparable` | `mode=full` or `mode=degraded`, then `;` and this skill's fields sorted by key: `passes` (the passes the Passes line marks `yes`, named `build`, `recording`, `near`, `size` and `icons` for removal build, recording, near duplicates, size and icons, sorted and joined with `+`, for example `icons+near+size`; `none` if no pass ran). A run with the removal build off starts with `mode=degraded` |
| `report` | repo-relative path of this run's `report.md` |

After appending, check that the file grew by exactly one line and that no earlier line changed. Order in
the file does not matter.
