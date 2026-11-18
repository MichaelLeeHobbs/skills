---
name: triage-todos
description: >-
  Use for "are these TODOs still real", "clean up stale TODOs", "which FIXMEs point at closed bugs",
  "delete TODOs for fixed issues", "triage our TODO comments", "agents keep chasing old TODOs", "re-run
  the TODO triage". Judges each TODO, FIXME, HACK and XXX marker, and each unmarked "temporary" or "this
  breaks when" note, against its linked issue's current state, the file's history since the comment was
  written, and the code as it is now. Gives every marker a verdict (delete, rewrite, link, keep,
  conflict, unproven) with the evidence for it, and edits only what the user approves. NOT for counting
  or trending markers (use debt-ledger), general comment tightening (use optimize-comments), or fixing
  the work a TODO describes.
---

# Triage TODOs

A TODO that points at a closed issue, or at code that no longer exists, tells every reader and every
agent there is work to do when there is none. An agent that reads one may go and do it, unasked. Find
those markers, prove each one stale from evidence, and remove or rewrite them with the user's approval.

**Verify intent before proposing a deletion.** Age proves nothing. A five-year-old TODO on an open issue
is accurate; a week-old one whose code was deleted is stale. Every Delete needs the issue's state, or the
change that removed the condition, named in the report.

**What it writes.** A report, and one line in the shared run record, both under `clean-code/` as
[reference/REPORT.md](reference/REPORT.md) says. It edits comments only after the user approves the
verdicts, files no issue without a yes for that issue, and commits nothing. Temporary files go in a work
folder outside the repo.

## Prerequisites

Stop before any work and say which is missing:
- You can read files and search the repo.
- You can run commands, to search at a pinned revision and read version-control history.

Two sources are optional, and each one that is missing makes the run `partial`:
- **Version control.** Without it there is no file history. Markers can still reach Delete only when
  the linked issue is closed as fixed and the condition is gone from the current code.
- **Issue tracker access.** Read-only access to each tracker the markers reference (a CLI, an API, or a
  web page you can read). Without it, every referenced marker is Unproven. Unreferenced markers are still
  judged from the code and its history.

## 1. Pin and scope

Record the commit, and whether the tree is dirty, before anything else. Read everything at that commit.
Scope is the whole repo unless the user named a package, folder or file. Ask once which trackers the
repo uses if the markers' references do not make it clear (a bare `#123` is ambiguous). Write the answer
in the report header.

## 2. Find the markers

Use [reference/MARKERS.md](reference/MARKERS.md): the marker tags in every comment form of each
language present, then the unmarked phrases. Skip the paths MARKERS.md lists as out of scope, and count
them by reason. Record each hit: path, line, tag (or `unmarked`), the reference it carries (issue key,
URL, or none), and the comment text with its continuation lines.

If the repo has a debt-ledger item list, you may use its paths and lines as a cross-check: every
debt-ledger marker in scope must appear in your list. Never use it in place of your own search.

## 3. Gather the evidence

For each marker, collect the four facts [reference/EVIDENCE.md](reference/EVIDENCE.md) defines, and
write each with its source:
1. **Issue state:** `open`, `fixed`, `wontfix`, `duplicate`, `not_found`, `unreachable` or `none`, with
   the date you read it and the closing change when the tracker names one.
2. **Written:** the commit and date that introduced the comment, following moved lines.
3. **Code since:** whether the code the comment describes changed after that commit, and in which
   commit.
4. **Condition now:** whether what the comment warns about or asks for still holds in the current
   code: `holds`, `gone` or `unknown`, with the lines that show it.

Look up each issue once and reuse the result for every marker that cites it. Read only what the
tracker shows; never infer a state from an issue's title or age.

## 4. Decide each verdict

Apply the decision table in EVIDENCE.md. It gives exactly one verdict per marker:

| Verdict | Means | Proposed change |
|---|---|---|
| **Delete** | Stale: the issue is fixed, or the condition is gone | Remove the comment |
| **Rewrite** | The constraint is real but the TODO framing invites work nobody will do | State the constraint as a fact; drop the marker |
| **Link** | A real open problem with no issue | Draft an issue; after it is filed, add its key to the comment |
| **Keep** | Open issue, accurate text | None |
| **Conflict** | The evidence disagrees (issue fixed, condition holds) | None; report both readings |
| **Unproven** | A fact needed to decide is missing | None; name the missing fact |

Never upgrade Unproven or Conflict to Delete because the marker looks old or vague.

## 5. Verify

Hand every Delete and Rewrite, plus a sample of Keeps (at least 5, or all if fewer), to a verifier that
did not make the first call: if you can run work in parallel, a separate worker given only the marker
and its raw evidence; otherwise yourself, in a fresh pass that re-reads the evidence without looking at
the first verdict. The verifier applies the decision table on its own. A disagreement turns that marker
into Conflict, with both verdicts shown.

Run the canaries in EVIDENCE.md "Canaries" through the same table. Each must land on its planted
verdict.

## 6. Report

Write the report as REPORT.md lays it out: header, headline counts, one table per verdict with every
marker's evidence, and the canary and check lines. Show the user the headline and the Delete and Rewrite
tables, and ask which verdicts to apply. Then append the run record as REPORT.md "Run record" says.

## 7. Apply what the user approves

Only on the user's approval, and only the markers they approved:
- **Delete:** remove the comment and its continuation lines. Leave the code untouched.
- **Rewrite:** replace the comment with the stated constraint, in the repo's comment style.
- **Link:** show each issue draft and file it only on a yes for that issue. Then add its key to the
  comment in the form the repo's other markers use.

Then search again at the working tree: every applied Delete and Rewrite marker is gone, every other
marker is still there, and the diff touches only comment lines. If the repo has a check that reads
comments (doc tests, a docs build, a lint rule on markers), run it. Report the result beside the report's
verdicts; do not append a second run record.

## Check

**The run fails**, and the report says so above the header, when any of these happens:
- the marker canary in MARKERS.md is missed, or its planted string literal is counted;
- the report's marker count differs from the step 2 search count minus the skipped paths;
- a Delete or Rewrite row lacks its issue state with a read date, or its commit, as EVIDENCE.md requires;
- a verdict canary lands on a different verdict;
- a debt-ledger marker in scope is missing from your list (when that list exists);
- after step 7, an approved marker is still present, an unapproved marker is gone, or the diff touches a
  non-comment line;
- the run record is missing, or disagrees with this report's commit, value or check.

A check that could not run has failed. The run is `partial` when any marker is Unproven, or when
version control or tracker access was missing.

## If you cannot run work in parallel

Run every step in order. Step 3 is the slow one: look up issues one at a time, write each result to the
work folder as you go, and resume from there. Do step 5's verification as a separate pass after all
verdicts are written, never interleaved with deciding them.
