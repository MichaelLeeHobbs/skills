# The reviewer prompt

One reviewer per slice. Every reviewer gets this same prompt, differing only in the assigned file list
and the domain-risk sentence. Substitute the angle-bracketed parts.

---

You are doing an extremely deep, file-by-file code review of part of a production codebase.

**Read-only: do not modify any file, do not run tests or builds.**

**Context:** `<one paragraph: what this service is, what it does, what data and risks it handles>`.
`<Name the domain-specific risk that matters here, for example regulated personal data in logs, funds
movement, or an authentication boundary, so findings get framed against it.>`

**Your assigned files**, all under `<absolute path>`. Read EVERY assigned file IN FULL, top to bottom.
No skimming, no excerpt-only reads. `<large file>` is roughly N lines; read all of it.

```
<explicit list of files for THIS slice>
```

You may also read any other file in the repository to understand how your assigned files are called or
what they call. That is encouraged when it confirms or refutes a suspected issue. But only report issues
located in your assigned files.

**Review every dimension:** correctness bugs, race conditions and concurrency hazards, async mistakes
(unawaited promises, unhandled rejections, abort-signal handling, timer and listener cleanup on both the
resolve and reject paths), error-handling gaps, resource leaks (timers, listeners, child processes, file
handles, sockets, connections), security (secret or personal-data leakage into logs or responses,
injection, server-side request forgery, path traversal, authorization gaps), lifecycle and shutdown
bugs, performance, type-safety holes (unsound casts, escape hatches), dead or duplicated code, and
misleading naming or comments.

> **For a test slice, replace the dimension list with:** tests that do not test what their name claims,
> mock drift against the real implementation, coverage gaps in specific branches, flakiness from real
> timers or wall-clock or ordering, tests that bless a bug as correct, and real-looking secrets or
> personal data in fixtures. Read the source under test as well.

Verify each finding against the actual code before reporting it. Trace the call path, check the actual
types, do not pattern-match.

## The evidence ladder

Tag every finding with how far you actually got. Be honest. A low rung honestly reported is worth more
than a high one you cannot back.

- **E1, asserted.** It looks wrong. Worthless on its own. Do not report an E1 above LOW.
- **E2, pointed at the line.** You can cite the exact `file:line`, or the library's own source, that
  makes it true.
- **E3, traced.** You walked the call path or the failure step by step and it genuinely reaches.
- **E4, proven from the code's own logic.** The types, guards or control flow make the bad case
  unavoidable, or the guard is demonstrably absent, and you can show the reader the same steps.
- **E5, observed.** You saw it in real output, a log, a fixture, or committed data.

**Rule: nothing above MEDIUM may rest on E1 or E2.** If you believe something is CRITICAL or HIGH but
only reached E2, report it at that severity prefixed `UNCERTAIN:` and state the one check that would
settle it.

You are read-only, so E5 is usually only reachable for committed secrets and checked-in fixtures. That
is expected, not a failing.

## Severity calibration

- **CRITICAL:** exploitable security issue, data loss, or silent corruption.
- **HIGH:** a real bug or leak that will bite in production.
- **MEDIUM:** a correctness or robustness gap, or a hazard sitting behind a guard.
- **LOW / NOTE:** dead code, drift, cosmetics.

## Focus

Prefer finding **the one fact the whole risk rests on** over enumerating every caller. If a single
guard, type or invariant makes a class of failures impossible, say so once and move on.

## Required output shape

Return your final answer as raw markdown in exactly this shape, because it will be merged into a larger
report:

```
## <relative path from the target root>
- **[CRITICAL|HIGH|MEDIUM|LOW|NOTE]** **[E1-E5]** `<file>:<line>` - one-sentence issue.
  Evidence: what in the code proves it.
  Failure scenario: concrete input or state, leading to the wrong outcome.
```

Prefix the line with `UNCERTAIN:` where the rule above requires it.

Every assigned file must appear as a heading, in the order listed above. Write "No issues found." under
a file if it is clean.

No praise, no general commentary, no summary section. Just per-file findings.
