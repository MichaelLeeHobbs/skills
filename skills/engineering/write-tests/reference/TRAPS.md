# The trap catalogue

Every one of these is a real incident where a green suite hid a live defect. They are grouped by the
shape of the failure, because the shape is what transfers between codebases. The specific technology is
incidental.

---

## 1. The assertion does not test the thing

### 1.1 The assertion that cannot fail

Two tests moved a node into a container and asserted on the flattened order of the tree. Moving a node
in or out of a container leaves flattened order unchanged, so both passed no matter what the move
function did.

```
// wrong: flatten order is identical whether the move worked or not
expect(flatten(next).map(r => r.key)).toEqual(['root', 'a', 'b'])

// right: assert the thing that actually changed
expect(findParent(next, 'b').key).toBe('a')
```

**Rule:** name the property the behavior changes and assert that. If the same assertion would hold with
the feature deleted, it is not testing the feature.

### 1.2 The fixture that collapses the distinction under test

A repeater component had two separate names: the key identifying the component, and the data key naming
the array it wrote into. Every fixture in the repository set both to the same string.

The consequence: the row-addressing design and its exact opposite produced byte-identical output across
911 unit tests and 65 end-to-end tests. A patched build of the alternative design was run and the whole
suite stayed green. The suite could not have caught the defect that prompted the question, which was
that a repeater whose two names differ silently discarded every keystroke in its rows.

The fix took three tokens. The fixture that could see the difference took longer to write than the fix.

Note this is not the same as 1.3. The fixture was one the product builds readily. It is producible, it
is realistic, and it is useless, because the two names it should have kept apart were the same string.

**Rule:** ask what the code branches on, then build the fixture so that branch is observable. If you can
swap the two values and the test still passes, the test is not about them.

### 1.3 Fixtures the product never builds

Every language test constructed a language as `{ code: 'en' }`. The real factory produces
`{ code: 'en', dialect: 'US' }`. So a remove button that compared a full language tag was broken for
every real document and green for every test.

**Rule:** build fixtures with the factory, or match what the factory produces. A fixture shaped more
simply than reality tests a product that does not exist.

### 1.4 Matching more than you meant

A contrast test selected style blocks by substring, so the light-theme selector also matched the
dark-theme one. Thirty-two assertions ran twice against the dark palette and never once against light.

```
// wrong: substring, so the light selector also matches the dark one
const block = css.slice(css.indexOf(selector))

// right: exact, and loud when a block disappears
if (!blocks.has(selector)) throw new Error('no block for ' + selector)
```

The same shape bites in a DOM. A text lookup started matching twice the moment a second control
appeared. A role lookup became ambiguous the moment a second panel grew tabs. A label lookup missed
entirely because a modified field announces itself with a suffix.

**Rule:** scope every query to the region you mean, and make the lookup throw when it finds nothing
rather than silently measuring the wrong thing twice.

### 1.5 The implementation copied into the test

If the test file contains a reimplementation of the behavior it is checking, both copies can be wrong in
the same way and the test will never say so.

**Rule:** assert against expected values written by hand, or against a fixture. Never against a second
implementation of the thing under test.

### 1.6 A mock so broad the test asserts nothing about real code

When every collaborator is mocked and every return value is stubbed, the assertions are about the stubs.
The production code could be deleted and the test would still pass.

**Rule:** at least one assertion per test has to be about a value the production code actually computed.

---

## 2. Green for the wrong reason

### 2.1 The test that encodes the bug

A validation suite contained a case asserting that a required field "accepts false and 0". That was the
bug: an unticked consent checkbox passed a submit. The test had been protecting it for months and the
type checker had no opinion.

**Rule:** when a test's name states a policy, check the policy is one the spec actually wants before you
make the test pass. A wrong claim defended by a green tick is worse than no test.

### 2.2 Green because two faults cancel

Localisation was verified by hand in a browser and worked. It worked because translations were written
into one bundle while the renderer read a differently-named one, and because adding a language corrupted
the default language name into exactly the name the renderer was reading. Two bugs, one visible pass.

**Rule:** a passing manual check is not evidence unless you can say why it passed. If the answer is "it
just did", go find the mechanism.

### 2.3 Passing via the wrong path

A test can exercise a fallback, a cache, or an early return and never reach the code you changed.

**Rule:** confirm it passes via the path you meant. Cheapest check: put a deliberate failure inside the
branch you believe is executing. If the test still passes, it is not executing there.

