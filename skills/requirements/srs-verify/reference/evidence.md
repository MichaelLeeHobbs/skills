# Evidence

What counts as proof for each Verify method, and the traps that make a verdict look stronger than it is.

## Start from the requirement

Write the requirement's conditions as a list before you open any code. For
`AUTH-USR-03: The system shall lock an account after 5 failed sign-ins within 15 minutes`:

1. the trigger is a failed sign-in;
2. the count is 5, not 4 and not 6;
3. the window is 15 minutes, so 5 failures spread over 16 minutes do not lock;
4. the outcome is a locked account: a correct password is refused afterwards.

Each condition needs evidence. Reading the lockout code first and asking "does this look right?" is
working backward: you end up checking what the code does, not what was required.

## Test

Met needs all of:

- a test whose name cites the ID (or a test you found that the naming missed, noted as a rename);
- assertions that check each condition, read in the test body, not inferred from its name;
- a passing run you did yourself, with the command and its result recorded.

Partial when the test exists and passes but misses a condition: in the example, a test that checks
5 failures lock but never checks the 15-minute window. Not met when the test fails, or when no test
asserts the behaviour. Cannot verify when the suite cannot run here; say why.

Traps:
- a test that asserts a mock was called, not that the behaviour happened;
- a test marked skip, only, todo or expected-to-fail;
- a test that passes because its assertion can never fail (`expect(true)`, an empty loop);
- a test of the boundary on one side only (5 locks, but nobody checked 4 does not).

## Demonstration

Write the steps as you run them, with the build or revision, the environment, the input and the
observed result. A screenshot or log line is good support, not a substitute for the steps. Steps you did
not run are a plan, and the verdict is Cannot verify.

## Inspection

Name the file and line at a revision (commit hash), and quote the few lines that matter. For a negative
rule ("shall not write session tokens to logs"), list every place it could be broken (each logger call
near the token, error handlers, request logging middleware) and say why none does. One clean call site
is not proof of "never".

## Analysis

Write the argument out: the figures, where each came from, the arithmetic, and the conclusion. A load or
capacity claim cites measured numbers or a stated model, not a feeling. Analysis that rests on a guess is
Cannot verify, with the missing figure named.

## Regressed

A row that `trace.md` marked Met and now fails is Regressed, not Not met, so it reaches the top of the
report. Name the revision where it last passed if the earlier trace row recorded one.
