# The ledger: what is kept in the repo, and how a re-run uses it

## Where

A folder inside the target repo: the folder your agent already keeps project configuration in, with a
`debt-ledger/` folder under it, or `.debt-ledger/` at the repo root if your agent has none. Use the same
folder on every run; the report header names it.

The skill writes this folder and nothing else in the repo. It never commits.

## What goes in it

| File | One line per | Fields | Sorted by |
|---|---|---|---|
| `items.jsonl` | item | `path`, `line`, `kind`, `rule`, `linter`, `scope`, `hash`, `ordinal`, `dated`, `first_seen`, `owner` | `path`, `kind`, `rule`, `hash`, `ordinal` |
| `baselines.jsonl` | baseline entry | `source`, `linter`, `unit`, `path`, `rule`, `count` | `source`, `path`, `rule` |
| `ruleoffs.jsonl` | rule-off | `source`, `rule` | `source`, `rule` |
| `patterns.jsonl` | strict pattern | `kind`, `lang`, `text` | `kind`, `lang`, `text` |
| `history.jsonl` | run | the `tally` `history` record, plus `ledger_committed` (`true`, `false` or `unknown`) | date |
| `report.md` | | the last report | |

Write every JSONL file sorted, one compact object per line, so a re-run's changes show as a readable diff.

**Never in the ledger:** comment text, blame output, author names or emails, the built tool, canaries,
and anything else temporary. The hash identifies an item without its text, so a token or hostname left in
a comment is not copied into a second file.

## Re-running

1. Build and prove the tool (step 0). Inventory and check coverage as on a first run (steps 2 and 3).
2. Feed `items.jsonl` to `reuse` as `old` records. Only `redate` and `added` items are blamed.
3. Feed `baselines.jsonl` to `baseline` as `old` entries, and the inline counts per linter, path, rule and
   scope taken from `items.jsonl` as each `inline` record's `old`.
4. Feed the last line of `history.jsonl` to `tally` as `last` and `lastsource` records.
5. Replace `items.jsonl`, `baselines.jsonl`, `ruleoffs.jsonl`, `patterns.jsonl` and `report.md` with this
   run's versions, and append this run's `history` line.

If the ledger's spec version or pattern set differs from this run's, `tally` reports the trend as not
comparable. Say why in the header. To bridge a pattern change, run `tally` a second time over this run's
items found with the old pattern set, and report both.

## Size

About 250 bytes per item: 25,000 items give an `items.jsonl` near 6 MB. If that is too large to commit,
keep `history.jsonl`, `patterns.jsonl` and `baselines.jsonl` (small, and the part that keeps the trend
comparable). Without `items.jsonl` every item is `added` on the next run and is dated by blame again.