### 2.4 Mocks that drifted from the code they stand in for

A mock written against last quarter's signature keeps returning last quarter's shape. The suite fails in
a way that looks unrelated to its subject, or worse, passes.

**Rule:** when a suite fails in a way that looks unrelated to what it tests, suspect the mock before the
code.

---

## 3. The suite lies about what ran

### 3.1 Probe-and-skip, which fakes a pass

A suite needing a database probed for it and skipped when absent. On a machine without the database,
every test passed having asserted nothing, and the pipeline was green for weeks.

**Rule:** if the suite needs a dependency, fail at collection time with a message naming what is missing
and how to start it. A check that cannot run must fail, not pass. This is the worst item in this
document, because it scales: it hides every other trap here at the same time.

### 3.2 A file that never ran, reported as a failure

A file that throws while loading contributes zero test failures, because none of its tests exist yet. A
summary reading "12 files failed, 168 passed" alongside a healthy test count is hiding twelve files'
worth of coverage.

**Rule:** read the file-and-test split, not just the test count.

### 3.3 A document that says "must" with nothing executing it

A contract document listed accessibility obligations every implementation must satisfy. Nothing ran
them, and one implementation satisfied none of them.

Related: know what your tools do not check. An accessibility scanner that does not flag a reference
pointing at an id absent from the document will happily pass three tabs that all do exactly that.

**Rule:** if a document says something must hold, there is a test running it against every
implementation, or the sentence is a wish.

### 3.4 A guard with a hole in it

A guard existed to stop two documents drifting apart. Its regex matched "345 tests" but not
"345 unit tests", so a stale figure sat in both files while the guard reported green, in the same commit
that added the guard. Its link checker excluded any link containing a fragment, so every heading link
went unverified.

**Rule:** a guard is code. Break the thing it guards and watch it fail, or you have written a second
thing that needs guarding.

### 3.5 A guard naming a structure that has since moved

A guard enforced that no style rule reached past one of two named ancestors. A later refactor added a
wrapper one level deeper, so the exact rule that caused the invariant to be written in the first place
contained neither name, and all four assertions stayed green.

The guard was correct when the structure had one fewer wrapper. Nothing failed when the wrapper was
added, because a guard naming its scopes as strings cannot notice the scopes moved.

**Rule:** make a structural guard fail loudly on an unknown shape rather than pass quietly. Break it the
way the original incident broke the code, the same rule at the same place, and watch it go red.

---

## 4. Shared state and ordering

### 4.1 Shared identity fixtures

Two tests using the same user, tenant or record id will pass alone and fail together, or worse, pass
together for a while and then start failing when a third test mutates the shared row.

**Rule:** derive every identity from something unique to the test. A fixture that must be shared is
read-only.

### 4.2 Asserting on state wider than the test owns

A query over a cluster-wide catalogue returns rows created by every other database on the instance.
Green locally, red on shared infrastructure, or the reverse.

**Rule:** scope every such read to the current database, schema or tenant.

### 4.3 Resetting only some of the state

A test that resets the table but not the cache, or the cache but not the queue, leaves exactly enough
behind to make the next test's result depend on order.

**Rule:** enumerate every stateful thing the test touches and reset all of it, in shared setup rather
than per test.

### 4.4 Ordering dependence between files

One file changes a global setting and restores it after its assertions. An assertion fails, the restore
never runs, and a different file fails with an error that has nothing to do with it.

**Rule:** restore in a `finally`, not after the assertions.

### 4.5 An exact count with no reset on the way in

Asserting a collection has exactly three rows passes on a clean database and fails on the second run.
The same applies to taking a row with an unordered limit.

**Rule:** if a test asserts an exact count or takes an arbitrary row, it must reset on the way in, not
just on the way out. Cleanup after the fact does not help a test that ran second.

### 4.6 Hand-assigned ports

Two suites hardcoding the same port cannot run concurrently, and the failure looks like a network
problem rather than a collision.

**Rule:** bind port 0 and let the operating system assign one.

### 4.7 Clearing call history is not resetting implementations

Many mocking libraries offer two resets. One clears the recorded calls. The other also drops stubbed
return values, custom implementations and queued one-shot values. A test that stubs a failure, then a
later test that only cleared call history, inherits the failure. It fails or passes depending on which
test ran first.

**Rule:** know which reset your library's "clear" performs. When isolation needs fresh behavior, reset
implementations too and reinstall the defaults in shared setup. Restore spies and any changed
environment or clock in cleanup. **Detect it:** run the file in shuffled order, or run the second test
alone. A result that changes is leaking stubs.

