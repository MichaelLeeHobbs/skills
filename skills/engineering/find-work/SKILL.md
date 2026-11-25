---
name: find-work
description: >-
  Find what to work on next in the current project: "find me work", "what's easy on the board?", "give
  me some tickets", "anything my teammates left I can pick up?". Finds the tracker the repository uses,
  sorts its open tickets into Easy, Quick questions, Risky or unclear, Plan it and Close these, checks the
  likely ones against the code, and lists them on one screen for the user to pick by number. Works on any
  tracker through the shared tracker verbs. Read-only until the user picks. NOT for judging one ticket in
  depth (triage-card) or building (batch-work, run-plan).
---

# Find work

The user wants a short, trustworthy list of what can be done now, from the project this session is in,
sorted by how much of their attention each ticket needs.

**Read-only until the user picks.** No tracker writes, no branches. Ticket steps use the shared
[tracker verbs](../tracker-verbs/SKILL.md) (installed alone? read
`skills/engineering/tracker-verbs/SKILL.md` in github.com/MichaelLeeHobbs/skills).

## 0. Load the project

- Run the [conventions pass](../../thinking/debate-plan/reference/conventions-pass.md). A project copy of
  `find-work` wins over this file.
- **Find the tracker and board** from the project's context file and ticket conventions. If they do not
  name one, use the ticket keys most common in the last 90 days of the default branch's history. Where
  the work spans several boards, filter by component, label or text; otherwise ask the user once.
- Note the project's backlog-triage evidence rules and its rule for building several tickets together;
  steps 2 and 5 use them.

## 1. Scope

- **Default:** `search` open tickets assigned to the user or unassigned, leaving out epics (tickets with
  children), closed tickets, and anything in progress or in review. Take the first 40 by priority, then
  age.
- **The user widens or narrows it in their own words:** "all" (no limit), a label, component or area ("UI
  only"), or teammates by name ("include Sam", "the whole team"). Someone else's ticket qualifies only
  while it waits in the backlog; one they started is theirs.
- **Always skip** tickets another running session has claimed.

## 2. Sort

`read` each ticket's description, comments, links and parent, and give it a provisional tier, a size (S,
M, L), a one-line reason and any open questions with defaults. If your agent can run read-only work in
parallel, give each worker about ten tickets with the tier rules and the conventions sheet; otherwise go
through them one at a time.

Then **check the likely ones against the code.** Only tickets headed for Easy or Quick questions, at the
pinned default-branch revision: is it still needed, is it already done, is there a pattern to copy, do the
files it names exist? A ticket is **Easy only after this check passes**, never from its text. One found
done or overtaken goes to **Close these**.

| Tier | All of these hold |
| --- | --- |
| **Easy** | Checked against the code. Clear acceptance criteria or an obvious done state. One repository. A pattern or sibling change to copy. No product question. Not risky. |
| **Quick questions** | Would be Easy with one or two answers, each with a recommended default. |
| **Risky or unclear** | Any risk flag below, three or more open questions, or you cannot tell what it asks. Goes to `triage-card`. |
| **Plan it** | Epic-sized, a new system or domain, more than one repository, or needs coordination with other people. Goes to `shape-plan`. |

**Risk flags** (any one is enough): authentication, permissions or roles; exposure of, or new access to,
personal or sensitive data; deleting or migrating data, or a backfill; production infrastructure, secrets
or deploy pipelines; billing or anything sent to an outside party; a behaviour change users would notice
without being told.

## 3. Report: one screen

```
KEY: 38 tickets checked · 6 easy · 4 quick questions · 5 risky · 3 plan it · 2 close

Easy
 1. KEY-1807 <title as the tracker has it>: S, repeats KEY-1729's fix
 2. KEY-1811 <title>: S, Sam's · copy of the KEY-1790 grid change
Quick questions
 7. KEY-1790 <title>: M. Q: keep the old export? (default: drop it)
Risky or unclear
12. KEY-1650 <title>: changes role permissions
Plan it
16. KEY-1702 <title>: touches two repositories
Close these
19. KEY-1599 <title>: done on the default branch in a1b2c3d
```

Number across all tiers, titles as the tracker has them, at most ten per tier with a count of the rest,
sorted by priority, then whether it unblocks others, then age. No method or evidence unless asked.

## 4. The user picks

The user answers with numbers ("build 1-4, 7 with defaults, triage 12, close 19").

- **Someone else's ticket:** confirm in one line first ("2 is Sam's: take it and leave Sam a comment?").
  On yes, `assign` it to the user, `comment` for its old assignee, then `claim` it.
- **Close these:** `close` each (`done` or `not-planned`) with the evidence as the reason. "close 19" is
  the yes.

## 5. Hand off

Easy and answered tickets are built together by the project's rule for several tickets (`batch-work`
where there is none), here or in a fresh session if your agent can start one, with the keys and the
user's answers. Risky tickets go to `triage-card`, Plan it tickets to `shape-plan`.

## Check

Before the report: every ticket listed as Easy has a recorded code check at the pinned revision; every
key and title was read from the tracker in this run; no listed ticket is claimed by another running
session. After the user's picks, run the [tracker verbs check](../tracker-verbs/SKILL.md#check) for the
writes. A failed item is reported, not dropped.
