# The catalog: what is kept in the repo, and how a re-run uses it

## Where

Use `clean-code/` inside your agent's project configuration folder, or `.clean-code/` at the repo root if
your agent has none. If a `clean-code/` folder already exists in another folder at the repo root, use that
one; if two exist, stop and name both. This skill's files go in `clean-code/find-reinvention/`; for a
package scope, in `clean-code/find-reinvention/<repo path of the package>/` (for example
`clean-code/find-reinvention/apps/web/`). Write this folder and the shared `clean-code/ledger.jsonl` and
nothing else in the repo; never commit.

**Legacy folder.** On the first write, if `reinvention/` exists beside `clean-code/` (or `.reinvention/`
at the repo root), copy the whole folder into the new home: catalogs, history and user-owned files. A
legacy package subfolder named after a package goes to that package's repo path; if more than one could
match, stop and name the candidates. Say in the report header that you copied it and that the user can
delete the legacy folder. Never read the legacy folder again, and never delete it yourself.

## Run record

Replace `report.md` only after this run's own checks are done. Then append exactly one line to
`clean-code/ledger.jsonl`, pass or fail:

```
{"skill":"find-reinvention","scope":".","at":"2026-11-15T14:02:00Z","commit":"<full hash>","check":"pass","degraded":false,"metric":"jobs_2plus","value":<n>,"comparable":"mode=full;domains=<n>;nojob=<n>","report":"<path to report.md>"}
```

| Field | Value |
|---|---|
| `skill` | `find-reinvention` |
| `scope` | `.` for the whole repo, else the package's repo-relative path with `/` separators |
| `at` | UTC time the run finished, `YYYY-MM-DDTHH:MM:SSZ` |
| `commit` | the full commit hash read at the start of the run, with `+dirty` appended if the working tree had changes; `none` without version control |
| `check` | `fail` if the report says the run failed; `partial` if any check line reads PARTIAL, UNCONFIRMED, not run, or user's word; otherwise `pass` |
| `degraded` | `false`, or the one missing thing: `browser`, `runtime-evidence`, `ci-history`, `build`, `parser`. This skill always records `false`: without a parser it stops before any work |
| `metric` | `jobs_2plus` |
| `value` | the integer on the report's `Jobs implemented 2+ times` line, or `null` when the run stopped before `tally` produced it |
| `comparable` | `mode=full` or `mode=degraded`, then `;` and this skill's fields sorted by key: `domains` (lines in `domains.jsonl`; the list is append-only, so its length is its version), `nojob` (lines in `nojob.jsonl`). This skill always records `mode=full` |
| `report` | repo-relative path of this run's `report.md` |

After appending, check that the file grew by exactly one line and that no earlier line changed. Order in
the file does not matter.

## What goes in it

| File | Content | Sorted by |
|---|---|---|
| `rows.jsonl` | one line per function: the inventory fields from ROWS.md plus the described slots | `id` |
| `domains.jsonl` | the frozen domain list: `id`, `name`, `def`; append-only, IDs permanent | `id` |
| `mapping.jsonl` | `domain_in` string to domain ID | `value` |
| `nojob.jsonl` | domain IDs that get no job key (meaning "no input") | `domain` |
| `verdicts.jsonl` | judge and run results, each with the content hashes of the members it covers | group, member |
| `report.md` | the last report | |
| `history.jsonl` | one line per run: date, commit, rows, jobs implemented 2+ times | date |

Write every JSONL file sorted and one object per line, so a re-run's changes show as a readable diff.

**Never in the catalog:** the built tool, slices, worker outputs, harnesses, run output and anything else
temporary. Those live in a work folder outside the repo. Rebuild the tool from the spec and prove it
against the fixtures on every run.

## Re-running

1. Build and prove the tool (step 0). Enumerate and check coverage as on a first run (step 1).
2. Run `reuse` with the saved `rows.jsonl` as `old` records and this run's inventory as `new` records,
   using `id` and the content hash.
   - `reuse`: copy the saved slots to the new ID.
   - `changed` and `added`: describe these rows (step 2). Only these go to workers.
   - `removed`: drop the row.
3. Map only the new `domain_in` strings against the saved domain list (step 3). Add domains only through
   the reviewed unmatched list; never renumber.
4. Group as usual (step 4). Reuse a saved verdict only when every member hash it covers is unchanged and
   the group's membership is the same; judge every other group again.
5. Report the since-last-run line, list resolved groups (a group that lost all but one member), and add
   a line to `history.jsonl`. Replace the catalog files with this run's versions.

## Size

About 600 bytes per function: a 6,500-function package gives a `rows.jsonl` near 4 MB. If that is too
large to commit, keep `domains.jsonl`, `mapping.jsonl`, `nojob.jsonl` and `history.jsonl` (small, and
the part that keeps the metric comparable) and regenerate rows each run.
