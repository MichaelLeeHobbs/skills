# The report

Keep it under 150 lines and save it in the catalog folder as `report.md`. Everything else goes in the
appendix. Take every number from tool output or the run tables, never from memory or a worker's summary:
coverage lines from the `verify --check coverage` summary; rows, exclusions, slices, spend and the jobs
metric from `tally`; the since-last-run line from `reuse`; accepted, out-of-scope and reopened counts
from the `accepted` summary; executed groups and canaries from the run
tables. Canary rows never enter `tally`, groups or decisions.

## Header

```
Reinvention audit: <package>  commit <hash>  <date>
Catalog: <folder in the repo>   Work folder: <path outside the repo>
Since last run: <reused> reused, <changed> changed, <added> added, <removed> removed | first run
Coverage: <coverage> over <files> files (<adjusted> adjusted: <reasons>)   PASS | FAIL
Rows: <total> (<by kind>; <private> private)   Excluded: <total> (<by reason>)
Slices: <done> done, <blocked> blocked
Groups: <judged> judged of <candidates> (rest cut by priority); residuals judged <n> of <m>
Spend: $<total> of $<cap> cap (measured | estimated from tokens)
Canaries: <n> of 4 behaved as planted   PASS | FAIL
Executed: <n> of 10 top groups   Network off: yes | no
Jobs implemented 2+ times: <n> (last run: <n> | first run); <a> accepted, <o> out of scope, reopened <r>
```

`<n>` is `tally`'s `reinvented`, which leaves out closed groups. Without `accepted.jsonl`, end the line
after the parenthesis.

If any line says FAIL, say first, above the header, that the run failed and which check.

## Reopened groups

A reopened group is open again: it ranks, runs and enters the decision list like any other group. Mark
it wherever it appears, from its `reopened` records:

```
G7  reopened: accepted.jsonl line 12 (G0041, out-of-scope); added c.ts:9:fmt; edited a.ts:4:fmt; gone none
```

## Decision list

One numbered item per disagreement across a job family, not per group:

```
1. Empty date. "-" (4 copies, 31 importers) vs "" (2 copies, 3 importers) vs "Invalid Date" (1, 2).
   Default: "-".
2. Time zone for timestamps. Local (5 copies) vs fixed product zone (2) vs UTC slice (1).
   Default: fixed product zone, because <reason from the code or the product>.
```

The default follows the canonical rule in [JUDGE.md](JUDGE.md) unless the run shows the canonical copy
mishandling an input the others handle.

## Top 10 groups

Each one:

```
G3  timestamp -> text, date-only        6 members, 4 VARIANT, 1 SAME, 1 DIFFERENT (regrouped)
  members:  features/a/utils/format.ts:12 formatDate     exported  14 importers  [canonical]
            features/b/ReadinessPage.tsx:26 formatDate   private    0 importers
            ...
  output      a.formatDate      b.formatDate     c.formatDay      (run in UTC | product zone)
  null        "-"   run         ""    run         throws  run
  "garbage"   "Invalid Date" run ...
  if merged onto a.formatDate: b shows "-" where it showed "" for empty dates (3 screens import b).
  adapter:   c is a grid cell formatter; call as ({ value }) => formatDate(value).
```

"If merged" lines come from the run cells that differ, not from prose. A predicted cell is marked
predicted and never supports an "if merged" line on its own.

## Groups 11 to 30

One line each, in this format:

```
G14  byte count -> text  3 members  2 VARIANT  canonical lib/format.ts:4 formatBytes  differs: zero, units cap
```

## Prevention drafts

Drafts for the user to apply. The skill edits nothing.

- **Lint rule**, ready to paste, that flags a new declaration with a confirmed name outside the canonical
  file. Write it for the linter the repo already uses, with the canonical import path in the message.
- **Catalog lines** for the repo's agent context file, one per canonical function: signature plus one
  line of behaviour, for example ``formatBytes(n: number): string  binary units to TB, "0 B" for 0``.
  Mark them valid only once the decision list is settled.
- **The cause**, if the repo's agent context file or contributing guide tells contributors to keep
  helpers local to each feature or module: quote that line and draft the replacement.

## Appendix (catalog folder, not the report)

- Every group with its verdicts and tables (`verdicts.jsonl`).
- Removed since last run: the functions `reuse` reported removed, and any group they leave with one
  member, which is a resolved duplicate.
- Closed groups: each `closed` record with its line's reason.
- Unmatched `accepted.jsonl` lines. With an empty `present`, every copy is gone and the user may delete
  the line. Otherwise the group still exists but was not judged this run (cut by priority or the cap)
  or is no longer counted; keep the line.
- Draft lines: one per `draft` record, as a ready-to-paste `accepted.jsonl` line with the group ID,
  `members`, `hashes`, and `bucket` and `reason` left for the user to fill.
- Per-key unique hits: for each grouping key and optional source, how many confirmed groups only it
  found. A key that finds nothing unique over two runs is a candidate to drop.
- The domain mapping and its version.
