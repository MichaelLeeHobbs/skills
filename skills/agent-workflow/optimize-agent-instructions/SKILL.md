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
on demand, linting skill frontmatter. Run it and apply what you agree with. Steps 3 to 5 are the passes
it does not do.

A clean report is not a clean bill of health. These tools target the project context file, and a personal
global file is all stance, which is never derivable from a codebase, so the tool finds nothing it knows
how to look for. Skill bodies get checked for shape, not for length.

## Step 3: decide what stays inline

A reference to another file loads at wildly different cost depending on how it is written, and the two
forms look identical in markdown.

- **In a context file:** a plain link is usually lazy, read only when the task needs it. An import is
  eager, inlined every session, exactly as expensive as leaving the text inline. Agents spell imports
  differently and some have no such concept, so confirm before relying on one. Reserve it for the rare
  thing genuinely needed every session.
- **In a skill or command body:** a linked reference file is read only when a step sends the agent there.
  Long tables, worked examples and detail a run needs sometimes belong in one. What every run needs stays
  in the body.

Move a sometimes-needed block out and leave a one-line pointer plus a plain link behind it. The pointer
has to say when to follow it or the file never gets opened.

Two things never move. A standing directive about what counts as done stays inline. A step's check
stays with the step.

**Check:** every link resolves, and every pointer says when to follow it.

## Step 4: TIGHTEN what remains

Strip rationale that does not change behavior. The test for every clause: **delete it, then ask whether
the agent would now do or conclude anything different.** If not, it goes.

Agents add justification by habit, so expect it in text an agent wrote, including text you wrote. Check
clause by clause for these shapes:

- **A colon or dash tail on a complete rule** that says who else acts or why.
- **A `so`, `because` or `since` clause that sells the rule:** "Use the pinned toolchain version, because
  a floating version gives two developers different lockfile output." Keep the first sentence only.
- **Other people's process:** what a reviewer, an owner, CI or another team does after the agent's part
  ends. The agent cannot act on it.
- Cost/benefit math behind a decision already made, "this matters because...", a parenthetical defining
  a term the author knows, and the file explaining its own purpose.

Worked example, from a personal context file:

> *"Only OPS cards go to Done. On every other board a finished card goes to Review and stops there: the
> board owner moves it to Done. Don't ask me to mark a non-OPS card Done."*

The tail after the colon names who acts next. Delete it and the agent still stops at Review and still
does not ask, so it goes. "Knowing who does it could help" is the argument that keeps these alive. Name
what the agent would do differently with it. If you cannot, cut it.

**Keep the why when the why IS the rule.** Some reasoning blocks a specific false conclusion:

> *"Exported HARs redact `Set-Cookie`, so a missing `Set-Cookie` is **not** evidence the server didn't
> set one. Confirm in devtools."*

Delete that "so" clause and the agent reads a missing header as proof. The board-owner tail blocks no
conclusion. This one does.

**Where the line falls depends on who reads the file.** A context file states rules to someone who
already agreed with them, so most rationale in it is dead weight. A skill or command teaches a procedure
to a first-time reader. Cut a reason that argues the step is a good idea. Keep a reason that says what
goes wrong if the agent improvises instead.

Cut hedges (`generally`, `try to`, `where possible`) that soften an instruction into a suggestion, and a
second sentence that restates the first.

**Cut a past event a reader can no longer act on.** "`main` is the only long-lived branch (`dev` was
deleted on YYYY-MM-DD)" carries a parenthetical about a branch nobody can reach. The rule is complete
without it and the note will never be useful again, but it reads like the why that makes the rule work,
so it survives every pass.

The discriminator: **could a reader still make the mistake this history warns about?** A rejected
approach stays, because someone will propose it again. These go: a completed migration, a deleted branch
or flag, a rename, a version no longer supported, "this used to be X", and any line narrating what was
done in an earlier session.

**Check:** re-read each shortened line cold. Does it still tell you what to do? A rule whose reasoning
was load-bearing must keep it. Then re-read every surviving colon, dash, `so`, `because` and `since` and
name what the agent would do differently without the clause after it. A clause you cannot name that for
is still justification.

## Step 5: fix the description

Skills, commands and subagents only. The agent decides whether to load the body from the description
alone. Two failures, opposite directions:

- **Too vague to fire.** The body never loads and nothing errors. Fix this one first.
- **A paragraph of summary.** Prose that duplicates the body, loaded every session.

Write the conditions that should trigger it, in the words a user would actually say, plus what it is not
for when the boundary is easy to get wrong.

**Check:** read the description cold with the body hidden. If you cannot tell whether to open the file,
neither can the agent.

## Step 6: verify, do not self-grade

Diff old against new. Everything kept is still inline or relocated to a real destination, and only
deliberate cuts disappear. Compare the result against the target from step 1.

## Step 7: report, do not impose

Match the file's existing voice. Show the diff and a before-and-after report: `N to M lines`, the cut
list, and every TIGHTEN before and after, not just a line-count delta.
