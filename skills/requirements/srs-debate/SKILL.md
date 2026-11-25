---
name: srs-debate
description: >-
  Challenge and polish a Software Requirements Specification (docs/srs) by having panels argue over it:
  a contractor hunting every ambiguity, the customer asking whether they would sign it, a tester asking
  whether each line can be proven, a domain guardian and a scope guardian. Returns numbered findings per
  requirement ID with proposed rewrites and decisions with defaults. Use for "debate the SRS", "poke
  holes in the auth requirements", "is this spec buildable", "review interfaces/connector.md".
  Read-only until the developer approves. NOT for writing new requirements (srs) or checking code
  against them (srs-verify), and not for debating a ticket or design (debate-plan).
---

# SRS debate

Panels read the SRS the way the people who will build, buy, test and guard the product would, and argue
until what is left is a short list of fixes. You are the chair: you brief the panels, run the rounds,
check every claim against the document and write the report.

**Read-only.** Change no file until the developer approves the report. If the request already says to
apply the result, the approval is in the request.

## 0. Read the SRS and set the scope

Read `docs/srs/README.md` in full: its Conventions section is the format, and its Out of scope and User
classes sections are what the panels judge against. Then pick the scope with the developer: one area,
a few areas, an interface spec, or the whole SRS. For the whole SRS, debate one to three areas at a time;
a panel reading forty pages skims.

## 1. Cast the domain guardian

Ask the developer who guards this product's domain, unless the project's context file or the SRS README
names one: the regulation, integrity rule or migration that would sink the product if missed (health
privacy law, financial audit, data integrity across a migration). Write that seat's charge in two lines.
If the developer names none, drop the seat and say so in the report.

## 2. Write the shared brief

Every panel reads the same brief first:

- the request and the developer's notes, word for word;
- the README's Purpose, Scope, Out of scope, User classes and Conventions, word for word;
- every area or interface file in scope, word for word, including Proposed rows and source notes;
- facts the panels need that the SRS does not hold (the product's scale, its users' day), each with
  where it came from.

## 3. The panels

[Panels](reference/panels.md) has each seat's full brief, what it flags and its word cap.

- **Contractor.** Paid a fixed price to build exactly this and nothing more. Lists every place they would
  have to guess, and every place they could deliver something useless that still meets the words.
- **Customer.** Paying for it. Would they sign it? Missing capabilities, wrong priorities, a P3 they
  cannot ship without, a user class nobody served.
- **Tester.** Has to prove each line. Flags rows that cannot be proven as written, compound rows, the
  wrong Verify method, and numbers with no tolerance or window.
- **Domain guardian.** Project-supplied (step 1). Flags rows that break, or fail to state, the domain's
  rules.
- **Scope guardian.** Flags gold-plating, rows that collide with Out of scope lines, and implementation
  leaking into a requirement (a library, table or framework named outside an interface spec).

Every brief says: read-only; read the shared brief first; cite a requirement ID for every finding, or
name the area or behaviour that is missing; propose the rewrite, not only the complaint.

## 4. Rounds

1. **Review.** Each panel reviews the brief alone and writes its findings as a separate note.
2. **Cross-examine.** Each panel reads the others' notes and answers them: agrees, rebuts with a
   concrete case, or merges. The Customer and the Scope guardian pull in opposite directions; each of
   their disputed findings must be answered by the other.
3. **Merge.** You merge the notes into one numbered list, drop duplicates, check every quoted row
   against the file, and keep real disagreements as decisions.

Keep a round log (who raised what, who answered it, what changed). The check reads it.

## 5. Report

1. **Findings**, numbered, grouped by area. Each one: the ID (or `missing: <area or behaviour>`), the
   panels that raised it, the problem in one or two lines, and the fix as a row ready to paste. Fixing
   an Accepted row means a new Proposed row with the next unused ID in that sub-area; the old row is
   superseded only when the developer accepts the new one. A Proposed row may be rewritten in place.
2. **Decisions**, numbered D1, D2..., each a genuine product call with the options and your default, so
   the developer can answer "D1 default, D2 b".
3. **Left alone**: rows the panels challenged and you kept, with the reason in one line.

## 6. After the developer answers

Apply only what they approved, following the SRS README's conventions: new or rewritten rows land as
Proposed with a source note naming this debate. A row becomes Accepted only when the developer's answer
accepts it in words ("1 accept"); then add the dated change-log line with their words, and set the
replaced row to `Superseded by <new ID>`.

## Check

Before you send the report, confirm and list as pass or fail:

- every finding cites an ID that exists in the SRS, or names a missing area or behaviour;
- every proposed row has an ID, all five columns and an allowed Pri and Verify;
- every decision has a default;
- every panel's note was answered by at least one other panel in round 2.

An item you cannot evaluate fails. Fix and recheck, or send the report with the failing items at the top.

After applying approved edits, run the `srs` skill's format check if it is installed (a sibling `srs`
folder holding `scripts/srs-lint.mjs`): `node <srs skill folder>/scripts/srs-lint.mjs docs/srs` must exit
0. If it is not installed or Node is missing, say the script did not run and check the edited rows by hand
against the README's Conventions: unique never-reused IDs, five columns, allowed Pri, Verify and Status
values, `Superseded by` targets that exist, and a dated change-log line for every newly Accepted ID.

## If you cannot run work in parallel

Run each panel in turn as a distinct persona. Write each review from the shared brief alone, without
reading the other reviews, and keep each as its own note. Only round 2 reads the others. Say in the
report that the panels ran in sequence.

## It is working if

The check passes, and the findings include at least one ambiguity the Contractor could exploit and one
row the Tester could not prove, or the report says plainly that the panels found none.
