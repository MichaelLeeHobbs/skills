---
name: find-token-drift
disable-model-invocation: true
description: >-
  Use for "audit our design tokens", "how many greys do we use", "find hard-coded colours", "token drift",
  "which paddings are off-scale", "design system cleanup", "re-run the token audit". Inventories every
  colour, spacing, radius, font size, shadow and z-index in a front-end codebase (tokens, hard-coded
  values, theme overrides, inline styles), clusters near-duplicates by perceptual distance and scale
  closeness, and reports each cluster with call sites, a proposed token and whether the swap would show or
  break contrast. Works from source, no browser. Keeps a small catalog in the repo for re-runs.
  User-invoked. NOT for a lint rule in CI, a codemod that rewrites the values, visual regression testing,
  or auditing component duplication (use find-reinvention).
---

# Find token drift

Count every design value the code uses, measure how far each sits from the theme, and prove which swaps
are safe. A model never counts a value or computes a distance: the tool does, from source bytes, and the
model only judges intent.

**What it writes.** In the target repo, only its catalog folder ([reference/CATALOG.md](reference/CATALOG.md)).
It edits no code and commits nothing. Everything temporary goes in a work folder outside the repo.

## Prerequisites

Stop and say which is missing:
- You can run commands and write files.
- A runtime with arbitrary-precision integers to build the tool in.
- A parser for each style syntax in scope, or the hand-written fallback in step 3.

Source goes only to the model provider you already use.

## Roles

You coordinate and hold the tool's output, never the values. Workers write extractors and read source;
a cheaper model is enough for extraction, and the judge in step 6 needs the most capable model available
to you. With one model, use it for everything. Start each step from the tool's output in a fresh context.

## 0. Build and prove the tool

Implement [reference/ALGORITHM.md](reference/ALGORITHM.md) and [reference/COLOUR.md](reference/COLOUR.md)
to satisfy [reference/CONTRACT.md](reference/CONTRACT.md) in the work folder. Run every fixture in
`reference/fixtures/`. **If any fixture fails, stop and report which.** Never edit a fixture to make it
pass, and never continue with a partly passing tool.

## 1. Scope and setup

Record the commit and read all source at it (a detached checkout in the work folder, or a snapshot when
there is no version control). Detect which syntaxes the target uses with
[reference/SYNTAXES.md](reference/SYNTAXES.md). Find the root font size (`html { font-size: 62.5% }` gives
10px) for `--root-px`, the surface tokens (page and card backgrounds), and the scopes (CODEOWNERS
entries, else top-level folders). If the catalog has `config.jsonl`, start from it and say what changed.
Exclude generated, vendored and test files by path, and list the exclusions.

## 2. Tokens

Extract every token definition in every mode as `token` records, as SYNTAXES.md describes for each
source: CSS custom properties, SCSS and LESS variables, JS theme objects, Tailwind config or `@theme`,
design-token JSON. A token defined as another token is a `ref`. Each record carries the span of its
definition.

## 3. Occurrences

Write an extractor per detected syntax in the work folder, using a real parser where one exists. It
emits one `occ` per value site, as SYNTAXES.md describes: theme-scale uses are `ref`, literals are
`literal`, and every colour or length literal in a style context is an occurrence, with category `other`
for properties outside the six. For a syntax with no parser, hand-write a lexer and name the syntax in the
report header as lexed.

## 4. Prove the inventory

Run `verify --check occ` on the source, tokens and occurrences. Run `sweep` on the same source and
`verify --check coverage` with the occurrences, tokens and `ignore` records (comments, and literals that
are not style such as `href="#add"`). Both must pass. Then the tripwire: run coverage again with one real
occurrence removed. It must fail; if it passes, the check is broken and the run stops.

## 4b. Canaries

Write the canary file (see Check) in the work folder in the target's main token syntax, extract it with
the same extractors, and run steps 4, 5 and 7 on it in their own tool calls. Never mix its records into
the real run's input; they appear only on the Canaries line.

## 5. Cluster

Run `cluster` with the tokens, occurrences, surfaces and scopes. When a category has fewer than 3 token
values, the report leads with a proposed scale from the largest clusters.

## 6. Judge

Read [reference/JUDGE.md](reference/JUDGE.md). The judge reads source for the top 15 clusters per
category by uses, applies team decisions from the catalog first, and writes one `plan` record per value:
SNAP to a named token, NEW token, KEEP with an intent and a cited line, or SPLIT by role. It never writes a
number. More batches run only on request, each with its cost estimate.

## 7. Measure

Run `measure` with the cluster input and the plan. Rejected plan rows go back to the judge once with the
reason; rows rejected twice are dropped from the plan and listed as blocked in the report. Only a
CONFIRMED snap becomes a default in the decision list.

## 8. Report and catalog

Write the report as [reference/REPORT.md](reference/REPORT.md) lays out, the per-line change list to the
work folder, and the catalog files as CATALOG.md lists them. On a re-run, run `diff` against the saved
values first. Hand back the report path, its header and the decision list.

## Check

The canary file defines its own canary tokens (a neutral, a surface, a spacing step, a z-index) and uses.
Write the item 5 plan row yourself. Run `verify --check canaries` with one `expect` record per item below
and the canary run's output:
1. A canary token colour written in another notation: `exact`.
2. A neutral within 20 milli of the canary neutral: `snap`.
3. A neutral about 150 milli from every canary token: `lone`.
4. The canary neutral at an alpha more than 8/255 below 255: `lone`.
5. A text grey that just passes 4.5 on the canary surface, planned SNAP to a canary token within snap
   distance that does not (`#767676` to `#7a7a7a` on white): `measure` gives `REFUTED`.
6. A z-index one above the canary layer token: `token_plus_n`, distance 1.
7. A spacing value 1px off the canary step: `near`; and a 1px hairline: `hairline`.
8. One occurrence per detected syntax, written in that syntax (an `sx` multiplier, a Tailwind arbitrary
   value, a `var()`): extracted with the expected kind and category.
9. A chart palette array with one entry equal to a canary token: the judge plans KEEP `palette`.

**The run fails**, and the report says so above the header, when any of these happens: a fixture fails;
`verify --check occ` or `verify --check coverage` fails; the tripwire passes; any canary fails; the judge's
plan still has rejected rows after one resend and they cover more than 10% of judged uses. A run that
could not perform one of these checks has failed it.

## If you cannot run work in parallel

Run the same steps in order, one syntax extractor and one judge batch at a time. The work folder is the
progress record: a step is done when its tool check passes, so a stopped run resumes by re-running the
checks and continuing from the first that fails. If you cannot start fresh contexts, say in the report
header that the judge and the extractors shared one context.
