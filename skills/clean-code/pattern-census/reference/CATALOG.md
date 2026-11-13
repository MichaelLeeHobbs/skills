# The catalog: what is kept in the repo, and how a re-run uses it

## Where

A folder inside the target repo: the folder your agent already keeps project configuration in, with a
`pattern-census/` folder under it, or `.pattern-census/` at the repo root if your agent has none. Use
the same folder on every run; the report header names it. The skill writes this folder and nothing else
in the repo, and never commits.

## What goes in it

| File | Content | Sorted by |
|---|---|---|
| `jobs.jsonl` | `job`, `grade`, the sample `seed`, the lexical net | `job` |
| `sinks.jsonl` | the frozen sink table (JOBS.md), including dependencies classified as doing no job | `symbol` |
| `conduits.jsonl` | conduits the user declared at the gate | `symbol`, `job` |
| `conventions.jsonl` | the convention records (CONVENTIONS.md) | `id` |
| `dispositions.jsonl` | readers' answers for `unresolved` hits, each with its `key` | `id` |
| `history.jsonl` | one line per run: date, commit, definitions version, per job sites, families, coverage range | date |
| `report.md` | the last report | |

Write every JSONL file sorted, one object per line, so a re-run's changes read as a diff.

**The definitions version** is a hash of `jobs.jsonl`, `sinks.jsonl`, `conduits.jsonl` and
`conventions.jsonl`. Every number in the report and in `history.jsonl` carries it.

**Never in the catalog:** the built tool, the scanner, scan output, samples, readers' outputs, canary
files, or a per-site list. Rebuild the tool from the spec and prove it against the fixtures on every run.

## Re-running

1. Build and prove the tool; regenerate and prove the scanner against the scanner cases.
2. Classify only dependencies new to the manifest. Keep sinks, markers and conduits unless the user
   changes them; a change bumps the definitions version.
3. Re-read the convention sources. A changed quote or a new rule bumps the definitions version.
4. Scan at the new commit. Copy a saved disposition onto an `unresolved` hit only when its `key` matches;
   `close` rejects any other as `stale`. Only hits without a valid disposition go to readers.
5. Measure as on a first run, with the seed's commit part changed.
6. The since-last-run line compares with the last `history.jsonl` line only when the definitions version
   is the same; otherwise it says the definitions changed and gives no delta.

## Cost

Scanning, `close`, `census`, sampling and owners cost no model tokens. Spend goes to the dependency
classification, the two convention readers, unresolved hits, the audit (about 30 reads per family), the
escape sample (300 whole files) and the strongest model's rulings. A re-run costs about 60 to 70% of the
first: the escape sample and audit are redrawn every time.
