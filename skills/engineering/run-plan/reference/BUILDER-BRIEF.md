# Builder brief

Every builder gets all of this. A builder does not load your context file or this skill, so a rule it
needs must be in its brief.

1. **The slice:** its ticket key, title, acceptance criteria, and the files or areas it owns, with an
   instruction to touch nothing outside them.
2. **The brief's Decided, don't reopen list,** word for word.
3. **The conventions sheet,** the project skills this slice must read before writing code (by path), and
   the patterns to copy (by file).
4. **UI work:** check the project has a visual language (tokens plus a reference doc) before building a
   screen; if it does not, stop and return a proposal for one instead of building. Use the project's
   current web-platform guidance for HTML, CSS and client code.
5. **Its own working copy and scratch folder:** the block in batch-work's
   [ISOLATED-AGENT-RULES.md](../../batch-work/reference/ISOLATED-AGENT-RULES.md) (installed alone?
   `skills/engineering/batch-work/reference/ISOLATED-AGENT-RULES.md` in github.com/MichaelLeeHobbs/skills),
   word for word, with its paths filled in.
6. **The test rule:** the project's. Where it sets none, the builder runs only the tests it wrote or
   changed, plus lint and typecheck of the packages it touched, never the whole suite.
7. **Mechanical work:** run the tool's autofix or a small script first; rewrite a file with many findings
   in one write, not one edit per finding; read only the lines around each finding, and cut tool output
   down to the lines it needs.
8. **Contradictions:** if the brief contradicts an owning project skill (the wrong reference pattern, say),
   report it and do not build that part around it.
9. **Context:** when its working context grows large, stop at a clean point, commit, and return a
   handoff: what is done, what is left, the exact next files.
10. **What to return:** what changed, exactly what it ran (each test, lint and typecheck command and its
    package, with the result), what it could not do, and anything that broke a convention or the brief.

If your agent lets you pick a model per worker, mechanical slices (lint fixes, renames, baseline work) can
run on a cheaper one; design-heavy slices and reviewers stay on the main one unless the brief says
otherwise.
