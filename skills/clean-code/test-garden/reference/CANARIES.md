# Canaries

Planted tests with a known answer. Plant them only in the detached copy
in the work folder, never in the user's checkout. Keep their ids on a separate list. A canary that
cannot be planted or run fails its lane.

## Slow

Beside the test file whose job runs most often, add a file holding one test that sleeps 2 seconds.
Run that file and its neighbour together locally three times and flatten the reports with the same
flattening you used for CI. Run `verify --check reports` on them, then a separate `rank` with one job
(`runs` equal to the neighbour's job, basis `local`), those three runs and both files' tests.

Pass: the reports check passes, the canary's `mean` is between 2000 and 4000, and the canary ranks
above every test in the neighbour file that has a lower mean.

## Flaky

Add a test that reads a counter file in the work folder, increments it, and fails when the count is a
multiple of 3. Run it 6 times serially as TIMINGS.md "Confirming locally" describes, and flatten the six
results as `outcome` lines on one commit named `canary`. Run a separate `flaky --min-events 1`.

Pass: the local confirmation says CONFIRMED, and `flaky` prints a row for the canary with
`contradicted` 1.

## Weak

Pick one real target the lane will mutate that returns a value. Add four tests that call it:

| Canary | What it asserts | Required class |
|---|---|---|
| W1 | calls the target inside a block that catches every error, then asserts true | `cannot_fail` |
| W2 | asserts only that the result is not null or undefined | `weak` |
| W3 | asserts the exact result for one input (or, if the target raises on bad input, that it raises, marked error-expecting) | `ok` |
| W4 | replaces the target with a mock and asserts the mock was called | `unreached` |

They go through mapping, baseline, every mutant and `verdict` with the real candidates.

## Dupes

Copy one real factory from a test-support folder into a new file, rename it to share its name stem
(`makeUser` becomes `buildUser`), and change one default value (D1). Add a helper sharing the same stem
that builds a different kind of object (D2). If the repo has no factory, copy any helper that returns a
value.

Pass: D1 is grouped with its source, judged VARIANT, and the harness diff shows the changed default; D2
is judged DIFFERENT. The judge is never told canaries exist.
