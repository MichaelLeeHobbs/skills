---
name: hill-climb
description: >-
  Improve something fuzzy (a UI, a prompt, generated code, copy, a layout) by turning it into a scored
  loop: freeze a metric or a judge rubric, calibrate the judge, then make one change per round and keep it
  only if the score rises past the noise. Use for "hill climb this", "iterate until it scores 8",
  "make this look like the reference", "loop on it with a judge", "keep improving until it plateaus".
  NOT for a bug with a known fix, a one-shot edit, or a choice between two designs (that is a debate).
---

# Hill climb

One prompt and a hopeful look is a coin toss. A climb is a loop with a number in it: change one thing,
measure, keep it only if the number went up by more than the measuring stick wobbles.

## Gate: can it be scored?

The climb is only as good as its score. Before anything else, name what "better" means in a form two
people could apply and get close to the same number.

- **A deterministic metric wins every time**: tests passing, a benchmark, bundle size, a pixel diff
  against a reference image, an accessibility audit, an eval set's accuracy. Use one when it exists.
- **A judge** (an agent scoring evidence against a rubric) is for qualities with no metric: how a
  screen looks, whether copy reads well, how idiomatic code is.
- If you cannot write either, stop. Ask the user what a good result looks like and get references.

## Phase A: frame (frozen before round 1)

1. **Score.** The metric, or a rubric of 3 to 6 criteria, each with anchors that say what a 3, a 6 and a
   9 look like. "Spacing matches the reference within a few pixels" is a criterion. "Polished" is not.
   The judge brief template is in [reference/judge-brief.md](reference/judge-brief.md).
2. **Evidence.** What the judge sees each round: screenshots at named viewports and states, test output,
   a diff, the rendered text. Same capture, same settings, every round.
3. **References.** The target the judge compares against, when there is one: mockups, screenshots of the
   product you are matching, a gold answer.
4. **Guardrails.** Things that must not regress whatever the score does: tests, type checks, build,
   behaviour the user named. A round that breaks one is rejected without being scored.
5. **Stop rule.** Target score, round budget, and a plateau rule (for example, stop after 3 rounds in a row
   with no accepted change).

Show the frame to the user and get a yes. Changing the rubric mid-climb resets the baseline.

## Phase B: calibrate the judge

Skip this only for a deterministic metric. A judge you have not calibrated produces numbers, not a score.

1. **Noise floor.** Score the unchanged baseline 3 times with fresh judges. The spread is the noise
   floor. A gain smaller than it is not a gain.
2. **Range.** Score the reference (it should land near the top) and a deliberately damaged copy (it
   should land low). If the judge cannot separate them by several noise floors, rewrite the anchors and
   calibrate again.
3. Record the baseline as the mean of the three scores.

## Phase C: climb

Checkpoint the starting state in version control. Then, each round:

1. **Pick the target.** Read the last judge's lowest criterion and its stated reasons. Work on that.
2. **Make one focused change.** One idea per round, so a score change can be traced to a cause. If you can
   run work in parallel, try 2 to 4 different candidates for the same criterion and keep the best one
   (a small beam). Each candidate starts from the current best, not from another candidate.
3. **Check guardrails.** Any failure: revert, log it, next round.
4. **Capture evidence** exactly as framed.
5. **Judge blind.** A fresh judge each time, given the rubric, references and evidence only. It does not
   see the previous score, the change description or the round number, because each of those pulls the
   score toward a story.
6. **Decide.** Accept if the score beats the current best by more than the noise floor and no criterion
   fell by more than the noise floor. Otherwise revert. Checkpoint every accepted change.
7. **Log one row**: round, change, per-criterion scores, total, accepted or reverted, and why.

Tell the user the score line every few rounds (for example, 6.1, 6.4, 6.4, 7.0) so they can stop you.

## Council (optional, for high stakes or a stubborn plateau)

Score each round with 3 judges, on different model families if you have them, and use the median. When
the judges disagree by more than twice the noise floor, read their reasons before accepting: the
disagreement usually points at a vague anchor.

## Guarding against gaming

A loop optimises what is measured, not what was meant. Watch for changes that move the score while
making the thing worse: text that flatters the rubric's words, hidden elements, a screenshot cropped to
the good part, a test weakened to pass. Every 5 accepted rounds, and at the end, have one judge that has
never seen the rubric compare the baseline and the current best side by side and say which is better and
why. If it disagrees with the climb, stop and show the user.

## Phase D: confirm and hand back

1. Re-score the best version 3 times with fresh judges. The climb counts only if its mean beats the
   baseline mean by more than the noise floor.
2. Show the user baseline and final evidence side by side, the score line, and the log.
3. Leave the accepted changes as checkpoints the user can read one by one, and say what the next round
   would have tried.

## If you cannot run separate agents

Judge in a separate pass that starts from only the rubric, references and evidence. Write the score
before you re-read the change you made. Calibrate harder: 5 baseline scores instead of 3, because a judge
that shares your memory of the change is noisier. If you cannot view images, climb only on deterministic
metrics, and say so rather than judging screenshots you cannot see.

## It is working if

The final confirmed mean beats the baseline mean by more than the noise floor, every guardrail passes,
the never-saw-the-rubric judge prefers the final version, and the log explains each accepted step with a
change a reader can find in the checkpoints.
