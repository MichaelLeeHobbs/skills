---
name: optimize-comments
description: >-
  Cut comments in a file, diff or package down to the few an agent needs. Use for "clean up these
  comments", "strip the comments", "remove useless JSDoc", "the comments are out of date", "too many
  comments", or "this file is over-commented". Deletes by default: a comment stays only when it states
  something the code and types cannot, in a form that cannot drift from the code. Deletes doc comments
  that repeat types, narration, banners, commented-out code, and claims about the repo's own speed, size
  or cost; keeps outside facts, deliberate oddities, caller rules, security limits and tool directives.
  Flags comments that excuse a shortcut ("quick fix is fine because", "timer works around the race") as
  findings instead of keeping or hiding them. NOT a general code review, not for TODOs tied to issues
  (use triage-todos), and not for generated or vendored files.
---

# Optimize comments

Agents read most code now, and they read the same file many times. Every comment is paid for on every
read, and a comment that describes the code goes stale the first time the code changes without it. A
stale comment is worse than none: the agent believes it. So the default verdict is **Delete**, and a
comment has to earn its place.

## The keep test

Keep a comment only when all four hold:

1. **It prevents a named mistake.** Write down the edit an agent would make without it and what that
   edit breaks: wrong output, a crash, data loss, a security hole, a broken contract, a failed build, or
   a test that passes while proving nothing. Slower, costlier or less tidy is not breakage: an agent can
   make that edit and measure it. No named mistake, no comment. "An agent would act differently without
   it" is not enough, because a false comment does that too.
2. **The code and types cannot say it.** It is one of four kinds: an **outside fact** (a vendor limit, a
   spec rule, a runtime defect), a deliberate **oddity** an agent would otherwise "fix", a **caller
   rule** the types miss (units, side effects, ordering, ownership), or a **security limit** (a trust
   boundary, a bound on untrusted input); if two fit, security limit wins. "Reason" is not a kind. A
   "because" proves nothing: judge the fact it rests on.
3. **It cannot drift.** Neither the code nor the state of the repo owns the fact (see below), or the
   comment points to a lasting source: an issue, a spec section, vendor documentation, a decision record.
   A comment that says what the code does fails this, however accurate it is today.
4. **It is the shortest form that still does the job.** One clause beats a sentence; a sentence beats a
   paragraph.

**Claims about the repo itself are always Delete.** How long something takes, which step dominates, how
big, how many, "cheap", "long enough", "never flaky", what else shares a server or a file: these go
false when the repo changes, with no edit near the comment. Delete them whether or not they are true
today; this comes before Contradiction, and only Excuse (below) comes before it. Delete the clause that
makes the claim, and the whole comment unless the rest passes the keep test alone. Keep only a pointer
to a recorded measurement, without the claim. Go by who owns the fact, not by its words: a limit set
outside the repo ("the runtime kills the process after 10s") is an outside fact.

**A comment records a fact, never excuses a shortcut.** "Vendor drops the first request after idle
(issue 88)" is a fact that forces the code. "Quick fix, fine for now", "the timeout gives the list time to render"
or "works around the race" argues that a hack is acceptable, and teaches the next agent to copy it. An
excuse is never a Keep, and never a silent Delete either, because deleting it hides the hack. A timer,
sleep or retry with no named cause is an Excuse even when the comment also claims it is long enough.

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

Leave TODO, FIXME, HACK and XXX markers in place and list them for triage-todos. If that skill is not
available, list them in the report as unjudged.

If you split the work, give each worker this file and its references, never a summary: a summary drops
the rules that make a worker check. Without parallel work, take the files in order.

## Step 2: give every comment one verdict

| Verdict | When |
|---|---|
| **Delete** | Fails the keep test. This includes narration, doc comments that repeat a name or a type, section banners, commented-out code, history notes, and any comment describing what the code does |
| **Move to test** | Passes rules 1 and 2, but a test already pins the behaviour. Delete the comment if the test's name or assertion message states the cause; if it does not and code changes are allowed, rename the test to state it, then delete |
| **Shorten** | Passes the test with more words than it needs |
| **Keep** | Passes the test, or is a fixed exception. Name its rule-2 kind, the edit it prevents and what that edit breaks, or which exception it is |
| **Contradiction** | The comment states a fact that the code or a check disproves. This comes before Delete. Report both readings. Do not delete it to make the conflict disappear: it may be the only record of intended behaviour, and the code may be the bug |
| **Excuse** | The comment justifies a shortcut instead of stating a fact that forces it. Leave it in place and report it as a finding: the code it excuses, the fix (find the root cause the timer, retry or sleep papers over), or the issue to file. If it calls itself temporary or names an issue, also list it for triage-todos |

