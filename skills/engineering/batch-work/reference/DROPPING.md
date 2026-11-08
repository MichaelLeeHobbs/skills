# Dropping a ticket from a batch

Git treats a reverted merge as still merged. So the way a ticket leaves the batch decides how it can come
back. Pick by whether the batch has been pushed.

## Before the batch is pushed: rebuild without it

Nothing outside your machine references the ticket's merge, so take it out of history.

1. In the batch working copy, find the commit just before the ticket's merge:
   `git log --first-parent --oneline <base>..HEAD`.
2. `git reset --hard <that commit>`.
3. Merge the tickets that came after it again, each with `git merge --no-ff`, in the same order.

The dropped ticket's branch is untouched. It can later join another batch or go out on its own as an
ordinary branch.

## After the batch is pushed: revert its merge

Rewriting a pushed branch under an open pull request confuses reviewers and anyone who fetched it.
Revert instead.

1. `git revert -m 1 <the ticket's merge commit>` on the batch.
2. Push once, and ship the rest.

To bring the ticket back later, first revert the revert (`git revert <the revert commit>`) on the new
batch or on a branch cut from the base, then merge the ticket's newer commits. Merging the old branch
again without that step brings in only commits made after the original merge.

## Quick fix instead of a drop

If the failure is small and the owning ticket is clear, fix it on that ticket's branch, merge the branch
into the batch again and push once. Drop only when the fix is not quick or not clear.

## Either way

- **Keep the dropped ticket's branch.** Once a revert reaches the base, the base contains the ticket's
  commits, and a tool that deletes "merged" branches will delete it. Remove its working copy without
  deleting the branch.
- **Leave the ticket in progress** with a note: where its branch is, whether it was rebuilt out or
  reverted, and the revert commit if there is one.
- **Name it in the pull request description** under dropped tickets, with the reason.

## After a merged batch breaks in production

Each ticket is still its own merge commit on the base, so a fix forward or a revert can target the one
ticket that broke. Move only that ticket back in its lifecycle.
