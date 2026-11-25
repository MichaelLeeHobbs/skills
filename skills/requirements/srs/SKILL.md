---
name: srs
description: >-
  Write and maintain a Software Requirements Specification (SRS) in the repo's docs/srs folder, the
  contract agents build toward. Use for "start an SRS", "bootstrap requirements from this repo", "add a
  requirement", "this ticket changes AUTH-USR-03", "log a requirement we found while building", "accept
  AUTH-USR-03 and 04, reject 05", "draft an interface spec". Ships srs-lint, a Node script that checks
  the format. NOT for challenging the document (srs-debate) or proving the code meets it (srs-verify).
---

# SRS

The SRS lives in `docs/srs/` of the repo it describes. It is the definition of done, it is allowed to
change, and the developer decides what gets in. You draft and maintain it; you never decide for them.

## 0. Read the conventions

If `docs/srs/README.md` exists, read all of it before anything else. Its Conventions section is the
format, so this skill and its siblings work without each other. If the repo's README changes a
convention from the template, follow the README and tell the developer that `srs-lint` checks the
template's conventions and will flag the difference.

If there is no SRS, copy [the README template](reference/README-template.md) to `docs/srs/README.md`,
fill in what you know, and go to bootstrap (an existing codebase) or add (a new project).
[The example area](reference/example-area.md) shows a finished area file.

## Rules you never break

- **You write Proposed rows only.** Only the developer moves a row to Accepted, Deferred or Rejected,
  in their own words. You apply their decision and quote their words in the change log.
- **Accepted text is frozen.** A change gets a new ID as a Proposed row. When the developer accepts it,
  the old row's Status becomes `Superseded by <new ID>`. A Proposed row may be revised in place.
- **IDs are never reused.** The next number in a sub-area is one more than the highest ever used there,
  counting Superseded and Rejected rows.
- **Never write `trace.md`.** Verdicts belong to verification, and whoever built the work never marks it Met.
- **Write requirements, not designs.** One behaviour per row, `shall` / `should` / `may`, verifiable,
  saying what and not how: no library, table, framework or file name. Interface specs are the exception.
- **Never a wall.** Present at most 3 to 5 areas for decision at a time.

## Mode 1: bootstrap an existing repo

1. Inventory what the repo already says it does, following [bootstrap](reference/bootstrap.md): docs,
   capability lists, roadmaps and decision records, tests, routes, schemas, CLI commands, config.
2. Propose the area list and sub-areas (area code, file name, one line each) and the Out of scope lines,
   drawn from "won't", "not planned" and "non-goal" statements. Ask the developer to confirm the areas
   before you draft rows.
3. Draft Proposed rows for 3 to 5 areas. Every row gets a source note under its table naming where it
   came from (`AUTH-USR-04: source: docs/user/capabilities.md "Lockout"; tests/auth.spec.js:40`). A
   test proves something exists, not that it is required: say so when a test is the only source.
4. Present the batch: per area, the rows and a one-line question. Accept answers like "accept all but
   04, defer 07, reject 09". Apply them as in mode 4, run the check, then present the next batch.

## Mode 2: add or change from a conversation, ticket or idea

1. Read the area files it touches and search every SRS file for the behaviour: duplicates, rows it
   contradicts (a different number, a different rule) and Out of scope lines it collides with.
2. Draft the new or replacement rows as Proposed, with a source note naming the conversation or ticket.
3. Report: rows added (IDs), existing rows touched or superseded on acceptance (IDs), conflicts and
   Out of scope collisions, each with the decision it needs. Stop there until the developer decides.

## Mode 3: discovered during a build

Any agent building against the SRS that finds a requirement nobody wrote (an edge case, a limit, a
rule the design implies) appends a Proposed row to the right sub-area with a source note naming the
work: `AUTH-SES-04: source: discovered while building idle logout, PR 214`. Do not stop the build for
it and do not build to it until it is Accepted. Name the new IDs in the build's report.

## Mode 4: apply the developer's decisions

1. Map their words to IDs. If any decision is ambiguous ("accept the auth ones"), list the IDs you read
   it as and confirm before writing anything.
2. Set each Status. For an accepted replacement, set the old row to `Superseded by <new ID>`.
3. Add one change-log line per decision, newest first, naming every ID explicitly (no ranges) with the
   date and their words: `- 2026-11-24: Accepted AUTH-USR-03, AUTH-USR-04; deferred AUTH-SES-03 until
   mobile ships. "Five attempts, not three."`

## Mode 5: interface specs

Draft or revise `docs/srs/interfaces/<name>.md` following [interface specs](reference/interface-spec.md):
its own IDs, its own semver, and the exact shape as the requirement. A breaking change bumps the major
version and supersedes the rows it changes.

## Check

Run the format check from this skill's folder against the SRS:

```
node <this skill's folder>/scripts/srs-lint.mjs docs/srs
```

Add `--json` for a machine-readable list. Exit 0 means clean. Exit 1 lists findings as
`file:line: rule: message`: fix every one and run it again; never report the work done with findings
open. Exit 2 means a wrong path or option.

If Node is not available, the check has not run, and you say so in your report as a failure. Then go
through [the checks by hand](reference/lint-by-hand.md), mark each pass or fail with the row it concerns,
and give that list to the developer.

## Report

End with: the rows you added or changed, by ID; each decision waiting on the developer as a numbered
line with your recommended answer; and the check's result.

## It is working if

The check exits 0, every Proposed row has a source note, and every Accepted row traces to a dated
change-log line in the developer's words.
