# The catalog: what is kept in the repo, and how a re-run uses it

## Where

A folder inside the target repo: the folder your agent already keeps project configuration in, with a
`contract-drift/` folder under it, or `.contract-drift/` at the repo root if your agent has none. Use the
same folder on every run; the report header names it.

The skill writes this folder and nothing else in the repo. It never commits.

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
