---
name: optimize-context-file
description: >-
  Audit and tighten any file that instructs an agent: a context file (CLAUDE.md, AGENTS.md, GEMINI.md,
  .cursorrules), a skill, a slash command, a subagent definition, or a reference file one of those links
  to. Strips rationale that does not change behavior, checks that a description still triggers retrieval,
  and catches standing rules demoted to a lazily loaded link. Use when one of these is bloated,
  over-explained, stale or duplicative, or when the user asks to review / trim / tidy / refactor / slim one.
---

# Optimize an agent instruction file

Agents take instructions from more than one place. A standing context file read at the start of every
session, called `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.cursorrules` or whatever yours is. Skills. Slash
commands. Subagent definitions. The reference files those link to. All of them are prose the model obeys,
all of them rot the same way, and this pass tightens any of them.

Bloat costs more than the tokens it burns. An over-long file makes the model ignore the instructions
inside it, so every line you add weakens the lines you already had.

## Find the tier before you cut

How hard to cut depends on when the file enters the context window.

| Tier | What is in it | What bloat costs |
|---|---|---|
| Always loaded | the context file, and the frontmatter `description` of every skill, command and subagent | every task pays, including the ones this file has nothing to do with |
| Loaded on trigger | skill bodies, command bodies, subagent prompts | one task pays, and the text competes with that task's real work |
| Loaded on demand | reference files a body links to | almost nothing, which is why detail belongs here |

Confirm the tiers against your own agent instead of assuming. Some inline every skill body up front, some
load a body only after its description matches, and that difference decides whether a 300-line skill is
free or ruinous.

## Run the built-in audit first, if there is one

Some agents ship a command that does the mechanical passes: cutting content derivable from the codebase,
deduplicating a local file against a checked-in one, moving always-loaded guidance into things that load
on demand, linting skill frontmatter. Run it, apply what you agree with, then do the three things those
tools do not.

1. **The files the tool skips.** Built-in audits target the project context file. A personal global file
   is all stance, and stance is never derivable from a codebase, so a trimming pass finds nothing in it.
   Skill bodies get checked for shape, not for length.
2. **Within-line tightening.** Automated passes move and delete whole blocks. They do not shorten a rule
   you are keeping. That is the pass below, and it is the one everyone skips.
3. **Checking the result still reads as an instruction.** Tightening is the edit most likely to break a
   rule silently.

## TIGHTEN: the pass that matters

Strip rationale that does not change behavior:

> *"Use the pinned toolchain version, because a floating version means two developers get different
> lockfile output and the diff noise makes review slower for everyone."*
> becomes **"Use the pinned toolchain version."**

**Where the line falls depends on who reads the file.** A context file states rules to someone who
already agreed with them, so most rationale in it is dead weight. A skill or command teaches a procedure
to a reader meeting it for the first time, so some reasoning is doing work. Cut a reason that argues the
step is a good idea. Keep a reason that says what goes wrong if the agent improvises instead.

**Keep the why when the why IS the rule.** Some rules only work because of their reasoning, because they
exist to block a specific false conclusion:

> *"Exported HARs redact `Set-Cookie`, so a missing `Set-Cookie` is **not** evidence the server didn't
> set one. Confirm in devtools."*

Delete that "so" clause and the rule stops working.

The test before cutting a clause: **does it change what the agent concludes or does, or does it only
justify the rule to a human reader?** Justification goes. Corrective reasoning stays.

Also cut hedges (`generally`, `try to`, `where possible`) that soften an instruction into a suggestion,
and a second sentence that restates the first.

**What TIGHTEN looks like in the wild:** a dash or `because` clause selling the rule, cost/benefit math
behind a decision already made, "this matters because...", a parenthetical explaining a term the author
obviously knows, and the file explaining its own purpose to its author. Left alone these compound: every
rule keeps its own little essay and the file doubles.

## A description is a trigger, not a summary

Skills, commands and subagents only. The agent reads the frontmatter `description` to decide whether to
load the body at all, and pays for it on every task whether or not it fires. Two failures, opposite
directions:

- **Too vague to fire.** The body is excellent and never loads. This is the worse one, because nothing
  about it looks broken. You get the agent's default behavior and no error.
- **A paragraph of summary.** Always-loaded rates for prose that duplicates the body.

Write the conditions that should trigger it, in the words a user would actually say, plus what it is not
for when the boundary is easy to get wrong. Then check it cold: read the description alone with the body
hidden, and decide whether you would open the file. If you cannot tell, neither can the agent.

## Eager versus lazy references

A reference to another file loads at wildly different cost depending on how it is written, and the two
forms look identical in markdown.

- **In a context file:** a plain link is usually lazy, read only when the task needs it. An import is
  eager, inlined every session, exactly as expensive as leaving the text inline. Agents spell imports
  differently and some have no such concept, so confirm before relying on one. Reserve it for the rare
  thing genuinely needed every session.
- **In a skill or command body:** a linked reference file is read only when a step sends the agent there.
  Long tables, worked examples and detail a run needs sometimes all belong in one. What every run needs
  stays in the body.

Either way, "break it up" means replacing a sometimes-needed inline block with a one-line pointer plus a
plain link, and the pointer has to say when to follow it or the file never gets opened. Never leave a
link to a file that does not exist.

## Verify, do not self-grade

- **No rule broken by tightening.** Re-read each shortened line cold. Does it still tell you what to do?
  A rule whose reasoning was load-bearing must keep it. This is the failure mode this pass introduces, so
  check it explicitly rather than assuming shorter is safer.
- **Nothing over-demoted.** A standing directive about what counts as done belongs inline, even when a
  skill could hold it, because a lazily loaded file may not be in context at the moment it matters. In a
  skill body, a step's check stays with the step and never moves to a reference file.
- **No behavior lost.** Diff old against new: everything kept is still inline or relocated to a real
  destination. Only deliberate cuts disappear.
- **Descriptions still fire**, if you touched one. Run the cold read above.
- **Links resolve.**

## Targets and output

| File | Target |
|---|---|
| Context file | well under 200 lines. Roughly 60 to 100 is healthy for a typical project, less for a personal global file |
| Skill or command body | under roughly 150 lines, with the rest pushed into reference files |
| Description | a few lines, trigger conditions first |
| Reference file | no limit worth enforcing, it is read only when a step calls for it |

Match the file's existing voice. These files are load-bearing, so propose rather than impose. Show the
diff and a before-and-after report: `N to M lines`, the cut list, and every TIGHTEN before and after.
Those are edits to lines the user chose to keep, so they deserve to be seen rather than buried in a
line-count delta.