### 4.8 Removing a directory something is still writing

A test that commits into a temporary repository and deletes it afterwards failed with "directory not
empty" after its body passed. After a commit, version control can start a detached maintenance or
garbage collection child, and that child was writing lock and log files inside the repository while
the recursive delete walked the tree. The same shape shows up as "file locked" on systems that refuse
to delete open files.

**Rule:** turn off automatic background maintenance for every process the suite starts, in a way child
processes inherit (environment configuration rather than a flag on one command). Remove temporary
directories with a delete that retries a few times with a short delay, never a single recursive
delete. **Detect it:** a cleanup failure after a green body, intermittent, and only in suites that
drive an external tool.

---

## 5. Time and concurrency

### 5.1 Sleeping instead of waiting for a condition

A sleep is a bet that the machine running the test is at least as fast as the machine it was written on.
Continuous integration is usually slower and always more contended.

**Rule:** wait for the state you actually need, with a generous deadline and a message naming what never
became true.

### 5.2 Timestamps as a uniqueness source

Two records created in the same millisecond collide. On a fast machine this is common, not rare.

**Rule:** unique values get a random component.

### 5.3 Pinning which side of a race wins

A test asserting that worker A won will fail the day the scheduler changes its mind, and it was never
testing anything real, because either winner is correct.

**Rule:** assert the invariant, not the interleaving. "Exactly one row exists" rather than "worker A
created it".

### 5.4 A timeout tuned to a contended resource

A test needing a thirty-second timeout is usually telling you something expensive and shared is inside
it, and the timeout is hiding the design problem.

**Rule:** when a test needs a long timeout, ask what shared operation is inside it before raising the
number.

### 5.5 A timed-out test keeps running

Most runners do not cancel a test body when it times out. They report the timeout and start the next
test, while the old body's promises, timers and workers keep going. A timed-out copy test left eleven
copies holding process-wide slots, and the next two tests failed with "expected 11 to be 0". Neither
of them had done anything wrong.

The timeout itself came from a barrier that waited for twelve copies at once, a count the code under
test never reached in one of its phases. On passing runs the barrier always fell through to its
fifteen-second fallback, so it looked like it worked and nobody asked why the test took eighteen
seconds.

**Rule:** give every piece of background work a test starts a per-test abort signal, and have cleanup
abort it and wait for that work to finish. Any hold or gate the test sets up ends on the same abort.
Before writing a barrier, check that the code can reach its count in every phase. **Detect it:**
failures in the test after a timeout, counts that match leftover work, and a test whose duration
equals its fallback delay on every run.

### 5.6 A lock scenario that outlives its test

A test that sets up a lock holder and waiters, then releases them in the body's `finally`, leaves them
queued when the body times out (5.5), so the next test reads the previous test's locks. Borrowing the
holder's connection from the shared pool makes it worse, because the borrow itself can wait without
bound.

**Rule:** a lock scenario must never outlive its test. Open each holder and waiter on its own
single-connection client with a name the test can find. In cleanup, first terminate every session
carrying that name from the server side, because a session queued on a lock may not notice its socket
closing. Then close the clients, each with its own time bound. Bound every step of the scenario
(connect, begin, acquire, release, every poll) so a stall fails naming the step and printing what the
server shows. Assert on your own scenario's session or lock key, never on a server-wide view.
**Detect it:** a lock or session count that is off by the size of an earlier test's scenario, or a
step that hangs only in the pipeline.

### 5.7 A fixture whose cost grows with the repository

A test can be fast when written and slow a month later with nobody touching it. A migration test
replayed the whole migration chain several times. The chain grew from 70 to 112 entries and the same
six tests went from 52 to 105 seconds. Every new migration added its own replaying test and also
slowed every existing one, so total time grew with the square of the chain. It surfaced as timeouts
that looked like flake.

**Rule:** before writing a fixture, ask whether its cost grows with something that only grows: a
migration chain, seeded reference data, the route table, every role or permission. If it does, build
it once and copy it, start from the current state, or bound the input. Raising a timeout to fit such a
fixture is 5.4. **Detect it:** compare per-test durations across pipeline runs a few weeks apart. A
test that slows with no change to its own file is paying for the repository's growth.

### 5.8 A cold compile inside a timed assertion

The first test in a file that imports a large UI library or code generator can spend seconds
transforming or compiling it. If that import happens lazily inside a timed assertion or a wait with a
deadline, the test reports a behavioral timeout for what was a cold cache.

