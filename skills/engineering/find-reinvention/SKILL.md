---
name: find-reinvention
disable-model-invocation: true
description: >-
  Use for "find duplicate helpers", "how many formatDate copies do we have", "audit reinvention", "find
  semantic duplicates", "which utils do the same thing". Finds functions that do the same job as
  existing ones under different code or a different name across a whole package, and shows how the
  copies behave differently by running them side by side. Builds a manifest of every named function
  first, so nothing is skipped. Expensive and user-invoked. NOT for literal copy-paste (use a clone
  detector), a diff or pull-request review, or merging the copies.
---

# Find reinvention

Find every job a package implements more than once, prove how the copies differ, and draft what stops
the next copy. Copies of a helper rarely share code or a name, so name search and clone detectors miss
them, and similarity scores alone flag many pairs that do different jobs. This skill builds a manifest of
every named function, groups rows by the job they do, judges each group from source with the most capable
model available to you, and runs the copies on the same tricky inputs.

**Read-only on the target repo.** It edits no code, files no tickets and gates nothing. Everything it
writes goes in a state folder outside the repo.

## Prerequisites

Stop before any cost and say which is missing:
- You can run commands and write files outside the repo.
- The language has a parser you can drive (compiler API, tree-sitter grammar, AST module).

**Where code goes.** Source goes only to the model provider you already use. Optional helpers
(embeddings, a code graph, an AST similarity tool) must run locally or through that same provider.
Running copies uses copied function text only, never the application.

## Roles

You coordinate. You hold the plan and the tool's counts, never the rows: the tool reads and writes the
row files. Start each step from the tool's output with a fresh context. Workers do the reading: a cheaper
model is enough for describing rows; mapping and judging need the most capable model available to you.
With one model, use it for everything; the split only saves money. If you cannot start fresh contexts,
continue in one and say in the report header that steps and calibration passes were not independent.

## 0. Build and prove the tool

The tool does the bookkeeping a model must not do for itself: slicing, collecting and grouping rows,
checking returned IDs and rows, accounting for every group member, coverage, and the report's counts.

Pick a runtime on the machine. Implement [reference/ALGORITHM.md](reference/ALGORITHM.md) to satisfy
[reference/CONTRACT.md](reference/CONTRACT.md). Run every fixture in `reference/fixtures/`. **If any
fixture fails, stop and report which.** Never edit a fixture to make it pass, and never continue with a
partly passing tool. Keep the built tool in the state folder; later runs re-run the fixtures and reuse it.

## 1. Inventory

Create the state folder outside the repo and record the commit. Read all source at that commit for the
whole run (show the file at that revision, or a detached checkout in the state folder; with no version
control, snapshot the tree into the state folder first). A pull mid-run then changes nothing.

Enumerate every named callable with the parser, following [reference/ROWS.md](reference/ROWS.md): kind
by syntax, visibility, exclusions counted by reason, re-exports as aliases, importers per row. Count each
in-scope file with the language's pattern and run `verify --check coverage`. It must pass.

## 1b. Canaries and budget

Write the canaries (see Check) into one file in the state folder under a plausible path and enumerate it
the same way. Keep its row IDs in a separate canary list. Canary rows go through steps 2 to 6 like any
row, but stay out of the coverage check, `tally` input, the decision list and every count except the
Canaries line.

Estimate the cost from the real row and file counts: tokens per step times the provider's published
price. Show it, get one approval and a cap (default 1.25 times the estimate). Record spend per step for
`tally`; if you cannot see real spend, record your token estimate and label it estimated. Reaching the cap
stops the run cleanly; it resumes from the state folder.

## 2. Describe

Pack rows into slices with `slice` (whole files, by byte size). Give each worker one slice and the
worker brief in ROWS.md, in a fresh context. Check each returned slice with `verify --check ids` and
`verify --check rows`. Re-send a failing slice once, then split it in two, then mark it BLOCKED. Blocked
slices are counted in the report, never dropped silently.

## 3. Map domains

Run `strings` over the rows. With the most capable model, derive one list of canonical domains from those
strings (a sample stratified by folder if they do not fit one context), then freeze it. Map the strings
to it in batches of about 500. A string that fits nothing goes to an unmatched list you review and add to
once. Run `verify --check map`; it must pass. Save the mapping. It is append-only, domain IDs are
permanent, and the next run maps only new strings, so its metric compares with this one.

## 4. Group

Run `group` over the rows and the mapping. It groups `utility`, `method` and `framework-bound` rows that
share a job (canonical domain plus `domain_out`) or a name stem, logs stems too common to group, and drops
duplicate and subset groups. Components, handlers and overrides stay in the manifest, ungrouped. Add
groups from any optional helper, each counted separately in the appendix.

Merge two groups that share two or more members when the result fits the cap of 25 members or 150 KB of
source; record a `keep` pair for overlaps you cannot merge. Never chain groups through shared members.
Split a group over the cap by normalised signature (ignore nullability and parameter-object wrapping),
then by verb, then by the most capable model reading the rows. Add one more group holding the most
typical member of each part, so the parts are still compared; if it finds VARIANT or SAME, the parts are
one family in the decision list. Run `verify --check groups`; it must pass.

## 5. Judge

Calibrate on real pairs, then judge every group from source, as [reference/JUDGE.md](reference/JUDGE.md)
describes: anchor, SAME, VARIANT or DIFFERENT per member, a predicted behaviour table, residual
regrouping, the canonical copy. Judge in priority order (groups whose members span several files, then
by importers), so the cap cuts the least important groups. Only source decides a verdict.

## 6. Run side by side

Run the top 10 real groups and every group holding a canary, as [reference/RUN.md](reference/RUN.md)
describes: probe the zone and clock, run copied members in the bare runtime, mark cells run or predicted,
set CONFIRMED, REFUTED or BLOCKED.

## 7. Report

Write it as [reference/REPORT.md](reference/REPORT.md) lays out, and hand back its path, header and
decision list.

## Check

Plant four canaries in step 1b, self-contained, each copied from a real function in the package:
1. A date formatter, renamed and rewritten, with one changed edge (`""` instead of a dash for empty),
   written as a private top-level const in a component-style file.
2. A byte formatter rewritten in a different style (a reduce where it loops), named to share no stem with
   any real function (`humanReadableSize`), so only the same-job key can catch it.
3. An error-message helper, renamed, with one changed fallback text.
4. A negative: a function sharing a real helper's vocabulary but doing another job.

If the package has no date, byte or error helper, copy from the largest groups' families instead. The
judge never sees the canaries during calibration. The first three are known VARIANTs, the fourth a known
DIFFERENT: this is how you prove the check can fail. **The run fails**, and the report says so above the
header, when any of these happens:
- a positive canary is not grouped with its source, not judged VARIANT, or its planted difference does
  not show in the run table;
- the negative canary is judged SAME or VARIANT;
- `verify --check coverage` fails, or any other `verify` check fails at its step;
- none of the top 10 groups ran although at least one had a runnable member;
- the user supplied a list of known copies and any is missing from every group (name the step that lost
  it).

A run that could not perform one of these checks has failed it.

## If you cannot run work in parallel

Run the same steps in order, one slice at a time. The state folder is the progress record: a slice is
done when its output file passes `verify`, so a run stopped at any point resumes by asking the tool what
is missing. Expect hours, not minutes. The report header names the state folder so a later session can
find it.
