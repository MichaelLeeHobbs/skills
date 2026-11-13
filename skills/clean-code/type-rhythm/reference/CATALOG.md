# The catalog: what is kept in the repo, and how a re-run uses it

## Where

A folder inside the target repo: the folder your agent already keeps project configuration in, with a
`type-rhythm/` folder under it, or `.type-rhythm/` at the repo root if your agent has none. Use the same
folder on every run; the report header names it. The skill writes this folder and nothing else in the
repo. It never commits.

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
