# postmortem reference

The section template, the folder convention, the action-item buckets, and the card format.

## Where postmortems live

One folder per incident, in whichever repository holds your team's operational record:

```
incidents/{YYYY-MM-DD}-short-name/
  postmortem.md            the writeup
  card-1-<slug>.md         optional issue-tracker card drafts
  card-2-<slug>.md
```

`{YYYY-MM-DD}` is the incident or detection date. `short-name` is kebab-case and describes the incident,
for example `queue-amplification-loop`.

Add a row to an `incidents/README.md` index when the postmortem reaches final.

**A postmortem is a historical record. Do not rewrite one after it is final.** If a conclusion later
proves wrong, correct it wherever your team keeps living documentation and note the correction in the
index. Rewriting history destroys the evidence of what people believed at the time, which is often the
most useful part.

Read the existing postmortems before writing a new one. Failure classes recur, and the prior writeups
carry the disproven hypotheses so you do not re-walk them.

## The template

Order matters. Value for a non-specialist reader first, depth after. Omit a section only if it is
genuinely not applicable.

1. **Title.** `Postmortem: <what happened> -> <impact>`
2. **Metadata table.** Date of incident, date of writeup, status, severity with a one-line
   justification, authors, affected systems, primary identifier.
3. **Blameless banner.** One line stating this is blameless and that failures are of design, guardrails
   and observability.
4. **Executive summary.** Plain language, no jargon. What happened, business impact, why in one
   sentence, what has been done, what is still required. End it with a line telling non-engineering
   readers they can stop here.
5. **Impact.** Measured effects: integrity, availability, backlog, load. Durations. Data concerns. State
   plainly if no data was lost.
6. **Background.** How the relevant pipeline is *supposed* to work, so the failure is legible to someone
   who does not work on it.
7. **Timeline.** In UTC. Split the buildup, often a prior day's slow burn or firefight, from the
   investigation and response. What happened in what order, each step evidenced.
8. **Root cause analysis.**
   - The mechanism. A diagram helps for loops and flows.
   - Why each guard or safeguard did not stop it.
   - **Disproven hypotheses:** the wrong turns and the evidence that killed them.
   - **Five whys.**
9. **Detection.** How it was actually found, supplied by the engineer, plus the detection failures: a
   missing alert, an ignored one, anchoring on the wrong subsystem. Time to detect.
10. **Mitigation and resolution.** What is deployed, with a commit reference. What it fixes and what it
    explicitly does **not** fix. Operational remediation.
11. **Action items.** Bucketed by control, each owned and prioritised. Mark what is done.
12. **What went well, what went poorly, where we got lucky.**
13. **Lessons learned.** Generalisable principles, not restatements of the timeline.
14. **Appendix.** Key code references with file and line, key evidence such as queries and metrics, and
    a glossary if the incident needed one.

## Action-item buckets

Group items by how much control the team actually has, so a reader sees feasibility at a glance.

- **Already done.** Shipped during or after the incident, with a commit reference.
- **Things we can readily do.** Your own code. The primary root-cause fixes. These become feature cards.
- **Things we might be able to do, needs investigation.** Feasibility uncertain. These become spikes.
- **Things that mean changing something we only partly control.** A vendor application you sometimes
  modify, a shared platform another team owns. Cautious, coordinated, and worth naming as such.
- **Things we probably cannot do.** Vendor, external or customer-owned. Track and escalate. Often no
  card at all, and saying so explicitly is more honest than filing one nobody will action.
- **Operational cleanup.** Do-now items: purge, reprocess, quarantine.

End with a short defence-in-depth note naming which item stops the cause, which caps the damage, and
which detects a recurrence. If no item detects recurrence, say that too.

## Card format

One file per card, beside the postmortem.

```
Subject: <concise, specific title>

Type:      Feature | Research/Spike | Task
Component: <service or system>
Priority:  P0..P3      Timebox: <for spikes>
Related:   Postmortem <folder name>

## Problem, or Background for a spike
Context, grounded in the postmortem, with a link to it.

## Goal, or Questions to answer
For a feature, the goal. For a spike, the questions plus the deliverable.

## Acceptance criteria
- [ ] verifiable outcomes

## Technical notes
file:line, log groups, config keys the implementer will need.

## Out of scope
What this card is not.

## References
Postmortem ../postmortem.md
```

One clear outcome per card. Acceptance criteria have to be verifiable. A spike has a deliverable, which
is a recommendation or a writeup, and a timebox. Always link back to the postmortem. Keep customer data
and secrets out.

## Anti-laziness checklist

Before finalizing:

- [ ] Detection story came from the engineer, not assumed.
- [ ] Timeline order confirmed by the engineer.
- [ ] Severity set by the engineer.
- [ ] Every claim of cause cites evidence: a log, a metric, or code.
- [ ] Disproven-hypotheses section present, if the investigation had wrong turns.
- [ ] Action items owned, prioritised, and bucketed by feasibility.
- [ ] No customer data, no secrets, including in the examples.
- [ ] The engineer has reviewed and corrected it. Otherwise it is still a draft and says so.
