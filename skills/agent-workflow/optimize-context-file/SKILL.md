---
name: optimize-context-file
description: >-
  Audit and tighten an agent context file: strip rationale that does not change behavior, and check that
  nothing needed every session got demoted to a lazily loaded link. Use when a CLAUDE.md, AGENTS.md,
  GEMINI.md, .cursorrules or equivalent is bloated, over-explained, stale or duplicative, or when the
  user asks to review / trim / tidy / refactor / slim one.
---

# Optimize a context file

Every coding agent reads a standing instructions file at the start of a session. `CLAUDE.md`,
`AGENTS.md`, `GEMINI.md`, `.cursorrules`, whatever yours is called. This tightens it.

A context file earns its place only if what is inline changes behavior on *most* tasks. An over-long
file makes the model ignore the instructions inside it, so bloat costs more than the tokens it burns.

## Run the built-in audit first, if there is one

Some agents ship a command that does the mechanical passes across every context file at once: cutting
content derivable from the codebase, deduplicating a local file against a checked-in one, moving
always-loaded guidance into things that load on demand. Run it, apply what you agree with, then use this
skill for the three things those tools do not do.

1. **The personal global file.** Built-in audits target the project file. A personal global file is all
   stance, and stance is never derivable from a codebase, so a trimming pass finds nothing there. This
   skill's main target is the file the built-in tool will not touch.
2. **Within-line tightening.** Automated passes move and delete whole blocks. They do not shorten a rule
   you are keeping. That is the pass below, and it is the one everyone skips.
3. **Checking the result still reads as an instruction.** Tightening is the edit most likely to break a
   rule silently.

## TIGHTEN: the pass that matters

A context file is a set of instructions, not an argument for them. The author already knows why they
wrote each rule. Strip rationale that does not change behavior:

> *"Use the pinned toolchain version, because a floating version means two developers get different
> lockfile output and the diff noise makes review slower for everyone."*
> becomes **"Use the pinned toolchain version."**

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

## Eager versus lazy references

Check how your agent treats a reference to another file, because the two kinds look identical in markdown
and cost wildly different amounts.

- **A plain link** is usually **lazy**: read only when the task needs it. This is where sometimes-needed
  content goes.
- **An import** is **eager**: inlined every session, exactly as expensive as leaving the text in the
  context file. Agents spell this differently and some have no such concept at all, so confirm before you
  rely on it. Reserve it for the rare thing genuinely needed every session.

So "break it up" means replacing a sometimes-needed inline block with a one-line pointer plus a plain
link. Never leave a link to a file that does not exist.

## Verify, do not self-grade

- **No rule broken by tightening.** Re-read each shortened line cold. Does it still tell you what to do?
  A rule whose reasoning was load-bearing must keep it. This is the failure mode this pass introduces, so
  check it explicitly rather than assuming shorter is safer.
- **Nothing over-demoted.** A standing directive about what counts as done belongs inline, even when a
  skill could hold it, because a lazily loaded file may not be in context at the moment it matters.
- **No behavior lost.** Diff old against new: everything kept is still inline or relocated to a real
  destination. Only deliberate cuts disappear.
- **Links resolve.**

## Targets and output

Well under 200 lines. Roughly 60 to 100 is healthy for a typical project, less for a personal global
file. Match the file's existing voice.

A context file is load-bearing, so propose rather than impose. Show the diff and a before-and-after
report: `N to M lines`, the cut list, and every TIGHTEN before and after. Those are edits to lines the
user chose to keep, so they deserve to be seen rather than buried in a line-count delta.
