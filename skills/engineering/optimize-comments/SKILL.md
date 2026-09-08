---
name: optimize-comments
description: >-
  Audit and tighten comments in a file, diff or package. Use for "clean up these comments",
  "the comments are out of date", "too many comments", or "this file is over-commented".
  Delete information readily recoverable from nearby code, preserve the shortest useful explanation
  of constraints and intent, and add missing reasons only when supported by evidence.
  NOT a general code review, and not for generated or vendored files.
---

# Optimize comments

Keep the shortest comment that prevents a plausible misunderstanding or wrong edit. Delete information readily recoverable from the nearby code. Preserve constraints, reasons, and external facts the code cannot express.

Minimize the total effort and context needed to understand and safely change the code. A sentence that saves tracing several files or rediscovering a runtime bug can earn its tokens. A sentence narrating the next line does not.

## Standing rules

1. **Prefer clear names and structure.** Use a better name when it explains the point naturally and code changes are in scope. Do not introduce an abstraction solely to remove a short useful comment.
2. **Preserve information the reader needs.** Reasons an obvious alternative fails, ordering constraints, surprising units, compatibility requirements, and external contracts can belong beside the code. Explain what callers need without making them read the implementation, including callers inside the same package.
3. **Make each sentence earn its place.** Cut repetition, throat-clearing, and narration. Use an imperative for an instruction and a direct statement for a fact. A one-line workaround may need two sentences; comment-to-code length is not a deletion rule.
4. **Add only evidenced explanations.** No comment quota per declaration, and no requirement to add something in every pass. If the code is already clear, leave it alone. If the reason is unknown, report the gap rather than inventing one.

## Step 1: establish scope and protected content

Use the scope and permissions already supplied. Resolve only missing details that affect the work: which files, whether code changes are allowed, and which comments feed published documentation or tooling. Generated and vendored files are out. Without authorization for code changes, edit comments only. If a comment's publication or tooling role is uncertain, preserve it and report the uncertainty.

**Never change license headers, copyright notices, or attribution required by a license.** Preserve published documentation contracts and active formatter, linter, compiler, coverage, and other tool directives. These comments affect tools; removing them requires separate justification and verification with the tool that consumes them. Unknown directives stay until their role is understood.

## Step 2: read every comment and record its disposition

Read the surrounding code and enough of its callers, tests, and dependencies to judge each comment. Record one verdict per comment, including protected ones:

- **Rename.** An authorized naming or structure change makes the explanation unnecessary.
- **Contradiction.** The comment and implementation disagree; identify the conflicting claims.
- **Delete.** The comment adds no useful information beyond nearby code or repeats an explanation already accessible where needed.
- **Shorten.** Keep its useful information in fewer words.
- **Keep.** Name the misunderstanding it prevents, the caller information it supplies, or the legal/tooling role that protects it.

Choose the home by what the reader needs:

| Information | Home |
|---|---|
| What a simple expression or declaration does | Clear code or a better name |
| A behavior that must keep holding | A test, with a local explanation when its reason is not evident |
| A broad design decision and rejected alternatives | The project's decision record, with a short local pointer when needed |
| What a caller must know without reading the body | A doc comment on the declaration |
| A local constraint, unit, ordering requirement, or compatibility reason | A short comment beside the relevant code |
| A tool directive or required notice | Preserve where its consumer requires it |

Avoid copying long explanations between homes. A test can enforce behavior while a comment explains why it matters. A local pointer can save a reader from searching for the decision that makes an unusual line necessary.

**Check:** account for every comment in scope, with a reason for every deletion and every protected comment left intact.

## Step 3: check the evidence before deleting or correcting

**Test coverage does not automatically replace a comment.** Read the assertion and the behavior it exercises. Delete a comment that merely narrates an obvious tested implementation, but keep the shortest useful explanation of the requirement or constraint. A reader who does not understand the reason may otherwise change both the implementation and its test. Search for behavior rather than names alone; fixture-driven tests may not name the option they protect.

**Verify external claims.** Open a referenced dependency, specification, fixture, or issue when it determines whether the comment is still true. Record the evidence. If it is unavailable, mark the claim unchecked and preserve the explanation pending verification. An unavailable check is not a pass.

**Treat contradictions as unresolved until intent is established.** A stale-looking comment may be the only surviving record of intended behavior. Report both readings and do not rewrite or shorten it to match the implementation by assumption. Use history to find relevant changes when available; age alone proves neither correctness nor staleness. Without history, compare current code, callers, tests, and available requirements, and report what remains unknown.

**Distinguish stale history from a live constraint.** Delete a completed-migration note only when it no longer helps a reader act. Keep the reason for a rejected alternative someone could plausibly reintroduce. Read [reference/SHAPES.md](reference/SHAPES.md) for ambiguous cases, directives, and section banners. Read [reference/EVIDENCE.md](reference/EVIDENCE.md) when assessing the reasoning and limits behind these rules.

**Check:** every contradiction is resolved from evidence or reported with both readings. For each deletion, identify where its useful information remains or explain why it is no longer needed. Mark required checks that could not run as unverified.

## Step 4: shorten and fill evidenced gaps

Remove facts the nearby code already makes apparent, redundant introductions, and repeated rationale. Keep the condition, unit, exception, or reason that changes how the reader interprets or edits the code. Reusing a symbol's name does not make a comment redundant; ask what information the sentence adds.

Prefer one clause when it carries the whole explanation. Keep another sentence when dropping it would force the reader to reconstruct a consequential constraint. Preserve qualifiers that bound a claim, such as a runtime version or a condition under which behavior changes.

Look for missing explanations around unusual ordering, surprising constants, compatibility workarounds, and guards against apparently impossible cases. Add a short reason only when supported by evidence and useful at that location. A pass that only deletes, or makes no edits, is valid when no missing explanation is found.

## Step 5: verify and report

Review the diff against the original comments. Confirm no unique reason, caller contract, unit, required notice, or active directive disappeared. For each shortened comment, check that the relevant condition and consequence remain understandable without reconstructing the deleted text.

Run relevant checks for any authorized code or directive changes, including the consuming tool when a directive changed. If a required check cannot run, report that change as unverified rather than declaring it successful.

Show the diff and verdict counts. List unresolved contradictions, unavailable evidence, and important behaviors lacking tests separately. Report comment word counts before and after as context, without a reduction target. Additions can be justified even when the total grows.

**The pass succeeds when** every comment is accounted for, each change has a defensible information-based reason, protected content remains intact, and required checks pass. Zero edits is a valid result. Do not manufacture a deletion or addition to meet a count.
