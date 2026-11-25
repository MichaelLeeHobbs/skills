---
name: run-plan
description: >-
  Build a plan that a planning skill filed: one ticket or an epic with children, labelled plan-ready, whose
  description holds a run brief. Use for "run the plan on KEY-12", "build epic X", "run-plan #42". Gates
  on the label and the brief, claims the tickets, builds the slices wave by wave (in parallel where your
  agent can), keeps the tickets and the brief true, runs one review and one test run, and stops at open
  pull requests. Works on any tracker through the shared tracker verbs. NOT for a ticket without a brief
  (triage-card or shape-plan first), and it never merges.
---

# Run a plan from a ticket

`shape-plan` filed an epic with child tickets, or `open-card` filed one ticket, and the description holds a
[run brief](../../thinking/shape-plan/reference/RUN-BRIEF.md) (installed alone?
`skills/thinking/shape-plan/reference/RUN-BRIEF.md` in github.com/MichaelLeeHobbs/skills). This skill
builds it. The brief is the plan: follow it, do not redesign it. Where it contradicts an owning project
skill, stop and ask (step 4) rather than build around it.

Ticket and pull request steps use the shared [tracker verbs](../tracker-verbs/SKILL.md), including the
change verbs. Find your tracker layer there first.

## 0. Gate

`read` the ticket and check all of these:

- it carries `plan-ready`;
- its description has a section whose heading starts `## Run brief`, with every heading from the template
  (a brief with no **Sign-off** whose plan has a screen: ask the user for the sign-off tasks before wave 1);
- for an epic: every ticket in the slices table exists, has the epic as parent, is not closed, and its
  `blocks` links match the `Needs` column.

If any check fails, stop and say which. A ticket without the label or brief goes to `triage-card` or
`shape-plan`. A broken brief (a missing child, wrong links) goes back to `shape-plan`. Do not patch the
plan yourself.

## 1. Load the project

- Run the [conventions pass](../../thinking/debate-plan/reference/conventions-pass.md) for each
  repository in the brief. Check the brief's **Conventions** still match the owning skills. If a skill
  changed since the plan was written, the skill wins: record it under `### Changes during the run`.
- A project copy of `run-plan` wins over this file. The project's workflow skills always apply: how agents
  are briefed, how several tickets ship, the test-run policy, the review rule.

## 2. Claim and set up

- `claim` every ticket you will work: the epic and each child. A child another running session holds is
  skipped and reported, and anything that needs it waits.
- `start` the epic now; `start` each child when its wave starts, not before.
- **Branches:** follow the project's rule for several tickets (often one batch branch from the base, a
  branch per child, one pull request; see `batch-work`). Work in another repository gets its own branch
  and pull request there.

## 3. Run the waves

Build the dependency graph from the slices table and the `blocks` links. A wave is the set of slices whose
`Needs` are all merged into the batch. For each wave:

1. **Brief one builder per slice,** each in its own working copy, with
   [reference/BUILDER-BRIEF.md](reference/BUILDER-BRIEF.md).
2. **Run the wave's builders in parallel** if your agent can run work in parallel. One slice per builder;
   split a large slice only along file lines that do not overlap. Without parallel workers, build the
   slices one at a time in wave order, finishing and committing each before the next, with the same brief
   as your checklist. A builder that hands off part-way gets a fresh builder on the same branch with its
   handoff.
3. **Integrate each result as it lands.** Read the diff and check it against the slice's acceptance
   criteria and the conventions sheet. Read what the builder says it ran and cover only the gap (a shared
   package no builder linted where it is used). Merge the slice branch into the batch. A wrong slice goes
   back to its builder; the coordinator does no slice's coding.
4. **Keep the tickets true.** `comment` on a ticket when its slice lands. A change to the plan goes into
   the brief with `edit`, under `### Changes during the run`, dated, with the reason.
5. **Check the whole screen.** When one screen spans several slices, after each wave that touches it,
   render the assembled screen as each role that uses it, run the UI skill's checks and the sign-off tasks
   that should work by now, and keep the screenshots for the review.
6. **User walkthrough.** At the first wave after which the screen works end to end, stop and ask the user
   to try the sign-off tasks. Later waves do not build on it until they have.

## 4. When to stop and ask

Only for: the brief's **Stop and ask** items, an irreversible action (a data delete, a production change,
a force-push), a product call the brief does not settle, a builder's proposal for a missing visual
language, a builder's report that the brief contradicts an owning skill (bring both sides and your pick),
or the walkthrough. Batch the questions, each with a default.

## 5. Review, test, ship

1. **One fresh-context adversarial review per pull request,** by a reviewer who did no building (a fresh
   agent, or yourself in a separate pass from the brief, the sheet and the diff alone if you cannot start
   one). It checks correctness, the acceptance criteria, and that each owning skill's pattern was used
   with no second way invented; for a screen, the latest screenshots against the **Sign-off** tasks. Fix
   the findings with regression tests. Once, after the last change.
2. **The single pre-PR test run** the project's policy describes, on the final branch only. Rerun only
   what changed since.
3. **Clean up** test stacks and working copies, push, `open-change` each pull request with `tie` for its
   tickets.
4. **Stop at open pull requests.** Merge only when the user says so.

## 6. Close out

- Move each child only as far as the project's rules allow: `close done` when its closing state is
  reached (some boards wait for review, some for a verified deploy). A ticket that has not reached it
  keeps its claim, and the report says what it waits on. `release` each ticket when it closes or the user
  hands it on.
- **Close the epic only after every child is closed.** A child the user agreed to drop is noted in the
  brief.
- Before the last move, list what the run left unfinished: do it now if it can be done now, otherwise
  `file` at most one follow-up ticket with a checklist, `link`ed to the epic.
- `unlabel plan-ready` only when the epic closes. Until then it marks the plan as resumable.

## Resuming

The tickets are the state. A new run on the same epic reads each child's state, its pull request and the
batch branch, then carries on from the first wave not merged. It checks claims first, so it never takes
over a running session's tickets.

## Report

**Done:** what was delivered, in the epic's terms, including anything not delivered. **Pull requests:**
each one with its tickets and their states. **Next:** what the user does next (review, merge, deploy).

## Check

Before the report: every slice in the brief is merged into a branch with an open pull request, or listed
as not done with the reason; the review and the test run each ran once after the last change, and their
results are in the report; each ticket's state read back matches the report; no ticket that closed still
carries this session's claim. Run the [tracker verbs check](../tracker-verbs/SKILL.md#check).
