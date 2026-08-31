---
name: write-tests
description: >-
  Write or fix a test without writing one that passes while proving nothing. Covers vacuous assertions,
  tests that encode the bug, green from two cancelling faults, unscoped queries, fixtures the product
  never produces, shared state between tests, sleeps instead of conditions, probe-and-skip fake passes,
  and mocks so broad the test asserts nothing about real code. Use whenever authoring a test, changing
  one, reviewing one, or asking whether a green suite actually means anything.
---

# Writing tests that mean something

A test suite has two failure modes. It can fail when the code is fine, which is annoying and gets fixed
within the hour because someone is staring at red. Or it can pass when the code is broken, which is
invisible and survives for months.

This skill is about the second one. Every trap in [reference/TRAPS.md](reference/TRAPS.md) is a real
incident where a green suite hid a live defect, and almost none were caught by reading the diff.

## The one question

> **If I broke the thing this test is named after, would this test fail?**

If you cannot answer yes, you have written documentation, not a test.

The habit that makes this cheap, and the single most valuable thing in this skill:

```
break the code the test names   ->  run that test  ->  expect RED
put it back                     ->  run that test  ->  expect GREEN
```

Thirty seconds, and it is the only evidence a green line means anything. Do it for every test you write
that guards something load-bearing. Not the whole suite, the specific test that names the behavior.

## Before you write

1. **Write down what the code is supposed to do**, then check that against the code. Most of these traps
   were caught by someone stating the intended behavior in a sentence and noticing the code disagreed.
2. **Ask what the code branches on.** Whatever it distinguishes, the fixture has to make those two things
   different. If you can swap them and the test still passes, the test is not about them.
3. **Ask which level the bug lives at.** If the fix was "add a middleware", a unit test of the handler
   proves nothing. Test where the wiring is.

## The traps, by shape

Full catalogue with worked examples in [reference/TRAPS.md](reference/TRAPS.md). The index:

**The assertion does not test the thing.** An assertion that would hold with the feature deleted. A
fixture that collapses the distinction under test. A fixture the product never actually builds. A query
matching more than you meant. The implementation copied into the test. A mock so broad that nothing the
production code computed is ever asserted on.

**Green for the wrong reason.** A test whose name states a policy nobody wanted. Two faults cancelling
out. Passing via a path you did not intend. Mocks that drifted from the code they stand in for.

**The suite lies about what ran.** Probe-and-skip, where a missing dependency turns into a pass. A file
that never ran at all, hidden in a count of passing tests. A document that says "must" with nothing
executing it. A guard with a hole in its own regex. A guard naming a structure that has since moved.

**Shared state and ordering.** Identity fixtures shared between tests. Assertions on state wider than
the test owns. Resetting some of the state but not all. One file depending on another having run first.
An exact count with no reset on the way in. Hand-assigned ports.

**Time and concurrency.** Sleeping instead of waiting for a condition. Timestamps as a uniqueness
source. Pinning which side of a race wins. A timeout tuned to a contended resource.

**Testing at the wrong level.** Unit-testing what only breaks when wired up. Asserting on a raw string
the production code never sees. Covering the function you changed rather than every call site.
Enumerating cases where a structural check would catch the next one. Asserting browser behavior in a
simulated environment that implements a subset. Reading one projection while meaning another. A
positional test that passes only because the fixture happens to fit on screen.

## Two rules that generalise the rest

**Prefer a check that catches the next one over a check that catches the one you found.** Enumerating
the three routes that leaked will not notice the fourth. A structural check over all routes will.

**A guard is code, so it needs the same treatment.** Break the thing the guard exists to catch, in
exactly the way the original incident broke it, and watch the guard go red. A guard that has never been
seen to fail is a second thing needing a guard.

## Before you open the PR

- [ ] **Break the fix and watch the right test fail.** The only step that distinguishes a test from a
      comment.
- [ ] **Mutation-check anything load-bearing.** For a guard, a projection or a scope filter, change the
      value the assertion depends on and confirm the test notices.
- [ ] **Confirm it passed via the path you meant.** Add a temporary failure inside the branch you think
      is running. If the test still passes, it is not running there.
- [ ] **Read the file-and-test split, not just the test count.** A file that failed to load reports zero
      failures.
- [ ] **Run the slow suite too** if there is one. Layout, real event capture, focus order and anything
      the simulated environment only approximates live there.
- [ ] **Grep your diff for the tells:** an assertion that would hold with the feature removed, a lookup
      with no scope, a fixture literal where a factory exists, a fixture whose two names are the same
      string, a sleep, a hardcoded port, an exact count, a new "must" in a document with no test behind
      it, and any claim about what a real browser or database does asserted against a simulation of one.
