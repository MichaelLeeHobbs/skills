---
name: shape-plan
description: >-
  Work an idea, problem or feature into an agreed plan with the user before anything is built, then file
  it as one ticket or an epic with child tickets that a fresh session can build from alone. Use for
  "let's think about X", "I'm not happy with how Y turned out", "help me plan Z", "brainstorm this and
  make tickets". Short loops with the user, debate and project skills when they earn it, then a run brief
  in the ticket and the plan-ready label. Works on any tracker through the shared tracker verbs. NOT for
  judging an existing ticket (triage-card), one small follow-up (open-card), or building the plan
  (run-plan). Changes no code.
---

# Shape a plan with the user

The user brings a problem, a feature or a feeling that something is wrong. Together you turn it into a
plan they understand and agree with, then record it as tickets a separate session can build without
having been in this conversation.

**Change nothing in the repository.** Research is fine: read code and history, query the tracker, write
throwaway scripts outside the repo. The only writes are to the tracker (step 6), plus the project's
decision record when it keeps one, through its own process (often a docs pull request).

Ticket steps use the shared [tracker verbs](../../engineering/tracker-verbs/SKILL.md) (installed alone?
read `skills/engineering/tracker-verbs/SKILL.md` in github.com/MichaelLeeHobbs/skills). Find your tracker
layer there first.

## 0. Load the project

- Run the [conventions pass](../debate-plan/reference/conventions-pass.md) for every repository the idea
  touches (installed alone? `skills/thinking/debate-plan/reference/conventions-pass.md` in the same
  repo). A project copy of `shape-plan` wins over this file.

## 1. Listen, then play it back

Before proposing anything, read what exists today in the code and say back, in a few lines: what you
understood the user wants, in their terms; what is there today, with file paths, and where it diverges;
what you would need to know to go further.

The user's vision drives the design. When they explain how they see it ("the integration engine handles
the HL7, the app only gets JSON"), restate it as rules and check every later idea against them.

**Replacing a screen?** First list the old screen's jobs: each thing a user does there, as each role that
uses it, with its click path and label. This job inventory grounds the plan, and every later shape is
checked against it.

## 2. Work in short loops

Each reply fits on one screen:

1. **What changed** in your understanding since the last reply.
2. **The shape** you would suggest now: a few bullets or a small diagram, no field lists or file-by-file
   detail.
3. **At most three questions**, numbered, each with your recommended default, so the user can answer
   "1 yes, 2 drop".

Keep the details in a scratch draft outside the repo and expand a part when asked ("more on X"). Do not
paste the draft into the conversation.

Ask about house conventions as soon as the shape depends on one ("how do we usually call out from the
integration engine?"). A generic default here is what causes rework.

## 3. Bring in other skills when they earn it

- **`debate-plan`** for large or risky work: a new system or domain, a major overhaul, permissions or
  sensitive data, data integrity, a screen people work in all day. Say in one line that you are sending
  it to debate and at which depth. Hand it the user's vision rules and the conventions sheet word for
  word. Bring its report back in the short-loop shape; the full report stays in the scratch file.
- **Project skills for grounding:** the UI, route, schema or worker skill tells you what is cheap and
  what is expensive here. Read the relevant ones before sizing. When the plan names a pattern to copy for
  a screen, check it against the UI skill's own reference list; if you pick another, say why in the
  brief's **Conventions** line.
- **`triage-card`** for existing tickets the idea touches: fold them in, supersede them or leave them,
  and say which.

## 4. Refine until nothing is open

Loop until:

- every decision has an answer (the user's, or an accepted default);
- each slice has a clear owner area, so slices in the same wave do not touch the same files;
- you have re-checked against the code the key facts the plan relies on;
- a plan with a screen has a **sign-off list** the user agrees to: the tasks they will do by hand to
  accept it, in their words, with click counts where they matter. For a replacement it covers every job
  in the inventory, and each screen slice's acceptance names the jobs it carries. There is no late
  "parity" slice.

After the user's answers change the design, run one focused adversarial review of just the changed parts
(a fresh reviewer with the conventions sheet, or yourself in a fresh pass if you cannot start one). Tell
the user in a few lines what it changed.

A real defect found along the way gets its own ticket at once (sensitive data reaching the wrong
audience first). It is not fixed here.

## 5. Confirm the tickets before filing

Show the ticket plan in one short block: **one ticket** when the work fits one ticket on one branch,
otherwise **an epic plus child tickets** in build order, with waves, each naming its repository and what
it owns; and any follow-up tickets the user asked to keep. File on the user's yes; "use defaults" is a
yes.

## 6. File the tickets

Follow the project's ticket conventions for every field.

1. `file` the epic (or the single ticket) first, then each child with the epic as parent (`nest` if the
   layer cannot set a parent on `file`). Each child holds its goal, acceptance criteria, the files or
   areas it owns, and the project skills it must follow.
2. `link` the children `blocks` in build order, matching the brief's `Needs` column.
3. `edit` the epic's description to hold the [run brief](reference/RUN-BRIEF.md), with the real keys in
   its slices table.
4. Record architecture decisions where the project keeps them, then `comment` the full design on the epic
   and point the brief's **Design** line at it.
5. `read` everything back: each child's parent, each `blocks` link from both sides, the brief's headings.
   Only then `label` the epic `plan-ready`: it tells the build step the plan is complete.

## 7. Hand off

`release` any ticket this session claimed. Ask whether to start the build now. If your agent can start a
fresh session or agent, start it in the project with only the instruction to run the plan on the epic's
key (`run-plan`): the brief is the whole hand-off. Otherwise give the user that one line.

## Report

Short: the plan in three to five lines; the tickets, epic first, then children in build order, each with
key and title; where the decisions are recorded. Leave out how the plan was researched.

## Check

Before the report, from the read-back and not from memory: every ticket in the confirmed plan exists; each
child's parent is the epic; the `blocks` links match the `Needs` column; the epic's description holds every
heading in [reference/RUN-BRIEF.md](reference/RUN-BRIEF.md) and every slices row names a real key; the epic
carries `plan-ready`; no ticket still carries this session's claim. Run the
[tracker verbs check](../../engineering/tracker-verbs/SKILL.md#check). A failed item is reported as not done.
