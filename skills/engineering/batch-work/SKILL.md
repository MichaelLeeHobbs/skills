---
name: batch-work
description: >-
  Build several small tickets as one batch: each ticket on its own branch cut from one disposable batch
  branch, merged back locally, then one review, one test run and one pull request for the lot. Use when
  the user hands over a block of tickets or asks for a batch of easy ones, saying "do these five
  tickets", "batch these up", "give me a batch of easy bugs", "one PR for all of these" or "stack me
  some branches". NOT for a single ticket, which keeps its own branch and pull request, and not for a
  feature that still needs design or a ticket that asks someone to decide something.
---

# Batch work: several tickets, one pull request

Every pull request pays for a full pipeline run on each push, and every merge to the base usually earns
its own release. Five small tickets shipped one by one pay that five times. A batch pays it once, while
each ticket keeps its own branch and its own merge commit, so any one of them can still be found,
reviewed or taken back out.

**The project's own rules win.** If the project documents how it branches, names things, tests, reviews
or moves tickets, follow that and use this skill only for what it leaves silent. **Never start a batch on
your own initiative**: it commits hours of work the user has to review and release, so the user picks the
set.

## The shape

The commands here assume the project uses git. On another version control system, use its equivalents.

```
batch-<yyyy-mm-dd>-<slug>      one branch off the base, the only one that gets a pull request
  ├─ <key>-<slug>              cut from the batch, merged back with git merge --no-ff
  ├─ <key>-<slug>
  └─ <key>-<slug>              cut from the batch head when it needs a ticket already merged in
```

- **Name the batch** `batch-<yyyy-mm-dd>-<slug>`, where the slug names the theme (`grid-polish`,
  `db-health`). Keep it flat: some tools reject a slash in a branch name.
- **Name each ticket branch** with its ticket key, lowercased, and a short slug (`abc-123-fix-sort`).
  Each ticket's commits carry only its own key.
- **The batch is disposable.** It lives for one block of work and is deleted once it merges. Never keep
  a standing integration branch; the base stays the only long-lived branch.
- **Never open a pull request into the batch branch.** It can start a pipeline, which is the cost the
  batch exists to avoid. Ticket branches reach the batch by a local merge.

## 1. Pick the set, then stop

If the user named the tickets, read each one. If they asked for a batch of easy ones, rank the open
tickets by clear fix, small diff and no decision embedded, and list the ones that look small but are not.
Leave out a ticket with no description, one whose acceptance criteria hand someone a design choice, one
already being worked or in another open batch, and one that carries a risky release. Keep it to about a
day of work in one area. Details in [reference/PICKING.md](reference/PICKING.md). **Show the list and wait
for the user to confirm it.**

## 2. Map files, then group

For each confirmed ticket, work out the files it will actually touch. Then:

| Situation | Ticket branch |
|---|---|
| File sets disjoint | Cut from the batch, built in parallel, merged back in any order |
| File sets overlap | Built one after another; cut the later ticket from the batch head after the earlier one merges |
| One ticket needs another's change | Cut it from the batch head after that ticket merges |

Report the grouping before writing code. Unrelated areas make two batches.

## 3. Build each ticket in isolation

Cut the batch from a freshly fetched base. Cut each ticket branch from the batch, in its own working
copy (`git worktree add`) when more than one ticket is in flight. Move each ticket to the project's
in-progress state when its build starts.

**If you can run work in parallel**, give each ticket in a parallel group to its own worker with the
brief in [reference/WORKER-BRIEF.md](reference/WORKER-BRIEF.md). The coordinator does no ticket's
coding; it owns the batch branch, the merges, the review, the test run, the pull request and the tickets.

**If you cannot**, build the tickets one after another, each on its own branch, switching back to the
batch to merge each one before starting the next. Everything else in this skill stays the same.

Write each ticket's tests on its branch but do not run them there. They run once, with every other
ticket's, in step 6. For a new security, access or scope guard, break the fix during that run and watch
its test go red, then restore it.

## 4. Integrate each ticket as it lands

1. **Read the diff** and check it against the ticket's acceptance criteria. A worker's green report is
   not evidence; verify the important claims in the source.
2. **Send wrong work back** to whoever built it, with what is wrong. Do not fix it on the batch.
3. **Merge it into the batch**: `git merge --no-ff <key>-<slug> -m "<KEY>: <summary> (batch merge)"`.
   One merge commit per ticket keeps each ticket removable.
4. **Resolve conflicts in the batch**, and recheck shared behaviour even when git reports none: two
   tickets can each be right and wrong together. A conflict that changes what a ticket does goes back to
   that ticket's branch.
5. **When the base moves**, merge it into the batch, never into a ticket branch. That merge's conflict
   resolution is the only change made directly on the batch. Cut later tickets from the batch head.

## 5. One review over the whole batch

When every ticket is merged, run one review of the batch diff against the base, by a reviewer with fresh
context who built none of it. Give it each ticket's acceptance criteria and which merge brought in which
ticket, not the build narrative. Tell it to check commit messages' claims against the code.

**Fix each finding on the owning ticket's branch**, then merge that branch into the batch again. A fix
committed on the batch lands under no ticket. A finding that spans tickets goes to the ticket whose change
made it true. Do not ask for a second review of the fixes unless the user does.

If no fresh reviewer is available, say so in the pull request and ask the user for one. A self-review is
not independent.

## 6. One test run over the batch

Run every test any ticket wrote or changed, plus the project's typecheck and lint for each touched
package, in one run on the batch. Save the output to a file and record the exit status. Fix a failure on
its ticket's branch, merge it in again and rerun only what failed. No full suites unless the project's
policy says so; the pipeline is the full gate.

## 7. One pull request

Push the batch only when it is ready, since each push to an open pull request reruns its pipeline. Open
one pull request to the base. Its title names every ticket key, then the theme. Its description lists
each ticket with its acceptance check ticked and the evidence beside it, any ticket dropped and why, and
the test command with its result. The shape is in [reference/CHECK.md](reference/CHECK.md).

Fix a pipeline failure on the owning ticket's branch, merge it in and push once.

## 8. Merge, then keep each ticket honest

Merge when the user says to, with a merge commit, never a squash: a squash collapses the per-ticket merges into one
and leaves every ticket branch looking unmerged. Release once, then verify each ticket on its own and
record its evidence on that ticket.

Move each ticket only as far as the project's lifecycle allows. Merged is not deployed, and deployed is
not verified. A ticket whose change cannot be observed yet stays where it is, with a note saying why.

**Clean up** after the merge: fetch the base, remove every ticket and batch working copy
(`git worktree remove`), and delete the merged ticket branches and the batch, locally and on the remote.

## Dropping a ticket

A batch is as fast as its slowest ticket. A ticket that fails and will not be fixed quickly leaves the
batch rather than holding it. How you drop it decides how it comes back: follow
[reference/DROPPING.md](reference/DROPPING.md). Keep its branch, and leave the ticket in progress with a
note naming the branch and how it was dropped.

## Stop and ask

Stop for an irreversible action (a force push, a data delete, a production change), a product call no
ticket settles, a ticket that contradicts the project's rules, or a batch grown past what the user
confirmed. Batch the questions, each with your default.

## Check

Run [reference/CHECK.md](reference/CHECK.md) before handing the pull request over, and its last check
after cleanup. It passes only when the batch's first-parent history is nothing but `--no-ff` ticket
merges (plus base merges), every ticket branch is an ancestor of the batch, every ticket in the pull
request is ticked with evidence, the saved test output covers every touched package with exit zero, and
no working copy or branch from the batch is left except dropped tickets' branches. A check that cannot
run counts as failed, not skipped.
