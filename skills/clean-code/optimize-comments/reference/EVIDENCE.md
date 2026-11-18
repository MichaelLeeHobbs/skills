# Evidence for the hard calls

Read this when a verdict depends on what a test proves, what an agent needs, or whether a comment can
drift.

## Why delete by default

A comment costs reading time on every read, and agents reread files often within one task. A comment
that restates the code gives an agent nothing it would not get from the code, and the day the code
changes without it, the comment tells the agent something false. Agents act on what they read. The
expected value of a restating comment is negative, so it goes without needing proof of harm.

A comment that carries a fact the code does not own has the opposite profile: the agent cannot get the
fact anywhere else, and the fact does not change when the code does. That is what the keep test
selects for.

## What can drift and what cannot

Ask who owns the fact. If the code owns it (what a function does, what a loop iterates, what a
variable holds), a comment about it is a second copy that can disagree with the first: Delete. If
something outside the code owns it (a vendor's limit, a spec, a runtime defect, a decision the team
made), the comment is the only copy in the codebase: it can be wrong, but it cannot drift from the code
because the code does not state it.

A caller rule sits between the two. "Throws NotFound when hard-deleted" is owned by the function's
contract. It can go stale if the contract changes, but a contract change is a deliberate, visible
event, unlike an edit to a loop. Keep caller rules that the types cannot express, and prefer moving
them into the types (a result type, a branded unit type, a better name) when code changes are allowed.

## When a test really carries a comment

A test carries a comment only when all of these hold:
- it exercises the behaviour the comment protects, read from the assertion, not from the test's name;
- it fails if someone makes the change the comment warns against;
- its name or assertion message states the reason, so an agent that breaks it learns why instead of
  "fixing" the test.

If the first two hold and the third does not, the test protects the behaviour but not the reason. An
agent that breaks it may update the test to match. Rename the test or add the assertion message (code
change), or keep the one-line comment.

## What an agent needs from a comment

Agents read the code, the types, the callers and the tests. They are good at recovering what the code
does. They cannot recover:
- why an obvious simpler version is wrong;
- facts from outside the repository;
- which of two plausible behaviours is the intended one;
- which oddities are deliberate.

Those are the four rule-1 kinds. Anything else, the agent already has.

## Published API docs are different

A published package's doc comments are read by a doc generator and shown to users who never open the
source. There they are product, not commentary, and they are a fixed exception. This applies only to
the exported surface of a package that is actually published, not to every exported symbol in an
application or a private monorepo package.

## Comments that are code

Some comments are read by tools as code: JSDoc type annotations in JavaScript checked by a type
checker, Python type comments, doctests, and runnable doc examples. Removing them changes types or
drops tests. Step 5's checks catch a removal; treat such comments as fixed exceptions from the start.

## Age does not decide

An old comment is not stale because it is old, and a new comment is not useful because it is new. A
comment fails the keep test on what it says, not on when it was written. Stale TODO markers are judged
by issue state and history, which is triage-todos' job.
