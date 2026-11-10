---
name: optimize-agent-instructions
description: >-
  Audit and tighten any file that instructs an agent: a context file (CLAUDE.md, AGENTS.md, GEMINI.md,
  .cursorrules), a skill, a slash command, a subagent definition, or a reference file one of those links
  to. Use when one of these is bloated, over-explained, stale or duplicative, or when the user asks to
  review / trim / tidy / refactor / slim one. Not for user-facing documentation, a README, or a prompt
  embedded in application code.
---

# Optimize an agent instruction file

Agents take instructions from several files: a standing context file read at the start of every session,
skills, slash commands, subagent definitions, and the reference files those link to. This pass tightens
any of them.

Work the steps in order.

## Step 1: find the tier and the target

How hard to cut depends on when the file enters the context window.

| File | When it loads | Target |
|---|---|---|
| Context file | every session | well under 200 lines. Roughly 60 to 100 for a typical project, less for a personal global file |
| `description` of a skill, command or subagent | every session, whether or not it fires | a few lines, trigger conditions first |
| Skill body, command body, subagent prompt | when its description matches the task | under roughly 150 lines, with the rest pushed into reference files |
| Reference file | when a step sends the agent there | no limit worth enforcing |

Confirm the loading rules against your own agent. Some inline every skill body up front, some load a body
only after its description matches.

## Step 2: run the built-in audit, if there is one

Some agents ship a command that does the mechanical passes: cutting content derivable from the codebase,
deduplicating a local file against a checked-in one, moving always-loaded guidance into things that load
on demand, linting skill frontmatter. Run it and apply what you agree with. Steps 3 and 4 are the passes
it does not do.

A clean report is not a clean bill of health. These tools target the project context file, and a personal
global file is all stance, which is never derivable from a codebase, so the tool finds nothing it knows
how to look for. Skill bodies get checked for shape, not for length.

## Step 3: run every sentence through the four-prong test

Test each sentence, and each clause after a colon, dash, `so`, `because` or `since`, against the four
prongs in order. It stays as is only if it passes all four. The first prong it fails sets the remedy.
Record each failure for the report.

| Prong | Question | Fails | Remedy |
|---|---|---|---|
| 1. Action | Does it tell the agent to do or not do something, or give a check it can pass or fail? | rationale, "so that" framing, justification, background, other people's process | Cut it, or turn it into an acceptance criterion if it holds a real test |
| 2. But-for | Would a capable agent behave or conclude differently without it? | a restatement, a default, something the agent already does, a past event | Cut it |
| 3. Trigger | Is it clear when it applies? | "be careful with migrations", a hedge such as `where possible` | Rewrite it with the situation that triggers it |
| 4. Placement | Does it need to load every time this file loads? | long tool gotchas in an always-loaded context file | Move it to a reference file behind a pointer that says when to read it |

Agents write justification by habit. Expect prong 1 failures in text an agent wrote, including yours.

**Prong 1.** The tail after the colon here names who acts next and gives the agent nothing to do:

> *"On every other board a finished card goes to Review and stops there: the board owner moves it to
> Done. Don't ask me to mark it Done."*

Cut it. "Knowing who does it could help" is the argument that keeps these alive. Name what the agent
would do differently with it. If you cannot, it fails.

A rationale that names something checkable becomes an acceptance criterion. One that names nothing
checkable is cut.

> *"I check in on many parallel sessions with "Status?", "What's next?", "Are we done?". If I have to
> ask, the last message didn't do its job."*
> becomes, under the block's rules: **"It must answer "Status?", "What's next?" and "Are we done?"
> without my asking."**

**Prong 2.** Corrective reasoning passes, because it changes what the agent concludes:

> *"Exported HARs redact `Set-Cookie`, so a missing `Set-Cookie` is **not** evidence the server didn't
> set one. Confirm in devtools."*

Delete that "so" clause and the agent reads a missing header as proof. In a skill, a reason that says
what goes wrong if the agent improvises passes. A reason that argues the step is a good idea fails.

A past event fails when a reader can no longer make the mistake it warns about: "`main` is the only
long-lived branch (`dev` was deleted on YYYY-MM-DD)". Cut the parenthetical. A rejected approach passes,
because someone will propose it again. A completed migration, a deleted branch or flag, a rename, an
unsupported version, "this used to be X" and a note on what an earlier session did all fail.

**Prong 3.** "Be careful with migrations" becomes "Before editing a migration that has run in
production, write a new migration instead." A hedge (`generally`, `try to`, `where possible`) leaves the
agent to decide when the rule applies. Name the case or drop the hedge.

**Prong 4.** Step 1's table sets what loads when. When you move a block, the link form decides its cost:

- **In a context file:** a plain link is usually lazy, read only when the task needs it. An import is
  eager, inlined every session, as expensive as leaving the text inline. Agents spell imports
  differently and some have none, so confirm before relying on one.
- **In a skill or command body:** a linked reference file is read only when a step sends the agent there.
  What every run needs stays in the body.

Leave a one-line pointer that says when to follow it. Two things never move: a standing directive about
what counts as done, and a step's check.

**Check:** re-read each changed line cold. It still tells you what to do, corrective reasoning is still
there, every link resolves and every pointer says when to follow it. For each surviving clause after a
colon, dash, `so`, `because` or `since`, name what the agent would do differently without it. A clause
you cannot name that for failed prong 1 or 2.

## Step 4: fix the description

Skills, commands and subagents only. The agent decides whether to load the body from the description
alone. Two failures, opposite directions:

- **Too vague to fire.** The body never loads and nothing errors. Fix this one first.
- **A paragraph of summary.** Prose that duplicates the body, loaded every session.

Write the conditions that should trigger it, in the words a user would actually say, plus what it is not
for when the boundary is easy to get wrong.

**Check:** read the description cold with the body hidden. If you cannot tell whether to open the file,
neither can the agent.

## Step 5: verify, do not self-grade

Diff old against new. Everything kept is still inline or relocated to a real destination, and only
deliberate cuts disappear. Compare the result against the target from step 1.

## Step 6: report, do not impose

Match the file's existing voice. Show the diff, `N to M lines`, and a table of every sentence that failed
the test, with the prong it failed, the remedy applied, and its before and after:

| Sentence | Prong | Remedy | After |
|---|---|---|---|
| "...stops there: the board owner moves it to Done." | 1. Action | cut | "...stops there." |
