# The catalog: what is kept in the repo, and how a re-run uses it

## Where

Use `clean-code/` inside your agent's project configuration folder, or `.clean-code/` at the repo root if
your agent has none. If a `clean-code/` folder already exists in another folder at the repo root, use
that one; if two exist, stop and name both. This skill's files go in `clean-code/type-rhythm/`; for a
package scope, in `clean-code/type-rhythm/<repo path of the package>/` (for example
`clean-code/type-rhythm/apps/web/`). Write this folder and the shared `clean-code/ledger.jsonl` and
nothing else in the repo; never commit. The report header names the folder.

**Legacy folder.** On the first write, if `type-rhythm/` exists beside `clean-code/` (or `.type-rhythm/`
at the repo root), copy the whole folder into the new home: catalogs, history and user-owned files. A
legacy package subfolder named after a package goes to that package's repo path; if more than one could
match, stop and name the candidates. Say in the report header that you copied it and that the user can
delete the legacy folder. Never read the legacy folder again, and never delete it yourself.

## What goes in it

| File | Content | Sorted by |
|---|---|---|
| `plan.jsonl` | `screen` (route patterns only), `viewport`, `variant`, `exclude`, `routes` records | type, then identifying field |
| `scale.jsonl` | `scale` records | kind, viewport, value |
| `sources.md` | where each scale step, marker and role-map seed came from (file and line) | |
| `rolemap.jsonl` | `rolemap` records | `site` |
| `exceptions.jsonl` | `exception` records: deliberate off-scale uses, each with a reason | `site` |
| `tally.jsonl` | the last `tally` output, as printed | as printed |
| `report.md` | the last report | |
| `history.jsonl` | one line per run: date, commit, mode, sizes in use, sizes off, spacing off, unassigned share | date |

Write every JSONL file one object per line, sorted as listed, so a re-run's changes show as a readable
diff.

**Never in the catalog:** capture files, example parameters, concrete URLs, page text, screenshots, the
built tools or any other temporary file. Those stay in the work folder.

## Re-running

1. Build and prove the tools (step 0).
2. Read `plan.jsonl`, then re-read the router and show the user the routes added or removed since.
3. Reuse `scale.jsonl` unless the scale sources changed; reuse `rolemap.jsonl` and `exceptions.jsonl`.
   Run the pilot only for screens new since the last run.
4. Capture, check, tally as usual. Report the since-last-run line from `history.jsonl`, and list stale
   exceptions so the user can drop them.
5. Replace `tally.jsonl` and `report.md`, append to `history.jsonl`.

## Run record

Replace `report.md` only after this run's own checks are done. Then append exactly one line to
`clean-code/ledger.jsonl`, pass or fail:

```
{"skill":"type-rhythm","scope":".","at":"2026-11-15T14:02:00Z","commit":"<full hash>","check":"pass","degraded":false,"metric":"sizes_off","value":<n>,"comparable":"mode=full;plan=<plan hash>;scale=<scale hash>","report":"<path to report.md>"}
```

| Field | Value |
|---|---|
| `skill` | `type-rhythm` |
| `scope` | `.` for the whole repo, else the package's repo-relative path with `/` separators |
| `at` | UTC time the run finished, `YYYY-MM-DDTHH:MM:SSZ` |
| `commit` | the full commit hash read at the start of the run, with `+dirty` appended if the working tree had changes; `none` without version control |
| `check` | `fail` if the report says the run failed; `partial` if any check line reads PARTIAL, UNCONFIRMED, not run, or user's word; otherwise `pass` |
| `degraded` | `false`, or the one missing thing: `browser`, `runtime-evidence`, `ci-history`, `build`, `parser`. A static-tier run (`Mode: static`) records `browser`; the Full and Capped tiers record `false` |
| `metric` | `sizes_off` |
| `value` | the off-scale count on the report's `Sizes` line (`Sizes: ... <n> off-scale`) |
| `comparable` | `mode=full` or `mode=degraded`, then `;` and this skill's fields sorted by key: `plan` (the first 12 hex characters of the sha256 of this run's `plan.jsonl`; `none` in a static run), `scale` (the same for `scale.jsonl`; `none` in distribution mode). A static run's `comparable` starts with `mode=degraded` |
| `report` | repo-relative path of this run's `report.md` |

After appending, check that the file grew by exactly one line and that no earlier line changed. Order in
the file does not matter.
