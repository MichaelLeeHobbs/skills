---
name: debt-ledger
disable-model-invocation: true
description: >-
  Use for "how many TODOs do we have", "count our eslint-disables", "is the lint baseline really
  shrinking", "debt trend since last sprint", "how old are our FIXMEs", "audit type: ignore and
  ts-expect-error", "re-run the debt ledger". Inventories every TODO, FIXME, HACK and XXX marker, every
  inline lint or type-checker suppression and every lint-baseline entry in a repo, with age from
  version-control blame, an owning team, and the trend against the last run. Splits a baseline's change
  into fixed, moved inline, deleted with the file, and hidden by a config change, so a shrink that is not
  a fix shows. Keeps a ledger in the repo for re-runs. NOT for fixing the debt, judging whether a TODO
  still matters, or gating CI.
---

# Debt ledger

Count the debt a repo has written down, date it, assign it to a team, and show honestly how it moved
since the last run. Every number comes from the bookkeeping tool. No model reads or judges single items.

**What it writes.** In the target repo, only its ledger folder ([reference/LEDGER.md](reference/LEDGER.md)).
It edits no code, config or baseline, and commits nothing. Temporary files go in a work folder outside
the repo.

## Prerequisites

Stop before any work and say which is missing:
- You can run commands and write files.
- A runtime with JSON and SHA-256 in its standard library, to build the tool.

Version control is optional. Without it, ages are `unknown`, renames are not detected, and the report
header says so.

## 0. Build and prove the tool

Pick a runtime. Implement [reference/ALGORITHM.md](reference/ALGORITHM.md) to satisfy
[reference/CONTRACT.md](reference/CONTRACT.md) in the work folder. Run every fixture in
`reference/fixtures/`. **If any fixture fails, stop and report which.** Never edit a fixture to make it
pass, and never continue with a partly passing tool. Pass spec version `1` to `tally`.

## 1. Pin and load the last run

Record the commit and read everything at it (search and blame at that revision, or a detached checkout
in the work folder). Note whether the clone is shallow: a shallow clone dates nothing, so treat ages as
`unknown`. Find the ledger folder. If it holds a `history.jsonl`, the last line names the last run's
commit; check whether this commit descends from it. On a first run, ask once whether the team will commit
the ledger, and record the answer in the report header.

## 2. Inventory items

Use [reference/PATTERNS.md](reference/PATTERNS.md). For each language present, take its strict patterns
for markers and suppressions and search every tracked text file at the commit, skipping the paths
PATTERNS.md lists as out of scope (count them by reason). Each hit becomes one item per rule it names:
path, line, kind (`marker`, `inline`, `blanket`), rule, linter, scope, the owner tag if the marker has
one, and the comment text. The comment text goes only to the tool.

Then run the loose pattern over the same files. For loose hits that are not items, write exclusion rules
(a pattern and a reason such as `string literal` or `identifier`) from at most 20 sample lines per rule,
and count each file's excluded hits with search. Build one `count` record per file (found = items plus
excluded, loose = loose hits) and run `verify --check coverage`. It must pass. Keep exclusion rules out of the
pattern records, so they never break the trend.

## 3. Read the baselines

Look for every file [reference/BASELINES.md](reference/BASELINES.md) names. Run `adapt` on each one with
a listed format. Check each with `verify --check coverage` against the independent count BASELINES.md
gives for that format. A detected baseline whose format has no `adapt` support fails the run: name the
file and say a sample and fixture must be added first.

## 4. Key, date and own the items

Get the paths renamed since the last run's commit, with rename detection unlimited. If version control
reports that it skipped rename detection, the run fails. Run `reuse` with the ledger's items as `old`,
this run's items as `new`, and the renames.

Blame every `redate` and `added` item: one call per file with one line range per item, ignoring
whitespace, following moved lines, and using the repo's ignore-revs file if it has one. Keep only the
committer date as `YYYY-MM-DD` in UTC; delete the rest of the blame output. A `reuse` item keeps its
dates. `first_seen` is today for `added` items. Re-derive the date of 3 items through a different route
(the log entry of the blamed commit); a mismatch fails the run.

Run `owner` with the code-owners file's lines, the folders holding a package manifest, and every item's
path and tag.

## 5. Classify baseline change

On a re-run, run `baseline` with each source, the ledger's entries as `old`, this run's as `new`, the
renames, the deleted paths, inline suppression counts per linter, path, rule and scope (old from the
ledger, new from step 2), the added and removed lines of every lint configuration file's diff since the
last run, and `toolchain` when a linter or preset version changed in a manifest or lockfile. On a first
run there is nothing to classify: save the entries.

## 6. Canaries

Run both kinds through the same steps and glue as the real input, then keep them out of every count but
the Canaries line.
1. **Patterns.** For each language present, write a canary file in the work folder under `__canary__/`
   as PATTERNS.md "Canary file" describes. Steps 2 and 4 must find exactly the planted items with the
   planted kinds, rules and tags, and exclude exactly the planted negatives.
2. **Baseline.** Build a canary change set under `__canary__/` paths: one rename, one deleted file, a drop
   matched by a new same-rule inline suppression, a drop matched by a new blanket suppression, a drop for
   a rule named in a canary config line, one plain fix, one growth and one new entry. Run it through your
   step 5 glue in its own `baseline` call. Each unit must land in its planted class.

## 7. Report and save the ledger

Run `tally` with every item, the run record, the strict patterns, each baseline's total, and the last
history line. Write the report as [reference/REPORT.md](reference/REPORT.md) lays out and the ledger files
as LEDGER.md lists them, including the `history` record as a new line. Hand back the report path and its
header.

## Check

**The run fails**, and the report says so above the header, when any of these happens:
- a fixture fails (step 0);
- `verify --check coverage` fails for items or for any baseline;
- a detected baseline has no `adapt` support;
- `owner` reports `unsupported_pattern`;
- version control skipped rename detection;
- a canary item is missed, misclassified or wrongly counted, or a canary negative is counted;
- a baseline canary unit lands outside its planted class;
- a re-derived date disagrees with blame;
- the tool reports `conserved` false for any source.

A run that could not perform one of these checks has failed it.

## If you cannot run work in parallel

Run every step in order. Only blame benefits from parallel calls; run it one file at a time and resume
from the work folder, where a file is done once its dates are written.
