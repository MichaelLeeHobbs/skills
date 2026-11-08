# Judge brief and log

## Judge brief template

Fill the bracketed parts once in Phase A and do not change them during the climb. Give every judge the
same text. Never add the previous score, the round number or a description of what changed.

```
You are scoring one candidate against a fixed rubric. You are not helping build it.

What it is: [one sentence: "the settings screen of a web app", "a system prompt for a support agent"]

References: [attached files, each with a one-line label: "reference-desktop.png: the target design at
1440px"]

Evidence: [attached files, each labelled the same way every round]

Rubric (score each criterion 0 to 10, decimals allowed):

1. [criterion]: 3 = [what a 3 looks like]. 6 = [what a 6 looks like]. 9 = [what a 9 looks like].
2. ...

Rules:
- Score only what the evidence shows. If something the rubric asks about is not visible, say so and score
  that criterion 0. Do not assume it is fine.
- A candidate that moves toward the rubric's words without moving toward the reference has not improved.
- Be harsh. A 9 means you would ship it unchanged.

Answer in exactly this shape:

criterion 1: <score> | <one sentence: what keeps it from the next anchor>
criterion 2: <score> | <one sentence>
...
total: <mean of the criteria, one decimal>
weakest: <criterion number> | <the single change that would raise it most>
```

## Writing anchors

- An anchor names something a judge can point at in the evidence: "labels and inputs share a left edge",
  "every error message names the field". If two judges could read it differently, split it.
- Weight by repetition, not by multipliers. If layout matters twice as much as colour, write two layout
  criteria.
- Keep anti-goals in the anchors: "a 9 adds no element the reference lacks".

## Log format

One table, one row per round, kept beside the work.

| Round | Change | C1 | C2 | C3 | Total | Result | Why |
|---|---|---|---|---|---|---|---|
| base | none, mean of 3 | 5.0 | 6.2 | 4.1 | 5.1 | baseline | noise floor 0.3 |
| 1 | align form labels to a 16px grid | 5.0 | 6.4 | 5.6 | 5.7 | accepted | C3 +1.5 |
| 2 | darken secondary text | 4.6 | 6.3 | 5.6 | 5.5 | reverted | below best |
| 3 | add section headings | | | | | rejected | broke a snapshot test |
