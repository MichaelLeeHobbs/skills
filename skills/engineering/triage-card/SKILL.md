---
name: triage-card
description: >-
  Judge one or more tickets, or an epic, before anyone builds them: is it still valid, what is it really
  about, where is its diagnosis wrong, what does it collide with, how big is it, and what should happen
  next. Use for "what do you think of this ticket", "is this still a thing?", "triage these", "look at
  this epic", "is this still valid?", from any issue tracker. Ends with a recommendation, questions and a
  triage comment on each ticket. NOT for reviewing a pull request or diff (that is code review), NOT for
  building the fix, and NOT for a whole-backlog sweep when the project has its own backlog process.
---

# Triage a ticket (or a batch of tickets)

Someone wants your judgement on a ticket before work starts. The answer is a verdict with evidence, a
plain restatement, the places the ticket is wrong, the work it collides with, a size, options with your
pick first, and numbered questions. It is not an implementation.

**Change nothing in the repository until the user picks a path.** Reading code, history and logs is
fine, and so are throwaway scripts outside the repo. Production data only through the project's
sanctioned read-only route. The tracker is the exception: the triage is recorded on each ticket (step 8),
because a triage that lives only in a chat gets redone.

## 0. Load the project's rules

Read your agent's context file and the project's contributing docs before researching. Look for:

- **A project copy of this skill.** Where it differs from this file, it wins.
- **Ticket conventions:** fields, labels, link types, how tickets are closed, what a comment looks like.
- **The docs or skills that own the areas the ticket touches** (UI, routes, schema, workers, tests). Note
  for each area the pattern a fix must follow and one real file that follows it. You check every
  proposed fix against this list in step 4.
- **Where decisions are recorded:** a decision log, ADRs, planning docs.
- **A backlog-triage process with its own verdict words.** If one exists, use its words in ticket
  comments so every comment on the board reads the same.

## 1. Scope the set

- Read every ticket you were given, with comments and links. For an epic, read it and all its children.
- Find the neighbours: linked and parent tickets, the tracker's similar-issue search if it has one, and a
  text search on the ticket's key nouns over open and recently closed tickets. List them as related.
  Propose folding the ones that are clearly the same work; they join the set only when the user agrees.
- Leave out tickets someone else is actively working, and say which and why.

