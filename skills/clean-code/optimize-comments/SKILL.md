---
name: optimize-comments
description: >-
  Cut comments in a file, diff or package down to the few an agent needs. Use for "clean up these
  comments", "strip the comments", "remove useless JSDoc", "the comments are out of date", "too many
  comments", or "this file is over-commented". Deletes by default: a comment stays only when it states
  something the code and types cannot, in a form that cannot drift from the code. Deletes doc comments
  that repeat types, narration, banners and commented-out code; keeps reasons, outside facts and tool
  directives. NOT a general code review, not for TODOs tied to issues (use triage-todos), and not for
  generated or vendored files.
---

# Optimize comments

Agents read most code now, and they read the same file many times. Every comment is paid for on every
read, and a comment that describes the code goes stale the first time the code changes without it. A
stale comment is worse than none: the agent believes it. So the default verdict is **Delete**, and a
comment has to earn its place.

## The keep test

Keep a comment only when all three hold:

1. **The code and types cannot say it.** It states a reason, an outside fact (a vendor limit, a spec
   rule, a runtime defect), a deliberate oddity an agent would otherwise "fix", or a caller rule the
   types miss (units, side effects, ordering, ownership).
2. **It cannot drift from the code.** It states a fact the code does not own, or points to a lasting
   source (an issue, a spec section, a decision record). A comment that says what the code does fails
   this, however accurate it is today.
3. **It is the shortest form that still does the job.** One clause beats a sentence; a sentence beats a
   paragraph.

Ask the core question of every comment: would an agent editing this code act differently without it?
If not, it goes.

**Fixed exceptions.** These stay whatever the test says, because a tool or a law reads them, not a
person:
- license headers, copyright notices and attribution a license requires;
- active tool directives (lint suppressions, type-checker ignores, formatter and coverage markers),
  each with its one-line reason if it has one;
- deprecation markers that editors and linters act on;
- doc comments on the public API of a package that is published and whose docs a generator consumes;
- doc comments that are code: type annotations a type checker reads (JSDoc types in checked
  JavaScript, type comments in Python), and runnable examples a test runner executes (doctests).

## Step 1: scope

Use the scope and permissions the user gave. Settle only what changes the work: which files, whether
code changes (renames, test renames) are allowed, and whether the package is a published library.
Generated and vendored files are out. Without permission for code changes, edit comments only.

Leave TODO, FIXME, HACK and XXX markers in place and list them: whether they are stale is a question of
issue state and history, which triage-todos answers. If that skill is not available, list them in the
report as unjudged.

## Step 2: give every comment one verdict

| Verdict | When |
|---|---|
| **Delete** | Fails the keep test. This includes narration, doc comments that repeat a name or a type, section banners, commented-out code, history notes, and any comment describing what the code does |
| **Move to test** | Passes rule 1, but a test already pins the behaviour. Delete the comment if the test's name or assertion message states the reason; if it does not and code changes are allowed, rename the test to state it, then delete |
| **Shorten** | Passes the test with more words than it needs |
| **Keep** | Passes the test, or is a fixed exception. Name which rule-1 kind it is (reason, outside fact, oddity, caller rule) or which exception |
| **Contradiction** | The comment states a fact the code disagrees with. Report both readings. Do not delete it to make the conflict disappear: it may be the only record of intended behaviour, and the code may be the bug |

Read [reference/SHAPES.md](reference/SHAPES.md) for how the verdicts land on doc comments, banners,
directives, commented-out code and the cases that look like keeps but are not.

**Typed languages.** In TypeScript, typed Python, Kotlin, Rust and similar, a doc comment on anything
that is not public API of a published package keeps only the sentences that pass the keep test. Tags
that restate the signature (`@param x the x`, `@returns the result`, `@type`, `@async`) always go. A
doc comment with nothing left is deleted, not shortened to a stub.

**Check:** every comment in scope has exactly one verdict, every Keep names its kind or exception, and
every Delete of a rule-1 comment names the test that now carries it.

## Step 3: check before deleting

Read the code around each comment and enough of its callers to judge it. A comment can look like
narration and still carry an outside fact ("retry once" may be the only record that the vendor drops
the first request after idle). Verify outside facts against their source when the source is
reachable. A comment whose outside fact you cannot verify stays, marked unverified in the report.

Read [reference/EVIDENCE.md](reference/EVIDENCE.md) when you are unsure whether a test really pins a
behaviour, or whether a comment is a caller rule or narration.

**Check:** each Move to test names the test and the assertion that pins the behaviour. Each
Contradiction lists both readings.

## Step 4: shorten what stays

Cut each kept comment to its fact. Drop the subject when the code makes it plain ("vendor caps batches
at 500" over "We need to do this because the vendor API caps batches at 500 items"). Keep the
qualifier that bounds the claim (a runtime version, a condition). Replace a long explanation with one
line and a pointer to the issue or decision record that holds the rest.

Add a comment only for a deliberate oddity you found evidence for in this pass, such as an issue or a
commit message that explains it. Never add a doc comment, a summary, or a comment that describes the
code.

## Step 5: verify and report

Run what reads comments or depends on them: the type checker (doc-comment types), the linter
(directives), the formatter, the doc build for a published package, and doctests. Any failure means a
comment you removed was code: restore it and record it as a fixed exception.

Show the diff and the verdict counts. Report comment lines and words before and after, the fixed
exceptions kept by kind, unverified outside facts, contradictions with both readings, and the markers
left for triage-todos. Then append the run record as [reference/RUN-RECORD.md](reference/RUN-RECORD.md)
says.

**The pass succeeds when** every comment has one verdict, every Keep names its kind, no fixed exception
was removed, and every check above passes. The pass fails when a check fails after restoring, a
comment is unaccounted for, or the run record is missing or disagrees with this report's commit or
check. A check that could not run has failed. A pass with unverified outside facts is `partial`.
