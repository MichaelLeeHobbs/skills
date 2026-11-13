---
name: find-component-reinvention
disable-model-invocation: true
description: >-
  Use for "find duplicate components", "how many status badges do we have", "we built the table three
  times", "audit UI reinvention", "which empty states / confirm dialogs / date pickers are copies",
  "re-run the component audit". Finds UI widgets built several ways across a front-end package, groups
  them by what they show, and proves how the copies differ by rendering each one in the same states and
  measuring the pixel difference side by side. Keeps a catalog in the repo so re-runs reuse it. Expensive
  and user-invoked. NOT for duplicate helper functions (use find-reinvention), visual regression testing
  of one component over time, a pull-request review, or merging the copies.
---

# Find component reinvention

Find every widget a front-end package builds more than once, prove how the copies look different in the
same state, and draft what stops the next copy. A shared class or name proposes a group; only source and
a measured render decide it.

**What it writes.** In the target repo, only its catalog folder ([reference/CATALOG.md](reference/CATALOG.md)).
It edits no code and commits nothing. Everything temporary goes in a work folder outside the repo.

## Prerequisites

Stop before any cost and say which is missing:
- You can run commands and write files.
- The framework has a parser or template compiler you can drive.

For the visual half you also need a browser you can drive from a script without a window, and the repo's
build toolchain already installed. Without them, run the static fallback below.

**Where code goes.** Source goes only to the model provider you already use. Never send a screenshot or
sheet to a model: the tool measures them.

## Roles

You coordinate. You hold the plan and the tool's counts, never the rows or the pixels: the tool reads and
writes those files. Start each step from the tool's output with a fresh context. Workers describe rows
(a cheaper model is enough); splitting, judging and adapters need the most capable model available to
you. With one model, use it for everything. Start workers in waves no larger than your agent's limit on
concurrent work. If you cannot start fresh contexts, continue in one and say in the report header that
steps and calibration passes were not independent.

## 0. Build and prove the tool

The tool does the bookkeeping and the measuring a model must not do for itself: slicing, grouping,
checking returned rows, coverage, cell accounting, pixel difference, looks, evidence and the report's
counts. Implement [reference/ALGORITHM.md](reference/ALGORITHM.md) to satisfy
[reference/CONTRACT.md](reference/CONTRACT.md) in the work folder. Run every fixture in
`reference/fixtures/`. **If any fixture fails, stop and report which.** Never edit a fixture to make it
pass, and never continue with a partly passing tool.

## 1. Inventory

Record the commit and read all source at that commit. Enumerate every component with the parser,
following [reference/ROWS.md](reference/ROWS.md), count each in-scope file with the pattern, and run
`verify --check coverage`; it must pass. If find-reinvention's catalog exists, cross-check against its
component rows as ROWS.md describes. If this skill's catalog exists, run `reuse` as CATALOG.md describes.

## 1b. Canaries and budget

Write the canaries (see Check) into one file in the work folder and enumerate it the same way. Keep their
row IDs in a separate list: they go through every step but stay out of coverage, `tally`, the decision
list, the catalog and every count except the Canaries line.

Estimate the cost from the real counts (describe, judge, adapters, render) at the provider's published
price. Show it with the three facts RENDER.md "Before anything is built" names, get one approval and a cap
(default 1.25 times the estimate), split into one share per phase. Re-estimate after step 3 and ask again
only if it passes the cap. A phase that reaches its share marks its remaining units BLOCKED `cap_reached`.

## 2. Describe

Pack rows into slices with `slice`. Give each worker one slice and the worker brief in ROWS.md. Check each
returned slice with `verify --check ids` and `verify --check rows`; send rejected rows back once with the
problem named, then count what is still rejected as BLOCKED. Run `verify --check rows` over all rows at
the end: more than 10% `other` fails the step.

## 3. Group

Run `group`. It puts the eligible rows of each widget class in one group and flags classes over the cap.
Split oversize classes and run `verify --check groups` as [reference/JUDGE.md](reference/JUDGE.md)
describes; it must pass.

## 4. Judge

Calibrate, then judge every group from source as JUDGE.md describes: SAME, VARIANT or DIFFERENT against an
anchor, a look label per member per state from [reference/STATES.md](reference/STATES.md), residual
regrouping, wrappers, the canonical copy. Judge groups with members in several folders first, then by
import sites.

## 5. Render

Follow [reference/RENDER.md](reference/RENDER.md) in order: the cut, adapters for planned members only,
the export and build under its safety rules, the harness and browser, the containment and calibration
controls, two captures per cell, pixels extracted straight to files. Any static fallback trigger ends
this step.

## 6. Measure

Run `diff` once per group. Read outcomes, pairs, looks and evidence from its output only, build the
sheets, then run the after-step check in RENDER.md; it must pass.

## 7. Report and save the catalog

Write the report as [reference/REPORT.md](reference/REPORT.md) lays out and the catalog files as
CATALOG.md lists them. Hand back the report path, the header, the decision list and the sheet paths.

## Check

Plant four canaries in step 1b, each copied from a real component in the package:
1. **Colour variant.** A badge copy (prefer a hand-rolled member), renamed, with one state's colour
   changed to one of near-equal brightness, at least four times the tool's colour threshold away.
2. **Twin.** An exact copy of a real member, reformatted and renamed, whose adapter is its source's
   adapter byte for byte.
3. **Name-blind rewrite.** An empty state rebuilt with a name sharing no word with its source, renamed
   props, different markup structure, and one word changed in its default text.
4. **Negative.** A component that shares a badge's look and vocabulary but shows a person's initials.

If the package has no badge or empty state, copy from the two largest groups instead. The judge never
sees the canaries during calibration. **The run fails**, and the report says so above the header, when:
- canary 1 is not grouped with its source, not judged VARIANT, or its diff against its source is not
  noticeable in exactly the changed state;
- canary 2 is not judged SAME, or any pair with its source has a differing pixel;
- canary 3 is not grouped with its source, not judged VARIANT, or not noticeable in its default state;
- canary 4 is judged SAME or VARIANT with any badge;
- `verify --check coverage` or any other `verify` check fails at its step, or `diff` reports a problem
  you could not resolve;
- the visual half did not run (any static fallback trigger), or no real group has two members rendered
  `ok` in one state, or more than half the planned real cells are not `ok`;
- the after-step check finds a change in the live tree;
- the user supplied a list of known copies and any is missing from every group (name the step that lost
  it).

A run that could not perform one of these checks has failed it.

## Static fallback

When the visual half cannot run, still run steps 0 to 4 and 7. Every member's evidence is BLOCKED, every
finding says "unproven", the header's Visual proof line says FAIL with the trigger, and the run fails.
Canaries 1 to 4 are still checked for grouping and verdicts.

## If you cannot run work in parallel

Run the same steps in order, one slice and one group at a time. The work folder is the progress record:
a unit is done when its output passes its check, so a stopped run resumes by asking the tool what is
missing.
