---
name: optimize-comments
description: >-
  Audit and fix the comments in a file, a diff or a package: delete the ones carrying nothing, repair the
  ones that now contradict the code, and add the missing reason a reader cannot recover from the code
  itself. Use for "clean up these comments", "the comments are out of date", "too many comments", "this
  file is over-commented", or before handing code to someone who has never read it. NOT a code review for
  defects, and not for generated or vendored files.
---

# Optimize comments

A comment cleanup that only deletes makes the codebase worse. Two failures, opposite directions:

- **Comments that say what the code already says.** Noise, and they crowd out the ones that matter.
- **Comments that never got written.** The reason a line exists is the one thing a reader cannot recover
  by reading harder, and it is the rarest kind of comment in the wild.

Three numbers worth carrying into the pass. In six large Java projects, 59% of comment lines said nothing
about the readability or maintainability of the code they sat next to. Comments explaining *why* were
outnumbered by comments restating *what* roughly one to twenty-one. And a comment that contradicts its
code makes the next commit to that code about 1.5 times more likely to introduce a bug.

## Step 1: scope it before you touch anything

**Ask, and wait.** These change what you are allowed to delete.

1. **Which files.** A file, a diff, a package. Generated files and vendored dependencies are out.
2. **Is there a doc-comment convention**, and does anything publish from it? A doc comment feeding
   generated API documentation is a deliverable, not a comment.
3. **May you change code**, or comments only? Deleting a comment by renaming the thing it explains is a
   code change and needs the tests to prove it.

**Never touch license headers, copyright notices or attribution required by a license.** They are the
largest comment category by line count in real projects, and the first thing a naive pass deletes.

## Step 2: route the fact, do not judge the comment

Ask what each comment is trying to record, then ask where that fact belongs. Most bad comments are true
facts living in the wrong home, and the homes differ in one way: whether the record breaks loudly when
the code moves under it.

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

The bottom two rows are what a comment is for, and both go stale in silence. That is why a comment has
to earn its place.

## Step 3: find the comments that lie

**A comment older than the code beneath it is describing a version that no longer exists.** Compare the
last-changed date of the comment against the block it describes, and read every comment that lost the
race. Do not hunt for a commit that edited code and forgot the comment: when comments get edited at all
they are almost always edited alongside the code, so the ones that lie are the ones nobody has opened in
years.

**When a comment and the code disagree, do not assume the comment is wrong.** The comment may be the only
surviving record of what the code was supposed to do, in which case you have found a bug in the code, not
a stale comment. You cannot tell which from the file. Report both readings and let the author decide, and
never silently rewrite the comment to match the code.

**Check:** every contradiction you found is either fixed or reported as an open question with both
readings stated. None was resolved by guessing.

## Step 4: delete what carries nothing

- **Restating the code.** If the comment's words are the code's words, it adds nothing. `// increment i`
  over `i++`.
- **Commented-out code.** Version control already has it.
- **Changelogs, bylines and dates.** The history holds these, accurately.
- **Section banners and formatter directives** that separate what indentation already separates.
- **Mandated empty documentation.** `@param path the path`, which repeats the signature.
- **Comments explaining code that could just be clearer.** If a rename removes the need for the comment,
  and you are allowed to change code, rename it.

**Check:** for each deletion, say what information was lost. If the answer is anything other than
"nothing", it was not a deletion, it was a move, and step 2 says where.

## Step 5: fix the ones you are keeping

A comment pitched at the same level as the code it sits on will always be a restatement. A useful one
moves in one of two directions:

- **Down, for precision.** Units, ranges, null-ness, what the empty case means, which of two plausible
  encodings this is.
- **Up, for intuition.** What this block accomplishes, so a reader can skip the body.

The test: **does the comment use different words than the code?** Same words means same level, which
means it is redundant. If you cannot describe the thing except by restating it, the code needs the fix,
not the comment.

## Step 6: add the reason that is missing

Skipping this step turns the pass into vandalism. Newly written code is the least commented code in a
codebase, so the file someone has just edited hard is where the why has gone missing.

Look for a constant nobody can explain, a guard against a case that looks impossible, a deliberately
unusual approach, an ordering that matters, or a workaround for someone else's bug.

Write the reason, not the restatement. If you do not know why a line is there, say so in the report
rather than inventing a plausible reason, which is worse than no comment at all.

## Step 7: report

Show the diff. Then the counts: deleted, repaired, added, and moved to another home. List every
contradiction between a comment and its code separately, with both readings, because those are the ones
that need a human who knows the intent. Do not bury them in a total.

## If you cannot read history

The age comparison in step 3 needs version control. Without it, that step becomes reading each comment
against the code beneath it and asking whether it is still true, which is slower and misses less-obvious
drift. Every other step is unchanged. Say in the report that the age check did not run.

## It is working if

The comment count went down and the number of comments answering *why* went up. At least one comment
turned out to contradict its code, and you reported it rather than quietly rewriting it to agree.
Nothing you deleted was the only surviving record of a decision. Every comment you kept says something
the code beside it does not.

## Sources

The 59% figure and the why-to-what ratio: Pascarella and Bacchelli, "Classifying code comments in Java
open-source software systems" (MSR 2017), 2,000 hand-classified files across six projects. The
co-evolution finding: Fluri et al., "Do Code and Comments Co-Evolve?". The bug figure: recent work on
code-comment inconsistency. The abstraction-level and different-words tests are Ousterhout's, in *A
Philosophy of Software Design*.
