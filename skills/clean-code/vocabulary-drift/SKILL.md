---
name: vocabulary-drift
disable-model-invocation: true
description: >-
  Use for "build a glossary of our domain terms", "do we call it study, exam or order?", "find
  vocabulary drift", "which names mean the same thing", "is patient the same as subject here",
  "audit our naming", "re-run the vocabulary audit". Finds concepts that go by several names across a
  repo (identifiers, types, schema, routes, UI text, docs), proposes one canonical name per concept,
  and flags names that mean different things in different places, citing the sites that prove each
  verdict. Keeps the glossary in the repo so re-runs reuse it. Expensive and user-invoked. NOT for
  renaming anything (it proposes, never edits), API contract mismatches between client and server,
  duplicate functions (find-reinvention), or prose style.
---

# Vocabulary drift

Find every concept a repo names more than once, every name that means more than one concept, and draft
one canonical name for each. Shared words and similar shapes propose a pair; only cited source decides
it, and a real distinction (an order produces studies; they are not one thing) must survive.

**What it writes.** In the target repo, only its catalog folder ([reference/CATALOG.md](reference/CATALOG.md)).
It edits no code, renames nothing and commits nothing. Everything temporary goes in a work folder
outside the repo.

## Prerequisites

Stop before any cost and say which is missing:
- You can run commands and write files.
- You can enumerate declarations in the repo's languages (a parser, or one pattern per declaration
  form), and you can write a second, independent count for each surface ([reference/SITES.md](reference/SITES.md)).

**Where code goes.** Source goes only to the model provider you already use. Nothing is executed.

## Roles

You coordinate. You hold the plan and the tool's counts; the tool reads and writes the record files.
Start each step from the tool's output with a fresh context. Mapping terms and judging need the most
capable model available to you; cutting snippets and running the tool need none. With one model, use it
for everything. Start workers in waves no larger than your agent's limit on concurrent work. If you
cannot start fresh contexts, continue in one and say in the report header that steps and calibration
judges were not independent.

## 0. Build and prove the tool

The tool does what a model must not do for itself: tokenizing and folding terms, counting sites,
sampling, checking coverage, mapping and citations, and the report's counts. Pick a runtime. Implement
[reference/ALGORITHM.md](reference/ALGORITHM.md) to satisfy [reference/CONTRACT.md](reference/CONTRACT.md)
in the work folder. Run every fixture in `reference/fixtures/`. **If any fixture fails, stop and report
which.** Never edit a fixture to make it pass, and never continue with a partly passing tool.

## 1. Inventory

Record the commit and read all source at that commit for the whole run. Put every tracked file in one
bucket. Extract sites on six surfaces (`code`, `type`, `schema`, `route`, `ui`, `doc`) and label each
with a context, as SITES.md describes. Count each file and surface a second, independent way and run
`verify --check coverage`. It must pass.

If the catalog folder already holds `concepts.jsonl`, the run is a re-run: follow CATALOG.md.

**A find-reinvention catalog**, if the repo has one: read its `domains.jsonl` and `mapping.jsonl` as
SITES.md "Seeds" says, and record a `seed` line per file for `tally`. If there is none, the header says
`Seeds: none` and every later step runs unchanged.

## 1b. Canaries and budget

Plant the three canaries (see Check) as SITES.md "Canaries" says, one file per surface in the work
folder, and extract them like any file. Keep their site IDs in a separate list. Run `terms` twice: once
on real sites only (every reported count comes from this run), once with canary sites added (mapping and
sampling use this one). Canaries stay out of the coverage check, the catalog, and every count except the
Canaries line.

Estimate the cost from the real term and candidate counts: tokens per step times the provider's
published price. Show it, get one approval and a cap (default 1.25 times the estimate). If you cannot see
real spend, enforce the cap in tokens and label spend estimated. Reaching the cap stops the run cleanly;
it resumes from the work folder.

## 2. Concepts and mapping

With the most capable model, read the term table (terms by sites, with their forms and top names) and any
seeds, and write a frozen concept list: ID, name, a one-line definition, and a distinguishing test
("placed once by a clinician; produces one or more studies"). Then map every required term to one or
more concept IDs or `not-domain`, in batches of about 300 terms answered by line number and ID. A term
with two senses maps to both (`order` to the imaging order and `not-domain` for sort order). Run
`verify --check map`; it must pass.

## 3. Candidates and samples

A candidate is a concept with two or more names, or a name mapped to two or more concepts. Write one
`want` per candidate and name, with `exclude` listing the generic full names you saw in the term table
(`sortOrder`). Run `sample`; its rank is the judging order. Cut a snippet per pick: the site line with
three lines either side. Workers never read whole files.

## 4. Judge

Calibrate, then judge every candidate in rank order from its snippets, as
[reference/JUDGE.md](reference/JUDGE.md) describes: SYNONYM, DISTINCT with a relation, HOMONYM with
sense rules, or GENERIC, each citing site IDs from its own sample. Judge the canary candidates in the
first batch so the cap cannot skip them. Stop at the cap and give `tally` one `candidate` record per
candidate, `judged` or `cut`.

## 5. Verify

Run `verify --check evidence` over the sites, the picks, the claims, the senses and the canaries'
expected verdicts. It must pass. Send a claim with problems back to its judge once with the problem
named; a claim still failing is dropped from the glossary and counted. Run `tally` over the evidence
output, the candidate statuses, the seeds and the spend.

## 6. Report and save the catalog

Choose canonical names and write the report as [reference/REPORT.md](reference/REPORT.md) lays out, and
the catalog files as CATALOG.md lists them. Hand back the report path, header and decision list.

## Check

Plant three canaries in step 1b, built from the repo's own highest-ranked concept, each with sites on
at least two surfaces and at least as many sites as the mapping floor:
1. **Synonym**: a coined name (`imagingCase` for study) used on a type and in code, in the way the real
   name is used.
2. **Homonym**: an existing name of that concept used in a new folder for another concept (`exam` for a
   scheduling slot).
3. **Distinct**: a child or attribute of the concept that shares its tokens and fields (`studyArm`
   holding a `studyId`) and must not be judged SYNONYM.

Write an `expect` record per canary candidate ID: SYNONYM, HOMONYM, DISTINCT. The judge never sees the canaries during
calibration. **The run fails**, and the report says so above the header, when any of these happens:
- `verify --check evidence` reports `canary_wrong` or `missing`;
- a canary name is absent from the canary `terms` run on a surface it was planted on;
- `verify --check coverage` or `verify --check map` fails, or `tally` reports a seed file not read in
  full;
- the user supplied known synonym or homonym pairs and any is missing from every claim.

A run that could not perform one of these checks has failed it.

## If you cannot run work in parallel

Run the same steps in order, one batch at a time. The work folder is the progress record: a batch is done
when its output passes its `verify` check, so a stopped run resumes by asking the tool what is missing.