**Rule:** keep expensive imports at module scope, in collection, when import timing is not what the
test is about. Do not raise the timeout until you know what spent the time. **Detect it:** the first
test in a file times out on a cold runner and passes on rerun, or passes when moved second.

### 5.9 Reading an effect's result before the effect ran

A UI test's stub counted its mounts in a deferred effect, and the test read the count right after an
async "find this text" query resolved. On a loaded runner it read 0. The query resolves as soon as the
render commits the text, but some frameworks run deferred effects in a later task, so the effect can
still be pending. In React, for example, passive effects from a non-urgent render run after the
commit.

**Rule:** a stub that records lifecycle facts for a test records them in the phase that runs inside
the commit (a layout-phase effect), or the test reads them only after something that flushes effects.
Do not wrap an exact count in a retrying wait instead: it can pass at 1 just before an unwanted
remount makes it 2. A retrying wait is safe only when its condition depends on something that happens
after the mount. **Detect it:** a count that reads low only under load, read immediately after an
async query.

---

## 6. Testing at the wrong level

### 6.1 Unit-testing what only breaks when wired up

If the fix was "add a middleware", "register the handler" or "mount the router", a unit test of the
function proves nothing. The function was always correct. The wiring was missing.

**Rule:** test at the level the bug lived at.

A guard test has its own version of this. Asserting only that a request was rejected passes when some
unrelated middleware rejected it first. Asserting only that the handler was not called passes when the
fixture is broken and nothing could reach the handler.

**Rule:** for a guard, drive the real routing and assert both halves: the forbidden request is rejected
**and** the downstream handler was never called. Then send an authorized request through the same path
and assert it reaches the handler. **Detect it:** remove the guard. If the rejection test still passes,
something else is doing the rejecting.

### 6.2 Asserting on a raw string the production code never sees

A guard that runs against a parsed body, tested against a raw string, is testing a parser you wrote in
the test file.

**Rule:** drive the payload through the real parser first, then assert.

### 6.3 Covering the function you changed rather than every call site

A leak fixed in one helper stays open at the four other places that build the same response by hand.

**Rule:** after fixing a leak or a guard, find every call site and every route that reaches it.

### 6.4 Enumeration where a structural check belongs

Listing the three routes that leaked will not notice the fourth. Iterating every route and asserting the
shape will.

**Rule:** prefer a check that catches the next one over a check that catches the one you found.

### 6.5 Asserting real-environment behavior against a simulation

A simulated DOM gives every element a zero-size rectangle, so drop resolution, selection frames, drag
thresholds and focus order cannot be tested there. They pass on arithmetic that is wrong in a browser.

It is not only layout. A simulated environment's style parser can be stricter than a real browser's,
rejecting values a browser accepts. A test asserting "the browser refuses this value" then passes for
values a browser takes. That was measured while checking whether a framework's style handling stops an
injection. It does, but the simulation also rejected three legitimate values, so the instrument agreed
with the answer for the wrong reason.

**Rule:** any assertion about what a real browser, database or operating system accepts or rejects
belongs in a suite that runs the real thing. A simulation implements a subset, and a subset is exactly
the shape that makes a security test pass while the real thing stays open.

### 6.6 Reading one projection while meaning another

A tree view shows every node, a canvas shows only visible ones, and stored data shows what was saved.
They disagree deliberately. A test that reads the tree while naming the canvas silently changes what it
asserts.

**Rule:** know which projection you are reading.

### 6.7 A positional test that passes only because the fixture fits on screen

A drag test pulled an item out of a palette. Adding two entries made an earlier group one row taller,
pushing the target past the bottom of a 720px viewport. One operating system rendered the list just tall
enough to clip it and another did not, so the test failed every pipeline run and passed every local one.

Nothing reported a missing element. A bounding box returns page coordinates whether or not the element
is on screen, so an off-screen entry hands back a plausible rectangle, the press lands outside the
window, and the gesture becomes a text selection. The assertion then fails several steps downstream of
the cause.

It looks exactly like flake and it is not. It is deterministic per platform. Two plausible fixes went in
and were refuted before a screenshot settled it. Both blamed timing. Neither was timing.

**Rule:** scroll the element into view rather than trusting it is there. When a browser test fails only
in the pipeline, read the screenshot before theorising. It outranks any story about timing, and retrying
a test whose real cause is layout just buys the same failure twice.
