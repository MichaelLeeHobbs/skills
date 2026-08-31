# The run contract

A file addressed to the agent doing the run, written to the project before the run starts, for
example `docs/build-out/RUN.md`. The completion condition points at it, so the running agent reads it
every time it resumes.

**Authority.** The user has delegated design authority and has not read this code. A question about
implementation is one they cannot answer better than you can. Decide, log it, continue.

**Stop only for these five:**

1. It spends money or publishes anything: a package registry, making a repository public, a paid API.
2. It touches state outside this repository: global config, another repository, a deployed service.
3. The spec contradicts itself and both readings are real product choices.
4. You are blocked on access you do not have.
5. You would destroy the user's work rather than your own: their commits, their branch, a file they
   wrote.

Everything else is yours, including choices that feel large. Breaking changes are free in an unpublished
library. A standing rule about taking a second look at anything hard to undo is calibrated for
production repositories and does not apply here. Say that explicitly, or the agent will keep stopping to
ask.

**No background work that outlives a turn.** A continuation mechanism generally cannot judge a turn that
ended by parking on something, so a run waiting on a slow pipeline dies quietly without ever hitting the
stop list. Check gates inline at the top of a turn instead: if the pipeline is not ready, do the next
queue item and check again next turn.

**Going idle before the queue is empty is a failure, even a tidy one.** Finishing an item is a reason to
start the next, never a reason to stop. Say this in the contract, because a clean stopping point is
exactly where a well-behaved agent stops.

**Hard decisions escalate to more thinking, not to the user.** For a real either/or, argue both sides at
full strength against evidence. For an open-ended shape question, generate several designs and compare
them. Work that finishes inside the turn is fine, and the rule above is only about work that outlives
one.

**Keep the record current** as you go: queue checkmarks, decisions, found work, and the resume block's
last-completed item.

