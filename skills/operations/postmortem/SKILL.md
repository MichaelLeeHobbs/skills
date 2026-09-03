---
name: postmortem
description: >-
  Write a blameless incident postmortem collaboratively. Draft from a completed investigation, then
  iterate with the engineer section by section. It will NOT let someone offload the whole thing for
  anything beyond a trivial incident, because a real postmortem needs their timeline, detection story,
  severity and owners. Use for "write a postmortem", "write up the incident", "do an RCA writeup", or
  after an investigation concludes.
---

# Postmortem, collaborative and blameless

Turn a completed, verified investigation into a postmortem that follows best practice. The section
template, folder convention and card format are in [reference/TEMPLATE.md](reference/TEMPLATE.md).

> **A postmortem is a conversation, not a deliverable you hand back.** The engineer was there and you
> were not. Your draft is a scaffold built from investigation evidence. They fill the gaps, correct what
> you inferred, and own the narrative. Do not write the whole thing and declare it done.

## Two hard rules

### 1. Back-and-forth is required

Draft a section, or a skeleton, then stop and ask them to review and correct it before moving on.
Explicitly surface what you do not know and what you assumed.

Expect several rounds. That back-and-forth is the point, not friction.

### 2. Do not enable offloading

If they say "just write the postmortem", push back for anything beyond a trivial incident. Ask for the
things only they know rather than inventing them. A confidently wrong postmortem is worse than a thin
one, because it will be read by people who were not there and cannot tell.

Only a genuinely simple, low-impact incident may be drafted end to end with one review pass.

## What you must get from them, and must not invent

- **Detection.** How it was *actually* noticed. A support ticket? An alert? A customer? Stumbled on
  during unrelated work? This is almost always different from "we saw the metric", and it is where the
  process lessons live. Ask.
- **Timeline.** The real sequence and times, especially the firefight, which is often a different day
  from the analysis. Confirm the order of events.
- **Severity and impact.** Business impact, who and what was affected, duration, any data concerns. They
  set severity, not you.
- **Owners and feasibility.** Who owns each follow-up, and which fixes are actually doable versus
  blocked on a vendor or another team.
- **Corrections.** Anything in your draft they know is wrong. Invite this every round.

## Workflow

### 1. Ground it in the investigation

Base the draft on a verified root cause with an evidence chain. If the cause is not actually nailed
down, say so and do not write a postmortem yet. Investigate first.

A prior investigation's disproven hypotheses map onto a section of the template, and they stop the next
person re-walking the same wrong turns.

### 2. Draft the skeleton, confirm scope

Propose the incident title, dates, severity, affected systems and a one-line summary. Get those
confirmed or corrected before fleshing anything out. Create the file early so edits land in place.

### 3. Fill sections, pausing on the high-stakes ones

Write in the template's order. After each of these, stop and ask:

- **Executive summary.** Plain language. Someone senior can read only this and stop. Confirm the framing.
- **Timeline.** The section most likely to be wrong without them. Draft from evidence, then ask what is
  out of order, missing or mis-timed.
- **Detection.** Write what they told you, not "a human noticed".
- **Root cause.** Symptom versus cause, contributing factors, five whys, and a disproven-hypotheses
  subsection. Cite code and logs.
- **Action items.** Bucketed by how much control the team actually has, each owned and prioritised. Mark
  what is already done.

Flag inline what you inferred versus what is evidenced. Leave explicit markers for gaps you need them to
fill, so an unfinished draft cannot be mistaken for a finished one.

### 4. Offer cards for the action items

Offer to draft issue-tracker cards, one per action-item bucket as they direct: a feature card for the
code fixes, spike cards for the uncertain ones. Put them beside the postmortem.

### 5. Finalize

Only call it done when they have reviewed and corrected it. Confirm: no customer data, no secrets,
severity agreed, owners assigned, action items actionable.

Leave the commit and push to them.

## Guardrails

- **Blameless.** Failures are of design, guardrails and observability, never of people. No names as
  causes.
- **No customer data, no secrets.** In a regulated domain, reference records by internal identifier
  rather than anything that identifies a person. Never paste credentials. Scrub the examples too.
- **Evidence over narrative.** Every claim of cause traces to a log, metric or code citation. "We think"
  is fine when labelled. Do not dress inference as fact.
- **Do not finalize unilaterally.** If they have not reviewed it, it is a draft, and it says so at the
  top.

## It is working if

The engineer corrected something in every round, the detection story in the final document is one you
could not have guessed from the logs, and the disproven-hypotheses section saves the next person a day.
