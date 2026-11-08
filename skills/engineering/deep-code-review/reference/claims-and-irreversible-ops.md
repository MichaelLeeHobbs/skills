# Findings about claims and irreversible operations

Read this at verification time (step 4) when a finding rests on a claim someone made about the code, or
touches anything that deletes, disables or bulk-mutates data. It does not change the sweep. Reviewers
still read every file against the same rubric.

## Record what you reviewed

Write the revision into the report header: the commit for a tree review, the base and head commits for
a branch. A finding without a revision cannot be rechecked once the code moves, and "fixed since" is
unprovable without it.

## Treat a claim as a hypothesis

A card, a comment, a doc or a reviewer's summary that says "we require X" or "we skip Y" is a
hypothesis. Find the line that enforces it before you rely on it. Requirements nobody enforces are among
the most common real findings.

- Read the exact lines the claim cites. Paraphrase drifts.
- Look one hop past the named file. A claim naming one setup file usually reaches several callers.
- Report what the claim got wrong and what it missed. That is often where the real defect sits.

Example of the shape: a schema declared a field required, but a default filled it in before the
validation step ran, so the "required" check could never fire. The requirement had never existed.

## Ask "was this ever true?"

History answers questions reading cannot. Before reporting "X broke", check whether X ever worked.

- Search history for when a flag, field or call first appeared (a pickaxe search for the string).
- Find who last changed the exact lines, and read the predecessor of that commit.
- Compare a flag's introduction with its default. A feature whose enable flag and dry-run flag arrived
  in the same commit, both defaulted to the safe side, may never have run at all. That is a bigger
  finding than "it missed some rows".

## Repo evidence and deployed evidence are different levels

The code in the repository, a passing test, a green pipeline, a built artifact, the version actually
running, and behavior observed in its output each establish a different fact. A merged change proves
nothing about what is deployed. When a finding depends on what runs:

- Name the level of evidence you reached, in the same terms as the evidence ladder. A repository read
  is at most E4. Only observed runtime output is E5.
- Look for a runtime tell that distinguishes old code from new (a new field, a changed ordering, a
  count) before concluding the fix is live. "It deployed" is not a tell.
- If you cannot reach the runtime, say so and leave the finding at the level you did reach.

## Irreversible operations fail closed

For code that deletes, disables or bulk-mutates, check each of these. Any one missing is a finding.

- **Unknown state skips.** A missing timestamp means "I don't know", never "old enough to delete".
- **One gate per blast radius.** The reversible half and the irreversible half each have their own
  independently defaulted switch. Turning the first on must never arm the second.
- **The retention clock measures the right event.** Deleting on "last login" when the policy says "time
  since disabled" can collapse a two-year window to zero. Check the field the clock reads is the event
  the policy names, and that every path which causes that event also writes the field.
- **Stages that share state run in order.** When one stage writes what the next reads, settling them all
  in parallel lets the second read stale data. Sequence them.
- **A staleness floor.** An independent minimum age, separate from the main condition, so a freshly
  created row can never be caught.
- **Dry run by default.** Writing needs an explicit opt-in, and dependent rows are cleaned before the
  rows they depend on.

## A dry-run delta you cannot explain is a finding

When a dry run or candidate report exists, compare its output with the old behavior and explain every
difference. A safe new query that reports six candidates where the old one reported zero is either the
fix working or a false premise about the data. Until you can say which, it is a finding, not noise. If
you cannot see the output, report the premise as unverified rather than calling the change safe.

When a premise about the data turns out to be wrong, the fix needs both ends: correct the source, and
make the query refuse to trust the field alone, because historical rows stay wrong.

## Report the finding honestly

- Lead with what is true, including where the original claim was wrong.
- Separate confirmed from inferred, and show the evidence: the line, the commit, the count.
- For an irreversible operation, state which actions cannot be undone and what still needs runtime
  verification before anyone arms it.

## Check

Before the report goes out, confirm that its header names the revision reviewed, and that every finding
touching a claim or an irreversible operation states its evidence level and either cites the enforcing
line or says no such line exists. A finding that does neither goes back to step 4.
