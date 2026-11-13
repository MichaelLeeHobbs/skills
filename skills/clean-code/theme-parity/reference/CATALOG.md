# The catalog: what is kept in the repo, and how a re-run uses it

## Where

A folder inside the target repo: the folder your agent already keeps project configuration in, with a
`theme-parity/` folder under it, or `.theme-parity/` at the repo root if your agent has none. Use the same
folder on every run; the report header names it.

The skill writes this folder and nothing else in the repo. It never commits.

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
