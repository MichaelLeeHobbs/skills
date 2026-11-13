# The catalog: what is kept in the repo, and how a re-run uses it

## Where

A folder inside the target repo: the folder your agent already keeps project configuration in, with an
`asset-garden/` folder under it, or `.asset-garden/` at the repo root if your agent has none. Use the same
folder on every run; the report header names it and says whether version control ignores it.

The skill writes this folder and nothing else in the repo. It never commits.

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
