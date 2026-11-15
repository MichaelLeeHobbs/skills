# The catalog: what is kept in the repo, and how a re-run uses it

## Where

Use `clean-code/` inside your agent's project configuration folder, or `.clean-code/` at the repo root if
your agent has none. If a `clean-code/` folder already exists in another folder at the repo root, use
that one; if two exist, stop and name both. This skill's files go in `clean-code/theme-parity/`; for a
package scope, in `clean-code/theme-parity/<repo path of the package>/` (for example
`clean-code/theme-parity/apps/web/`). Write this folder and the shared `clean-code/ledger.jsonl` and
nothing else in the repo; never commit. The report header names the folder.

**Legacy folder.** On the first write, if `theme-parity/` exists beside `clean-code/` (or `.theme-parity/`
at the repo root), copy the whole folder into the new home: catalogs, history and user-owned files. A
legacy package subfolder named after a package goes to that package's repo path; if more than one could
match, stop and name the candidates. Say in the report header that you copied it and that the user can
delete the legacy folder. Never read the legacy folder again, and never delete it yourself.

## What goes in it

| File | Content | Sorted by |
|---|---|---|
| `screens.jsonl` | one line per screen: `screen`, the URL or route with the real IDs used, states, the theme recipes, last status | `screen` |
| `allowlist.jsonl` | selectors the user exempts, each with the user's reason; written only by the user | `selector` |
| `clusters.jsonl` | the last run's clusters with their fix target, label, chosen value and status | `id` |
| `report.md` | the last report and its appendix | |
| `history.jsonl` | one line per run: date, commit, renders, FAIL nodes, clusters, fixes PROVEN | date |

Write every JSONL file sorted and one object per line, so a re-run's changes show as a readable diff.

**Never in the catalog:** node rows, pairs, screenshots, the built tool, the collector, canary rows and
anything else temporary. Those live in the work folder outside the repo. Rebuild the tool from the spec
and prove it against the fixtures on every run.

## Re-running

1. Build and prove the tool (step 0).
2. Start the inventory from `screens.jsonl`: reuse its routes, IDs, states and theme recipes, add routes
   the router has gained, and mark routes it has lost as removed.
3. Render, measure and cluster everything again. Reuse no measurement.
4. Compare with `clusters.jsonl`: a previous cluster with no FAIL rows now is resolved; list resolved
   clusters in the report and the fixes that resolved them if the history shows them.
5. Add a line to `history.jsonl` and replace the other files with this run's versions. Keep
   `allowlist.jsonl` exactly as the user left it.

## Run record

Replace `report.md` only after this run's own checks are done. Then append exactly one line to
`clean-code/ledger.jsonl`, pass or fail:

```
{"skill":"theme-parity","scope":".","at":"2026-11-15T14:02:00Z","commit":"<full hash>","check":"pass","degraded":false,"metric":"clusters","value":<n>,"comparable":"mode=full;level=AA;screens=<screen set hash>;themes=dark+light","report":"<path to report.md>"}
```

| Field | Value |
|---|---|
| `skill` | `theme-parity` |
| `scope` | `.` for the whole repo, else the package's repo-relative path with `/` separators |
| `at` | UTC time the run finished, `YYYY-MM-DDTHH:MM:SSZ` |
| `commit` | the full commit hash read at the start of the run, with `+dirty` appended if the working tree had changes; `none` without version control |
| `check` | `fail` if the report says the run failed; `partial` if any check line reads PARTIAL, UNCONFIRMED, not run, or user's word (a Coverage line of PARTIAL and a static run's `not run (static)` lines are `partial`; the PARTIAL count on the Fixes line is not a check status); otherwise `pass` |
| `degraded` | `false`, or the one missing thing: `browser`, `runtime-evidence`, `ci-history`, `build`, `parser`. A static check run records `browser` |
| `metric` | `clusters` |
| `value` | the integer on the report's `Clusters` line |
| `comparable` | `mode=full` or `mode=degraded`, then `;` and this skill's fields sorted by key: `level` (`AA` or `AAA` from the Threshold line), `screens` (the first 12 hex characters of the sha256 of this run's sorted `screen` names from `screens.jsonl`, one per line with a final newline; `none` in a static run), `themes` (the Themes line's theme names, sorted and joined with `+`). A static run's `comparable` starts with `mode=degraded` |
| `report` | repo-relative path of this run's `report.md` |

Two runs are comparable only when their `comparable` strings are equal: the same mode, threshold, screen
set and theme set. After appending, check that the file grew by exactly one line and that no earlier line
changed. Order in the file does not matter.
