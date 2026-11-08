# The triage check

Run it twice: on the draft report before you send it, and on the tracker after you write. Record each
step as `PASS` or `FAIL: <reason>`. There is no skip. A step you cannot run is a `FAIL` with the reason,
and the report says so in its first lines.

## 1. The revision exists

- The report names one full commit id per repository.
- `git cat-file -e <rev>^{commit}` (or your version control's equivalent) succeeds for each.
- If the fetch failed, the report and every comment say "may be stale".

`FAIL` if no revision is named, if it does not resolve, or if a stale revision is not labelled. With no
revision, every verdict must be `UNCLEAR`; any other verdict also fails.

## 2. Every verdict has evidence

Build a table from the draft: ticket, verdict, citations.

- Every verdict other than `UNCLEAR` and `NEEDS-DECISION` has at least one `path:line` (or, for `OBE`
  and `DUPLICATE`, a commit id or ticket key).
- `NEEDS-DECISION` names its question. `UNCLEAR` names what is missing.
- `DONE-ON-MAIN` says separately whether it is deployed, or says that deployment was not checked.

`FAIL` for each row that is missing what its verdict requires. Fix it by finding the evidence or by
changing the verdict to `UNCLEAR`.

## 3. Every citation is real

For each `path:line` in the report and the comments, open it at the pinned revision
(`git show <rev>:<path>`) and read the cited line and a few around it.

- The file exists at that revision.
- The line says what the report claims it says.
- Each commit id cited resolves and touches what the report says it touches.

`FAIL` for each citation that is missing, off by enough to mislead, or that does not support the claim.
Citations from parallel researchers get the same treatment.

## 4. Every claim is labelled

List each claim the ticket makes (diagnosis, cause, proposed fix, each option).

- Each has exactly one label: `confirmed`, `real bug, wrong cause`, or `wrong`.
- Each mechanism you proposed that logs, data or a reproduction has not confirmed is labelled
  `hypothesis, not verified`, with what would confirm it.
- Each symptom the ticket reports is explained by a claim or a hypothesis, or listed as unexplained.

`FAIL` for each unlabelled claim and each symptom that is neither explained nor listed.

## 5. The tracker says what you meant

After the writes, read each ticket back from the tracker (not from your own copy of the text).

- The triage comment is present once, and its verdict, revision and recommendation match the report.
- Each link you added exists once, with the direction you intended.
- Existing labels are all still there, plus the triage label if the project uses one.
- No ticket outside the triaged set changed. Compare its last-updated time or history with the start
  of the triage.

`FAIL` if the read-back fails, a write is missing or duplicated, a label was dropped, or a ticket outside
the set changed. A failed read-back is not a pass: say the write is unconfirmed.

## Output

End the report with the five results, one line each. If any is `FAIL`, say what you did about it or what
the user needs to do.
