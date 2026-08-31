# Assembling the report

**Do not build the report with shell heredocs.** Apostrophes and backticks in review prose break shell
quoting, and you will lose work to it. Write the header and summary to the report path with a
file-writing tool, write each area's findings to its own part file, concatenate once, then delete the
parts.

Sanity-check the result: count the file headings, tally the severities, and tally the evidence levels. A
report whose CRITICAL and HIGH findings sit mostly at the bottom two evidence rungs is a report you have
not finished verifying. Go back to step 4.

Structure:

- **Header.** Date, scope, method, how many reviewers, and that findings were lead-verified.
- **Executive summary.** Lead with the single most important outcome, then a severity tally, then the
  cross-cutting themes. The same root cause reached from many files is the highest-signal thing you can
  report.
- **Verification note.** The anchors you confirmed, the verdict tally, and every blocked finding with
  what would settle it. **List what you refuted too.** Showing which alarming findings did not survive
  is what makes the survivors trustworthy.
- **Per-area, per-file findings.** Every file as a heading, "No issues found" where clean. The bulk.
- **A closing block of tasks for the user** if remediation needs a human: rotate a secret, make a breach
  call, decide on a history rewrite.

