# Batch check

Run checks 1 to 5 before handing the pull request to the user, and check 6 after the batch merges. Each
check states what passes. Anything else fails, including a command that errors or a check you cannot
run. Report a failed check by number with its output; never report the batch as ready over one.

The commands assume git. If the project uses another version control system, write the equivalent query
for each check before step 3 of the skill. A check with no equivalent is reported as not verified, which
counts as failed.

Set these first, in the batch working copy:

- `BASE`: the base branch as fetched, for example `origin/main`.
- `BATCH`: the batch branch, for example `batch-2026-11-08-grid-polish`.
- The ticket list: every key in the pull request title, and each key's branch name.

## Prove the check can fail

Before trusting a pass, make one check fail on purpose. Add an empty commit to one ticket branch
(`git commit --allow-empty -m "<KEY>: probe"`), run check 2 and confirm it reports that ticket. Then
remove the probe (`git reset --hard HEAD~1` on that ticket branch) and run it again. A check you have
never seen fail is not yet a check.

## 1. History: only ticket merges on the batch

```
git log --first-parent --format="%H %P | %s" BASE..BATCH
```

Passes when every line has exactly two parent hashes (a merge), and each subject is either a merge of a
ticket branch naming exactly one key from the ticket list, or a merge of the base. Every key in the ticket
list appears in at least one merge subject. A ticket merged again after a fix appears more than once,
which is fine.

Fails on a line with one parent (a commit made directly on the batch, or a fast-forward that skipped
`--no-ff`), a merge naming a key not in the pull request, or a ticket with no merge. The one allowed
exception is a ticket dropped by revert: its original merge and the revert commit may stay, and only when
the pull request names both under dropped tickets.

## 2. Every ticket branch is fully merged

For each ticket in the pull request:

```
git merge-base --is-ancestor <ticket-branch> BATCH
```

The command prints nothing; read its exit status. Passes when it is `0` for every ticket. A `1` means the branch has commits the batch does not, usually
a review fix that was never merged back. For a ticket dropped by rebuilding, the same command must exit
`1`.

## 3. Each ticket's commits carry only its own key

For each ticket merge commit `M` from check 1:

```
git log --format=%s M^1..M^2
```

Passes when every subject contains that ticket's key and no other key from the ticket list. Fails on a
commit with no key or with a second ticket's key.

## 4. The pull request lists every ticket with evidence

The description follows this shape:

```
## Tickets
- [x] ABC-123 Fix sort order on the grid
  - Acceptance: clicking the date header sorts newest first
  - Evidence: test "sorts by date desc" passed in the batch run (see Test run)
- [x] ABC-127 Trim whitespace in search
  - Acceptance: a query with trailing spaces returns the same rows as without
  - Evidence: search.test file, case "trailing spaces", passed; manual query output pasted below

## Dropped
- ABC-130 Export filename: rebuilt out of the batch, branch abc-130-export-name kept. Reason: needs a
  naming decision.

## Test run
- Command: <the exact command>
- Result: exit 0; packages covered: <list>

## Review
- Fresh-context review over the batch diff: <n> findings, each fixed on its owning ticket's branch.
```

Passes when:

- the keys in the title, the keys under Tickets and the keys from check 1 are the same set;
- every ticket line is ticked `[x]`;
- every Evidence line names something another person can re-check: a test name and the run it passed
  in, a command with its output, a file and line, a screenshot path. "Works", "verified" or "tested"
  alone fails.

## 5. The one test run covers every touched package

List the changed files and the changed tests:

```
git diff --name-only BASE...BATCH
```

Map each changed file to its package (the nearest folder holding the project's package manifest). Then
open the saved output of the single test run from step 6 of the skill.

Passes when the recorded exit status is `0`, every touched package appears in the output with its tests,
typecheck and lint passing, and every changed test file appears in the output as run. Fails on a package
or test file missing from the output, a file reporting zero tests, or an exit status that was never
recorded. Output that was piped through a filter before saving does not count, because the filter's exit
status replaced the run's.

## 6. Nothing left behind

After the batch merges and cleanup runs:

```
git worktree list
git branch --list "batch-*"
git branch --list "<key>-*"          (once per ticket, lowercase key)
git ls-remote --heads origin "batch-*"
```

Passes when the working copy list holds only the main checkout and any copies unrelated to this batch,
no batch branch exists locally or on the remote, and the only ticket branches left are dropped tickets'
branches named in the pull request. Fails on anything else from this batch.
