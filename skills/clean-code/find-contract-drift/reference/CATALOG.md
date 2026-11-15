# The catalog: what is kept in the repo, and how a re-run uses it

## Where

Use `clean-code/` inside your agent's project configuration folder, or `.clean-code/` at the repo root if your agent has none. If a `clean-code/` folder already exists in another folder at the repo root, use that one; if two exist, stop and name both. This skill's files go in `clean-code/find-contract-drift/`; for a package scope, in `clean-code/find-contract-drift/<repo path of the package>/` (for example `clean-code/find-contract-drift/apps/web/`). Write this folder and the shared `clean-code/ledger.jsonl` and nothing else in the repo; never commit.

**Legacy folder.** On the first write, if `contract-drift/` exists beside `clean-code/` (or `.contract-drift/` at the repo root), copy the whole folder into the new home: catalogs, history and user-owned files. A legacy package subfolder named after a package goes to that package's repo path; if more than one could match, stop and name the candidates. Say in the report header that you copied it and that the user can delete the legacy folder. Never read the legacy folder again, and never delete it yourself.

## Run record

Replace `report.md` only after this run's own checks are done. Then append exactly one line to `clean-code/ledger.jsonl`, pass or fail:

```
{"skill":"find-contract-drift","scope":".","at":"2026-11-15T14:02:00Z","commit":"<full hash>","check":"pass","degraded":false,"metric":"breaking","value":<n>,"comparable":"mode=full;unparsed=<languages or none>","report":"<path to report.md>"}
```

| Field | Value |
|---|---|
| `skill` | `find-contract-drift` |
| `scope` | `.` for the whole repo, else the package's repo-relative path with `/` separators |
| `at` | UTC time the run finished, `YYYY-MM-DDTHH:MM:SSZ` |
| `commit` | the full commit hash read at the start of the run, with `+dirty` appended if the working tree had changes; `none` without version control |
| `check` | `fail` if the report says the run failed; `partial` if any check line reads PARTIAL, UNCONFIRMED, not run, or user's word; otherwise `pass` |
| `degraded` | `false`, or the one missing thing: `browser`, `runtime-evidence`, `ci-history`, `build`, `parser`. This skill records `parser` when the header's `Unparsed` names a language the user excluded; otherwise `runtime-evidence` when a producer's serializer could not run in the bare runtime (basis `sample`) or a fallback left config kinds BLOCKED; otherwise `false` |
| `metric` | `breaking` |
| `value` | the integer on the report's `Cells` line (the BREAKING count), or `null` when the run stopped before `tally` |
| `comparable` | `mode=full` or `mode=degraded`, then `;` and this skill's fields sorted by key: `unparsed` (the excluded languages, sorted and joined with `,`, or `none`) |
| `report` | repo-relative path of this run's `report.md` |

After appending, check that the file grew by exactly one line and that no earlier line changed. Order in the file does not matter.

## What goes in it

| File | Content | Sorted by | Written by |
|---|---|---|---|
| `verdicts.jsonl` | per judged group: the `gdiff` record (members with hash and eff string), member verdicts, cell verdicts and evidence | group | the skill |
| `accepted.jsonl` | `accept` records (CONTRACT.md, `diff`): differences the team marked intended | anchor, member, field | the user, by copying a cell line from the report |
| `configs.jsonl` | the `config` rows of this run | scope, setting | the skill |
| `report.md` | the last report | | the skill |
| `history.jsonl` | one line per run: date, commit, shapes, groups, BREAKING cells, CONFIRMED cells | date | the skill |

Write every JSONL file sorted and one object per line, so a re-run's changes show as a readable diff.
Shape and field rows are not kept; the parser regenerates them each run.

**Never in the catalog:** the built tool, worker outputs, harnesses, run output and anything else
temporary. Those live in the work folder outside the repo. Rebuild the tool from the spec and prove it
against the fixtures on every run.

## Re-running

1. Build and prove the tool (step 0). Inventory and check coverage as on a first run.
2. Run `keys`, `group` and `diff` as usual, with `accepted.jsonl` as `accept` input. An accept whose
   hashes no longer match is reported as reopened, and the cell comes back.
3. Run `reuse` with the saved `verdicts.jsonl` groups as `old` records and this run's `gdiff` records as
   `new`. A `reuse` group keeps its saved verdicts and evidence; a `judge` group is judged again.
4. Report the since-last-run line, and replace the catalog files with this run's versions. Keep
   `accepted.jsonl` as the user wrote it.

## Size

About 2 KB per judged group in `verdicts.jsonl`. A repo with 500 judged groups keeps about 1 MB.
