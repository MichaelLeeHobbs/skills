---
name: find-dead-css
disable-model-invocation: true
description: >-
  Use for "find dead CSS", "which styles are unused", "can we delete these classes", "audit unused CSS
  rules", "shrink our stylesheet safely", "re-run the dead CSS audit". Crawls every route of a running
  copy of the app in each planned state, logs every class, id and attribute name that ever appears, and
  reports a CSS rule as dead only when it never matched and no file references it; then proves the
  delete list by rebuilding without it. Has a static-only mode whose findings are marked unproven.
  Expensive and user-invoked. NOT for unused JavaScript, purging a utility framework's generated
  classes, CSS-in-JS injected at runtime, or deleting the rules for you.
---

# Find dead CSS

Find the CSS rules a web app ships but never uses, prove each one, and hand back a delete list grouped
by source file. A rule is DEAD only when the crawl never showed it matching and no file references it.

**The test.** A selector matches an element only if every class, id and attribute name it requires is
on that element. So a required token that never appeared on any element, in any reached cell of the
crawl, proves that selector never matched there. Record a token log in the browser. Do not add rule
coverage, media emulation or forced pseudo-states: the test needs none of them, and any browser works.

**What it writes.** In the target repo, only its catalog folder ([reference/REPORT.md](reference/REPORT.md#catalog)).
It edits no code and commits nothing. Builds, logs and scripts go in a work folder outside the repo.

## Prerequisites

Ask these before any cost, in one message, and stop on any missing answer:
- **A safe host.** A running copy of the app on loopback, a `.localhost` or `.test` name, or a host the
  user types for this run and states holds no real data and sends no real mail or SMS. Never production.
- **A build command and environment** that point at that host and hold no upload or deploy tokens.
- **Roles and credentials**, supplied as environment variable names or a sign-in state file in the work
  folder. Never in the plan or the catalog.
- **Use outside this repo.** Is any of this CSS used by other repos, a published package, CMS or
  markdown content, emails or server templates elsewhere? Unknown counts as yes. See
  [reference/REFERENCES.md](reference/REFERENCES.md#outside-use).
- You can run commands, write files, and drive a browser from a script. Without browser automation,
  offer static-only mode (below) instead.

State before approval: source text goes only to the model provider you already use; the crawl sends no
page text to it; the browser reaches only the approved host; the app's own server calls (mail, payment,
third parties) are not guarded by this skill and are the user's to disable.

## Roles

You coordinate and hold the counts the tool prints. The tool decides every verdict. Drafting the plan
needs a capable model; the crawl itself runs with no model in the loop. If you can run work in parallel,
run crawl cells in several browser contexts; otherwise run them in order.

## 0. Build and prove the tool

Implement [reference/ALGORITHM.md](reference/ALGORITHM.md) to satisfy
[reference/CONTRACT.md](reference/CONTRACT.md) in the work folder, in any runtime. Run every fixture in
`reference/fixtures/`. **If any fixture fails, stop and report which.** Never edit a fixture.

## 1. Inventory

Record the commit. Build with the user's command in a detached checkout in the work folder, with source
maps on. Parse every built stylesheet with a real CSS parser, flattening nesting, and write one `rule`
record per style rule with its sheet, source file and line (from the source map; `""` and 0 when
unmapped). Count what is out of scope by reason: at-rules other than style rules, runtime CSS-in-JS,
sheets the user names as vendor. Run `members`. Every built stylesheet must appear in the inventory or in
an exclusion count; say the counts.

## 2. Plan the crawl

Draft the plan from the router configuration, end-to-end tests, component stories and mocks, as
[reference/PLAN.md](reference/PLAN.md) lays out: every route planned or excluded with a reason, each
state a short list of steps with an `expect`. Run `verify --check plan`; it must pass. Show the user one
screen: routes, cells, states per route, mocks, estimated wall time and model cost, the host and the
guard. Get one approval and a spend cap (default 1.25 times the estimate). Record the approval in the
catalog's `history.jsonl`.

## 3. Prove the driver

Generate the crawl driver and token log from [reference/INSTRUMENT.md](reference/INSTRUMENT.md). Run it
against the self-test page that file specifies. **If the logged token set or the blocked-request list
differs from the expected one in any way, stop.** Do not crawl the app with an unproven driver.

## 4. Crawl

Replay every cell. A cell is reached only when every step found its target, the `expect` held and the
URL is the route; retry a failed cell once, then record it blocked with a reason. Record per cell its
status and the stylesheets loaded; keep one seen-token set for the run. Plant the live canaries (see
Check) as INSTRUMENT.md describes. Reaching the cap stops cleanly; the work folder resumes it.

## 5. Static references

Take only the tokens that never appeared in the crawl. Build the corpus and run `refs` over it as
[reference/REFERENCES.md](reference/REFERENCES.md) describes: exact matches, string fragments that could
build the name, and CSS-module classes by their local name in the files that import the module.

## 6. Classify

Run `classify` over the members, refs, seen tokens, plan, cells, foreign sheets and canaries. Exit 1
means a problem record printed: a canary misbehaved, a route had no reached cell, or more than 5% of
cells were blocked. Each is a run failure. Verdicts: DEAD, KEEP (referenced), SEEN (appeared, so built at
runtime), UNDECIDABLE (only element names), UNPROVEN with a reason. Rules roll up to DEAD or TRIM (some
members of a selector list dead), files to DEAD_FILE.

## 7. Prove the delete list

In a fresh work-folder copy, delete every DEAD rule and TRIM member from the source. Mark any you cannot
remove cleanly (`@extend` targets, mixin bodies, rules a source map placed in a shared partial) `manual`
and leave them in. Rebuild with the same command, inventory both builds as `before` and `after` member
keys, add one `expect` per removed member, and run `proof`. Exit 0 is CONFIRMED. Problems are REFUTED
items: put their rules back to UNPROVEN `proof`. If the build cannot run, the proof is BLOCKED and the
report calls the list unproven.

## 8. Report and save the catalog

Write the report and catalog as [reference/REPORT.md](reference/REPORT.md) lays out. Hand back the
report path, its header and the delete list summary.

## Static-only mode

When the browser cannot be driven or no safe host exists: skip steps 2 to 4 and 7, send every token to
`refs`, and run `classify --mode static`. No member is ever DEAD; candidates are UNPROVEN `static-only`.
The report header says `Mode: static-only` and `Crawl canaries: not run`, and has no delete list. Use it
to size the work before paying for a crawl, never as a list to delete from.

## Check

Plant these before step 4. They never enter the inventory counts, the delete list or the catalog.
1. **Dead row**: a rule `.zz-dead-<nonce>` added to the members. Expect DEAD.
2. **Built at runtime**: on the deepest state in the plan, the driver adds an element whose class is
   assembled from parts at runtime (`zz-built-` plus a number) and a matching row. Expect SEEN.
3. **Fragment**: a corpus file in the work folder holding a string fragment `zz-frag-` beside an
   interpolation, and a row `.zz-frag-alpha`. Expect UNPROVEN `fragment`.
4. **Guard**: the driver sends one POST and one third-party GET from the first cell. Both must be
   aborted by the rules INSTRUMENT.md names.

Pass the first three to `classify` as `canary` records. **The run fails**, and the report says so above
the header, when any of these happens:
- any fixture fails, or the driver self-test differs from its expected output;
- `verify --check plan` or `classify` prints a problem;
- canary 4 was not aborted, or any request outside the guard reached a host;
- a rule the proof REFUTED is still on the delete list.

A check that could not run has failed. In static-only mode, canaries 2 and 4 cannot run, so the header
never says PASS for them.

## If you cannot run work in parallel

Run the cells one at a time. The work folder is the progress record: a cell is done when its record is
written, so a stopped run resumes with the cells that have none.
