---
name: steelman
description: >-
  Settle a real either/or design question by having agents argue the opposing positions at full strength,
  test both against a ground-truth agent, then judge. Use for "steelman this", "argue both sides", "set
  up a panel", or when a binary design choice keeps getting deferred. NOT for open-ended shape questions,
  which have many answers rather than two.
---

# Steelman

Two positions, argued as well as each can be argued, tested against evidence gathered by an agent with
no stake in either. You judge.

## Gate: is it actually binary?

This is for a question with two rival answers where picking wrong is expensive. If the question is "what
shape should this be", there are not two positions, there are many, and this is the wrong tool. Generate
several independent designs and compare them instead.

If the debate reveals a third shape nobody argued, stop the debate and go there.

## Phase A: frame

The briefs are the contract. Get them right before spawning anything.

1. **State each position as a flat assertion**, not a question. "An action must return a patch" beats
   "should actions return patches?". A position nobody would defend is not a position.
2. **Write the rubric**: 3 to 6 concrete criteria that would decide it. Concrete: "a third-party action
   can be added without touching core". Vague: "cleaner". The judge sees the rubric, the debaters do not.
3. **Name the ground truth** the arguments must survive: real use cases, the existing code, how other
   libraries solved it. Whatever a claim could be checked against.

## Phase B: spawn

Start every agent in one batch so they run concurrently, in the background if your agent supports it.

- **One steelman per position.** Tell each: argue this position honestly and at full strength, do not
  hedge, do not present both sides, an agent is arguing the opposite and a judge will read both. Require
  it to name what it rejects and why. Its value is making the best version of its side exist.
- **One ground-truth agent.** Explicitly not arguing. It supplies the concrete catalogue the claims get
  tested against, then says which claims survive contact with it. **This is the agent that makes the
  method work.** Without it a debate is decided on rhetoric.
- **Optionally one designer** producing an independent proposal, for when the answer is that neither
  position is right.

Debaters must not see each other's output. Independent strength is the point, and cross-talk produces
convergence on whoever wrote first.

Vary the model across agents where you can, and judge on a different model family from the debaters.

## Phase C: judge

Read all of it end to end. For each claim, ask whether the ground-truth agent's evidence supports it.
Discard anything that is only well-written. Score against the rubric from Phase A, not against how
confident each agent sounded.

Then decide, and say what would change your mind. A decision with no stated failure condition is a
preference.

## Phase D: record

Write the decision, the losing case's strongest surviving point, and the reversal cost. If the project
keeps a decision log, it goes there.

## If you cannot spawn agents

Write each brief in a separate pass without re-reading the other, gather the ground truth before you
write either, and do not let the second brief answer the first. A sequential debate that cross-references
itself converges on whichever position you wrote down first, which is the failure the parallel version
exists to avoid.

## It is working if

The losing brief contains at least one thing you did not know before you spawned it, and the decision
turned on evidence the ground-truth agent supplied rather than on which brief read better.
