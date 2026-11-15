# The catalog: what is kept in the repo

## Where

Use `clean-code/` inside your agent's project configuration folder, or `.clean-code/` at the repo root if
your agent has none. If a `clean-code/` folder already exists in another folder at the repo root, use that
one; if two exist, stop and name both. This skill's files go in `clean-code/find-token-drift/`; for a
package scope, in `clean-code/find-token-drift/<repo path of the package>/` (for example
`clean-code/find-token-drift/apps/web/`). Write this folder and the shared `clean-code/ledger.jsonl` and
nothing else in the repo; never commit.

**Legacy folder.** On the first write, if `token-drift/` exists beside `clean-code/` (or `.token-drift/`
at the repo root), copy the whole folder into the new home: catalogs, history and user-owned files. A
legacy package subfolder named after a package goes to that package's repo path; if more than one could
match, stop and name the candidates. Say in the report header that you copied it and that the user can
delete the legacy folder. Never read the legacy folder again, and never delete it yourself.

## Run record

Replace `report.md` only after this run's own checks are done. Then append exactly one line to
`clean-code/ledger.jsonl`, pass or fail:

```
{"skill":"find-token-drift","scope":".","at":"2026-11-15T14:02:00Z","commit":"<full hash>","check":"pass","degraded":false,"metric":"drifted_values","value":<n>,"comparable":"mode=full;root=<n>;syntaxes=<list>","report":"<path to report.md>"}
```

| Field | Value |
|---|---|
| `skill` | `find-token-drift` |
| `scope` | `.` for the whole repo, else the package's repo-relative path with `/` separators |
| `at` | UTC time the run finished, `YYYY-MM-DDTHH:MM:SSZ` |
| `commit` | the full commit hash read at the start of the run, with `+dirty` appended if the working tree had changes; `none` without version control |
| `check` | `fail` if the report says the run failed; `partial` if any check line reads PARTIAL, UNCONFIRMED, not run, or user's word; otherwise `pass` |
| `degraded` | `false`, or the one missing thing: `browser`, `runtime-evidence`, `ci-history`, `build`, `parser`. Record `parser` when the header names any syntax as lexed (no parser) |
| `metric` | `drifted_values` |
| `value` | the integer on the report's `Drifted values` line, or `null` when the run failed before `cluster` printed its summaries |
| `comparable` | `mode=full` or `mode=degraded`, then `;` and this skill's fields sorted by key: `root` (the `--root-px` value), `syntaxes` (every parsed and lexed syntax, sorted, joined with `,`) |
| `report` | repo-relative path of this run's `report.md` |

After appending, check that the file grew by exactly one line and that no earlier line changed. Order in
the file does not matter.

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
