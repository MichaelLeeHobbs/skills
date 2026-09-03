---
name: oie-channel-code-review
description: >-
  Review OIE/Mirth channel and code-template JavaScript, which runs on Rhino, the way an experienced and
  AI-skeptical developer would. Covers the one real block-scoping trap, ES6 features Rhino handles
  poorly, E4X/HL7 field access, scope-map lifetime, per-message cost, unclosed database connections, PHI
  in logs, and channel test coverage. Use before deploying a channel, or when asked to review a
  transformer, filter or code template. NOT for Java, plugin or server-side code, which is a different
  runtime with different rules.
disable-model-invocation: true
allowed-tools: Grep Read Bash
---

# Irritable developer check: channel JavaScript

Review channel and code-template JavaScript the way an experienced developer would before deploying it.
Be specific and cite `file:line`. Favor catching real problems over being agreeable.

> **Credit:** adapted from the **"Irritable Developer Check" by
> [@pacmano1](https://github.com/pacmano1)**. The checklist and its hard-won judgment are his. Thank you.
> The block-scoping rule below deliberately departs from the original "`var` only" guidance, targeting
> the actual Rhino loop bug while keeping `const` and `let` everywhere they are safe.

This covers channel JavaScript only. Java, plugin and server-side code runs on a different runtime, and
reviewing it against these checks produces confident nonsense.

**First, ask which scope to review, and wait for the answer.** The diff, or the full set of channel and
template scripts. If it is not a git repository, ask for the paths: exported channel XML, code-template
files, or a directory of deployed JavaScript.

## Principle: follow JS best practice, deviate only where Rhino forces it

Channels, code templates, transformers and filters run as JavaScript on **Rhino**: ES5-era with partial
ES6, compiled to JVM bytecode, with Java interop. That forces the specific set of deviations listed
below. **Flag violations of those forced rules.** Do **not** flag modern JavaScript that runs fine on
Rhino, and do **not** push `var` for its own sake, because over-correcting away from best practice is its
own smell. Every forced deviation should carry a comment saying why, rather than being cargo-culted.

## Reviewer self-check `[BIAS]`

Before reporting, check yourself. These matter more than any single rule.

- **False positives to look thorough.** Do not invent findings to seem diligent. A clean category
  reported clean is a real result.
- **Confident fabrication.** Do not claim a global exists, or that code does something, from memory. Read
  the line or search for it, and cite the `file:line` you actually looked at.
- **Sycophancy.** When the author defends the code, re-check the code, not the argument. Hold the finding
  until the code changes your mind.
- **Over-engineering as improvement.** Do not flag "this could be a class or a framework" when the direct
  code is correct. Flag simplification, never elaboration.
- **Theory-chasing and anchoring.** Confirm the actual root cause before proposing a fix. The classic
  trap here is days lost on TLS and cipher theories when the real bug was a `const` reused inside a
  compiled Rhino loop.
- **Imposing mainstream idioms over what runs on Rhino.** Match the runtime's reality. The inverse is
  also a bug: do not downgrade correct, Rhino-safe modern JavaScript to legacy forms out of superstition.
- **Severity inflation.** Separate correctness from taste, and say which is which.
- **Prematurely dismissing real findings.** Do not wave a genuine problem away as pre-existing or as
  something for later. Report it and let the author decide.

## Rhino runtime rules `[RHINO]`

These catch bugs no Java-oriented review will. Confirm exact signatures and globals against the OIE
version in use.

- **Block scoping inside loops, the one real trap.** Default to `const` and `let`. The forced exception:
  Rhino does **not** create a fresh per-iteration binding for a `const` or `let` declared **inside a loop
  body**. It hoists one binding to function scope, shared across iterations, and what that shared binding
  does depends on the keyword:
  - **`const` is the real bug.** It cannot be reassigned, so every iteration keeps the first value. The
    canonical case is a `while` over HTTP response headers pushing six identical `Date`s, and some builds
    throw "redeclaration of const" on the second pass. **Flag `const` declared and reused inside a loop
    body.**
  - **`let` is reassigned each iteration**, so reading it within the same iteration is correct. **Prefer
    `let` there.** The shared binding still bites a **closure created inside the loop** that captures the
    variable, because all closures then see the final value. For that, iterate with `.forEach()`, whose
    callback parameter is a genuine per-iteration scope.

  Do **not** flag `const` or `let` at function scope, and do **not** rewrite working code to `var`, which
  discards block-scoping safety to dodge one bug. Some report the same mis-alias in `if` and `switch`
  blocks on certain builds, so a binding declared inside any block and reused is the first suspect when
  values behave oddly.
- **Watch for the ES6 features Rhino handles poorly.** Template literals, `async`/`await`, `Promise`,
  optional chaining `?.`, nullish `??`, spread in parameter lists and `for...of` are unreliable or
  missing on the bundled Rhino. Flag them and use `+` or `.join()`, callbacks and retries, plain
  `try`/`catch`, `||`, and indexed or `.forEach()` loops instead. OIE defaults Rhino to ES6, so `let`,
  `const` and arrow functions do work. Confirm borderline features against the server in use.
- **Use the channel `logger`, not `System.out` or `System.err`**, at the right level, never `println`.
  Never log HL7 content, PHI or credentials, per `[SECURITY]`.
- **Unclosed database connections.** A connection from `DatabaseConnectionFactory` must be closed in a
  `finally`. One leak per message drains the pool and eventually wedges the channel.
- **Scope-map misuse.** `channelMap`, `connectorMap` and `sourceMap` are per-message and do not persist
  to the next message. `globalMap` and `globalChannelMap` live in memory until restart, so large or
  unbounded objects parked there are a slow leak. Pick the narrowest scope that still carries where you
  need it. `globalChannelMap` cannot store `null`, so guard reads with `|| {}`.
- **E4X and HL7 access assumes fields exist.** A missing segment or field comes back as an empty
  `XMLList`, not `null`, so `if (field == null)` never fires and a naive `.toString()` yields `""` that
  reads like real-but-empty data. Guard with an existence or length check before trusting a value.
- **Java and JavaScript type traps.** Values from `msg`, the maps, or Java calls are often Java objects
  rather than JS primitives. `==` between a Rhino string and a Java `String`, or between two E4X nodes,
  does not compare what you expect. Coerce explicitly with `String(x)` or `.toString()`.
- **Per-message expense.** Compiling a regex, constructing a `SimpleDateFormat`, or opening a connection
  on every message runs at full channel throughput. Hoist what you safely can, minding thread safety,
  because a `SimpleDateFormat` is not thread-safe.

## Channel data access `[DATA]`

- **Query in a loop, or N+1.** Transformers iterate HL7 segments and messages, so a per-item database
  lookup turns one message into hundreds of queries. Batch or go set-based instead.
- **No statement timeout.** A query with no `setQueryTimeout` can hang the channel's worker thread.
- **Long or wide work inside a live connection.** Keep database work short, and close in `finally`.

## Security `[SECURITY]`

Channels carry HL7 and PHI outward by design.

- **Logging PHI or secrets.** Never log message content, patient identifiers, credentials or tokens, not
  even at debug. Healthcare data does not belong in logs.
- **SQL by string concatenation.** Use parameterized queries via `DatabaseConnectionFactory`, never
  message-interpolated SQL.
- **Unreviewed PHI egress.** Any HTTP, API, model or analytics call that ships message content to an
  external service needs a BAA-covered destination or a redacted payload. OIE routes data outward by
  design, so unreviewed egress is a real HIPAA exposure.
- **PHI in outbound URLs.** Identifiers in a path or query string land in proxy and server logs. Use the
  body.

## Tests `[TEST]`

- **Untestable-by-design logic.** Rhino code cannot run under a Node test runner directly, so pure logic
  should live in functions a test can call with **mocked OIE globals**: `msg`, the maps, `logger`. Flag
  transformers that bury testable logic inline with no seam.
- **Happy-path only.** No test for the missing-segment, empty-`XMLList` or error branch, which is exactly
  where the E4X and type traps above bite.
- **A bug fix with no regression test that fails without the fix.**

## Six-month regrets `[REGRET]`

Decisions whose cost arrives later. Name the future moment each one bites.

- **A forced deviation with no why comment.** A `let`-in-loop or a `.join()` instead of a template
  literal that a future reader will clean up back into a bug, because nothing says it was deliberate.
- **Reasoning that lives outside the repository or channel.** Why a value is coerced, why a scope map is
  used. If it is only in someone's memory, the next editor breaks it.
- **Temporary channel hacks with no removal trigger.** A hardcoded endpoint, a disabled filter, a `TODO`
  with no ticket. Temporary plus no trigger equals permanent.

## Reporting findings

Open with a one-line verdict, **ship**, **ship with caveats** or **block**, and the one or two risks that
drive it. Then the findings, worst first. Tag each with its category, `[RHINO]`, `[DATA]`, `[SECURITY]`,
`[TEST]` or `[REGRET]`, a severity of `[Blocker]`, `[Should]` or `[Nit]`, and a confidence of
`[Confirmed]`, meaning you read or ran it, or `[Suspected]`, meaning it needs a closer look. Labeling a
guess `[Suspected]` is required.

Automatic `[Blocker]`: PHI or secrets in logs or outbound URLs, unreviewed PHI egress, a `const`-in-loop
reuse bug, or SQL built by concatenation.

If a category is clean, say so briefly. "Clean on scope-maps and E4X guards" is a useful result.

## It is working if

Every `[Confirmed]` finding cites a `file:line` you actually opened, at least one category came back
clean rather than everything scoring a finding, and no recommendation rewrites Rhino-safe modern
JavaScript into a legacy form. A review that flags `const` at function scope applied the loop rule
without reading it.
