# Assembling the report

**Do not build the report with shell heredocs.** Apostrophes and backticks in review prose break shell
quoting, and you will lose work to it. Write the header and summary to the report path with a
file-writing tool, write each area's findings to its own part file, concatenate once, then delete the
parts.

Sanity-check the result: count the file headings, and tally the severities, the evidence levels and the
classes. Three things to read off those tallies:

- CRITICAL and HIGH findings sitting mostly at the bottom two evidence rungs means you have not finished
  verifying. Go back to step 4.
- Any `PREFERENCE` or `OBSERVATION` that survived into the report should not have. Cut them.
- A report that is overwhelmingly `DRIFT` is describing a documentation problem rather than a code
  problem, and the summary should say so in those words.

Structure:

- **Header.** Date, scope, method, how many reviewers, and that findings were lead-verified.
- **Executive summary.** Lead with the single most important outcome, then the tallies, then the
  cross-cutting themes. The same root cause reached from many files is the highest-signal thing you can
  report.
- **Trend, when earlier passes exist.** This pass's counts beside the previous pass's, by severity. Then
  say what the shape means, because it is invisible from inside one report and it decides whether to run
  another. Falling severity with a flat total is a codebase that improved and a method now dredging for
  volume. Rising severity is a regression in the process that produced the code. Flat everything means
  the last pass was not acted on.
- **Verification note.** The anchors you confirmed, the verdict tally, and every blocked finding with
  what would settle it. **List what you refuted too.** Showing which alarming findings did not survive
  is what makes the survivors trustworthy.
- **Per-area, per-file findings.** Every file as a heading, "No issues found" where clean. The bulk.
- **A closing block of tasks for the user** if remediation needs a human: rotate a secret, make a breach
  call, decide on a history rewrite.

