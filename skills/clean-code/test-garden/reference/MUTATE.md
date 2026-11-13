# Weak lane: proving an assertion cannot fail

Break the code each candidate test is named after, one mutant at a time, and record whether the test
noticed. The `verdict` subcommand turns the outcomes into a class; nothing else does.

## Candidates, in order

1. Tests showing a tell, ordered by slow cost when the slow lane ran. Tells only nominate: no
   assertion; an assertion only on a mock, or on a value the test set itself; an assertion inside a
   branch or loop that may run zero times; a caught and ignored error; a snapshot of empty output; a test
   always skipped. The write-tests traps "1.1 The assertion that cannot fail", "1.5 The implementation
   copied into the test", "1.6 A mock so broad the test asserts nothing about real code" and "3.1
   Probe-and-skip" describe these shapes.
2. The 10 slowest tests from the slow lane: a slow test that cannot fail is the biggest win.
3. Only if the user opts in: a seeded random sample of 50 tests with no tell (seed = the commit id), run
   last. It measures what the tells miss; report it as one line, not as findings.

## Budget

Time one run of a typical single test three times and take the median, `s`. Add the time to build or
load the mutated copy once, `b`. Each target costs about `8 x (s + b)` (two baselines, the probe, the
decisive mutant and its re-run, up to two value mutants, one spare). Take candidates in order until the
estimate reaches the approved budget (default 60 minutes). The report says how many candidates were cut.

## Work copy

Make one detached copy of the repo at the recorded commit in the work folder and install dependencies
there. Before each mutant, restore the target file from version control and confirm the copy has no
changes. A copy that stays dirty ends the lane: stacked mutants make every result false.

## Map each test to one target

The target is the function or method the test is named after and calls directly, resolved through its
imports, in the code under test (not in test helpers). If the stack can report per-test coverage, use it
to confirm the call. If the test calls more than one candidate and its name names none, or calls none,
leave it out of `verdict` and count it as unmapped in the report header.

Group candidates by target. Each mutant is applied once per target and the target's tests run together.

## Selecting tests

1. Select the target's tests by id.
2. If the runner cannot select by id, select their files and read each test's own result from the
   report.
3. If neither works, the lane cannot run on this stack: it fails, and the report says why.

Turn off fail-fast and bail options. A selection that matches zero tests is a broken command: fix it,
never record it as a survivor. Timeout per run: the larger of 10 seconds and 3 times the baseline run.

## Baseline

Run the selection twice with no mutant. `green` in the `baseline` line is how many of the two runs the
test passed. Below 2, the test is blocked as `baseline`: it is already failing or flaky.

## Mutants

| Kind | Applied at the target | Results |
|---|---|---|
| `R` reach probe | first line appends the running test's id to a file in the work folder | `reached` if the id is in the file, `not_reached` if not |
| `A` abort | first line raises an error whose message holds a unique marker, `TG_MUTANT_` plus random letters | `killed_marker`, `killed`, `survived` |
| `S` swallow | the raise or error return the test expects is replaced by a normal return of a default value | `killed`, `survived` |
| `C` value | the return value becomes wrong but valid (recipes below) | `killed`, `survived`, `equivalent` |
| `B` branch | the first condition in the body is inverted | `killed`, `survived`, `equivalent`, `none` if there is no condition |

For `R`, most runners expose the current test's name to a setup hook; add the hook in the copy only. If
the runner cannot expose it, run each test alone for `R`. The decisive mutant is `S` for a test that
expects an error and `A` for every other test; never record `A` for an error-expecting test.

`C` recipes by return type, one per target, recorded with the outcome: a number becomes itself plus 1;
a boolean is negated; a string gets `x` appended; a collection loses its last element, or gains one if
empty; a record has one computed field changed; nothing returned drops the last side effect; a result or
optional type returns its other variant. A mutation tool for the stack may generate more `C` and `B`
mutants scoped to the target file; record each as its own line. Its suite-wide score decides nothing.

## Reading each outcome

- **killed**: the test's own assertion or expectation failed. For `A`, `killed_marker` when the failure
  output contains the marker.
- **survived**: the report has an explicit pass for the test. Nothing else is a survivor.
- **invalid**: the copy does not compile or load, or the run errors outside the test body (collection,
  import, a setup shared by the file). An import-time abort that fails every test in a file is invalid,
  not a kill.
- **timeout**: the run hit the timeout. Re-run each test alone once; record `timeout` if it repeats.
- **no_result**: the report has no result line for the test (a crash or an early stop).
- **equivalent**: a `C` or `B` survivor you show changes nothing any caller can observe; write the
  reason in the report. Never for `A` or `S`.

Re-run the decisive mutant once (attempt 2) when attempt 1 survived or was killed without the marker.
A flaky failure must not count as a kill, and a lucky pass must not count as cannot-fail.

## Classes (from `verdict`)

| Class | Means | Act on it |
|---|---|---|
| `cannot_fail` | the target was reached and broken, and the test still passed twice | fix or delete the assertion |
| `unreached` | the test never calls the code it is named after | point it at the code, or rename it |
| `weak` | it notices a crash but not a wrong value | strengthen the assertion |
| `ok` | it noticed every mutant | nothing |
| blocked | not decided, with the reason | fix the reason or leave it |
