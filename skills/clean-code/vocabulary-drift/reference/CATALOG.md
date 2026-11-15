# The catalog: what is kept in the repo, and how a re-run uses it

## Where

Use `clean-code/` inside your agent's project configuration folder, or `.clean-code/` at the repo root if
your agent has none. If a `clean-code/` folder already exists in another folder at the repo root, use that
one; if two exist, stop and name both. This skill's files go in `clean-code/vocabulary-drift/`; for a
package scope, in `clean-code/vocabulary-drift/<repo path of the package>/` (for example
`clean-code/vocabulary-drift/apps/web/`). Write this folder and the shared `clean-code/ledger.jsonl` and
nothing else in the repo; never commit.

**Legacy folder.** On the first write, if `vocabulary/` exists beside `clean-code/` (or `.vocabulary/` at
the repo root), copy the whole folder into the new home: catalogs, history and user-owned files. A legacy
package subfolder named after a package goes to that package's repo path; if more than one could match,
stop and name the candidates. Say in the report header that you copied it and that the user can delete
the legacy folder. Never read the legacy folder again, and never delete it yourself.

## Run record

Replace `report.md` only after this run's own checks are done. Then append exactly one line to
`clean-code/ledger.jsonl`, pass or fail:

```
{"skill":"vocabulary-drift","scope":".","at":"2026-11-15T14:02:00Z","commit":"<full hash>","check":"pass","degraded":false,"metric":"drifting","value":<n>,"comparable":"mode=full;concepts=<n>;seeds=<n>","report":"<path to report.md>"}
```

| Field | Value |
|---|---|
| `skill` | `vocabulary-drift` |
| `scope` | `.` for the whole repo, else the package's repo-relative path with `/` separators |
| `at` | UTC time the run finished, `YYYY-MM-DDTHH:MM:SSZ` |
| `commit` | the full commit hash read at the start of the run, with `+dirty` appended if the working tree had changes; `none` without version control |
| `check` | `fail` if the report says the run failed; `partial` if any check line reads PARTIAL, UNCONFIRMED, not run, or user's word; otherwise `pass` |
| `degraded` | `false`, or the one missing thing: `browser`, `runtime-evidence`, `ci-history`, `build`, `parser`. This skill always records `false`: a run without seeds is a full run, and a missing prerequisite stops it before any work |
| `metric` | `drifting` |
| `value` | the integer on the report's `Drifting concepts` line, or `null` when the run stopped before `tally` produced it |
| `comparable` | `mode=full` or `mode=degraded`, then `;` and this skill's fields sorted by key: `concepts` (lines in `concepts.jsonl`; IDs are append-only, so its length is its version), `seeds` (find-reinvention files read as seeds, `0` for none). This skill always records `mode=full` |
| `report` | repo-relative path of this run's `report.md` |

After appending, check that the file grew by exactly one line and that no earlier line changed. Order in
the file does not matter.

## What goes in it

| File | Content | Sorted by |
|---|---|---|
| `concepts.jsonl` | `id`, `name`, `def`, `test`, `canonical`, `ui_label`, `names` (sorted), `cells` (sorted `surface\|context` values its names occupy); IDs append-only and permanent | `id` |
| `mapping.jsonl` | `term`, `to` (a concept ID or `not-domain`), one line per pair | `term`, then `to` |
| `claims.jsonl` | every verified claim: `id`, `verdict`, `strength`, `names`, `relation`, `senses`, and `cites` as `{"path","text"}` (no line numbers) | `id` |
| `report.md` | the last report | |
| `history.jsonl` | one line per run: `date`, `commit`, `sites`, `terms`, `concepts`, `drifting` (concepts with two or more names judged SYNONYM), `homonyms` | `date` |

Write every JSONL file sorted and one object per line, so a re-run's changes show as a readable diff.
Never store sites, counts, samples or snippets: they are rebuilt each run and would churn on every
commit. Canary concepts and claims never enter the catalog.

**Never in the catalog:** the built tool, site records, tool outputs, snippets and anything else
temporary. Those live in a work folder outside the repo. Rebuild the tool from the spec and prove it
against the fixtures on every run.

## Re-running

1. Build and prove the tool (step 0). Inventory and check coverage as on a first run (step 1).
2. Run `terms`. Map only terms that are new or newly required against the saved concept list (step 2);
   add concepts with new IDs, never renumber. `verify --check map` over the saved and new mapping.
3. For each saved concept, compute its names and occupied cells from this run's mapping and `terms`
   output, and run `reuse` with the saved values as `old` and this run's as `new`.
   - `reuse`: resolve each saved cite to this run's site by `path` and `text`. If every cite resolves,
     keep the claim, with the cites rewritten to the new site IDs, and add those IDs to the candidate's
     picks for `verify --check evidence`. If any cite fails to resolve, rejudge.
   - `rejudge` and `added`: sample and judge as on a first run.
   - `removed`: drop the concept and its claims; list it under "Resolved since last run".
4. Report the since-last-run line and add a line to `history.jsonl`. Replace the catalog files with this
   run's versions.
