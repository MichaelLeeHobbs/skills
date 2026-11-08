# Final check

Run this against the written report and the round log before the report goes to the user. Each item is
pass or fail. An item you cannot evaluate fails: a missing round log fails items 6 to 8, a file you could
not open fails item 1. There is no "not applicable" except where an item says so.

Write the result as a table, one row per item, with pass or fail and, for each failure, the exact line of
the report or log that failed. Either fix and re-run until every item passes, or send the report with the
failing rows at the top under "Check failures". Never send a report whose check you did not run.

## Report shape the check expects

```
## What is wrong today
- <claim> (path/to/file.ext:line)

## Recommended design
...

## Slices
1. <name>, <size>. Follows: <conventions sheet row>. Owns: <files or areas>.

## Won't build and deferred
- <item>. Returns when: <trigger>.

## Decisions
1. <question> Default: <answer>.
```

## Round log shape

One line per contribution: round, member, kind (opening, rebuttal, merge, review), and for a rebuttal
whose opening it attacked and the failure scenario in one line. Example:

```
R2 skeptic rebuttal -> maintainer: bulk action has no undo, a misclick clears 200 holds
```

## Items

1. **Every claim under "What is wrong today" cites a file.** Each bullet has a path. Open each path:
   the file exists and the cited lines say what the claim says. A bullet with no path, a path that does
   not exist, or a path that does not support the claim fails.
2. **Every slice names its convention and its files.** Each slice has a non-empty "Follows:" that matches
   a row of the conventions sheet, and a non-empty "Owns:". Two slices owning the same file fail unless
   the later one says it depends on the earlier.
3. **Every decision has a default.** Each numbered decision has a "Default:" with a concrete answer. "It
   depends" or "your call" fails.
4. **Every convention break is a decision.** For each slice, compare what it builds with the pattern in
   its sheet row. Any departure (a new component where the sheet names one, a route that skips the named
   auth pattern, a new table where the sheet says extend) must appear as a numbered decision. A departure
   with no decision fails.
5. **Every deferral has a trigger.** Each deferred item has a "Returns when:" naming an observable event
   or threshold. "Later" or "if needed" fails. Won't-build items need no trigger.
6. **Every builder opening was rebutted.** In the round log, each builder's opening has at least one
   rebuttal from a different builder with a concrete failure scenario. A design that no builder rebutted
   counts as an incomplete round: run the rebuttal, do not report.
7. **The required reviewers reviewed the final draft.** The architecture and performance guardians appear
   in the log against the last draft. The safety guardian appears when the brief names sensitive data or
   permissions, the data steward when data leaves the system, and at least two user personas when there
   is a screen.
8. **The depth was honoured.** The log has the review rounds the chosen depth requires, or a line saying
   a loop was cut short because the previous round raised nothing new.
9. **The request survives word for word.** The user's request appears verbatim in the shared brief, and
   every need it states is either in a slice or in a numbered decision proposing to drop it.
10. **Serial runs say so.** If the panel ran one member at a time, the report says the debate was serial.

## Self-test

Before trusting the check on a real report, run it once on this broken sample. It must fail items 1, 3, 5
and 6 for the reasons below. Others fail too, because the sample has no brief or conventions sheet. If
any of items 1, 3, 5 or 6 passes, you are reading the items too loosely: re-read them before checking the
real report.

```
## What is wrong today
- The list loads every row at once.

## Slices
1. Paged list, S. Follows: grid row. Owns: the list screen.

## Won't build and deferred
- Saved filters. Returns when: later.

## Decisions
1. Keep the old export button?
```

Round log: `R1 maintainer opening`, `R1 designer opening`, `R2 designer rebuttal -> maintainer: page size
ignores the user's saved preference`. The designer's opening was never rebutted, so item 6 fails.
