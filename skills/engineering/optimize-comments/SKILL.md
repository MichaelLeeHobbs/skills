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
what the code already says, and the reason a line exists never getting written down at all.

Expect that mix. In six large Java projects, 59% of comment lines said nothing about the code beside
them, and comments restating *what* outnumbered comments giving *why* by about 21 to 1. The evidence
behind every rule here is in [reference/EVIDENCE.md](reference/EVIDENCE.md). Read it once before your
first pass.

## Three standing rules

1. **Prefer self-documenting code.** A rename or an extracted function that removes the need for a
   comment beats the comment. It cannot go stale. Try it before writing or keeping anything.
2. **A comment says why, not what.** One exception, and it is the only one: a doc comment on an exported
   declaration may say what, because a caller reading a hover cannot see the body.
3. **Terse.** A comment longer than the code it annotates means the fact is in the wrong home. A reason
   that needs a paragraph is a decision record.

Rules 2 and 3 have different budgets for the two kinds of comment, because they have different readers. A
doc comment on an exported declaration is read by a person on hover, deciding how to call something
without opening it. That is an interface, it earns the length a caller needs, and nothing else in the
codebase can carry it. An inline comment inside a body is read by whoever already opened the file, which
in practice means a model loading it into context. Nobody hovers it. Its job is to stop a plausible wrong
edit, and every line past that is weight the next reader pays for. An over-commented file makes the model
skim what is in it, the same way an over-long instruction file does.

## Step 1: scope it before you touch anything

**Ask, and wait.** These change what you are allowed to delete.

1. **Which files.** A file, a diff, a package. Generated files and vendored dependencies are out.
2. **Is there a doc-comment convention**, and does anything publish from it? A doc comment feeding
   generated API documentation is a deliverable, not a comment.
3. **May you change code**, or comments only? Rule 1 needs renames, and a rename is a code change that
   needs the tests to prove it.

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

**Already enforced by a test.** The highest-yield cut in a mature codebase, and the one that answers "but
these comments are load-bearing": the load is already being carried. A comment recording a measured
behaviour is describing a regression test. If that test exists, the comment is a second copy free to
drift out of agreement with it. If it does not, the comment is the only thing holding a behaviour nobody
checks, which is worth more than any edit to the prose. Search the tests for the behaviour, not for the
rule, symbol or option name: a test asserting through a fixture never names the thing it protects, so a
name search reports no coverage where there is plenty.

**It lies.** A comment older than the code beneath it describes a version that no longer exists. Compare
the last-changed date of the comment against the block it describes and read every comment that lost the
race. Do not hunt for a commit that edited code and forgot the comment: when comments get edited at all
they are almost always edited alongside the code, so the ones that lie are the ones nobody has opened in
years. **When a comment and the code disagree, do not assume the comment is wrong.** It may be the only
surviving record of what the code was supposed to do, which makes this a bug in the code. You cannot tell
which from the file, so report both readings and never silently rewrite the comment to match.

**It carries nothing.** Restating the code, where the comment's words are the code's words. Restating the
name, where a doc comment's first line is the declaration written out in prose; cut that line and keep
whatever follows, if anything does. Commented-out code, which version control already has. Changelogs,
bylines and dates, which the history holds accurately. Section banners and formatter directives that
separate what indentation already separates. Mandated empty documentation such as `@param path the path`.

**Check:** every contradiction is fixed or reported with both readings, none resolved by guessing. Every
measured claim is named alongside the test that asserts it, or reported as unguarded. For each deletion,
what was lost is nothing; anything else was a move, and step 2 says where.

## Step 4: shorten the ones you are keeping

A comment pitched at the same level as the code will always restate it. A useful one moves down for
precision, giving units, ranges, null-ness or which of two plausible encodings this is, or up for
intuition, saying what a block accomplishes so a reader can skip the body.

The test: **does the comment use different words than the code?** Same words means same level, which
means redundant. If you cannot describe the thing except by restating it, the code needs the fix.

Then cut to the shortest form that still stops the wrong edit. What survives is usually one clause: the
failure that produces no signal, the measured number, the reason the obvious alternative is wrong.

## Step 5: add the reason that is missing

Skipping this turns the pass into vandalism. Newly written code is the least commented code in a
codebase, so the file someone has just edited hard is where the why has gone missing.

Look for a constant nobody can explain, a guard against a case that looks impossible, a deliberately
unusual approach, an ordering that matters, or a workaround for someone else's bug. Prefer the ones whose
failure is silent: a mistake that throws teaches the next reader on its own, and one that produces no
signal never will.

Write the reason, not the restatement. If you do not know why a line is there, say so in the report
rather than inventing a plausible reason, which is worse than no comment at all.

## Step 6: report

Show the diff, the verdict counts from step 2, and the comment-to-code ratio before and after. List two
things separately rather than burying them in a total: every contradiction between a comment and its
code, with both readings, and every measured claim with no test behind it.

## If you cannot compare ages

The age check needs history with some spread in it. A file rewritten last week blames entirely to last
week, and the check then returns nothing rather than failing, so confirm you got a real spread before
trusting a clean result. Without usable history, read each comment against the code beneath it and ask
whether it is still true. Every other step is unchanged. Say in the report that the age check did not run.

## It is working if

Every comment in scope got a verdict, and at least one was removable by a rename rather than by deleting
prose. The comment-to-code ratio fell while the number of comments answering *why* rose. At least one
comment either contradicted its code or duplicated a test, and you reported it rather than quietly
resolving it. Nothing you deleted was the only surviving record of a decision.
