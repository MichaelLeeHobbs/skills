---
name: clean-code-steward
description: >-
  Use for "which clean-code skill should I run", "clean code scorecard", "how clean is this repo",
  "what's due", "start cleaning up this codebase", "run the next clean-code skill", "what have we
  measured so far". Surveys which of the clean-code skills apply to a repo, reads the shared run ledger
  they write, shows a scorecard of what is measured, unproven, clean or due, and hands off the one skill
  worth running next with its setup. Cheap and read-only. NOT for running an audit itself (it hands off
  to the skill), fixing findings, grading a repo against thresholds, or a single skill's own report.
---

# Clean-code steward

Seventeen clean-code skills are too many to choose from. The steward tells the user which ones apply,
what the ledger proves so far, and which one to run next. It measures nothing itself: every number comes
from a skill's own run record, and every status from the ledger tool.

**What it writes.** Nothing, unless the user asks to save the scorecard. It never writes a ledger line,
never edits a skill's files, and never commits. Its working files go in a work folder outside the repo.

## Prerequisites

- You can read files in the repo. Without that, stop.
- For the scorecard: you can run commands, to build and run the ledger tool and to read version-control
  history. Without that, give the Survey and the hand-off line only, show no scorecard, and say the check
  failed because the ledger could not be reduced. Never compute a status, trend or due flag by hand.

## Survey

Read-only, no budget, no question on the first screen.

1. Check whether each clean-code skill in [reference/SKILLS.md](reference/SKILLS.md) is available to
   you; ask once if you cannot tell.
2. Find the scope units. Repo-scope skills get `.`; package-scope skills get one unit per package.
3. Run each available skill's probe. Each unit is one of: **applies**; **needs setup** (name the missing
   thing, using the setup names in SKILLS.md); **not applicable** (print the evidence; the user may
   override in chat); **not installed** (list these on one line, naming the ones whose probe would hit).
4. Find the ledger as [reference/LEDGER.md](reference/LEDGER.md) "Where" says. If version control tracks
   the ledger but not the reports, say so (LEDGER.md "Sharing the ledger").

Probe hits rank; they are never findings. Never print "2 date libraries" from a probe.

## Status

Build and prove the ledger tool first: implement [reference/ALGORITHM.md](reference/ALGORITHM.md) to
satisfy [reference/CONTRACT.md](reference/CONTRACT.md) in the work folder, then run every fixture in
`reference/fixtures/`. **If any fixture fails, stop and report which.** Never edit a fixture, and never
use a partly passing tool.

Feed it the Survey units, the ledger lines, the report facts and the version-control facts, as LEDGER.md
"Building the tool's input" lists, and render its output as LEDGER.md "Scorecard layout" shows:

- Coverage first: "Measured X of Y", per package in a monorepo.
- One row per unit: status, value and metric, trend, last run, due ratio or rank, ledger line number.
- The tool's summary line: lines read, shown, duplicates, superseded, rejected, each rejected line named.
- The stamp: "from N lines through <latest at>", and any threshold the user changed in chat.

Show the scorecard on demand. Save it to `clean-code/scorecard.md` only when the user asks.

## Recommend

Take the due rows in the tool's `rank` order. Show the first as the pick and at most two runners-up.
Give each one why line built from facts: "never measured", "unproven: degraded (browser)", "31 commits
touched apps/web since the last run (threshold 25)", "45 days since the last run (threshold 30)".

The ranking, which the tool applies: never measured or unproven first; then failed or unverified; then
the largest due ratio, with unknown age first. Ties go to find-reinvention (three skills read its
catalog), then repo scope before package scope.

List `needs_setup` units apart, each with what is missing. They are never the pick.

When nothing is due, say so: "Nothing is due; the last change to a measured scope was <date>." Then name
the row nearest its threshold.

## Hand-off

The main path. For the pick (or the unit the user chose), print one paste-ready line:

```
Run the <skill> skill on <scope>. Setup: <copied from the skill's own prerequisites>. It appends its
run record to <ledger path> when done.
```

If you can load the chosen skill yourself and the user says yes in this sitting, follow it unchanged,
with its own approval, budget and check. Never chain a second skill after it.

On the next steward call, show what happened to the last hand-off: its new ledger line, or "handed off
<date>, not run yet". If a report is newer than the unit's latest ledger line, name both causes: the
installed copy of the skill predates the run record (update it), or the run stopped before appending.

## Check

The steward's run fails, and says so above the scorecard, when:
- any ledger tool fixture fails, or the tool could not be built or run;
- the summary's `read` differs from `shown + duplicates + superseded + rejected`;
- a scorecard row lacks its ledger line number, or shows a status, trend or due flag the tool did not
  output;
- a hand-off the user confirmed as done in this sitting left no new ledger line;
- the scorecard was asked for and not produced.

A check that could not run has failed. A scorecard from a failed check is not shown as current.

## Fallback

- **No way to run commands:** Survey by reading files, give the hand-off line, show no scorecard, and
  report the check as failed.
- **No version control:** records carry `commit: none`. Their age is unknown, so every measured unit
  is due; say that this is why.
- **Cannot tell which skills are installed:** ask once, then treat the answer as the installed list.
- **No ledger yet:** every applicable unit is unmeasured. Recommend find-reinvention first where it
  applies, and draft the `.gitattributes` line from LEDGER.md.
