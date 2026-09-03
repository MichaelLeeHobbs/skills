---
name: optimize-comments
description: >-
  Audit and fix the comments in a file, a diff or a package: rename what a better name would explain,
  delete the ones carrying nothing or already enforced by a test, repair the ones that now contradict the
  code, and add the missing reason a reader cannot recover from the code itself. Use for "clean up these
  comments", "the comments are out of date", "too many comments", "this file is over-commented", or
  before handing code to someone who has never read it. NOT a code review for defects, and not for
  generated or vendored files.
---

# Optimize comments

A cleanup that only deletes makes the codebase worse. Two failures, opposite directions: comments saying
what the code already says, and the reason a line exists never getting written down.

Expect that mix. In six large Java projects, 59% of comment lines said nothing about the code beside
them, and comments restating *what* outnumbered comments giving *why* by about 21 to 1. The evidence
behind these rules is in [reference/EVIDENCE.md](reference/EVIDENCE.md), read once before a first pass.

## Four standing rules

1. **Prefer self-documenting code.** A rename or an extracted function that removes the need for a
   comment beats the comment. It cannot go stale. Try it before writing or keeping anything.
2. **A comment says why, not what.** One exception: a doc comment on the public API may say what,
   because a caller reading a hover cannot see the body. Public means reachable from the package's
   entry point, not the presence of the `export` keyword. A module-level export nobody outside can
   import has no hover audience and gets the inline budget.
3. **Terse, and in the imperative.** Write the instruction, not the story about the code. "A second
   entry here is usually the wrong repair" is narration; "Do not add a second entry" is the thing a
   reader has to do. A comment longer than the code it annotates means the fact is in the wrong home,
   and a reason that needs a paragraph is a decision record.
4. **Not every declaration needs one.** A file where every declaration carries a block comment reads as
   dense even when each one is defensible, and pitches everything as subtle, which devalues the two or
   three things that are.

The budgets differ because the readers do: a hover reader who cannot see the body, against a reader who
already has the file open. [reference/EVIDENCE.md](reference/EVIDENCE.md) has the reasoning.

## Step 1: scope it before you touch anything

**Ask, and wait.** These change what you are allowed to delete.

1. **Which files.** A file, a diff, a package. Generated files and vendored dependencies are out.
2. **Is there a doc-comment convention**, and does anything publish from it? A doc comment feeding
   generated API documentation is a deliverable, not a comment.
3. **May you change code**, or comments only? Rule 1 needs renames, and a rename is a code change that
   needs the tests to prove it.

If you cannot ask, take the conservative branch and say so in the report: comments only, no renames,
and nothing deleted that might be attribution.

**Never touch license headers, copyright notices or attribution required by a license.** They are the
largest comment category by line count in real projects, and the first thing a naive pass deletes.

## Step 2: sweep every comment and give it a verdict

Every comment in scope gets exactly one verdict, written down before you change anything, and the list
accounts for all of them including the ones you keep. Read for the interesting ones instead and you grade
the file by its best comments, walking past a `const PREFIX` that should have been `ERROR_PREFIX`.

- **Rename.** A better name removes it. Try this first, every time.
- **Already enforced.** A test asserts it.
- **It lies.** It contradicts the code.
- **Delete.** It carries nothing.
- **Shorten.** The fact is right, the length is not.
- **Keep.** Say in one clause what it tells a reader that the code does not.

Where a comment is a true fact in the wrong home, this says where it goes. The homes differ in one way:
whether the record breaks loudly when the code moves under it.

| The fact | Where it belongs | When the code changes under it |
|---|---|---|
| What this line does | the code: rename it, or extract a named function | cannot go stale |
| A behaviour that must keep holding | a test whose name states the behaviour | the test fails, loudly |
| Why this design and not the obvious one | a decision log, an ADR, the pull request | it is dated, so a reader knows to check |
| What a caller must know without reading the body | a doc comment on the declaration | goes stale in silence |
| A local why, a unit, a range, an invariant, a reference to a spec or a bug | a comment at that line | goes stale in silence |
| Nothing a reader would act on | nowhere | n/a |

**Prefer the record that executes.** A test outranks a log entry, which outranks a comment. Never write
all three for one fact: the copies drift, and the drift gets filed as a defect later.

**Check:** the verdict list covers every comment in scope, with none left unjudged.

## Step 3: reach the three verdicts that need evidence

