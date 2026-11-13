---
name: pattern-census
disable-model-invocation: true
description: >-
  Use for "how many ways do we fetch data", "are we following our conventions", "pattern census",
  "convention coverage", "how consistent is our error handling / logging / permission checks / form
  validation", "re-run the pattern census". Counts every site of each cross-cutting job in a package,
  groups the sites into families by how they do it, and measures how many follow the one way the repo's
  agent context file, project skills, contributing guide or lint config states, with the off-pattern
  families and their owners. Expensive and user-invoked. NOT for duplicate helper functions (use find-reinvention), unused code, dependency
  overlap, or fixing the off-pattern sites.
---

# Pattern census

Count how many ways a package does each cross-cutting job, and how many sites follow the stated
convention: "data fetching: 6 families, 2,140 sites; C1 covers 61.0% to 61.8%; 3 off-pattern families
and their owners".

**What it writes.** In the target repo, only its catalog folder ([reference/CATALOG.md](reference/CATALOG.md)).
It edits no code, convention file or lint config, and commits nothing. Everything else goes in a work
folder outside the repo.

## Prerequisites

Stop before any cost and say which is missing:
- You can run commands and write files.
- The language has a parser with name resolution you can drive (a compiler or type-checker API). Without
  one the census cannot run; text search is never a fallback for counting.

**Where code goes.** Send source only to the model provider you already use. Run the scanner and the
tool locally. Never run repo code, start the application or install anything.

## Roles

You coordinate and hold the tool's counts, never the records: the tool reads and writes them. Readers
work in fresh contexts: a cheaper model labels audit samples and resolves unresolved hits; the escape
sample needs the mid or strongest tier; the most capable model classifies dependencies, settles
convention disagreements and rules on every audit or escape dispute. With one model, use it for
everything. Start readers in waves no larger than your agent's limit on concurrent work.

## 0. Build and prove the tool

Pick a runtime. Implement [reference/ALGORITHM.md](reference/ALGORITHM.md)
to satisfy [reference/CONTRACT.md](reference/CONTRACT.md) in the work folder. Run every fixture in
`reference/fixtures/`. **If any fixture fails, stop and report which.** Never edit a fixture to make it
pass, and never continue with a partly passing tool.

## 1. Conventions and jobs

Record the commit and read all source at it for the whole run. Read the convention sources and write
quoted records with allow and deny keys, as [reference/CONVENTIONS.md](reference/CONVENTIONS.md) says.
Pick the jobs as [reference/JOBS.md](reference/JOBS.md) says: those a source names, at most 5, plus any
the user names.

## 2. Sinks and markers

Build and freeze the sink table (JOBS.md): platform primitives, every manifest dependency classified
once, and the modules a convention names, whose files are opaque. Each sink belongs to one job. Compute
the definitions version (CATALOG.md).

## 3. Scanner

Generate the scanner in the work folder from [reference/SCAN.md](reference/SCAN.md). Run the scanner
cases through it and `close`, then `verify --check scan`. **It must exit 0 before the scanner touches the
repo.** Fix the scanner, never an expected row. Then scan the package at the commit.

## 4. Close and the gate

Run `close`. Plant the canaries (MEASURE.md) and scan them in the overlay. Estimate the cost from the
real counts: hits to resolve, families to audit, 300 escape files, tokens per read times the provider's
published price.

Show the user one gate before any spend: per job the free counts by family, the quoted conventions with
their keys, the tool's conduit list, exclusions (opaque files, tests and generated code skipped), the
estimate and a cap (default 1.25 times the estimate). Apply their edits to sinks, keys or conduits,
rescan (it is free) and continue only on their confirmation. An unattended run continues with `Patterns: UNCONFIRMED` in the header.
Reaching the cap stops the run cleanly; it resumes from the work folder.

## 5. Residual

Give each `unresolved` hit to a reader with its 40 surrounding lines: which job, if any, and which
marker. Write the answers as `disposition` records with the hit's `key`, and rerun `close`. If more than
5% of a job's hits stay blocked, `census` withholds its percentage; the counts still go in the report.

## 6. Measure

As [reference/MEASURE.md](reference/MEASURE.md) describes: the blind audit (`audit`), the escape sample
in up to two rounds, then `census` over the sites, conventions, strata and escapes. Check the canaries
and any known sites.

## 7. Owners, report and catalog

Resolve owners with `owners` (REPORT.md). Write the report as [reference/REPORT.md](reference/REPORT.md)
lays out and the catalog files as CATALOG.md lists them. Hand back the report path, header and decision
list.

## Check

**The run fails**, and the report says so above the header, when any of these happens:
- a tool fixture fails (step 0) or the scanner cases fail (step 3);
- `close` reports a problem that is still open at the report;
- `audit` fails after the one fix round, or ran without fresh contexts (`NOT BLIND`);
- `census` exits 1: a sample was not drawn, or a `closed` job still has an escape after round two;
- a canary is missing or lands in the wrong family, or the negative canary produces a site;
- a known site the user supplied is not found;
- a number in the report did not come from tool output.

A run that could not perform one of these checks has failed it. A withheld percentage is not a failure;
the report says why it is withheld.

## If you cannot run work in parallel

Run the same steps in order, one reader at a time. The work folder is the progress record: a step is
done when its tool command exits 0, so a stopped run resumes by rerunning the last command. Fresh
contexts still matter more than parallelism: without them the audit cannot be blind and fails.