Read [reference/SHAPES.md](reference/SHAPES.md) for how the verdicts land on doc comments, banners,
directives, commented-out code and the cases that look like keeps but are not.

**Typed languages.** In TypeScript, typed Python, Kotlin, Rust and similar, a doc comment on anything
that is not public API of a published package keeps only the sentences that pass the keep test. Tags
that restate the signature (`@param x the x`, `@returns the result`, `@type`, `@async`) always go. A
doc comment with nothing left is deleted, not shortened to a stub.

**Check:** every comment in scope has exactly one verdict; every Keep and Shorten names its kind, the
edit and the breakage, or its exception; every Move to test names the test that now carries it; and
every Excuse names the code it excuses and the fix or issue.

## Step 3: check before deleting

Read the code around each comment and enough of its callers to judge it. A comment can look like
narration and still carry an outside fact ("retry once" may record a vendor defect), so look for its
source before you judge it.

Check the claim in every comment you would keep, whatever its kind: run it, read the library or the
spec, or find the issue or commit that recorded the failure. Then:
- **True:** keep it.
- **False:** Contradiction, reported with what disproved it.
- **Cannot be checked:** if it names a lasting source you cannot open, keep it, marked unverified. If
  the commit that added it describes the failure, keep it with a pointer to that commit. Otherwise
  Delete, and list its full text in the report so the author can restore it. Never delete a security
  limit for this; keep it, marked unverified.
- **Checked in part:** cut the unchecked part, unless it is a security limit, which stays, marked.

**Expiry conditions** ("revisit if", "until", "once X ships"): check the condition and report whether it
is met. Keep it, and list it for triage-todos, only when it is not met and the claim it bounds passes the
keep test. Otherwise Delete, including a condition that stands alone.

Read [reference/EVIDENCE.md](reference/EVIDENCE.md) when you are unsure whether a test really pins a
behaviour, or whether a comment is a caller rule or narration.

**Check:** each Move to test names the test and the assertion that pins the behaviour. Each
Contradiction lists both readings. Each Keep that is not a fixed exception says how its claim was
checked.

## Step 4: shorten what stays

Cut each kept comment to its fact. Drop the subject when the code makes it plain ("vendor caps batches
at 500" over "We need to do this because the vendor API caps batches at 500 items"). Keep the qualifier
that bounds the claim (a runtime version, a condition): a shorter comment must never claim more than the
original. Cut a clause that restates the code; keep one that names the breakage. If it is still long
with its condition, Delete and report it. Replace a long explanation with one line and a pointer to the
issue or decision record that holds the rest.

Add a comment only for a deliberate oddity you found evidence for in this pass, such as an issue or a
commit message that explains it. Never add a doc comment, a summary, a comment that describes the
code, or a comment that excuses a shortcut. Never shorten an Excuse into something that reads like a
Keep.

## Step 5: verify and report

**Judge the keeps again.** Give every Keep and Shorten except fixed exceptions, with its code but not its
verdict, to a separate worker; without one, do it yourself as a fresh pass after the edits. If the second
reader would not keep it, Delete and report, but a security limit stays and is reported.

Run what reads comments or depends on them: the type checker (doc-comment types), the linter
(directives), the formatter, the doc build for a published package, and doctests. Any failure means a
comment you removed was code: restore it and record it as a fixed exception.

Show the diff and the verdict counts. Report comment lines and words before and after, the comments kept
by kind and as a share of those judged, every Keep's edit and breakage, the fixed exceptions by kind,
unverified claims kept, deleted claims with their text and the setting or code each defended (it may be
wrong too), contradictions with both readings, excuses with the fix or issue each needs, and the
markers and expiry conditions left for triage-todos. Then append the run record as
[reference/RUN-RECORD.md](reference/RUN-RECORD.md) says.

**The pass succeeds when** every comment has one verdict, every Keep names its kind, the edit and the
breakage or its exception, the keeps were judged twice, no fixed exception was removed, and every check
above passes. The pass fails when a check fails after restoring, a comment is unaccounted for, or the run
record is missing or disagrees with this report's commit or check. A check that could not run has failed.
A pass that kept unverified claims is `partial`.
