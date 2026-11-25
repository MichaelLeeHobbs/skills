---
name: open-card
description: >-
  Open one new, small ticket that a fresh session can build from the ticket alone. Use for "open a ticket
  for X", "file an issue for that", "make a card for this, assigned to me", usually for a follow-up
  spotted in this or another session's work. Checks the claim in code and cheap live evidence, looks for
  duplicates, drafts the ticket with a one-slice build brief, files it on the user's yes labelled
  plan-ready, and offers to start the build. Works on any tracker through the shared tracker verbs. NOT
  for an epic or several tickets, NOT for work that needs a design choice (plan it first), and NOT for
  judging an existing ticket (triage-card).
---

# Open one small ticket a fresh session can build

The user saw something worth fixing and wants it tracked, not fixed here. You check it is real, write it
up so a fresh session can build it from the ticket alone, and file it. The ticket is a one-slice plan:
its description carries a [run brief](reference/BRIEF.md), and the `plan-ready` label says so.

**Change nothing in any repository.** Research is fine: read code, history and tickets, run read-only
live checks the project allows, write throwaway scripts outside the repo. The only writes are to the
tracker, plus whatever record the project keeps of tickets it files.

Ticket steps use the shared [tracker verbs](../tracker-verbs/SKILL.md) (installed alone? read
`skills/engineering/tracker-verbs/SKILL.md` in github.com/MichaelLeeHobbs/skills). Find your tracker
layer there first.

## 0. Load the project

- **The board's rules** come from the project's ticket conventions: which board, ticket type, priority,
  starting state, labels, mentions and any record of filed tickets. Those rules set fields, not the
  approval: a ticket from this skill still waits for the user's yes (step 3).
- **The conventions come from the repository where the fix lives,** which is often not this one. A
  docs-repo session filing a firewall change traces it in the infrastructure repo. There, read the docs
  or skills that own the one area the ticket touches, and note the pattern a fix must follow and one real
  file that follows it.
- A project copy of `open-card` wins over this file.

## 1. Ground it

- **Pin a revision** in the fix's repository: fetch, then record the default branch's full commit id (for
  git: `git fetch origin`, `git rev-parse origin/<default>`). Check every claim the ticket will make at
  that revision, with `path:line`. Never switch, reset or dirty the user's checkout.
- **Cheap live evidence** where the project allows it read-only (network logs, a log query, a describe
  call), when it decides the fix. "Only the web proxy calls the file server on port 80, from a week of
  flow logs" is what turns a guess into a one-line rule change.
- **Duplicates and neighbours:** `search` for the originating ticket's neighbours and for the key nouns
  over open and recently closed tickets (about the last six months). An open ticket that is the same work
  means no new ticket: say so, and offer to `comment` your evidence on it.
- A claim that turns out wrong changes the ticket, or ends it. Tell the user before drafting.

## 2. Size gate

Stop and do not file if the work is really several tickets, spans more than one repository, needs a
design debate (a real choice between approaches, permissions or sensitive data, data integrity), or adds
a new system or screen. Stop too if the tracker is public and the fix lives in a private repository: the
ticket could not say where to build it, so propose a private tracker. Say which in one line, and offer to plan it instead, carrying over what you
found: the evidence, the revision, the conventions and the neighbours. Never file a partial ticket to fit
this skill.

## 3. Draft

Show the user one compact block:

- **Title**, in the board's style, naming the change and its scope ("Narrow the file server's port 80
  ingress from the app subnets to its one real caller").
- **Board, type, assignee, priority, state, labels.** The assignee is the user unless they named someone.
- **Acceptance criteria**, cheapest decisive check first.
- **Links:** the originating ticket and how it relates.

Keep the full body in a scratch file outside the repo, or where the project keeps ticket drafts. "Just
file it" (or "assigned to me, go") in the user's ask counts as a yes: skip the wait and show the block
with the result.

## 4. The ticket body

The project's tone rules apply (neutral, provable, no personal data or credentials). On a public tracker,
so does the public tracker rule in the [rules for every write](../tracker-verbs/SKILL.md#rules-for-every-write),
for the title and the brief too. "Just file it" does not cover a private detail. Then:

- **What:** the change, in a few lines.
- **Why it matters:** the failure first (what breaks or misleads if nobody does this).
- **Evidence:** `path:line` at the revision, the query and its result (where the public tracker rule bars
  them, only the conclusion), the originating ticket unless it is private, and the session id.
- **Acceptance criteria:** testable, cheapest decisive check first, with the command when one settles it.

Then the run brief from [reference/BRIEF.md](reference/BRIEF.md), filled in for one slice, in the
description, never a comment. If the project has its own brief format that its build step reads, use that
instead.

## 5. File

On the user's yes:

1. `file` it with the assignee and the fields the project's rules name.
2. `edit` the body to put the new key into the brief's slices row; a ticket cannot name its own key
   before it exists.
3. `label` it `plan-ready` plus the project's labels, in one write.
4. `link` it to the originating ticket (`relates`, unless the user says otherwise).
5. `read` everything back: the fields, the labels, the brief's headings against the template, the link
   from both tickets (from the private one alone, if only it is private). Write the project's record of filed tickets, if it keeps one.

## 6. Do not claim it

Filing is not working it. Leave it unclaimed and in the state the project's rules give new tickets: the
build session claims and starts it. If this session claimed the originating ticket or any other for the
research, `release` it now, unless this session is still working it.

## 7. Hand off

Unless the user only wanted it filed for later, ask whether to start the build. If your agent can start
a fresh session or agent, start it in the fix's repository with only the instruction to build the new
ticket from its brief: the ticket is the whole hand-off. Otherwise give the user that one line to paste
into a new session.

## Report

Short:

- **Filed:** the key and title, board, state, assignee and the link to the originating ticket. Or why
  nothing was filed (a duplicate, the size gate).
- **Grounded on:** one line: the revision and the decisive evidence.

Leave out how it was researched.

## Check

Before the report, confirm from the `read` back, not from memory: the ticket exists with the drafted
title; it carries `plan-ready`; its description holds every heading in
[reference/BRIEF.md](reference/BRIEF.md) and its own key in the slices row; the link shows from both
tickets (from the private one alone, if only it is private); it is unclaimed. Run the
[tracker verbs check](../tracker-verbs/SKILL.md#check). Any item that fails goes in the report as not done.
