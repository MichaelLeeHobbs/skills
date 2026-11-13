# The report and the catalog

Keep the report under 150 lines and save it in the catalog folder as `report.md`. Take every number from
tool output: inventory lines from `verify --check coverage`, slow lines from `rank`, flaky lines from
`flaky`, weak lines from `verdict`, groups from `group`. Canary ids never appear outside the Canaries
line.

## Header

```
Test garden: <repo>  commit <hash>  <date>
Catalog: <folder in the repo>   Work folder: <path outside the repo>
Lanes: slow <run | not run | FAILED>  flaky <...>  weak <...>  dupes <...>
Inventory: <listed> tests in <files> files; never ran <n>, shortfall <n>, broken <n>, excepted <n>   PASS | FAIL
Evidence: rung <a-d>, window <days> days, <runs> runs from <jobs> jobs, partial: yes | no, retry results visible: yes | no
Slow: <ranked> tests and <files> file rows ranked, <unseen> unseen, <orphans> orphans (ids unstable: yes | no)
Flaky: <flaky> ranked, <below_min> below <min> events, <red> red, <burst> outage commits
Weak: <judged> judged of <candidates> (<cut> cut by budget, <unmapped> unmapped): cannot_fail <n>, unreached <n>, weak <n>, ok <n>, blocked <n>
Dupes: <groups> groups, <judged> judged: <n> VARIANT, <n> SAME, <n> DIFFERENT; copied setup blocks not covered
Canaries: <n> of <m> behaved as planted   PASS | FAIL
Since last run: <changes> | first run | not comparable (<why>)
```

If any line says FAIL or FAILED, say first, above the header, that the run failed and which check.

## Do this first

Up to five items across the lanes, largest measured saving first, each one line with its number: a slow
test or file row (`cost_ms_day` as test-seconds per day), a flaky test (`cost_ms_day` as job-seconds per
day of reruns), a `cannot_fail` or `unreached` test (it costs its slow cost and protects nothing).

## Slow table

The top 30 `slow` rows: rank, id, kind, test-seconds per day, executions per day (`exec_milli / 1000`),
`n`, mean, median, p90, basis, flags. Ignored rows go in a short list under it with their reason and
review date. Say once that cost is machine time, not CI wall time.

## Flaky table

Every `flaky` row: id, job-seconds per day, events, contradicted, retry_passed, observed commits, rate
(`rate_bp / 100` percent), first and last day. Add a suggested cause from reading the test, marked as a
suggestion, with the write-tests trap title and number that fits (for example "5.1 Sleeping instead of
waiting for a condition", "4.6 Hand-assigned ports"). Then the `red` list (broken, not flaky) and the
`burst` commits (outages).

## Weak table

Every `cannot_fail` and `unreached` test: id, target, proof, and the fix as a trap title and number.
`weak`: the count and the 10 with the highest slow cost. Blocked: the count per reason. The opt-in
sample, if run: one line, "<n> of 50 untold tests were cannot_fail".

## Dupes

For each judged group: members with importer counts, verdicts, the diff (run or predicted) and the copy
to keep.

## Catalog

A folder inside the target repo: the folder your agent keeps project configuration in, with a
`test-garden/` folder under it, or `.test-garden/` at the repo root if your agent has none. Use the
same folder every run. The skill writes this folder and nothing else in the repo, and never commits.

| File | Content | Written by |
|---|---|---|
| `report.md` | the last report | each run, replaced |
| `history.jsonl` | one line per run, sorted by date | each run, one line appended |
| `ignore.jsonl` | `{"id":..., "reason":..., "until":"YYYY-MM-DD"}` per accepted slow test | the user only; read every run, never rewritten |

A `history.jsonl` line holds: `date`, `commit`, `rung`, `window_days`, `runner` (`ci`, or a label for
the machine that ran local timings), `lanes`, the coverage summary counts, `slow_total_ms_day` (sum of
`cost_ms_day` over ranked tests), `slow_top10` (id and `cost_ms_day`), `flaky_events`, `flaky_tests`,
`failed_runs` and `runs` from the CI run list, the `verdict` summary counts and the dupes counts.

**Since last run.** Compare with the last history line only when `rung`, `window_days` and `runner`
match; otherwise print "not comparable" with the field that differs. Report each top-10 slow test that
left the table as fixed (still in the inventory) or deleted (gone from it).

Propose new `ignore.jsonl` entries in the report; never write them. Nothing else is kept: no verdicts,
since every run measures again, and never the built tool, reports, samples or mutant copies.
