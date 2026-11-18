# Evidence and verdicts

Write every fact with its source: the tracker page or command you read it from and the date you read it,
or the commit hash and the lines. A fact without a source counts as missing.

## Issue state

Read the issue's current state from its tracker. Map it to one word:

| State | When |
|---|---|
| `open` | open, in progress, reopened, or in review |
| `fixed` | closed as done, fixed, resolved or completed |
| `wontfix` | closed as won't do, obsolete, invalid, or by design |
| `duplicate` | closed as a duplicate. Follow it to the issue it duplicates and use that issue's state, noting both |
| `not_found` | the tracker answers, and has no such issue |
| `unreachable` | the tracker did not answer, needs access you do not have, or you cannot tell which tracker it is |
| `none` | the marker carries no reference |

Trackers name their resolutions differently: map by meaning, and write the tracker's own word beside
yours. When the tracker links a closing change (a commit or pull request), record it.

## Written

The commit that introduced the comment's first line, from blame at the pinned commit, ignoring
whitespace and following moved lines. Use the repo's ignore-revs file if it has one. If blame lands on a
pure move or reformat commit, follow it back to the commit that wrote the text. Record the hash and the
committer date.

## Code since

The code the comment describes: the statement or block it sits on or above, or the symbol it names.
List the commits after Written that changed those lines, including a deletion or a move of the symbol.
Record the latest such commit, or `unchanged`. A change only to the comment itself does not count.

## Condition now

Read the current code for what the comment claims:
- `holds`: the workaround, missing case, limit or warning is still present in the code;
- `gone`: the workaround was removed, the missing case is handled, the named symbol no longer exists, or
  the code the comment sits on was rewritten so its claim no longer applies;
- `unknown`: the comment states no checkable condition, or checking it needs runtime facts.

Cite the lines. When the condition depends on another repo or a service, it is `unknown` unless you read
that source.

## Decision table

Take the first row that matches, top to bottom:

| # | Issue state | Condition now | Other | Verdict |
|---|---|---|---|---|
| 1 | `unreachable` or `not_found` | any | | Unproven (`tracker`) |
| 2 | `fixed` | `gone` | | Delete |
| 3 | `fixed` | `holds` | | Conflict |
| 4 | `fixed` | `unknown` | the closing change touched this file or the described code | Delete |
| 5 | `fixed` | `unknown` | | Unproven (`condition`) |
| 6 | `wontfix` | `holds` | | Rewrite |
| 7 | `wontfix` | `gone` or `unknown` | | Delete |
| 8 | `open` | `gone` | | Conflict |
| 9 | `open` | any | | Keep |
| 10 | `none` | `gone` | Code since is a commit, not `unchanged` | Delete |
| 11 | `none` | `gone` | | Unproven (`history`) |
| 12 | `none` | `holds` | the comment names a concrete problem or task | Link |
| 13 | `none` | `holds` | | Rewrite |
| 14 | `none` | `unknown` | | Unproven (`condition`) |

Without version control, Code since is unknown for every marker: row 4 needs a closing change that the
tracker itself links, and row 10 always falls through to row 11.

Notes on the rows:
- Row 3: the issue closed, but the code still shows the problem. Either the fix landed elsewhere and the comment is stale, or the issue was closed by
  mistake. Report both readings; do not pick one.
- Row 8: the code no longer shows the problem, but the issue is open. The issue may need closing, or the
  fix may be partial. Report both.
- Row 13 is a lasting constraint written as a TODO ("TODO: this must run before auth"). Rewrite it as a
  fact so nobody tries to "do" it.
- A Delete never removes code, only the comment.

## Canaries

Run these synthetic markers through the same table, in the same way as the real ones. Each must land on
its planted verdict:

| Canary | Issue state | Condition now | Other | Planted verdict |
|---|---|---|---|---|
| C1 | `fixed` | `gone` | | Delete |
| C2 | `fixed` | `holds` | | Conflict |
| C3 | `unreachable` | `gone` | Code since is a commit | Unproven |
| C4 | `none` | `gone` | Code since is `unchanged` | Unproven |
| C5 | `none` | `holds` | names no concrete task | Rewrite |
| C6 | `open` | `gone` | | Conflict |
| C7 | `duplicate` of a `fixed` issue | `unknown` | closing change touched this file | Delete |

## Recommendation for the repo

When the run finds markers on open issues that the repo's agents could pick up unasked, add one line to
the report suggesting the repo's agent context file say: "Do not act on a TODO or FIXME you were not asked
about; mention it instead." Never edit that file yourself.
