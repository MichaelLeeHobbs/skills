---
name: find-reinvention
disable-model-invocation: true
description: >-
  Use for "find duplicate helpers", "how many formatDate copies do we have", "audit reinvention", "find
  semantic duplicates", "which utils do the same thing", "re-run the reinvention audit". Finds functions
  that do the same job as existing ones under different code or a different name across a whole package,
  and shows how the copies behave differently by running them side by side. Builds a catalog of every
  named function, kept in the repo so re-runs reuse it and the team can share it. Expensive and
  user-invoked. NOT for literal copy-paste (use a clone detector), a diff or pull-request review, or
  merging the copies.
---

# Find reinvention

Find every job a package implements more than once, prove how the copies differ, and draft what stops
the next copy. Copies of a helper rarely share code or a name, so name search and clone detectors miss
them, and similarity scores alone flag many pairs that do different jobs. This skill catalogs every named
function, groups them by the job they do, judges each group from source with the most capable model
available to you, and runs the copies on the same tricky inputs.

**What it writes.** In the target repo, only its catalog folder ([reference/CATALOG.md](reference/CATALOG.md)).
It edits no code and commits nothing. Everything temporary goes in a work folder outside the repo.

## Prerequisites

Stop before any cost and say which is missing:
- You can run commands and write files.
- The language has a parser you can drive (compiler API, tree-sitter grammar, AST module).

**Where code goes.** Source goes only to the model provider you already use. Optional helpers
(embeddings, a code graph, an AST similarity tool) must run locally or through that same provider.
Running copies uses copied function text only, never the application.

## Roles

You coordinate. You hold the plan and the tool's counts, never the rows: the tool reads and writes the
row files. Start each step from the tool's output with a fresh context. Workers do the reading: a cheaper
model is enough for describing rows; mapping and judging need the most capable model available to you.
With one model, use it for everything; the split only saves money. Start workers in waves no larger than
your agent's limit on concurrent work. If you cannot start fresh contexts, continue in one and say in the
report header that steps and calibration passes were not independent.

## 0. Build and prove the tool

The tool does the bookkeeping a model must not do for itself: slicing, collecting, grouping and
reconciling rows, checking returned IDs and rows, accounting for every group member, coverage, and the
report's counts. Pick a runtime. Implement [reference/ALGORITHM.md](reference/ALGORITHM.md) to satisfy
[reference/CONTRACT.md](reference/CONTRACT.md) in the work folder. Run every fixture in
`reference/fixtures/`. **If any fixture fails, stop and report which.** Never edit a fixture to make it
pass, and never continue with a partly passing tool.

## 1. Inventory

Record the commit. Read all source at that commit for the whole run (show the file at that revision, or
a detached checkout in the work folder; with no version control, snapshot the tree there first).

Enumerate every named callable with the parser, following [reference/ROWS.md](reference/ROWS.md): kind
by syntax, visibility, signature, exclusions counted by reason, re-exports as aliases, importers per row.
Count each in-scope file with the language's pattern and run `verify --check coverage`. It must pass.

If the catalog folder already holds `rows.jsonl`, run `reuse` against it as CATALOG.md describes: reused
rows keep their slots, and only changed and added rows go to step 2.

## 1b. Canaries and budget

Write the canaries (see Check) into one file in the work folder under a plausible path and enumerate it
the same way. Keep their row IDs in a separate list. Canary rows go through steps 2 to 6 like any row,
but stay out of the coverage check, `tally` input, the decision list, the catalog and every count except
the Canaries line.

Estimate the cost from the real counts: tokens per step times the provider's published price. Show it,
get one approval and a cap (default 1.25 times the estimate). If you cannot see real spend, enforce the
cap in tokens and label spend estimated. Reaching the cap stops the run cleanly; it resumes from the work
folder.

## 2. Describe

Pack rows into slices with `slice` (whole files, by byte size). Give each worker one slice and the
worker brief in ROWS.md, in a fresh context. Check each returned slice with `verify --check ids` and
`verify --check rows`. Send only the rejected rows back, once, with the problem named. Rows still
rejected after that, and slices that come back short twice, are BLOCKED and counted, never dropped.

## 3. Map domains

Run `strings` over the `utility`, `method` and `framework-bound` rows only; other kinds are never
grouped. With the most capable model, derive one list of canonical domains from those strings (a sample
stratified by folder if they do not fit one context), then freeze it, and list the domains that mean "no
input" as `nojob`. Map the strings in batches of about 500, each answered by line number and domain ID
rather than by retyping the strings. A string that fits nothing goes to an unmatched list you review
once. Run `verify --check map`; it must pass.

## 4. Group

Run `group` over the rows, the mapping and the `nojob` list. It groups eligible rows that share a job
(canonical domain plus `domain_out`) or a name stem, logs stems too common to group, and drops duplicate
and subset groups. Add groups from any optional helper, each counted separately in the appendix.

Merge two groups that share two or more members when the result fits the cap of 25 members or 150 KB of
source; record a `keep` pair for overlaps you cannot merge. Never chain groups through shared members.
Split a group over the cap by normalised signature (ignore nullability and parameter-object wrapping),
then by verb, then by the most capable model reading the rows. Add one more group holding the most
typical member of each part, so the parts are still compared (JUDGE.md says what follows when it finds a
match). Run `verify --check groups`; it must pass.

## 5. Judge

Calibrate on real pairs, then judge every group from source, as [reference/JUDGE.md](reference/JUDGE.md)
describes: anchor, SAME, VARIANT or DIFFERENT per member, a predicted behaviour table, residual
regrouping, the canonical copy. Judge in priority order: groups whose members span several files and
are mostly `utility` or `method`, then by importers, with groups whose job means "no input" last, so the
cap cuts the least useful groups. Only source decides a verdict.

## 6. Run side by side

Run the top 10 real groups, every group holding a canary, and each positive canary beside its source, as
[reference/RUN.md](reference/RUN.md) describes: probe the zone and clock, run copied members in the bare
runtime, mark cells run or predicted, set CONFIRMED, REFUTED or BLOCKED.

## 7. Report and save the catalog

Write the report as [reference/REPORT.md](reference/REPORT.md) lays out and the catalog files as
CATALOG.md lists them. Hand back the report path, header and decision list.

## Check

Plant four canaries in step 1b, self-contained, each copied from a real function in the package:
1. A date formatter, renamed and rewritten, with one changed edge (`""` instead of a dash for empty),
   written as a private top-level const in a component-style file.
2. A byte formatter rewritten in a different style (a reduce where it loops), named to share no stem with
   any real function (`humanReadableSize`), so only the same-job key can catch it.
3. An error-message helper, renamed, with one changed fallback text.
4. A negative: a function sharing a real helper's vocabulary but doing another job.

If the package has no date, byte or error helper, copy from the largest groups' families instead. Plant
each difference where the step 6 inputs reach it. The judge never sees the canaries during calibration.
The first three are known VARIANTs, the fourth a known DIFFERENT: this is how you prove the check can
fail. **The run fails**, and the report says so above the header, when any of these happens:
- a positive canary is not grouped with its source, not judged VARIANT, or its planted difference does
  not show when it is run beside its source;
- the negative canary is judged SAME or VARIANT;
- `verify --check coverage` fails, or any other `verify` check fails at its step;
- none of the top 10 groups ran although at least one had a runnable member;
- the user supplied a list of known copies and any is missing from every group (name the step that lost
  it).

A run that could not perform one of these checks has failed it.

## If you cannot run work in parallel

Run the same steps in order, one slice at a time. The work folder is the progress record: a slice is
done when its output passes `verify`, so a stopped run resumes by asking the tool what is missing.
