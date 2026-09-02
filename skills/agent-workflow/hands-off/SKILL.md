---
name: hands-off
description: >-
  Prepare a project for an unattended build-out, then hand the run to whatever continuation mechanism
  your agent provides. Use once per project when the user hands over design authority and wants the thing
  built from its spec with little input, saying "let it run overnight", "build this out while I am away"
  or "hands off". Fits an unpublished library or a personal project, anything they will test and review
  after it exists rather than steer while it is written. NOT for production work, and not for a project
  whose spec is still being argued about.
disable-model-invocation: true
---

# Hands-off build-out

**This skill prepares. It does not run the build.** Running unattended needs a mechanism your agent
either has or does not.

Run this once per project. When the queue empties, the project graduates to a normal workflow.

## What the run needs, and what to do if you do not have it

Unattended means the agent keeps going after it would otherwise hand control back. Prose in a skill
cannot make that happen. An agent told "do not stop" still stops, because stopping is not a decision it
makes, it is what happens when a turn ends.

A mechanism that actually works has three properties:

1. It re-invokes the agent when a stated condition is still unmet.
2. It judges that condition from something it can actually observe.
3. It survives a session being resumed.

**If your agent has one**, prepare everything below and hand it the completion condition from step 5.

**If it does not**, everything below is still worth doing. A frozen queue with per-item checks, a
delegation contract and a decision log turn a supervised multi-session build-out into a series of
resumptions rather than re-explanations. You lose the unattended part, not the method.

## Before you start

- **Permissions.** An unattended run stalls on the first approval prompt. Confirm the run can actually
  proceed without a human, and say so plainly if it cannot.
- **A fresh session.** Context exhaustion tends to destroy whatever is tracking the run's state. Do not
  start a build-out in a session that is already long.

## 1. Read before you plan

The spec, the roadmap, open pull requests, the actual state of the code. Work out what "built" means for
this project and where the line is today.

Take the time. A bad queue is a bad run, and the queue is frozen once it is set.

## 2. Freeze the queue

Write an ordered list of the items between here and done, each with a **stated check** that proves it: a
test command, a build exit code, a file that must exist. Put it somewhere stable, for example
`docs/build-out/queue.md`.

**The queue is frozen at this point.** You may not add to it or drop from it during the run. If the agent
being graded also owns the finish line, a struggling run will quietly redefine done and it will look like
success.

Work discovered mid-run goes to a separate file that does **not** gate completion, and becomes the
user's next conversation with the project.

Show the queue to the user before going further. This is the one thing they should look at, and the only
approval this skill asks for.

## 3. Set up the record

**A decision log.** Every decision that would otherwise have been a question. Four fields:

- **Decided.** What you chose.
- **Why.**
- **Rejected.** The alternative, and what beat it.
- **Reversal.** What undoing this later costs. This is the field that tells the user which entries
  deserve their attention, out of a list they did not watch being written.

**A found-work file.** Discovered work, explicitly out of scope for this run.

**Say where each kind of record goes**, or the run writes all of them everywhere. An unattended agent
with no reviewer justifies itself in prose beside the code. Step 6's contract gives each fact one home.

## 4. Write the resume block

Add a short block to whatever file your agent loads at the start of every session, because it is the
only thing a cold session reads on its own:

```
Mid build-out (started <date>, last completed: <item>).
Frozen queue: docs/build-out/queue.md
Decisions:    docs/decisions.md
If no unattended run is active, tell me to restart it using the line at the top of the queue file.
```

Keep the date and the last-completed item current during the run. A resume pointer describing last
week's state is worse than none, because it will be believed.

Remove this block when the build-out completes.

## 5. Write the completion condition

**Design the condition against what your continuation mechanism can actually observe.** A condition the
judge cannot evaluate is not a condition, it is a wish.

If the judge only sees the conversation, a condition depending on the contents of a file is unevaluable,
and the run's reporting discipline has to be designed alongside it. That is why the condition below asks
for the queue state to be printed every turn. It moves the evidence into the only place the judge can
see.

Something of this shape, stored at the top of the queue file so a resume can find it:

```
Every item in docs/build-out/queue.md is checked off with its stated check passing.
Print the full queue state and the current time at the end of every turn, so this is
judgeable from the transcript alone. Finishing an item means starting the next one,
never stopping. Do not start background work that outlives a turn.
Follow docs/build-out/RUN.md.
```

Conditions that have failed, or would: a single pull request going green, "the library is done", and
anything the judge would have to open a file to check.

## 6. Write the run contract

Write a contract addressed to the agent doing the run, for example `docs/build-out/RUN.md`, and point
the completion condition at it so it is re-read on every resume.

Copy [reference/RUN-CONTRACT.md](reference/RUN-CONTRACT.md) and fill in the project specifics. It holds
the delegated-authority statement, the five reasons to stop, and the rules about background work and
going idle. Two of its lines are the ones a well-behaved agent violates by default: everything not on the
stop list is yours to decide, and going idle before the queue is empty is a failure, even a tidy one.

## On completion

Remove the resume block. Write a final digest of what was built and decided. Hand the user the
found-work file as the starting point for normal work on the project.

## It is working if

The user reads the decision log and disagrees with a couple of entries at most, none of which turns out
to be a decision they were better placed to make. And the run ended because the queue emptied, not
because it stopped.
