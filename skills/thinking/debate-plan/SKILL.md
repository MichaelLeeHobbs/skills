---
name: debate-plan
description: >-
  Turn a vague ticket, screen or idea into buildable work by having panels of agents argue it out:
  builders design and rebut each other, real users of the product and guardians (architecture, volume,
  access, data leaving the system) review, and the result comes back as a recommended design, slices in
  build order and numbered decisions with defaults. Use for "debate this", "get a panel on this ticket",
  "have agents design and rebut", "plan this screen properly", or a ticket too vague to build. Read-only
  until the user approves. NOT for a single either/or question (use steelman), and not for exploring
  options with the user in short loops before anything is chosen (use brainstorm).
---

# Debate plan

A vague ticket becomes a design, slices and a short list of decisions, argued by people who would build
it, use it and guard it. You are the coordinator. You brief the panels, run the rounds, settle facts in
the code and write the report.

**Read-only.** No edits, no branches, no tickets moved until the user approves the report. If the
request already says to build it ("plan it and build it"), the approval is in the request.

If the project ships its own skill with this name, read it and follow it wherever it differs from this
one. The project copy owns the specifics, this file owns the method.

## 0. Load the project's conventions

Run the [conventions pass](reference/conventions-pass.md) for every repo the design touches. It ends
with a conventions sheet of about 300 words and, where a convention is unwritten, one question to the
user with your assumed default. Ask that question before any panel starts: a panel that builds on a
wrong assumption has to redo the whole debate.

## 1. Pick the depth

- **Standard** (the default): builders, users, builders, guardians, builders.
- **Critical**: builders, then users and builders up to three times, then guardians and builders up to
  twice. Use it for screens people work in all day, permissions and access to sensitive data, data
  integrity, and core operational monitoring.

If the ticket makes the depth obvious, say which in one line and start. If not, ask once: Standard or
Critical with your recommendation, and whether they want any persona added.

## 2. Ground it

Write one shared brief before any agent starts. Every panel member reads it first. It holds:

- the request and the user's own notes, word for word;
- scale: users, rows, traffic, and the traffic pattern (office hours or round the clock);
- facts checked against the code, each with its file path;
- the conventions sheet, word for word, with the skills or docs each panel member must read for their
  part (a UI designer reads the UI conventions and approved screens, a database builder reads the
  migration rules);
- when a screen is being replaced, the old screen's job inventory: every task a user does there today,
  so reviewers can check each job keeps a findable place.

For a whole system, have one agent map how it works today before the panels start. If grounding finds a
real defect, write it up as its own ticket now (ask first if filing needs approval) and fix it only if
the user says so. Sensitive data shown to the wrong audience goes to the top.

## 3. Panels

Each brief opens with who the agent is, what their day looks like and what they fight for. Pick members
from the problem. [Panels](reference/panels.md) has the casting guide, the brief template and the word
caps.

- **Builders (3 to 4)**: the developer who will build and maintain it, a designer when there is a screen,
  the operator who gets woken when it breaks or the database owner, and always one skeptic or minimalist
  who argues what not to build.
- **Users (2 to 3, whenever there is a screen)**: real users of this product, cast with their day and
  their stakes, not "a user".
- **Guardians**:
  - *Architecture fit and conventions*, always: does each part reuse what the project has, or invent a
    second way? A part that departs from the conventions sheet without a stated reason is a finding.
  - *Performance and logic at real volume*, always: is it right, and is it the fast way? Work the sums
    at the scale in the brief.
  - *Safety and access*, when sensitive data or permissions are involved: any path outside the user's
    scope, any way to escalate.
  - *Data steward*, when data leaves the system: what goes out, to whom, under what approval.

Every brief also says: read-only; read the brief, then the conventions named for your part, then the
named files; design within the conventions, and propose any break openly with the reason. Each agent
writes its full output as a separate note and returns a summary within its word cap.

## 4. Rounds

1. **Builders open.** Each opening covers what is wrong today, citing files; the design worked through a
   real example from the brief; an ASCII mockup per state for any screen (empty, loading, normal, error,
   no access); the data behind each part and the cost of any new server data; and a must, should, won't
   list.
2. **Builders rebut.** Each gets the others' openings and attacks them with concrete failure scenarios
   checked in the code, adopts ideas that beat its own, concedes weak points and revises. Every opening
   must be rebutted by at least one other builder.
3. **The chair merges.** You, or one agent you name, merge the result into one draft and settle disputed
   facts by reading the code. Real disagreements stay in the draft as options.
4. **Users and guardians review** the draft from their own seat. The builders revise after each review
   round. Round counts are caps: when a round raises nothing new, skip the rest of that loop.

Each round lists only genuine product calls for the user. Keep a round log as you go (who spoke, who
rebutted whom, what changed). The check in step 6 reads it.

## 5. Report

In this order:

1. **What is wrong today**, including defects found, each claim citing a file.
2. **The recommended design**, with mockups for any screen.
3. **Slices in build order**, with rough sizes. Each names the convention or skill it follows (a row of
   the conventions sheet) and the files or areas it owns.
4. **Won't build and deferred.** Each deferral names the trigger that would bring it back.
5. **Numbered decisions**, each with a recommended default, so the user can answer "1 yes, 2 drop, 3
   default". Every place the design breaks a convention is one of these decisions.

KISS and YAGNI apply. A need the user stated stays in, even if large. A "we could" with no plan behind it
goes to deferred or is dropped. If a numbered decision is a genuine either/or that is expensive to get
wrong, offer to settle it with the steelman skill if it is installed; if not, give each side's strongest
point in two lines and your default. If the user answers "need more detail", explain who the choice
affects and recommend one option.

## 6. Check the report before you send it

Run the [self-test](reference/final-check.md#self-test) once, then every item in
[the final check](reference/final-check.md) against the written report and the round log. Each item
passes or fails, and an item you cannot evaluate fails. Any failure means fix and re-run,
or send the report with the failing items listed at the top. Never send it silently.

The items, in short: every "wrong today" claim cites a file that exists and says what is claimed; every
slice names its convention and owned files; every decision has a default; every convention break is a
decision; every deferral has a trigger; every builder opening was rebutted; every always-on guardian and,
for a screen, every user persona reviewed the final draft.

## 7. After the user answers

Do not run the debate again. Revise the design, then run one focused adversarial review of only the parts
the answers changed. Tell the user what that review changed, then record the result where the project
keeps such things:

- the design and decisions as a comment on the ticket, or on the parent for a multi-ticket plan;
- the ticket re-scoped, or slice tickets filed in build order with their dependencies linked;
- parked ideas on one future ticket that names its prerequisites;
- for an architecture decision, an entry in the project's decision record if it keeps one, with the
  deferral triggers, the losing option's strongest point and the condition that would reverse it.

## If you cannot run work in parallel

Run each panel member in turn as a distinct written persona. Write each opening in its own pass from the
brief alone, without re-reading the other openings, and keep each member's output as a separate note.
Only the rebuttal pass reads the others. Say in the report that the debate ran serially, because serial
openings drift toward whichever was written first, and the rebuttal round is your only defence.

## It is working if

The report check passes, and the final design contains at least one idea or failure scenario that no
single builder's opening had.
