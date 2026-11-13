---
name: type-rhythm
disable-model-invocation: true
description: >-
  Use for "the type feels inconsistent", "how many font sizes do we actually use", "audit our type
  scale", "are we using the spacing scale", "which screens use off-scale sizes", "type rhythm audit",
  "re-run the type audit". Measures computed styles on rendered screens: which font sizes, weights and
  line heights each role (heading, body, label, caption, code) really uses, and whether margins, padding
  and gaps sit on the design scale, then lists the off-scale values with the sites and owners that set
  them. Needs a browser; without one it falls back to reading stylesheets and marks every finding
  unproven. Expensive and user-invoked. NOT for near-duplicate values declared in source (use
  find-token-drift), colour or contrast, or fixing the styles.
---

# Type rhythm

Turn "it feels inconsistent" into a list: "17 font sizes render, the scale has 6; these owners set the
off-scale ones".

**What it writes.** In the target repo, only its catalog folder ([reference/CATALOG.md](reference/CATALOG.md)).
It edits no code and commits nothing. Captures, built tools and every other temporary file go in a work
folder outside the repo. It never records page text, screenshots or URLs with real parameters.

**Boundary.** find-token-drift finds near-duplicate literals in source (`14px` and `0.875rem` declared in
two files). This skill measures rendered values per role. When a trace finds several near-duplicate
literals behind one rendered value, name find-token-drift in the report instead of listing them.

## Prerequisites

Stop before any cost and say which is missing. You can run commands and write files. Then pick a tier:
- **Full**: you can drive a browser, run a script you generate inside the page, and run a loop on this
  machine that captures every screen and writes the files itself.
- **Capped**: you can drive a browser only one action at a time, so each capture passes through your
  context. Run at most 40 captures and say so in the header.
- **Static**: no browser you can drive, or no way to run a script in the page. Follow
  [reference/STATIC.md](reference/STATIC.md); every finding is `unproven (static)`.

## Roles

You coordinate. You hold the plan and the tool's output, never element records: the collector writes
them to files and the tool reads the files. Use the most capable model available for the role map and
for tracing. If you can work in parallel, split captures and traces into batches.

## 0. Build and prove the tools

Pick a runtime. Implement [reference/ALGORITHM.md](reference/ALGORITHM.md) to satisfy
[reference/CONTRACT.md](reference/CONTRACT.md), and the collector from
[reference/COLLECTOR.md](reference/COLLECTOR.md), in the work folder. Run every fixture in
`reference/fixtures/`, the collector's in `fixtures/collector/`, after their page check. **If any fixture
fails, stop and report which.** Never edit a fixture to make it pass.

## 1. Scale

Take the scale the user names, else what the repo declares: custom properties, a theme object, a
utility-framework config, token files. Read them; do not grade them. Write `scale` records in hundredths
of a pixel, resolving rem against the root font size you measure in the browser. A size step names the
roles it serves when the source says so (a `caption` token serves caption). A step may apply to one
viewport.

No declared scale: run in distribution mode. Write no `scale` records, so nothing is graded, and put a
proposed scale first in the decision list. Never infer a scale and then grade against it.

If source declares font sizes with `clamp(` or viewport units, say in the header that fluid type is
present and graded only at the measured widths.

## 2. Screens and environment

Build the screen list and set up the environment as [reference/CAPTURE.md](reference/CAPTURE.md) says:
route patterns from the router, routes that act on load excluded, an independent route count, the
user's confirmation of the list; a test environment the user starts and signs in to once in a
dedicated browser profile; navigation by URL only.

## 3. Pilot

Capture 5 routes at one viewport. Run `unmatched`. With the most capable model, propose `rolemap`
entries for the listed site keys from the keys and the source alone, never from sizes, and seed it with
the component library's variant classes. Re-run `unmatched` until unassigned is under 5% of text
elements, or tell the user which keys stay unassigned.

## 4. Estimate and approve

Show captures planned (screens x viewports x variants, plus canaries), estimated time and model work, as
CAPTURE.md "Estimate" works it out. Get one approval and a cap. Reaching the cap stops the run cleanly;
it resumes from the work folder.

## 5. Capture

Run the capture loop (CAPTURE.md). Then run `verify --check captures` over the work folder. Recapture
every `todo` once. On `auth_lost` or `login`, stop and ask the user to sign in again; never type
credentials. The check must pass before step 7.

## 6. Canaries

Take the capture canaries and the element canaries as CAPTURE.md "Canaries" says, then run
`verify --check canaries`. It must pass.

## 7. Tally and trace

Run `tally` over the plan, scale, role map, exceptions and every capture. A `FAIL` gate means the role
map needs work: fix it and re-tally, never recapture for it. Trace each off-scale owner, in the order the
`owner` records give, as [reference/REPORT.md](reference/REPORT.md) "Tracing" says.

## 8. Report and save the catalog

Write the report as REPORT.md lays out and the catalog as CATALOG.md lists it. Hand back the report
path, header and decision list. Tell the user the work folder's path and size and offer to delete it.

## Check

**The run fails**, and the report says so above the header, when any of these happens:
- a fixture fails in step 0, or the collector's source contains a banned name (COLLECTOR.md "Limits");
- `verify --check captures` does not pass after the recapture;
- `verify --check canaries` reports any failed entry: a signed-out capture or an impossible route was
  accepted; an off-scale label (c1) or an inherited off-scale size (c3) graded on, or c3's owner was not
  its parent; an on-scale heading (c2) graded off; off-scale padding (c4) graded on; screen-reader text
  (c5) counted; a `display: none` element (c6) seen; a centred block (c7) not graded auto; a planted id
  (c8) not normalised;
- `tally` reports a `FAIL` gate in the final run;
- the user named an inconsistency they see, and no finding in the report covers it.

A run that could not perform one of these checks has failed it.

## If you cannot run work in parallel

Run the same steps in order, one screen at a time. The work folder is the progress record: a capture is
done when its file exists under its final name, so a stopped run resumes from the `todo` list.
