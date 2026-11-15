# Ledger and scorecard

## Where

Use `clean-code/` inside your agent's project configuration folder, or `.clean-code/` at the repo root
if your agent has none. If a `clean-code/` folder already exists in another folder at the repo root, use
that one; if two exist, stop and name both. The ledger is `clean-code/ledger.jsonl`: one line per skill
run, appended by the skill itself. The steward never writes a ledger line. It writes nothing at all
unless the user asks to save the scorecard (`clean-code/scorecard.md`).

## The record

Every clean-code skill appends one line at the end of every run, pass or fail:

```
{"skill":"find-reinvention","scope":"apps/web","at":"2026-11-15T14:02:00Z","commit":"<full hash>","check":"pass","degraded":false,"metric":"jobs_2plus","value":9,"comparable":"mode=full;defs=3","report":".clean-code/find-reinvention/apps/web/report.md"}
```

`commit` ends in `+dirty` when the tree had changes, and is `none` without version control. `check` is
`pass`, `partial` or `fail`. `degraded` is `false` or the one missing thing (`browser`,
`runtime-evidence`, `ci-history`, `build`, `parser`). `comparable` starts with `mode=full` or
`mode=degraded`, then the skill's own fields sorted by key. Order in the file does not matter.

## Building the tool's input

Feed the tool (CONTRACT.md) these records, each line written with a JSON serializer:

1. `now`: the current UTC time.
2. One `unit` per Survey row for an installed skill: skill, scope, evidence kind and due threshold from
   SKILLS.md, `applies` from the probe (or the user's override), `absent` naming each missing setup.
3. One `ledger` record per non-empty line of `ledger.jsonl`, with its text unchanged and its line number.
4. One `report` record per ledger line whose `report` is not `null`: whether the file exists, and the
   commit, headline value and run date its header prints.
5. One `git` record per ledger line whose commit is not `none`: whether the commit (without `+dirty`) is
   an ancestor of the current commit, and if so how many commits since then touch the scope's path
   (every commit for scope `.`). With git: `merge-base --is-ancestor` and `rev-list --count
   <commit>..HEAD -- <scope>`.

Read every input from the repo; never from memory or an earlier sitting.

## Status words

| Status | Means | Shown as |
|---|---|---|
| `unmeasured` | no valid ledger line for this unit | unmeasured |
| `failed` | the latest run failed | failed, last good value beside it |
| `unverified` | the report on disk does not match the record (`unchecked`, `missing`, `commit`, `value`, `date`) | unverified (reason) |
| `unproven` | the latest valid run is `partial`, degraded, or from a dirty tree | unproven (reason) |
| `needs_setup` | the Survey found setup missing and the unit has nothing better than the above | needs setup: what |
| `clean` | value 0 from a full, passing, verified, clean-tree run, no commit has touched the scope since, and (runtime) fewer days have passed than the threshold | clean |
| `was_clean` | a value of 0 that has since aged | was clean at `<short commit>`, N commits (or days) since |
| `measured` | everything else | the value and metric |

A degraded zero, a partial zero and a dirty-tree zero are never clean. "Last good" is the latest pass
from a full run on a clean tree, whether or not its report still matches.

## Trend

Only against the previous passing, full, clean-tree record of the same skill and scope whose commit is
an ancestor of the current commit, and only when the latest row is `clean`, `was_clean` or `measured`
with a known age. Show `down 3` or `up 2` or `same`; `new baseline` when there is no previous record;
`not comparable (key)` when the `comparable` strings differ, naming the first differing key. Never
compute a trend across a change of definitions, mode or window.

## Due

A row is due when it is applicable, nothing is missing from its setup, and one of these holds: it is
`unmeasured`, `unproven`, `unverified` or `failed`; its commit is unreachable (squashed, another branch,
no version control); a `source` unit has at least K commits touching its scope and its last valid run is
at least 7 days old; a `runtime` unit's last valid run is at least D days old. The ratio is commits over
K or days over D, so the two kinds rank on one scale. "Nothing is due" is a real state: say it, with the
date of the last commit touching any measured scope and the row nearest its threshold.

## Coverage

"Measured X of Y": Y counts installed, applicable units with a metric; X counts those that are `clean`,
`was_clean` or `measured`. Skills not in SKILLS.md, scopes not in the Survey, not-applicable units and
optimize-comments and optimize-docs never count. In a monorepo, print one coverage line per package
scope plus the repo scope `.`, then the total.

## Scorecard layout

```
Clean-code scorecard: from 14 lines through 2026-11-12T10:00:00Z (thresholds: defaults)
Measured 6 of 9 (repo 3 of 4; apps/web 2 of 3; apps/admin 1 of 2). Clean 1. Due 3. Needs setup 1.

Skill                       Scope       Status                  Value                 Trend          Last run    Due
find-reinvention            apps/web    measured                9 jobs_2plus          down 3         2026-11-01  0.16  L7
find-reinvention            apps/admin  unmeasured              -                     -              -           #1
debt-ledger                 .           measured                40 blanket            new baseline   2026-11-01  1.20 #2  L9
find-token-drift            apps/admin  clean                   0 drifted_values      same           2026-11-01  0.00  L11
asset-garden                .           was clean at a1b2c3d, 3 commits since        new baseline   2026-10-01  0.12  L4
find-dead-code              .           failed (last good 5)    -                     -              2026-11-10  #3  L12
theme-parity                .           needs setup: browser    4 clusters            -              2026-11-10  -  L13
my-custom-audit             .           not in SKILLS.md        3 things              new baseline   2026-11-10  -  L14

Read 14 lines: 8 shown, 1 duplicate, 4 superseded, 1 rejected (line 6: bad_field check).
```

Every row ends with its ledger line number (`L7`); a row without one is a check failure. `#n` is the
recommendation rank. A unit row the tool marks `unknown` shows "not in SKILLS.md" when no unit has
that skill, and "scope not surveyed" otherwise.

## Sharing the ledger

Draft this line for the user to add to the repo's `.gitattributes` (never add it yourself), so two
branches that both appended runs merge without a conflict:

```
clean-code/ledger.jsonl merge=union
```

Use the folder path the repo actually has (`.clean-code/ledger.jsonl` when that is the home). If the
ledger is tracked by version control but the reports are not, say in the Survey: "teammates' runs will
show unverified on other machines; commit the reports or keep the ledger local."
