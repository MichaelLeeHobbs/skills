# Judging candidate groups

## Two verdict axes

**Same job?** The judge reads source and gives each member one of:

- **SAME**: does the same job, and behaves the same on every input class in the table.
- **VARIANT**: does the same job, and behaves differently on at least one input class (empty, invalid,
  time zone, units, rounding, output shape). A superset is a VARIANT with a note saying which member does
  more.
- **DIFFERENT**: does another job, whatever its name or vocabulary.

**Shown by running it?** After step 6, each member's verdict gets one of:

- **CONFIRMED**: the side-by-side run produced the behaviour table the judge predicted.
- **REFUTED**: the run contradicted the prediction. Use the run's table; the judge was wrong.
- **BLOCKED**: not run, with the reason (needs framework setup, a closure, I/O, a clock the runtime cannot
  freeze). Keep the predicted table, marked predicted.

**Never launder a verdict.** BLOCKED ranks better than a soft CONFIRMED. A VARIANT nobody ran is BLOCKED,
never CONFIRMED. If you are tempted to write CONFIRMED without a run output in front of you, the verdict
is BLOCKED.

## Calibrate before judging

1. Build a calibration set from real functions only, never the canaries: two or three pairs from the
   largest groups whose answer you settle by reading both bodies yourself, and two pairs that share
   vocabulary but not the job (for example a byte formatter and a count formatter, or an absolute date
   formatter and a relative "3 days ago" formatter). The canaries stay unseen so they still test the
   judge.
2. Judge the set twice, each time with a fresh judge that sees only the brief and the set.
3. If any verdict differs between the two runs, or from the known answer, the brief is unclear. Rewrite
   it and judge the set twice again.
4. When both runs agree with the known answers, freeze the brief. Do not edit it for the rest of the run.
   A changed brief means calibrating again.

## Anchors, residuals and the canonical copy

- **Anchor** (what each member is judged against): the most typical member, the one whose behaviour most
  members share, preferring the most defensive one on bad input. Pick it from the rows before judging.
- **Residual**: members judged DIFFERENT from the anchor form a new group and are judged again the same
  way. Two copies that match each other but not an odd anchor still get compared.
- **Canonical** (what the report recommends keeping): an existing shared copy if one exists, else the
  member with the most importers, else the most defensive on the tricky inputs, else the one with tests.
  If the repo already depends on a library that does this job, say so next to the canonical copy.

## Judge brief

Give each judge call one group (or about ten small groups batched in one call) and this brief:

> You are given the full source of several functions, shuffled, and their manifest rows. Rows can be
> wrong; trust the source. The first function listed is the anchor. For every other function, give one
> verdict, SAME, VARIANT or DIFFERENT, against the anchor, with the line numbers that decide it. Then fill a
> behaviour table: one column per function, one row per input class (empty, invalid, the boundary
> cases for this job's domain, time zone or units), each cell the output you predict from the code.
> Do not guess from names. Do not mark SAME unless every cell matches. Reply as JSON lines: one
> `verdict` line per member with `group`, `member`, `anchor`, `verdict`, `lines`, then one `table` line.

Do not tell the judge which grouping key proposed the group or that canaries exist.

## Overlaps and conflicts

Before judging, merge any two groups that share two or more members if the merged group fits the cap
(25 members or 150 KB of source). For overlaps that would exceed the cap, record a `keep` pair for the
tool and give each shared member one home group: the higher-priority group. If two judgements give a
pair conflicting verdicts, judge that pair once more with both functions alone and keep that verdict.
