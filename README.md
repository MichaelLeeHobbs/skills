# Skills

**Agent skills across a range of topics. Prose only, so nothing here executes.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
&nbsp;Works with Claude Code, Cursor, Codex, opencode, Windsurf, Gemini CLI and 70 other agents.

Installing a skill normally means copying a folder into your agent's skills directory and then letting
the agent do whatever the skill body tells it to. If that folder contains a script, one command just
bought you code execution from a repo you probably skimmed.

This repo makes that impossible. There are no executable files in it and there never will be. You can
install everything here without reading a line of code, because there is no code.

## Install

```bash
npx skills add MichaelLeeHobbs/skills
```

That is the [`skills` CLI](https://github.com/vercel-labs/skills). It detects which agents you have and
copies the skills into the right place for each. To take one instead of all of them:

```bash
npx skills add MichaelLeeHobbs/skills --skill write-tests
```

Or read the markdown and copy what you want. Every skill is one file you can hold in your head.

## The skills

Grouped by area. Different topics, no unifying theme beyond being useful and being prose.

### thinking

Reaching a decision. Nothing here touches code.

| Skill | What it does |
|---|---|
| `brainstorm` | Explore a problem you have not solved. You bring the problem and the goal, the agent brings the option space instead of running with its first idea. |
| `steelman` | Settle a binary design question that keeps getting deferred. Both positions argued at full strength, both tested against ground truth, judged on a rubric written before the arguing started. |

### engineering

Writing and reviewing code.

| Skill | What it does |
|---|---|
| `write-tests` | Write a test that would actually catch the bug it claims to cover. Covers the traps: vacuous assertions, tests that encode the bug, green from two cancelling faults, fixtures the product never produces. |
| `deep-code-review` | Exhaustive file-by-file review of a package or service. Splits the tree into disjoint slices so every file is actually read, then verifies the load-bearing findings against the source before reporting them. |

### operations

Running things that are already live.

| Skill | What it does |
|---|---|
| `postmortem` | Write a blameless incident postmortem as a conversation, not a deliverable. Refuses to invent the timeline, detection story and severity, because you were there and the model was not. |

### agent-workflow

Directing the agent itself.

| Skill | What it does |
|---|---|
| `optimize-agent-instructions` | Audit and tighten any file that instructs an agent: a context file (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.cursorrules`), a skill, a command, a subagent definition. Sizes the cut by when the file loads, strips rationale that does not change behavior, and catches a description too vague to ever fire. |
| `hands-off` | Prepare a project for an unattended build-out. Freezes an ordered queue with a check per item, sets up a decision log, and defines what the agent does when it hits something ambiguous at 3am. |

### clean-room

Specifying a system you can observe but must not copy.

| Skill | What it does |
|---|---|
| `ui-feature-spec` | Reverse-engineer a live web page into a build-ready spec by operating it: scrolling, clicking, breaking forms on purpose, exercising every variant, reading the network. Captures behaviour exactly and describes appearance by intent rather than copying values. Needs browser control. |

### domains

Tied to one technology. Useful only if you use that thing.

| Skill | What it does |
|---|---|
| `oie-plugin-development` | Scaffold and build a plugin for Open Integration Engine or Mirth Connect. Maven layout, `plugin.xml`, server and admin-GUI classes, connectors, migrations, packaging and signing. Nine reference docs. |
| `oie-channel-code-review` | Review channel and code-template JavaScript before it deploys. The Rhino block-scoping trap that costs people days, E4X fields that are empty rather than null, scope-map leaks, and PHI heading for the logs. |

## The rules

One hard rule and three quality bars. The reasoning is in [AGENTS.md](./AGENTS.md).

1. **No executable files. Ever.** This is what the repo is. Everything else is negotiable.
2. **No agent-specific names.** No model names, no tool names, no `~/.claude` paths. A skill that names
   one agent is a skill that breaks on every other.
3. **Degrade gracefully.** A skill that wants eight parallel workers still has to do something useful on
   an agent that has none.
4. **Every skill ships its own check.** If a skill cannot tell you how you would know it worked, it is
   not finished.

## What is deliberately not here

Skills that come with scripts. Those live in a separate cookbook repo that is structurally invisible to
the `skills` CLI, so installing one is a deliberate act: read it, copy it, rename it. Link to follow once
it is published.

## Credits

- `unslop` is [Cursor's](https://github.com/cursor/plugins/blob/main/pstack/skills/unslop/SKILL.md), and
  `codebase-design` and `grilling` are [mattpocock's](https://github.com/mattpocock/skills). None of them
  are vendored here. Go get them from the source.
- The parallel-argument method in `steelman` owes a lot to Ousterhout's "design it twice".

## License

MIT. Copy them, fork them, put them in your company's repo. See [LICENSE](./LICENSE).