**Already enforced by a test.** The highest-yield cut in a mature codebase, and the answer to "but these
comments are load-bearing": the load is already carried. A comment recording a measured behaviour is
describing a regression test. If that test exists, the comment is a second copy free to drift from it.
If it does not, the comment is the only thing holding a behaviour nobody checks, which is worth more
than any edit to the prose. Search the tests for the behaviour, not the rule, symbol or option name: a
test asserting through a fixture never names what it protects, so a name search reports no coverage
where there is plenty. Tests are not the only oracle: a comment naming a dependency's symbol, a file
path or a fixture is checkable against that source. Open it.

**It lies.** A comment older than the code beneath it describes a version that no longer exists. Compare
the last-changed dates and read every comment that lost the race. This needs history with real spread: a
file rewritten last week blames entirely to last week, and the check then returns nothing rather than
failing, so confirm the spread before trusting a clean result and say in the report if it did not run.
Do not hunt for a commit that edited code and forgot the comment: when comments get edited at all they
are almost always edited alongside the code, so the ones that lie are the ones nobody has opened in
years. **When a comment and the code
disagree, do not assume the comment is wrong.** It may be the only surviving record of the intent, which
makes this a bug in the code. You cannot tell which from the file, so report both readings and never
silently rewrite the comment to match. Such a comment is frozen: do not shorten it either, because
shortening picks a side.

**It carries nothing.** Restating the code, restating the declaration's own name, commented-out code,
changelogs and bylines, formatter directives, mandated empty documentation. **Stale history** hides in
this verdict: a comment about a state the code can no longer be in reads like the why that makes the
code make sense, so it survives every pass.

When a verdict is not obvious, or when you hit a section banner, read
[reference/SHAPES.md](reference/SHAPES.md). It carries each shape, the discriminator that separates dead
history from a rejected alternative worth keeping, and the one case where deleting is the wrong move.

**Check:** every contradiction is fixed or reported with both readings, none resolved by guessing. Every
measured claim is named alongside the test that asserts it, or reported as unguarded. For each deletion,
what was lost is nothing; anything else was a move, and step 2 says where.

## Step 4: shorten the ones you are keeping

A comment pitched at the same level as the code will always restate it. A useful one moves down for
precision, giving units, ranges, null-ness or which of two plausible encodings this is, or up for
intuition, saying what a block accomplishes so a reader can skip the body. The test: **does it use
different words than the code?** Same words means same level, which means redundant.

Then cut to the shortest form that still stops the wrong edit. What survives is usually one clause: the
failure that produces no signal, the measured number, or the reason the obvious alternative is wrong.

**Fix register before length.** Shortening every comment while leaving the voice alone still reads as
heavy. Three tics, worst first: narration where an imperative would do, connective glue joining labels
into paragraphs ("The inverse matters as much", "and that was a live defect"), and hedges
(`deliberately`, `genuinely`, `actually`, `exactly`, `usually`). Count the hedges: the number proxies
how much of the file is voice rather than fact.

Measure words, not only lines. A file can shed a third of its comment lines and keep nearly all of its
comment words.

## Step 5: add the reason that is missing

Skipping this turns the pass into vandalism. Newly written code is the least commented code in a
codebase, so the file someone has just edited hard is where the why has gone missing.

Look for a constant nobody can explain, a guard against a case that looks impossible, an unusual
approach, an ordering that matters, or a workaround for someone else's bug. Prefer the ones whose failure
is silent: a mistake that throws teaches the next reader, one that produces no signal never will.

If you do not know why a line is there, say so in the report rather than inventing a plausible reason,
which is worse than no comment at all.

## Step 6: report

Show the diff, the verdict counts from step 2, and both the comment-to-code ratio and the comment word
count before and after. If nothing changed, report the sweep instead of the diff.

List two things separately rather than burying them in a total: every contradiction between a comment
and its code, with both readings, and every measured claim with no test behind it.

## It is working if

Every comment in scope got a verdict, each verdict defensible on its own rather than as a total. Nothing
you deleted was the only surviving record of a decision, and nothing you shortened was under an
unresolved contradiction. Where you did change things, comment words fell faster than comment lines,
because register is where the weight is.

**A file that needs no changes passes this too.** Every comment coming back `keep` is a result, not a
skipped pass, on the same evidence as any other run: the sweep covering every comment, each with a clause
saying what it tells a reader that the code does not. Never manufacture an edit to justify the run. A
pass that always finds something is not measuring anything, and a wrong deletion costs a fact nobody can
recover.
