---
name: test-garden
disable-model-invocation: true
description: >-
  Use for "which tests are slowest", "what is our CI spending on tests", "find flaky tests", "rank
  tests by cost", "which tests cannot fail", "find tests that assert nothing", "duplicated test
  fixtures", "weed the test suite", "re-run the test audit". Ranks slow tests by measured time x how
  often CI runs them, flaky tests by rerun cost from CI history, proves assertions that cannot fail by
  mutating the code under test, and groups duplicated fixtures and helpers. Expensive and user-invoked.
  NOT for writing or fixing one test (use write-tests), a pull-request review, or deleting tests.
---

# Test garden

Weed an existing test suite. Every finding rests on a measurement: a timing, a CI outcome, or a mutant
that the test failed to notice. A name, a tell or a reading only nominates a candidate.

**What it writes.** In the target repo, only its catalog folder ([reference/REPORT.md](reference/REPORT.md#catalog)).
It never edits, deletes, skips or quarantines a test, never commits, never re-runs CI, and never changes
the user's checkout. Mutants and everything temporary go in a work folder outside the repo.

## Lanes

| Lane | Finds | Proof | Needs |
|---|---|---|---|
| `slow` | tests and files costing the most test-seconds per day | measured durations x executions per day | per-test durations |
| `flaky` | tests that pass and fail on one commit, ranked by rerun cost | CI outcomes per commit | CI history |
| `weak` | assertions that cannot fail, tests that never reach their target | mutants the test survives | single-test or per-file runs |
| `dupes` | fixtures, factories and helpers written twice | building each copy and diffing | a parser for test files |

Default: `slow` and `flaky` when CI history is readable, `slow` alone when it is not. Run `weak` and
`dupes` only when the user picks them. Name every lane not run in the report header.

## Prerequisites

Stop before any cost and say which is missing:
- You can run commands, write files and run the suite locally.
- The runner reports per-test durations (JUnit XML or its own JSON). Without them, `slow` cannot run.
- For `flaky`: read access to the CI provider's run list and test reports. Without it, see TIMINGS.md.

Send source and reports only to the model provider you already use.

## Roles

You coordinate and hold the tool's counts, never the raw records: the tool reads and writes those
files. If you can run work in parallel, give each worker one chunk of reports to flatten or one target
to mutate, with the matching reference file, in a fresh context. Use the most capable model for
judging dupes and reading targets; a cheaper one can flatten reports.

## 0. Build and prove the tool

Implement [reference/ALGORITHM.md](reference/ALGORITHM.md) to satisfy
[reference/CONTRACT.md](reference/CONTRACT.md) in the work folder, in any runtime the machine has. Run
the `common` fixtures and the fixtures of every subcommand the chosen lanes use (CONTRACT.md
"Fixtures"). **If any fixture fails, stop and report which.** Never edit a fixture, and never continue
with a partly passing tool.

## 1. Inventory

Record the commit. List every test id with the runner's list or collect-only mode, normalising path
separators to `/`. Count test declarations per file with the language's pattern (tolerate CR at line
ends). Run `verify --check coverage`. Every `never_ran`, `shortfall` and `broken` file is a finding;
add an `except` record only for a stated reason (a loop or table that declares tests at run time). It
must pass before any lane runs.

## 2. Canaries and budget

Plant the canaries for the chosen lanes in a detached copy of the repo in the work folder, as
[reference/CANARIES.md](reference/CANARIES.md) describes. Keep their ids on a separate list: they go
through every step but never into a finding, a ranking or a count except the Canaries line.

Estimate cost from real numbers: reports to download, local runs times suite time, weak candidates times
measured single-test time (step 5), tokens times the provider's published price. Show it, get one
approval and a cap per lane (default 1.25 times the estimate; `weak` defaults to 60 minutes of runs).
Reaching a cap stops that lane cleanly and the report says how far it got.

## 3. Slow lane

Follow [reference/TIMINGS.md](reference/TIMINGS.md): pick the evidence rung, sample qualifying CI runs,
flatten each report into `sample` lines and check them with `verify --check reports` (it must pass),
then run `rank`.

## 4. Flaky lane

Follow TIMINGS.md "Flaky evidence": collect outcomes for commits that failed then passed, flatten them
to `outcome` lines, run `flaky`. Local reruns confirm a suspect; they never clear one.

## 5. Weak lane

Follow [reference/MUTATE.md](reference/MUTATE.md): pick candidates, map each to its target, take a
baseline, apply one mutant at a time to a clean copy, record each outcome as a `mutant` line, and run
`verdict`. Only `verdict` output sets a class.

## 6. Dupes lane

Follow [reference/DUPES.md](reference/DUPES.md): list named fixtures, factories, builders and helpers in
test folders as `helper` lines, run `group`, judge up to 30 groups from source, prove each VARIANT by
building both copies and diffing. Copied setup blocks inside test bodies are not covered; say so.

## 7. Report and catalog

Write the report and update the catalog as [reference/REPORT.md](reference/REPORT.md) lays out. Hand back
the report path, its header and the "do this first" list.

## Check

The run fails, and the report says so above the header, when any of these happens:
- a fixture failed, or `verify --check coverage` or `verify --check reports` failed;
- a chosen lane's canary did not behave as CANARIES.md requires, or could not run;
- a chosen lane could not get its evidence (it is reported as failed, never silently skipped);
- a class, rank or count in the report does not come from tool output;
- the user named a known slow, flaky or vacuous test and it is missing from that lane's output (name the
  step that lost it).

A check you could not perform has failed.

## If you cannot run work in parallel

Run the same steps in order, one report chunk or one target at a time. The work folder is the progress
record: a chunk is done when its lines pass `verify`, and a target is done when every mutant outcome is
recorded, so a stopped run resumes from what is missing.
