# The catalog: what is kept in the repo, and how a re-run uses it

## Where

A folder inside the target repo: the folder your agent already keeps project configuration in, with a
`dead-code/` folder under it, or `.dead-code/` at the repo root if your agent has none. Use the same
folder on every run; the report header names it.

The skill writes this folder and nothing else in the repo. It never commits, and it never edits the
repo's ignore file. The report warns before anyone commits it.

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
