# Worker brief

Give each worker building one ticket of a batch everything below. A worker starts with none of the
coordinator's context, so the brief is all it knows. Do not copy design discussion into it, only facts
and decisions.

## What the brief holds

- **The ticket.** Its key, title, description and acceptance criteria, word for word.
- **Where to work.** The working copy path, the ticket branch name, and the base revision it was cut
  from. Tell the worker to confirm the branch and that revision before its first edit.
- **What it owns.** The files and folders it may change. Anything else is off limits.
- **What it must not touch.** The other tickets' files, the batch branch, the project's main checkout.
  Name them. An edit outside the owned set is sequenced, not raced.
- **What to read first.** The project's context file, contributing guide and any project skill or doc
  that covers the area, by path. Mark which facts you verified and which are guesses.
- **Decided, do not reopen.** Choices already made for this ticket or the batch.
- **Patterns to copy.** Existing files that already do the same kind of thing.
- **Tests.** Which tests to write or change. The worker does not run them: the batch's single run does.
  It hands back the list of test files or names it wrote, so the coordinator can include them.
- **Commits.** Commit only owned paths, on the ticket branch, with only this ticket's key in each
  message. The message says what was wrong, why this fix, and what was rejected. No push, no pull
  request.
- **What to hand back.** Changed files, commit hashes, the tests written or changed, anything it could
  not do, and anything in the brief that contradicts a project rule. A contradiction is reported, not
  built around.

## Working rules to include

1. Stay in the supplied working copy. Check the branch before every commit.
2. Do not start, stop or reuse servers the user runs. A temporary server uses a free port and is stopped
   before handing back.
3. Do not merge, rebase onto, or edit another ticket's branch.
4. If the ticket cannot be done as written, stop and say why rather than delivering something else.

## When a result comes back

- Read the actual diff, not the report.
- Check it against the acceptance criteria and the owned file list.
- If it is wrong, send it back to the same worker with what is wrong. The coordinator does not fix it.
- If it is right, merge it into the batch (step 4 of the skill).

## Without parallel workers

Use the same brief as your own checklist for each ticket, one at a time. The isolation still matters: a
ticket built on its own branch can still be reviewed, dropped and merged on its own.
