# Conventions pass

Run this before writing the shared brief, and again for each extra repo the design reaches. A design that
ignores the project's own conventions can be sound and still need reworking. A generic industry answer
in place of a house convention is the most common cause of that rework.

## 1. Read the rules

- Your agent's context file at the repo root, and the scoped one in every directory the design touches.
  Projects often keep per-app or per-package files with rules the root file does not repeat.
- The standards those files point to, and the planning or decision docs for the area: a decision log,
  architecture decision records, a planning folder.
- **The skill index.** The project's own index of its skills if it keeps one, and the description of
  every project skill. Skim them all: the skill that owns an area is often not the one the ticket or the
  context file names.
- **The owning skills themselves**, not just their names. A route skill's auth pattern or a UI skill's
  density rules only reach the design if someone read them.
- **The approved examples** an owning skill names, such as reference screens or a reference
  implementation. Read the examples, not the skill's summary of them.

## 2. Write the conventions sheet

Keep it to about 300 words. Every panel member gets a copy, and the guardians check the design against
it.

| Area the design touches | Owning skill or doc | Pattern to copy (a real file) | House rules |
| --- | --- | --- | --- |
| e.g. screen | the UI skill, the grid skill | a path to an approved screen | visual language: tokens, components, density, layout |
| e.g. HTTP route | the route skill | a path to a route built that way | auth, permissions, request and response shapes, API docs |
| e.g. schema change | the migration doc | a recent migration | naming, backfill, rollback rules |
| e.g. integration in another repo | that repo's skills | a path in that repo | its house tools for calling out |

Add the workflow conventions too: how tickets are filed, how several tickets ship together, how agents
are briefed, how tests run, how releases work. Every cell in the "pattern to copy" column is a real path
you opened. A cell you could not fill is a gap (step 3), not a guess.

## 3. Ask about gaps

If the design touches an area with no written convention (a new kind of screen, a new integration style,
an outbound call from a system that has never made one), ask the user one short question before any panel
starts: "How do we usually do X here?" Give the default you would otherwise assume, so a "yes" settles
it. Batch all gaps into one message with a default each.

Do not fill a gap with a generic default and move on. A panel that builds on a wrong assumption redoes
the whole debate.

## 4. Pass it on

- Every panel brief includes the sheet word for word and names the rows that member must read for their
  part.
- Every slice in the report names the row of the sheet it follows.
- Breaking a convention is a numbered decision for the user, with the reason. It never happens silently
  in a draft.
- The architecture guardian reviews each part against the sheet: does it use the owning pattern, or
  invent a second way?

## Check

The sheet is done when every area the design touches has a row, every row's pattern cell is a path that
exists in the repo, and every empty cell has a matching question in the gap message. If a row has neither
a path nor a question, the pass failed: fill it or ask before the panels start.