**More than about three tickets, or tickets in unrelated areas:** if you can run read-only research in
parallel, give one researcher per cluster steps 2 to 6, with the brief in
[reference/templates.md](reference/templates.md#researcher-brief). Researchers never write to the tracker; you
do every write. **Without parallel workers,** do the tickets one at a time in the same order, finishing
each ticket's verdict and evidence before starting the next, so evidence never bleeds between tickets.

## 2. Pin a source revision

Fetch the remote, then record the full commit id of the default branch (for git: `git fetch origin`,
then `git rev-parse origin/<default>`). Use that id for every read: `git show <rev>:<path>`,
`git grep <pattern> <rev>`, `git log <rev>`. Never switch, reset or dirty the user's checkout.

If the fetch fails, use the local ref and write in the report and the comment that the revision may be
stale. If you cannot pin any revision, every verdict is `UNCLEAR` and the check in step 9 fails.

**The code may live elsewhere.** A ticket about another system is triaged in that system's repository.
Find it, pin its revision the same way, and follow that board's conventions for the tracker writes.

## 3. Is it still valid?

Trace each claim at the pinned revision: entrypoint, permissions, logic, persistence, consumers. Then
look for what overtook it: commits or merged pull requests that mention the ticket or its keywords, a
later decision or epic that superseded it, the named component removed or rewritten.

| Verdict | Means | Evidence required |
| --- | --- | --- |
| `VALID` | Still needed as written | The defect or gap at the revision, `path:line` |
| `PARTIAL` | Some of it is done | What is done (commit, `path:line`) and exactly what remains |
| `DONE-ON-MAIN` | Implemented in source | Commit, `path:line`, tests; deployed or not, stated apart |
| `OBE` | Overtaken by events | The change, removal or decision that made it moot |
| `DUPLICATE` | Same work as another ticket | The canonical ticket, and anything unique here to move to it |
| `NEEDS-DECISION` | Blocked on a product or ownership call | The specific question |
| `UNCLEAR` | Cannot tell, or cannot prove | What is missing |

**A verdict without evidence is `UNCLEAR`, never a guess.** Source on the default branch is not shipped:
for `DONE-ON-MAIN`, say whether it is deployed, and check the project's deploy record or logs when that
matters.

## 4. Challenge the ticket

The ticket's diagnosis and proposed fix are the reporter's hypothesis, not a spec. The reporter may not
be a developer, and the text may have been drafted by a cautious assistant. Finding where the ticket is
wrong is the most valuable thing a triage does. [reference/example.md](reference/example.md) is the
model.

- **Check each claim on its own** and label it `confirmed` (with `path:line`), `real bug, wrong cause`,
  or `wrong`. A claim can describe a real symptom and still guess the wrong mechanism.
- **Explain every symptom.** If the proposed fix does not account for one (it repeats, it alternates, it
  happens only after X), there is probably a second bug. Find the mechanism and label it `hypothesis,
  not verified` until logs, data or a reproduction confirm it.
- **Look for code that already does it right:** a sibling path that handles the same case, or a helper
  the broken path skips. Reusing it is usually the fix, and it shows the fix is small. A fix that builds
  something differently from the pattern the owning docs require is wrong even if it works; name the
  pattern it should follow.
- **Judge each option the ticket proposes.** Reject options that add a second source of truth, put the
  fix in the wrong system, or treat a symptom. Keep fair stopgaps, labelled as stopgaps.
- **Widen the scope.** Who else does this affect beyond the reported user, site or record? Which other
  systems received the same bad data? Propose the survey query, and keep data cleanup separate from the
  code fix.
- **Do not inherit approval gates from ticket text.** "Needs X's go-ahead" written on a ticket is not a
  rule. The user decides who approves.

## 5. Restate it and find collisions

- Restate the ticket in two or three plain sentences: the user-visible problem or goal, not the fix.
- **Conflicts:** open pull requests and remote branches touching the same files (for git:
  `git log <rev>..origin/<branch> -- <paths>`), local worktrees, tickets in progress in the same area,
  and recorded decisions the ticket contradicts. Name each with a link, or write "none found" and list
  what you checked.

## 6. Size it

- **Small:** fix X, or add a feature to an existing system. One area, a known pattern.
- **Medium:** several tickets or packages, but an existing system and an obvious design.
- **Large:** a new system or domain, or a major overhaul. Usually the ticket is really an epic. Large work
  goes to a planning step (a design discussion, a plan document, sliced tickets) before any code.

## 7. Report

Use [the answer shape](reference/templates.md#answer-shape). Sensitive-data exposure (such as PHI or PII
reaching the wrong audience) goes first. Options put your pick first; questions are numbered, each with a
default, so the user can answer "1 yes, 2 drop".

## 8. Record it on the ticket

Follow the project's ticket conventions for every write.

- Post a triage comment on each ticket whose verdict is not a plain `VALID` or whose diagnosis you
  challenged. Never post a bare "still valid". The template is in
  [reference/templates.md](reference/templates.md#triage-comment).
- Add only links you are sure of, after reading existing links. If a link is refused, name the ticket
  in the comment instead.
- A "triaged" label, if the project uses one, goes on without dropping existing labels.
- Read each ticket back after writing.
- **Touch only tickets in the triaged set.** Neighbours you did not triage get no writes.

After the user picks a path, apply it (re-scope, close with a reason, file slice tickets, reprioritize)
and comment what was decided. Confirm any open hypothesis before building on it, and tell the user if it
turned out wrong.

## 9. Check your work

Run [reference/check.md](reference/check.md) before you answer and again after the tracker writes. It
re-opens every cited line at the pinned revision, confirms every claim is labelled, and compares each
comment read back from the tracker with what you meant to post. A step that cannot run is a `FAIL`.

## It is working if

At least one claim in a non-trivial ticket gets a label other than `confirmed`, every verdict survives
the citation re-check, and a reader of the ticket alone can see what was checked, at which revision, and
what to do next.
