# The catalog: what is kept in the repo

## Where

A folder inside the target repo: the folder your agent already keeps project configuration in, with a
`token-drift/` folder under it, or `.token-drift/` at the repo root if your agent has none. Use the same
folder on every run; the report header names it. The skill writes this folder and nothing else in the
repo, and never commits.

## What goes in it

| File | Content | Sorted by |
|---|---|---|
| `config.jsonl` | data only: syntaxes detected, token sources, `--root-px`, surface token names, scopes, exclusions | kind, then value |
| `decisions.jsonl` | `cat`, `value`, `scope` (a path prefix, `""` for everywhere), `action`, `token`, `intent`, `cite`, `date`; the team edits these rows | cat, value, scope |
| `values.jsonl` | `old` records (`cat`, `value`, `uses`, `anchor`) from this run's `value` records | cat, value |
| `history.jsonl` | one line per run: date, commit, sweep hits, per-category values, uses, token values, drift and matched counts, REFUTED count | date |
| `report.md` | the last report | |

Write every JSONL file sorted, one object per line, so a re-run's changes read as a diff. `values.jsonl`
stays small (one line per distinct value, a few hundred lines on a large app).

**Never in the catalog:** the built tool, source copies, occurrence records, the per-line change list,
canary files and anything else temporary. Those live in the work folder. Rebuild the tool from the spec
and prove it against the fixtures on every run.

## Re-running

1. Build and prove the tool. Start setup from `config.jsonl` and say what changed in the header.
2. Extract and prove the inventory as on a first run. Occurrences are always re-extracted.
3. Run `cluster`, then `diff` with `values.jsonl` as `old` records and the new `value` records. The report
   lists added and removed values, and values whose anchor changed.
4. Apply `decisions.jsonl` before judging; judge only values without a decision, and KEEP rows whose
   anchor changed.
5. Compare with the last `history.jsonl` line. A headline that moved while the sweep hit count stayed flat
   points at an extractor change, not a code change: say so in the header.
6. Replace `values.jsonl`, `report.md` and `config.jsonl`, append to `history.jsonl`, and add this run's
   accepted decisions to `decisions.jsonl` without removing the team's rows.
