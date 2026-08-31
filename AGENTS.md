# Contributing

Read this before adding or editing a skill. It applies to humans and to agents.

## What belongs here

One hard rule: the skill must contain no executable code. That is the whole admission test and it is the
only thing every skill here has in common.

Topics vary on purpose. A skill for scaffolding a Mirth plugin sits next to one for writing a postmortem
because both are useful and both are prose. Do not look for a unifying theme, and do not reject a good
skill for lacking one.

What does get rejected: anything that only makes sense inside one company, one codebase, or one machine.
If a stranger cannot use it, it belongs in your own dotfiles.

## The rules

Rule 1 is what the repo is. Rules 2 to 4 are quality bars.

### 1. No executable files, ever

No `.mjs`, no `.ps1`, no `.sh`, no `.py`. Not in a skill folder, not in `scripts/`, not anywhere.

`npx skills add` copies a skill folder into your agent's skills directory, and the agent then does what
the skill body says. If the body says to run the script sitting next to it, the agent runs it. One
command should never be able to do that, so the guarantee this repo makes is that there is nothing here
to run.

This is not a style preference. It is the guarantee the repo exists to make, and it is the reason
someone can install everything here without auditing it first.

If a skill genuinely needs a deterministic tool, see [generated tools](#generated-tools) below.

### 2. No agent-specific names

Banned from skill bodies:

- Model names. Not `Opus`, `GPT-5`, `Gemini`, or a version number.
- Tool names. Not "the Task tool", "the Skill tool", "call Read".
- Agent file names as if universal. Say "your agent's context file", not `CLAUDE.md`.
- Absolute paths, and anything under `~/.claude`, `~/.cursor` or equivalent.
- Harness concepts. Turn semantics, background tasks and subagent lifecycles differ per agent.

Say what capability you need, not which product provides it. "If you can run work in parallel" beats
"spawn subagents".

### 3. Degrade gracefully

State the fallback explicitly. A skill that fans out to eight workers must say what to do on an agent
with none, and the fallback has to actually work rather than being a shrug.

### 4. Every skill ships its own check

A skill that tells the agent to do something must tell it how to know it worked. "Looks right" is not a check.

A check that cannot run must fail, not pass. Never write a step that skips or returns early because a
dependency is missing. A procedure that completes having verified nothing is worse than no procedure,
and it hides for months.

## Format

```
skills/<name>/
  SKILL.md              required
  reference/*.md        optional, for detail that would bloat the body
```

Two fields are required:

```yaml
---
name: write-tests
description: >-
  What it does, then when to use it, then when not to.
---
```

Agent-specific frontmatter keys are allowed on top of those two. An agent that does not recognise a key
ignores it, so `disable-model-invocation: true` costs nothing on an agent that has no such concept. This
is the one place agent-specific naming is fine, because it degrades gracefully by construction. The rule
in [rule 2](#2-no-agent-specific-names) is about the body, where a name the reader has to translate is a
real bug.

The `description` is a retrieval surface, not a summary. An agent decides whether to load the skill from
this text alone, so lead with the trigger conditions and include the phrases a user would actually say.
Say what it is NOT for when the boundary is easy to get wrong.

Keep `SKILL.md` under roughly 150 lines. Push detail into `reference/`.

## Generated tools

When a skill genuinely needs a deterministic tool, ship a specification rather than an implementation.
The agent generates the tool on the user's machine and proves it correct before using it.

```
skills/<name>/
  SKILL.md
  reference/
    ALGORITHM.md         pseudocode, precise enough to implement from
    CONTRACT.md          invocation signature, exit codes, output shape
    fixtures/
      01-basic.in / .out       byte-exact expected output
      02-empty.in / .out       the edge cases that actually bite
      03-malformed.in / .out
```

The skill body instructs: detect the runtime, implement `ALGORITHM.md` to satisfy `CONTRACT.md`, run it
against every fixture, and **stop and report if any fixture fails**. Never proceed with a
partially-passing tool.

The fixtures are not optional and they are not decoration. Without them this is worse than shipping a
script, because a hand-written script is wrong the same way every time while a generated one is wrong
differently on every machine, silently. The fixtures are also the regression suite for the spec: a
reported bug becomes a fixture, and every future generated implementation inherits the fix.

## Writing style

- Sentence case headings. No decorative emoji.
- No em dashes. Use a period or a comma.
- Say what a step does, not how it feels. If a sentence could appear unchanged in another repo's docs,
  it says nothing and should be cut.
- Active voice, and name the actor.
- Second person imperative for instructions. "Read the file", not "the file should be read".

## Before you open a PR

- Read the skill as if you use a different agent than the author. Every name you had to translate is a
  bug.
- Confirm the skill's own check is one you could actually run.
- Confirm no executable file entered the repo.
