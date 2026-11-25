---
name: srs-verify
description: >-
  Prove or disprove that the code meets its Software Requirements Specification (docs/srs): start from
  each Accepted requirement and its Verify method, assume Not met, find the evidence, and write verdicts
  (Met, Partial, Not met, Regressed, Cannot verify) to docs/srs/trace.md. Ships srs-coverage, a Node
  script that maps requirement IDs to test names and rewrites the README summary. Use for "verify
  AUTH-USR-03", "verify the auth area", "are we done against the SRS", "re-verify everything Met". Never
  edits requirement text. NOT for writing requirements (srs) or debating them (srs-debate).
---

# SRS verify

You are the sceptic at acceptance. For each requirement you assume it is Not met and look for evidence
that would convince someone who did not build it. The code never tells you what the requirement means;
the requirement tells you what to look for in the code.

## 0. Read the conventions and pick the scope

Read `docs/srs/README.md` in full: its Conventions section defines the rows, the Verify methods and the
verdicts. Then settle the scope with the developer, or take it from the request:

- one ID;
- one area or interface spec;
- every Accepted requirement;
- a re-verify sweep of every row `trace.md` marks Met, to catch drift.

Only Accepted rows get verdicts. Proposed, Deferred, Rejected and Superseded rows are out of scope.

**Independence.** Whoever built the work never marks it Met. If you wrote or changed the code under
verification in this session, hand verification to a fresh context if your agent can start one (a new
session or a separate worker given only this skill, the SRS and the repo). If it cannot, you may record
any verdict except Met; where the evidence would support Met, record Cannot verify with the note
"verifier built this work; needs independent verification" and your evidence.

## 1. Run the coverage script

From the repo root, with every folder that holds tests:

```
node <this skill's folder>/scripts/srs-coverage.mjs docs/srs --tests <test folder>... --json
```

`covered` maps each ID to the test names that cite it: those are your candidates, not your evidence.
`uncovered` lists Accepted rows with Verify Test and no citing test, by priority: each starts as Not met
unless you find a test the naming missed. Findings for unknown or superseded IDs are tests to rename;
list them in the report. Exit 0 or 1 both mean the script ran; exit 2 means wrong arguments, so fix and
rerun. If Node is not available, say the script did not run and find citing tests by searching the test
folders for each ID (hyphenated, and with underscores for languages that forbid hyphens in names).

## 2. Judge each requirement

Take the requirement's words, list every condition in them (actor, trigger, number, window, outcome),
then look for evidence of the kind its Verify column demands. [Evidence](reference/evidence.md) has the
full rules and examples.

- **Test**: a named test that asserts the behaviour, and passes when you run it. Run it with the
  project's own test command and record the command and the result. A test that cites the ID but
  asserts only part of the conditions is Partial; say which condition is missing.
- **Demonstration**: steps you ran against the running product and what you observed. Steps you could
  not run make it Cannot verify, never Met.
- **Inspection**: the file and line, at a named revision, that shows it. For a "never" rule, show the
  places it could be broken and why none does.
- **Analysis**: the reasoning written out in full, with the figures it rests on and where they came from.

Verdicts:

- **Met**: every condition has evidence of the required kind.
- **Partial**: some conditions have evidence; name the rest.
- **Not met**: the evidence shows it fails, or nothing supports it.
- **Regressed**: `trace.md` had it Met and it now fails. List these first in the report.
- **Cannot verify**: you could not obtain evidence (no environment, missing config, independence rule);
  always with the reason.

If the requirement itself is the problem (ambiguous, compound, untestable as written), do not edit it
and do not bend the verdict to fit. Give the best verdict the words allow and add a note for the `srs`
skill or the developer: the ID, the problem, and a suggested rewrite.

## 3. Write the results

Update `docs/srs/trace.md` following [trace format](reference/trace-format.md): one row per verified ID
with verdict, evidence, the date and revision checked, and notes. Replace rows for IDs you verified; keep
other rows unchanged; remove rows whose requirement is no longer Accepted. Never touch requirement rows,
area files or the change log.

Then refresh the README summary:

```
node <this skill's folder>/scripts/srs-coverage.mjs docs/srs --tests <test folder>... --write-summary
```

The last line says `summary written`; anything else means it was not, and the findings say why.

## Check

Before you report, reopen every row you marked Met and confirm its Evidence names one of: a test name
with the command run and its result, the demonstration steps and what was observed, a file and line at a
revision, or the written analysis. A Met row without that is Partial at best; fix it.

Then run the `srs` skill's format check if it is installed (a sibling `srs` folder holding
`scripts/srs-lint.mjs`): `node <srs skill folder>/scripts/srs-lint.mjs docs/srs` must exit 0. It also
fails Met rows with empty evidence. If it is not installed or Node is missing, say it did not run and check
`trace.md` by hand: every ID exists and is Accepted and appears once, every verdict is one of the five,
Met, Partial and Regressed rows name evidence, and Cannot verify rows say why.

## Report

Counts by verdict; Regressed rows first, then Not met and Partial P1 rows with what is missing; notes on
requirements for the `srs` skill; tests to rename; and the results of both checks.

## It is working if

Every Met row in `trace.md` names evidence a sceptic could re-run or re-read, no verdict came from the
author of the work, and the format check exits 0.
