# The report

Keep it to one screen and save it in the ledger folder as `report.md`. Take every number from tool
output: counts, ages, owners, oldest items, history and trend from `tally`; reuse counts from `reuse`;
baseline classes from `baseline`; coverage from `verify --check coverage`. Canary results come only from
the canary runs and never enter any other line. Show no comment text and no person's name.

## Header

```
Debt ledger: <repo>  commit <hash>  <date>   spec 1
Ledger: <folder in the repo> (committed: yes | no | unknown)   Work folder: <path outside the repo>
Since last run: <reused> reused, <redated> re-dated, <added> added, <removed> removed, <renamed> renamed | first run
Trend: comparable | not comparable (<reason>)
Coverage: items <coverage> over <files> files; baselines <coverage> over <n>   PASS | FAIL
Canaries: patterns <n> of <n> languages, baseline <n> of 8 planted changes   PASS | FAIL
Ages: from blame committer date, lower bounds | unknown (<shallow clone | no version control>)
```

If any check failed, say first, above the header, that the run failed and which check.

## Headline

Three columns, never summed into one number, each with its change since the last run:

```
Markers      412  (+9)    TODO 301, FIXME 70, HACK 38, XXX 3
Inline       233  (-4)    rule-specific suppressions
Blanket       61  (+6)    suppressions naming no rule
```

Then one block per baseline source:

```
eslint-suppressions.json  violations  1,120 -> 1,090  (gross in 41, gross out 71)
  out: fixed 18 (inferred, upper bound), moved inline 30, moved to blanket 6, config-changed 9 (proxy),
       deleted with file 8
  in:  grew 25, added 16
```

Add "fixed unreliable: the linter or a preset changed version" when `fixed_reliable` is false. For
`pairs` sources write "file and rule pairs" instead of "violations". List rule-offs (`ruleoff` records)
under their source, with any that are new since the last run marked.

## Ages and owners

The six age buckets in one line, with "lower bounds" beside them. Then the top 10 owners by item count
(`owners`), which are team handles, ticket keys, package folders or top-level folders only.

## Oldest 20

`path:line  kind  rule  days  owner`, from the `oldest` records. Note that identical items in one file
share their dates as a group: which of two identical lines is older is not known.

## Footer

- Patterns: languages covered, pattern-set hash, and any row added this run.
- Out of scope: excluded paths and loose-hit exclusions, counted by reason.
- Before sharing the report outside the team, check that no path names a customer or a confidential
  project.
