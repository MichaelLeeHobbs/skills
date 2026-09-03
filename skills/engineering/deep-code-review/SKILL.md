---
name: deep-code-review
disable-model-invocation: true
description: >-
  Run an exhaustive, file-by-file review of a whole service, package or directory by splitting it across
  parallel reviewers that each read every assigned file in full, then merging into one severity-tagged
  report grouped per file. Use for "deep review", "extremely thorough review", "file-by-file review",
  "audit this service", "review everything under <path>", or any review too large for one pass,
  especially when the user says not to bias them about what to look for. NOT for a quick diff or
  pull-request review, and not for a single file.
---

# Deep code review

Split a codebase area into disjoint slices, give each to its own reviewer that reads every assigned file
in full, verify the top findings yourself, merge into one report. The output lists **every file** with
its findings, or "No issues found", so nothing is silently skipped. This is not a sampling review.

**This is expensive and deliberately user-invoked.** Do not start one on your own initiative.

## When to reach for it

- The target is bigger than a comfortable single-pass read, roughly more than 15 to 20 source files.
- Thoroughness matters more than speed.
- The user explicitly does not want to be biased about what to look for. The reviewer prompt sweeps
  every dimension rather than hunting one bug class.

For a focused diff or branch review, use a normal review. For one file, just read it.

## 1. Scope and settle the output location

Enumerate the target's files and rough sizes so you can slice by cohesion and balance load. A file
listing plus a line count on the source, test and documentation files is enough to spot the giants.

Decide where the report goes before you start. If your setup records a standard location for review
artifacts, use it without asking. Otherwise ask once, offer sensible options, and settle it before
writing rather than blocking the review on it. Default name when nothing dictates otherwise:
`<target>-review-<YYYY-MM-DD>.md`.

**Keep the report out of version control** unless the user says otherwise.

If the user said not to bias them on what to look for, asking about the location is still fine. Asking
what to focus on is not.

**Read what earlier passes already settled.** Previous review reports, a list of declined findings, a
log of accepted trade-offs. Read them yourself and hand the reviewers nothing from them, so the sweep
stays unbiased. You need them at merge time instead: a finding that repeats a decision the project made
deliberately is not a finding. Note the previous pass's totals while you are there. The report opens
with the delta.

## 2. Slice into disjoint, cohesive groups

Aim for 6 to 10 slices, each fitting comfortably in one reviewer's context. Group by cohesion, not
alphabetically, so a reviewer sees a subsystem whole:

- Entry point, wiring, routing, lifecycle
- Each major subsystem, one significant module plus its collaborators per slice
- Cross-cutting libraries, split by concern: concurrency and state primitives separately from parsing,
  redaction and logging
- External process, network and database clients, plus configuration
- Tests, split the same way. Each test slice's reviewer reads the source under test too, and judges the
  tests against it
- Scripts, build and infrastructure config, and documentation as one slice, cross-checked against code

**Two rules make the contract:** every file lands in exactly one slice, and together the slices are the
whole tree. Check the union equals the tree before dispatching.

Put the biggest files in their own slice or a lighter one.

## 3. Dispatch one reviewer per slice

Start them all at once so they run concurrently. Use the most capable model available to you. **This is
the one place not to economize.** Finding an unreported bug is open-ended judgment, and the cheaper tiers
are worst at exactly that.

Each reviewer gets the same rubric and differs only in its assigned file list. The full prompt template,
including the evidence ladder and the required output shape, is in
[reference/REVIEWER-PROMPT.md](reference/REVIEWER-PROMPT.md).

Tell the user how many reviewers you dispatched and what each covers. Then wait. Do not predict or
fabricate results. Give a one-line highlight as each returns so the user sees progress.

**If you cannot run reviewers in parallel,** do the slices sequentially and start a fresh context per
slice rather than carrying the previous slice's findings forward. Carrying them forward is what makes a
sequential review converge on whatever the first slice found. Expect it to take proportionally longer,
and do not reduce the number of slices to compensate, because that is the same as skipping files.

## 4. Verify the load-bearing findings yourself

Before writing the report, read the actual anchor lines for every CRITICAL and the most consequential
HIGH findings, especially any that several reviewers converged on. Convergence raises confidence, but
verify anyway. For any committed-secret claim, confirm the file is really tracked and the value is a
live literal.

Give every finding you check exactly one verdict from a closed vocabulary: CONFIRMED, DOWNGRADED,
REFUTED or BLOCKED. Read [reference/VERDICTS.md](reference/VERDICTS.md) before you assign the first one.
Two of its rules are the ones skipped most often: BLOCKED ranks better than a soft CONFIRMED, so if you
are tempted to write CONFIRMED without having opened the file the verdict is BLOCKED; and a latent defect
filed as a note gets promoted, with the promotion stated in the report.

## 5. Assemble the report

Structure and the sanity checks to run on the finished file are in
[reference/REPORT-FORMAT.md](reference/REPORT-FORMAT.md).

**Do not build the report with shell heredocs.** Apostrophes and backticks in review prose break shell
quoting. Write the parts with a file-writing tool and concatenate once.

**Answer one question about the project, not the code.** What is it about how this codebase is built
that produces the findings you are holding? A tree full of guards that cannot fail is describing a
process that manufactures guards and never proves them. Documentation drift everywhere is describing a
project that writes prose where it should write tests.

## 6. Hand back

Give the report path, the headline, the severity tally, and the two or three things needing a human
decision. Offer to start fix branches on a chosen subset. Do not apply fixes unprompted.

## It is working if

Every file in the tree appears in the report, at least one finding was refuted during verification, and
the cross-cutting themes name a root cause that no single file would have revealed.

Across passes, it is working if the severity mix falls. A second pass that reports the same total as the
first with half the seriousness is telling you the code improved and the method is now dredging. That is
a result, not a failure, and it is the signal to stop running full passes and switch to reviewing
changes.
