---
name: deep-code-review
disable-model-invocation: true
description: >-
  Run an exhaustive, file-by-file review of a whole service, package or directory by splitting it into
  disjoint slices, giving each to its own reviewer that reads every assigned file in full, verifying the
  load-bearing findings against the source, and merging into one severity-tagged report grouped per
  file. Use for "deep review", "extremely thorough review", "file-by-file review", "audit this
  service", "review everything under <path>", or any review too large for one pass, especially when the
  user says not to bias them about what to look for. NOT for a quick diff or pull-request review, and
  not for a single file.
---

# Deep code review

Reviews a whole codebase area at a depth one context cannot reach: split it into disjoint slices, give
each to its own reviewer that reads every assigned file in full, verify the top findings yourself, merge
into one report. The output lists **every file** with its findings, or "No issues found", so nothing is
silently skipped.

This is fan out, read everything, verify, merge. It is not a sampling review. It routinely surfaces
committed secrets, silent-failure paths, race conditions, redaction holes, and documentation that lies
about the code, because every file is actually read.

**This is expensive.** It is deliberately user-invoked. Do not start one on your own initiative.

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

**Keep the report out of version control** unless the user says otherwise. It is an artifact, not a
deliverable.

If the user said not to bias them on what to look for, asking about the location is still fine. Asking
what to focus on is not.

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
whole tree. Overlap wastes effort and produces duplicates. A gap means a file went unreviewed and the
"every file covered" promise is a lie. Check the union equals the tree before dispatching.

A single very large file can own most of a slice. Put the biggest files in their own or lighter slices.

## 3. Dispatch one reviewer per slice

Start them all at once so they run concurrently. Use the most capable model available to you. **This is
the one place not to economize:** a cheaper model misses the subtle async, redaction and race findings
that justify the whole exercise. Finding an unreported bug is open-ended judgment, which is exactly what
the cheaper tiers are worst at.

Each reviewer gets the same rubric and differs only in its assigned file list. The full prompt template,
including the evidence ladder and the required output shape, is in
[reference/REVIEWER-PROMPT.md](reference/REVIEWER-PROMPT.md).

Tell the user how many reviewers you dispatched and what each covers. Then wait. Do not predict or
fabricate results. Give a one-line highlight as each returns so the user sees progress.

**If you cannot run reviewers in parallel,** the method still works and the slicing matters more, not
less. Do the slices sequentially, and start a fresh context per slice rather than carrying the previous
slice's findings forward. Carrying them forward is what makes a sequential review converge on whatever
the first slice found. Expect it to take proportionally longer, and do not reduce the number of slices
to compensate, because that is the same as skipping files.

## 4. Verify the load-bearing findings yourself

Before writing the report, read the actual anchor lines for every CRITICAL and the most consequential
HIGH findings, especially any that several reviewers converged on. Convergence raises confidence, but
verify anyway. For any committed-secret claim, confirm the file is really tracked and the value is a
live literal, because that finding outranks everything else and has to be right.

Give every finding you check exactly one verdict. The vocabulary is closed on purpose. Pick one, do not
invent a softer word.

- **CONFIRMED.** You read the anchor lines and the claim holds. Mark it verified in the report.
- **DOWNGRADED.** Real but less severe. Restate at the correct severity and say why.
- **REFUTED.** You checked and it is wrong. Drop it, but note it if a reviewer argued it forcefully, so
  the next reviewer does not re-raise it.
- **BLOCKED.** You could not check it. Say so, name what would settle it, and keep it in the report at
  its claimed severity flagged unverified.

**The anti-laundering rule.** BLOCKED ranks *better* than a soft CONFIRMED. Never write CONFIRMED for
something you pattern-matched, inferred from a name, or "checked" by re-reading the reviewer's own
prose. That disguises an unverified claim as a verified one, and a CRITICAL the user trusts because it
says verified is worse than one honestly marked unverified. If you are tempted to write CONFIRMED
without having opened the file, the verdict is BLOCKED.

**Before dropping a finding, name why it is a false positive.** Reviewers over-report and filtering is
this pass's job. The recurring shapes:

- **Nitpick gravity.** A reviewer that found nothing serious inflates nits to fill the space. If a
  slice's findings are *all* low-severity style preferences, the diagnosis is "this area is clean". Say
  that instead of passing through a list of cosmetics.
- **Hypothetical versus actual.** The failure needs an input the system cannot produce. Ask what
  actually calls this.
- **"I would have written it differently."** A preference wearing a bug's clothes. The most common false
  positive there is.
- **Premature-abstraction warnings.** "This should be extracted", with no defect behind it.
- **Missing context.** The guard exists one layer up and the reviewer did not look. Check the caller
  before dropping *or* keeping.

Do not apply this filter to security and correctness findings by default. Be readier to keep a plausible
injection or data-leak finding flagged uncertain than to drop it for tidiness. The filter exists to kill
noise, not to shrink the report.

## 5. Assemble the report

Structure, the sanity checks to run on the finished file, and one hard-won mechanical warning are in
[reference/REPORT-FORMAT.md](reference/REPORT-FORMAT.md).

The warning is worth repeating here because it costs real work when ignored: **do not build the report
with shell heredocs.** Apostrophes and backticks in review prose break shell quoting. Write the parts
with a file-writing tool and concatenate once.

## 6. Hand back

Give the report path, the headline, the severity tally, and the two or three things needing a human
decision. Offer to start fix branches on a chosen subset. Do not apply fixes unprompted. A deep review
is an assessment, and the user drives what gets fixed.

## It is working if

Every file in the tree appears in the report, at least one finding was refuted during verification, and
the cross-cutting themes name a root cause that no single file would have revealed.
