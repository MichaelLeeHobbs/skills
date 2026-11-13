# Dupes lane: fixtures and helpers written twice

## What to list

Every named fixture, factory, builder and helper in test folders and test-support modules (shared
setup files, fixture folders, test utility packages). Test cases themselves are not listed. Enumerate
them with the language's parser; without one, the lane cannot run and fails.

For each, one `helper` line: `id` as `path:line:name`, `name`, and `body`, the full source text of its
body. Run `group`. It groups helpers whose bodies are identical apart from whitespace, and helpers that
share a name stem (`makeUser`, `buildUser`, `user`).

## Judge

Judge at most 30 groups, largest first, from source, with the most capable model. Give each member one
verdict against the group's most-imported member:

- **SAME**: builds the same thing for every input.
- **VARIANT**: does the same job, and differs on at least one default, field or input. Name each
  differing field.
- **DIFFERENT**: does another job, whatever its name.

## Prove by building

For each VARIANT and SAME pair, write a throwaway harness in the work folder that copies both members'
text (renamed so they cannot collide), calls each with no arguments and with one explicit set of
arguments, and prints each result as canonical JSON with sorted keys. Diff the outputs. Mark each
member CONFIRMED (the diff shows what the judge said), REFUTED (it does not: the diff wins) or BLOCKED
(it needs a database, network, a running app or injected fixtures; keep the judge's predicted diff,
marked predicted). Never import repo code into the harness and never start the application.

## Report

For each group: members with importer counts, verdicts, the diff, and the copy to keep (the most
imported, else the one in a shared support folder). Flag a VARIANT whose differing field is read by an
assertion: merging the copies changes those tests' results.

Copies that do one job under different code and different names are out of reach of this lane. The
find-reinvention skill finds those if its exclusion of tests and test helpers is lifted.
