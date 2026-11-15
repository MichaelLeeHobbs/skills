# The catalog: what is kept in the repo, and how a re-run uses it

## Where

Use `clean-code/` inside your agent's project configuration folder, or `.clean-code/` at the repo root if
your agent has none. If a `clean-code/` folder already exists in another folder at the repo root, use that
one; if two exist, stop and name both. This skill's files go in `clean-code/find-component-reinvention/`;
for a package scope, in `clean-code/find-component-reinvention/<repo path of the package>/` (for example
`clean-code/find-component-reinvention/apps/web/`). Write this folder and the shared
`clean-code/ledger.jsonl` and nothing else in the repo; never commit.

**Legacy folder.** On the first write, if `component-reinvention/` exists beside `clean-code/` (or
`.component-reinvention/` at the repo root), copy the whole folder into the new home: catalogs, history
and user-owned files. A legacy package subfolder named after a package goes to that package's repo path;
if more than one could match, stop and name the candidates. Say in the report header that you copied it
and that the user can delete the legacy folder. Never read the legacy folder again, and never delete it
yourself.

## Run record

Replace `report.md` only after this run's own checks are done. Then append exactly one line to
`clean-code/ledger.jsonl`, pass or fail:

```
{"skill":"find-component-reinvention","scope":".","at":"2026-11-15T14:02:00Z","commit":"<full hash>","check":"pass","degraded":false,"metric":"families_2plus","value":<n>,"comparable":"mode=full;states=<n>","report":"<path to report.md>"}
```

| Field | Value |
|---|---|
| `skill` | `find-component-reinvention` |
| `scope` | `.` for the whole repo, else the package's repo-relative path with `/` separators |
| `at` | UTC time the run finished, `YYYY-MM-DDTHH:MM:SSZ` |
| `commit` | the full commit hash read at the start of the run, with `+dirty` appended if the working tree had changes; `none` without version control |
| `check` | `fail` if the report says the run failed; `partial` if any check line reads PARTIAL, UNCONFIRMED, not run, or user's word; otherwise `pass` |
| `degraded` | `false`, or the one missing thing: `browser`, `runtime-evidence`, `ci-history`, `build`, `parser`. Record `browser` when the visual half did not run (any static fallback trigger: a static run without rendering); such a run also has `check` `fail` |
| `metric` | `families_2plus` |
| `value` | the integer on the report's `Families implemented 2+ times` line, or `null` when the run stopped before `tally` produced it |
| `comparable` | `mode=full` or `mode=degraded`, then `;` and this skill's fields sorted by key: `states` (lines in `states.jsonl`, the frozen state tables). `mode=degraded` exactly when `degraded` is not `false` |
| `report` | repo-relative path of this run's `report.md` |

After appending, check that the file grew by exactly one line and that no earlier line changed. Order in
the file does not matter.

## What goes in it

| File | Content | Sorted by |
|---|---|---|
| `components.jsonl` | one line per component: the inventory fields and the described slots from ROWS.md | `id` |
| `adapters.jsonl` | one line per member and state: `id`, `hash`, `state`, `props` (data with the three markers only) | `id`, `state` |
| `verdicts.jsonl` | judge results with the hashes of the members they cover, and the last run's evidence for reading only | group, member |
| `states.jsonl` | the frozen state tables: class, state, payload | class, state |
| `report.md` | the last report | |
| `history.jsonl` | one line per run: date, commit, rows, families implemented 2+ times, visual proof rendered or not | date |

Write every JSONL file sorted and one object per line, so a re-run's changes show as a readable diff.
Never write payloads or adapters holding anything copied from real data (STATES.md "Payload rules").

**Never in the catalog:** screenshots, sheets, pixel files, the built tool, the harness, the build
configuration, the export, logs, environment values, and URLs with query strings. They live in the work
folder outside the repo. Rebuild the tool from the spec and prove it against the fixtures on every run.

## Re-running

1. Build and prove the tool (step 0). Enumerate and check coverage as on a first run (step 1).
2. Run `reuse` with the saved `components.jsonl` as `old` and this inventory as `new`, by `id` and `hash`.
   - `reuse`: copy the saved slots to the new ID.
   - `changed` and `added`: describe these rows (step 2). Only these go to workers.
   - `removed`: drop the row.
3. Group as usual (step 3). Reuse a saved SAME, VARIANT or DIFFERENT verdict and its look labels only
   when every member hash it covers is unchanged, the membership is the same and the state table is
   unchanged; judge every other group again.
4. Reuse an adapter only when its member's hash and its state's payload are unchanged.
5. Render every planned cell again. Never reuse evidence, captures or sheets: a theme or global style
   change leaves every component hash unchanged and still changes every render.
6. Report the since-last-run line, list resolved families, add a line to `history.jsonl`, and replace the
   catalog files with this run's versions.
