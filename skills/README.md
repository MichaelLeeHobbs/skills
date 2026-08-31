# skills

One folder per skill, grouped into areas. The `skills` CLI walks this tree and installs each folder
containing a `SKILL.md` into whichever agents it detects, so the grouping is for humans browsing the repo
and costs nothing at install time. Skills are addressed by name, not path:

```bash
npx skills add MichaelLeeHobbs/skills --skill write-tests
```

## The areas

| Area | What goes here |
|---|---|
| `thinking/` | Reaching a decision. Exploring an option space, stress-testing a plan, settling an argument. Nothing here touches code. |
| `engineering/` | Writing and reviewing code. Tests, reviews, refactors, scaffolding, the docs that describe code. |
| `operations/` | Running things that are already live. Incidents, investigations, audits, infrastructure health. |
| `agent-workflow/` | Directing the agent itself. Delegation, context files, orchestration. Meta-work rather than the work. |
| `blackbox/` | Specifying a system you can observe but cannot read the source of. Reverse-engineering by operating the thing. |
| `domains/` | Tied to one technology or ecosystem. Useful only if you use that thing, and clearly labelled so. |

Add an area when three skills want it, or when one skill names a mode of work no existing area covers.
`blackbox/` is the second case: specifying from observation rather than from source is a different job
from anything in `engineering/`. `engineering/` will likely split once the docs and scaffolding skills
land.

Required shape and the rules every skill follows: [../AGENTS.md](../AGENTS.md).
