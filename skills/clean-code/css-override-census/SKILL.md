---
name: css-override-census
disable-model-invocation: true
description: >-
  Use for "audit our CSS overrides", "how many !important do we have", "what breaks when we upgrade
  the component library", "how many z-index values do we use", "find selectors reaching into MUI/antd
  internals", "re-run the CSS census". Counts CSS that fights itself across a whole front end:
  `!important` by cause, selectors that target a library's internal class names (and which of those
  are already dead), deep descendant chains, specificity hot spots and the z-index ladder, then drafts
  a small set of z layers, tokens and a cascade layer order. Covers stylesheets, style blocks and
  CSS-in-JS; keeps a catalog in the repo for re-runs. Expensive and user-invoked. NOT for unused CSS,
  visual regressions, linting one file, or applying the fixes.
---

# CSS override census

Measure every override in a front end, prove which library overrides are already dead, and draft the
layers and tokens that make the rest unnecessary. A count says where to look; only source decides a
judgment, and only the tool produces a number.

**What it writes.** In the target repo, only its catalog folder ([reference/CATALOG.md](reference/CATALOG.md)).
It edits no code and commits nothing. Everything temporary goes in a work folder outside the repo.

## Prerequisites

Stop before any cost and say which is missing:
- You can run commands and write files.
- A real CSS parser for each stylesheet language in the repo, and the script language's parser for
  style blocks and CSS-in-JS ([reference/INVENTORY.md](reference/INVENTORY.md)).
- The repo's dependencies are installed, so library files can be searched locally.

**Where code goes.** Source goes only to the model provider you already use. The presence search reads
installed packages on disk and never downloads one.

## Roles

You coordinate. You hold the plan and the tool's counts, never the records: the tool reads and writes
the record files. Workers classify `!important` declarations, and a cheaper model is enough for that.
Judging prefixes and drafting proposals need the most capable model available to you. With one model,
use it for everything. Start workers in waves no larger than your agent's limit on concurrent work.

## 0. Build and prove the tool

Never count, compute specificity or check a mapping yourself; the tool does all of it. Pick a runtime.
Implement [reference/ALGORITHM.md](reference/ALGORITHM.md) to satisfy
[reference/CONTRACT.md](reference/CONTRACT.md) in the work folder. Run every fixture in
`reference/fixtures/`: the first line of each `.in` is the arguments, the rest is standard input, and
`.out` and `.exit` are the expected bytes and exit code. **If any fixture fails, stop and report
which.** Never edit a fixture, and never continue with a partly passing tool.

## 1. Inventory

Record the commit and read all source at it. Turn every in-scope source into `file`, `rule` and `decl`
records as INVENTORY.md describes: nesting flattened, object styles included, mixins counted but not
expanded. Write the independent `count` walk and run `verify --check coverage`. It must pass.

## 1b. Canaries and budget

Plant the canaries listed under Check in the work folder, under plausible paths, and inventory them
the same way with `canary` true. Write down the expected `canaries` record before going further.

Estimate the cost from the real counts (prefix judging, `!important` declarations to classify,
proposals), show it, and get one approval and a cap (default 1.25 times the estimate). Reaching the cap
stops the run cleanly; it resumes from the work folder.

## 2. Prefixes and presence

1. Run `census` with no `prefix` records. Hand its `head` records, the dependency manifest and the
   installed UI packages to the most capable model, which writes `prefix` records as
   [reference/JUDGE.md](reference/JUDGE.md) describes. Add the canary prefix.
2. Run `census` with the prefixes. For every `token` record, search the installed package's files for
   the exact class string and write a `presence` record.
3. Run `census` a third time with prefixes and presence. This output is the census of record.
   `unchecked_tokens` must be 0.

## 3. Causes

Run `slice` over the files holding `!important` declarations (canary declarations included, unmarked).
Give each worker one slice and the brief in JUDGE.md, in a fresh context. Run
`verify --check causes` over all returns; it must pass after one resend, with anything still missing
counted as BLOCKED. Under 40 declarations, classify them yourself and run the same check.

## 4. Propose

With the most capable model, draft the four proposals in JUDGE.md: z layers and tokens, a cascade layer
order, public-API replacements for internal selectors (dead ones first), and rewrites for the top 10
hot spots. Run `verify --check layers` on the z proposal; it must pass.

## 5. Report and save the catalog

Write the report as [reference/REPORT.md](reference/REPORT.md) lays out and the catalog files as
CATALOG.md lists them. Hand back the report path, the header and the decision list.

## Check

Plant these, each a plausible copy of the repo's own style:

1. A canary package in the work folder with one distributed CSS file defining `.zzcanary-button-root`,
   and the prefix `zzcanary-` (library `canary-pkg`, status `internal`) added in step 2. Search this
   package for the canary tokens exactly as for real ones.
2. A canary stylesheet in the repo's main stylesheet language with four rules:
   - `.zzcanary-button-root .canary-label` with `color: red !important` (cause `library`);
   - `.zzcanary-ghost-root` with any declaration (a dead token: the package does not define it);
   - `#canary-root .a .b .c .d` (five compounds, one id);
   - `.canary-motion { animation: none !important }` inside `@media (prefers-reduced-motion: reduce)`
     (the negative: cause `a11y-print`, never `library`).
3. If the repo uses object styles, a canary component whose style object has `zIndex: 7777` and a key
   `'& .zzcanary-button-root'` holding `color: 'red !important'` (cause `library`).

Expected `canaries` record: `files` 1, `rules` 4, `bad` 0, `important` 2, `internal_rules` 2,
`dead_tokens` 1, `deep_rules` 1, `id_rules` 1, `max_spec` `[1,4,0]`, `z_uses` 0, `z_named_uses` 0.
With the component canary: `files` 2, `rules` 6, `important` 3, `internal_rules` 3, `z_uses` 1, the
rest unchanged. Canary findings stay out of the report body, which shows only the Canaries line.

**The run fails**, and the report says so above the header, when any of these happens:
- the `canaries` record differs from the expected one in any field;
- a canary declaration gets the wrong cause, or the reduced-motion one is classed `library`;
- any `verify` check fails at its step, or `unchecked_tokens` is above 0 in the census of record;
- a head that matches an installed UI dependency has neither a prefix nor a reason in the appendix;
- the user supplied known overrides and any is missing from the `m` records or is not flagged as the
  user described (name the step that lost it).

A run that could not perform one of these checks has failed it.

## If you cannot run work in parallel

Run the same steps in order, one slice at a time. The work folder is the progress record: a slice is
done when its returns pass `verify --check causes`, so a stopped run resumes by checking which slices
have passing returns.
