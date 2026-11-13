# Measuring: audit, escape sample, canaries, known sites

Each part below has a tool command whose exit code decides it. Seeds are `<seed in jobs.jsonl>:<commit>:<round>:<part>`, so a re-run on new
code draws a fresh sample and the same run always draws the same one.

## Audit: is the scanner's family right?

1. Run `sample` with every site as an `item` whose `stratum` is its family, and a `quota` of 30 per
   family. Families under 30 sites are audited in full. On a re-run, draw a third of each quota from
   sites whose disposition was reused.
2. Give each sampled site to a reader in a fresh context, a cheaper model is enough, with the 40 lines
   around it, the trigger table from SCAN.md, the job's markers, and this brief:

   > Say which job this call does, if any, and write its family as `trigger:outer>terminal` from the
   > lists given: the trigger is where the call sits, the outer marker is the thing called, the terminal
   > is what finally does the work. Reply `not-a-site` if it does none of the jobs. Read the code; do
   > not trust names.

   Never show the reader the scanner's answer.
3. Run `audit` with the scanner's family as `scan` records and the reader's as `label` records. For each
   `disagree` record, the most capable model reads the source and rules `scanner` or `worker`; add the
   rulings and run `audit` again.
4. A ruling for `worker` is a scanner defect. Fix the scanner (or a sink, marker or conduit entry),
   rescan, rerun `close` and audit again with a new round in the seed. If `audit` still fails, the run
   fails.

**No fresh contexts?** Label the samples yourself, but the header's audit line says `NOT BLIND` and the
line FAILS: the same mind that wrote the scanner cannot audit it.

## Escape sample: what did the scan miss?

1. Strata: `nohit` (in-scope files with no hit for any job) and `hit` (files with at least one). Run
   `sample` with quotas of 200 and 100.
2. A reader on the mid or strongest tier reads each sampled file whole, with the job list, the scan's
   sites for that file, and this brief:

   > List every place in this file that does one of these jobs and is not in the list of found sites,
   > with its line. A wrapper around one of the jobs counts. Do not list comments, strings or tests.

3. For every file with a real miss (the most capable model confirms each), write one `escape` record per
   job, then fix the cause (a missing sink, a dependency left unclassified, an unresolvable call shape),
   rescan, and redraw with the next round. At most two rounds.
4. Run `census` with `stratum` records holding each stratum's population and how many files were read,
   and the last round's `escape` records. `census` turns them into each job's bound ("at most N sites
   missed, 95%"), widens the percentage into a range, and fails the run if a `closed` job still has an
   escape after the last round.

When a percentage is withheld for `range`, say in the report how many more files the sample would need.

## Canaries: does the pipeline work end to end?

Canaries prove the mechanics (resolution, closure, families, the audit), not recall of unknown shapes:
call them pipeline canaries in the report. Recall comes from the escape bound and the known sites.

After the sinks are frozen, run `sample` with every site as an item, stratum = job, quota 1 per recipe,
seed part `canary`. For each picked site, write a copy of its enclosing function into a canary file in
the work folder overlay, at a plausible path, mutated by one recipe:

| Recipe | Mutation | Expected |
|---|---|---|
| alias | import the callee through a new barrel under another name | same family as the source site |
| wrapper | wrap the call in a new helper that returns it, called from two places in the source's context | two sites, one per caller, both with the source site's family |
| reference | pass the conduit by name instead of calling it inline | same family as the source site |
| rename | rename every local identifier | same family as the source site |
| negative | replace the callee with a same-named method on a new local class | no site |

Scan the repo plus the overlay, run `close`, and compare the canary files' sites with the expected
column using `verify --check scan` (case = recipe). Put canary sites, unlabelled, into the audit sample.
Canary sites never enter `census`, owners, or any count except the Canaries line.

## Known sites

If the user names sites they know of ("the three places that still use the old client"), each must be a
site, or `same_as` one, in the job and family the user expects. A missing one fails the run; name the
step that lost it (not scanned, unresolved, inside a conduit, wrong family).
