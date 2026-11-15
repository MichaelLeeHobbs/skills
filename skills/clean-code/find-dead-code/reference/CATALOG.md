# The catalog: what is kept in the repo, and how a re-run uses it

## Where

Use `clean-code/` inside your agent's project configuration folder, or `.clean-code/` at the repo root if
your agent has none. If a `clean-code/` folder already exists in another folder at the repo root, use that
one; if two exist, stop and name both. This skill's files go in `clean-code/find-dead-code/`; for a
package scope, in `clean-code/find-dead-code/<repo path of the package>/` (for example
`clean-code/find-dead-code/apps/web/`). Write this folder and the shared `clean-code/ledger.jsonl` and
nothing else in the repo; never commit. Never edit the repo's ignore file; the report warns before anyone
commits the folder.

**Legacy folder.** On the first write, if `dead-code/` exists beside `clean-code/` (or `.dead-code/` at
the repo root), copy the whole folder into the new home: catalogs, history and user-owned files. A legacy
package subfolder named after a package goes to that package's repo path; if more than one could match,
stop and name the candidates. Say in the report header that you copied it and that the user can delete
the legacy folder. Never read the legacy folder again, and never delete it yourself.

## Run record

Replace `report.md` only after this run's own checks are done. Then append exactly one line to
`clean-code/ledger.jsonl`, pass or fail:

```
{"skill":"find-dead-code","scope":".","at":"2026-11-15T14:02:00Z","commit":"<full hash>","check":"pass","degraded":false,"metric":"unused","value":<n>,"comparable":"mode=full;kinds=<k+k>;sources=<n>;windows=<kind:days+kind:days>","report":"<path to report.md>"}
```

| Field | Value |
|---|---|
| `skill` | `find-dead-code` |
| `scope` | `.` for the whole repo, else the package's repo-relative path with `/` separators |
| `at` | UTC time the run finished, `YYYY-MM-DDTHH:MM:SSZ` |
| `commit` | the full commit hash read at the start of the run, with `+dirty` appended if the working tree had changes; `none` without version control |
| `check` | `fail` if the report says the run failed; `partial` if any check line reads PARTIAL, UNCONFIRMED, not run, or user's word; otherwise `pass` |
| `degraded` | `false`, or the one missing thing: `browser`, `runtime-evidence`, `ci-history`, `build`, `parser`. Record `runtime-evidence` for a static-only run (no live evidence source was queried) |
| `metric` | `unused` |
| `value` | the UNUSED count on the report's `Candidates` line, or `null` when the run stopped before the second `join` produced it |
| `comparable` | `mode=full` or `mode=degraded`, then `;` and this skill's fields sorted by key: `kinds` (kinds in scope, sorted, joined by `+`), `sources` (number of qualified evidence sources, never their labels), `windows` (each kind's window floor as `kind:days`, sorted, joined by `+`). `mode=degraded` exactly when `degraded` is not `false` |
| `report` | repo-relative path of this run's `report.md` |

After appending, check that the file grew by exactly one line and that no earlier line changed. Order in
the file does not matter.

## What goes in it

| File | Content | Written by |
|---|---|---|
| `keep.jsonl` | one line per entry the owner keeps on purpose: `id`, `reason`, `review_by` (UTC date), sorted by `id` | the owner only; the skill reads it and proposes lines in the report |
| `history.jsonl` | one line per run: `date`, `commit`, `kinds`, the `summary` counts, and the ids per class (`unused`, `entry_unused`, `stuck`), sorted by date | the skill appends one line per completed run |
| `report.md` | the last report | the skill replaces it each run |

Write ids sorted and one object per line, so a re-run shows as a readable diff.

**Never in the catalog:** evidence counts, day totals, source labels tied to hosts or accounts, hostnames,
account IDs, query text, credentials, author names, the built tool, or anything else temporary. Those
stay in the work folder outside the repo.

## Why nothing is reused

find-reinvention reuses descriptions and verdicts when source is unchanged. This skill deliberately does
not: its evidence is a function of the clock and of other systems, so a verdict from last month says
nothing about today, even when no line of the repo changed. Every run queries again and joins from
scratch. What carries over is what does not expire: the owner's keeps and the history.

## Re-running

1. Build and prove the tool (step 0).
2. Read `keep.jsonl`: each line becomes a `keep` record (`id`, `review_by`). An expired keep no longer
   blocks a verdict; the summary counts it, and the report asks the owner to renew or drop it. A keep
   whose id no entry has is counted orphan: the entry is gone or its key changed.
3. Read the last line of `history.jsonl`: each id in its `unused` list becomes a `prior` record. The tool
   marks a now-LIVE entry `revived`, and the header prints "Earlier UNUSED claims overturned". A
   non-zero count means an earlier finding was wrong; say which and why in the report (a window too
   short, a missing source, a rewrite the key rule missed).
4. Run steps 1 to 5 as usual, then append the new history line and replace `report.md`.

A history file that does not parse is a run failure, not a first run. No history file is a first run:
the header says "prior: none".
