# Contributing

Read this before adding or editing a skill. It applies to humans and to agents.

## What belongs here

A skill is prose an agent follows. Some skills also ship a small script for a job prose does badly
(parsing a table, counting IDs), under the strict terms of [rule 1](#1-scripts-only-under-scripts-node-built-ins-only-tested).

Topics vary on purpose. A skill for scaffolding a Mirth plugin sits next to one for writing a postmortem
because both are useful. Do not look for a unifying theme, and do not reject a good skill for lacking
one.

What does get rejected: anything that only makes sense inside one company, one codebase, or one machine.
If a stranger cannot use it, it belongs in your own dotfiles.

## The rules

Rule 1 limits what can run. Rules 2 to 4 are quality bars.

### 1. Scripts only under scripts/, Node built-ins only, tested

`npx skills add` copies a skill folder into your agent's skills directory, and the agent then does what
the skill body says. If the body says to run the script sitting next to it, the agent runs it. So a
script is allowed only when all of these hold:

- It lives in the skill's own `scripts/` folder. No executable file anywhere else in the repo.
- It is Node ESM (`.mjs`) using Node built-ins only. No npm dependencies, no `package.json`, no install
  step, no network access, no shell-outs. A reader can audit it in one sitting because nothing else runs.
- It ships tests and fixtures beside it (`scripts/*.test.mjs`, `scripts/fixtures/`) that pass with
  `node --test "skills/<group>/<name>/scripts/*.test.mjs"` (the runner takes globs, not folders). The
  tests themselves may spawn the script with `node`; the script may not spawn anything. Every finding the script can report has a fixture that
  triggers it, and one clean fixture produces none.
- It exits 0 when clean, 1 when it has findings, 2 on a usage error, and prints text by default and JSON
  with `--json`, so an agent can read the result without parsing prose.
- The skill body names the script, says when to run it and what its exit codes mean. A script the body
  never mentions is dead weight and gets deleted.
- A skill never imports from another skill's folder: each installs on its own. When two skills need the
  same parsing, each carries its own copy, and each copy is covered by its own skill's tests.

No `.ps1`, `.sh`, `.py` or other languages: one runtime keeps the audit surface to one.

Prefer prose. Reach for a script only for a deterministic job where an agent working by hand would be
slow or would drift (parsing, counting, cross-checking tables). If a skill needs a deterministic tool
but should not carry code, the [generated tools](#generated-tools) pattern below is still an option.

### 2. No agent-specific names

Banned from skill bodies:

- Model names. Not `Opus`, `GPT-5`, `Gemini`, or a version number.
- Tool names. Not "the Task tool", "the Skill tool", "call Read".
- Agent file names as if universal. Say "your agent's context file", not `CLAUDE.md`.
- Absolute paths, and anything under `~/.claude`, `~/.cursor` or equivalent.
- Harness concepts. Turn semantics, background tasks and subagent lifecycles differ per agent.

Say what capability you need, not which product provides it. "If you can run work in parallel" beats
"spawn subagents".

One exception: a literal token that other sessions or tools match on keeps its exact text, even when it
names a product. Renaming it would orphan every record already written with it. The only one today is
the `claude-session:` claim marker in `github-issues`.

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
skills/<group>/<name>/
  SKILL.md              required
  reference/*.md        optional, for detail that would bloat the body
  scripts/*.mjs         optional, see rule 1
  scripts/*.test.mjs    required when scripts/ exists
  scripts/fixtures/     required when scripts/ exists
```

Name fixture files so the test runner does not mistake them for tests: no `*.test.js`, `*_test.js`,
`test-*.js` or `test/` folders inside `fixtures/`. Use `.spec.js`, another language's test naming, or a
`tests/` folder.

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

An alternative to a script under rule 1: ship a specification rather than an implementation. The agent
generates the tool on the user's machine and proves it correct before using it. Choose this when the tool
must run in the user's own language or toolchain, or when the skill should stay prose only.

```
skills/<group>/<name>/
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
- Confirm every executable file is a `.mjs` under a skill's `scripts/` folder, imports only `node:`
  built-ins, and that `node --test "skills/**/*.test.mjs"` passes.
- A new group folder under `skills/` needs its own entry in `.claude-plugin/marketplace.json`, named
  `mlh-<group>` so it cannot clash with a same-named plugin from another source, or Claude Code plugin
  users never see it. Run `claude plugin validate .` if you have Claude Code; it must pass.
