# Picking the tickets for a batch

Use this when the user asks for a batch without naming the tickets. When they name them, still run the
exclusions below and say which named ticket fails one, rather than building it.

## Rank

Read the open tickets and rank them by three things together: a clear fix, a small diff, and no decision
embedded in the ticket. For each pick give one or two lines: what it is, why it is cheap, and what would
make it expensive.

Then give a second, shorter list: tickets that look small but are not, each with its hidden cost (a
migration, a shared contract, a screen several roles use, a fix that needs a product answer). Being told
what to skip is worth as much as the pick list.

Before ranking a ticket as cheap, check its claim against the current code. A ticket written months ago
may already be fixed, or may describe code that has since moved.

## Leave out

- **No description**, or no stated expected behaviour. The reporter has to say what should happen.
- **Acceptance criteria that only open a question**: "decide whether", "benchmark first", "investigate".
  That is design work, not batch work.
- **Already taken**: in progress for someone else, with its own open pull request, or listed in another
  open batch's pull request.
- **Deliberately deferred**: a follow-up dated for later, or waiting on another ticket that has not
  shipped.
- **Risky to release with others**: a data migration, a security change, anything the project would
  roll back on its own. It ships alone, so a rollback takes nothing else with it.

## Size and group

- About a day of work for the whole batch. A bigger batch takes longer to review and is more likely to
  be held by one failing ticket.
- One area where you can. Tickets in the same packages keep the pipeline's scope narrow and the review
  coherent.
- Two unrelated areas make two batches.

## Confirm

Show the pick list, the skip list and the proposed grouping, then stop. Build nothing until the user
confirms the set. If they change it, the confirmed list is the batch; a ticket added later is a new
confirmation, not a quiet addition.
