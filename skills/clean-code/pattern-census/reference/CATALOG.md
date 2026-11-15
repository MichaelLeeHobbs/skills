# The catalog: what is kept in the repo, and how a re-run uses it

## Where

Use `clean-code/` inside your agent's project configuration folder, or `.clean-code/` at the repo root if
your agent has none. If a `clean-code/` folder already exists in another folder at the repo root, use that
one; if two exist, stop and name both. This skill's files go in `clean-code/pattern-census/`; for a
package scope, in `clean-code/pattern-census/<repo path of the package>/` (for example
`clean-code/pattern-census/apps/web/`). Write this folder and the shared `clean-code/ledger.jsonl` and
nothing else in the repo; never commit.

**Legacy folder.** On the first write, if `pattern-census/` exists beside `clean-code/` (or
`.pattern-census/` at the repo root), copy the whole folder into the new home: catalogs, history and
user-owned files. A legacy package subfolder named after a package goes to that package's repo path; if
more than one could match, stop and name the candidates. Say in the report header that you copied it and
that the user can delete the legacy folder. Never read the legacy folder again, and never delete it
yourself.

## Run record

Replace `report.md` only after this run's own checks are done. Then append exactly one line to
`clean-code/ledger.jsonl`, pass or fail:

```
{"skill":"pattern-census","scope":".","at":"2026-11-15T14:02:00Z","commit":"<full hash>","check":"pass","degraded":false,"metric":"off_pattern_families","value":<n>,"comparable":"mode=full;definitions=<version>","report":"<path to report.md>"}
```

| Field | Value |
|---|---|
| `skill` | `pattern-census` |
| `scope` | `.` for the whole repo, else the package's repo-relative path with `/` separators |
| `at` | UTC time the run finished, `YYYY-MM-DDTHH:MM:SSZ` |
| `commit` | the full commit hash read at the start of the run, with `+dirty` appended if the working tree had changes; `none` without version control |
| `check` | `fail` if the report says the run failed; `partial` if any check line reads PARTIAL, UNCONFIRMED, not run, or user's word; otherwise `pass` |
| `degraded` | `false`, or the one missing thing: `browser`, `runtime-evidence`, `ci-history`, `build`, `parser`. This skill always records `false`: without a parser it stops before any cost |
| `metric` | `off_pattern_families` |
| `value` | the integer on the report's `Off-pattern families` line, or `null` when the run failed before `census` printed its `family` records |
| `comparable` | `mode=full` or `mode=degraded`, then `;` and this skill's fields sorted by key: `definitions` (the definitions version) |
| `report` | repo-relative path of this run's `report.md` |

After appending, check that the file grew by exactly one line and that no earlier line changed. Order in
the file does not matter.

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
