# The ledger: what is kept in the repo, and how a re-run uses it

## Where

Use `clean-code/` inside your agent's project configuration folder, or `.clean-code/` at the repo root if your agent has none. If a `clean-code/` folder already exists in another folder at the repo root, use that one; if two exist, stop and name both. This skill's files go in `clean-code/debt-ledger/`; for a package scope, in `clean-code/debt-ledger/<repo path of the package>/` (for example `clean-code/debt-ledger/apps/web/`). Write this folder and the shared `clean-code/ledger.jsonl` and nothing else in the repo; never commit.

**Two different ledgers.** In this skill, "the ledger" always means this skill's own catalog: the files in `clean-code/debt-ledger/` listed below. The shared `clean-code/ledger.jsonl` one folder up is the run record every clean-code skill appends to (see Run record). It is not part of this ledger: never read it as `history.jsonl`, never feed it to `reuse`, `baseline` or `tally`, and never name a catalog file `ledger.jsonl`.

**Legacy folder.** On the first write, if `debt-ledger/` exists beside `clean-code/` (or `.debt-ledger/` at the repo root), copy the whole folder into the new home: catalogs, history and user-owned files. A legacy package subfolder named after a package goes to that package's repo path; if more than one could match, stop and name the candidates. Say in the report header that you copied it and that the user can delete the legacy folder. Never read the legacy folder again, and never delete it yourself.

## Run record

Replace `report.md` only after this run's own checks are done. Then append exactly one line to `clean-code/ledger.jsonl`, pass or fail:

```
{"skill":"debt-ledger","scope":".","at":"2026-11-15T14:02:00Z","commit":"<full hash>","check":"pass","degraded":false,"metric":"blanket","value":<n>,"comparable":"mode=full;patterns=<64 hex>;spec=1","report":"<path to report.md>"}
```

| Field | Value |
|---|---|
| `skill` | `debt-ledger` |
| `scope` | `.` for the whole repo, else the package's repo-relative path with `/` separators |
| `at` | UTC time the run finished, `YYYY-MM-DDTHH:MM:SSZ` |
| `commit` | the full commit hash read at the start of the run, with `+dirty` appended if the working tree had changes; `none` without version control |
| `check` | `fail` if the report says the run failed; `partial` if any check line reads PARTIAL, UNCONFIRMED, not run, or user's word; otherwise `pass` |
| `degraded` | `false`, or the one missing thing: `browser`, `runtime-evidence`, `ci-history`, `build`, `parser`. None of these applies to this skill (running without version control only leaves ages `unknown`, which the header already says), so it always records `false` |
| `metric` | `blanket` |
| `value` | the integer on the report's Headline `Blanket` line, or `null` when the run stopped before `tally` |
| `comparable` | `mode=full` or `mode=degraded`, then `;` and this skill's fields sorted by key: `patterns` (the pattern-set hash in this run's `tally` `history` record), `spec` (the spec version passed to `tally`) |
| `report` | repo-relative path of this run's `report.md` |

After appending, check that the file grew by exactly one line and that no earlier line changed. Order in the file does not matter. This line is separate from the `history.jsonl` line the Re-running steps append to the ledger: write both.

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
