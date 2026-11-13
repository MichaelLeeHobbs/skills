# Timings and flake evidence

## Pick the evidence rung

Test each rung in order and use the first that works. Write the rung in the report header.

| Rung | Test that it works | Durations from | Executions per day from | `job` basis |
|---|---|---|---|---|
| a | you can list CI runs and download their test reports | CI reports | CI run list | `ci` |
| b | you can list CI runs but not download reports | local runs | CI run list | `local` |
| c | no CI access, the user states runs per day per job | local runs | the user | `user` |
| d | none of the above | local runs | unknown | none |

On rung d, print durations only (the `mean`, `median` and `p90` columns, from `rank` with one job of
`runs` 1 and a window of 1 day), title the table "duration only, frequency unknown", and never call it a
cost. Never assume a frequency.

## The window and qualifying runs

The window is the last 14 days, or the CI provider's report retention if shorter. For each CI job, a
qualifying run is attempt 1 of a run that finished, was not skipped and was not cancelled. `runs` in the
`job` record is the count of qualifying runs in the window. A matrix or sharded job's shard reports from
one run are one run.

## Sampling (rung a)

Sample qualifying runs per job with a seeded random draw, seed = the recorded commit id, so a re-run on
the same commit samples the same runs. Take 30 runs per job, or all if fewer, and at most 300 reports in
total; trim the jobs with the most runs first. On a rate limit, stop downloading, rank what you have,
and mark the lane partial in the header.

Record one `run` line per sampled run: `day` is the number of whole days since the window started,
`attempt` is 1.

## Flatten reports into lines

Read each report with the language's XML or JSON parser, never by pattern matching. For each report:
- one `report` line with the report's own declared test count and total time (sum them over the suites
  in one file);
- one `sample` line per test case: `test` is the id exactly as the inventory spells it (map the
  report's class and name to the listed id; a case that maps to nothing keeps its own name and becomes
  an orphan), `ms` the duration converted to whole milliseconds, rounding half up, `status` one of
  `pass`, `fail`, `skip`, `flaky`;
- one `filetime` line per test file when the format gives a per-file time.

Read the format's time unit from its documentation: JUnit XML gives seconds, several runners' JSON give
milliseconds. Run `verify --check reports` on every report before `rank`. A `count` problem means the
flattening lost or invented cases; a `time` problem means a unit error. Fix the flattening and re-run;
never drop the report.

## First day and ignore list

For each test, `first` is the day its file was added according to version control (day 0 if before the
window). Without it, a new test's share of runs reads too low.

Pass each id in the catalog's `ignore.jsonl` whose review date has not passed as an `ignore` line. Ignored
rows stay ranked with the `ignored` flag; the report lists them apart.

## Local runs (rungs b, c, d)

Run the full suite `max(1, min(5, floor(30 / suite minutes)))` times, serially, with the runner's default
parallelism, in the work copy. When there are two or more runs, drop the first: it is the cold one.
Record each run as a `run` of one job named `local`, whose `runs` is the CI run-list count of the job
that runs the full suite (rung b) or the user's runs per day times the window days (rung c).

## Reading the slow table

`cost_ms_day` is the measured mean times executions per day: machine time, not CI wall time. `low_n`
means fewer than 5 measurements; `thin` means the test was seen in fewer than 3 sampled runs, so its
frequency is uncertain. Show both flags. File rows are setup and teardown time the tests in that file
share; they are often the cheapest win.

## Flaky evidence (rung a only)

1. From the run list, find commits in the window where a job attempt failed and a later attempt, or
   another run on the same commit, passed. Take the 100 most recent.
2. Download every attempt's reports for those runs. Also take every `flaky` status from the slow sample.
3. Flatten to `outcome` lines (test, commit, job, run, attempt, day, status) and `job` lines with each
   job's mean duration over its qualifying runs.
4. Run `flaky`. `burst` commits are outages (many tests failing at once); list them apart. `red` tests
   failed on every attempt of a commit: broken, not flaky.

Every count is a lower bound: only sampled commits were read, and retries the CI hides are invisible.
Say whether the reports carried retry results.

## Confirming locally

For the top suspects, or the suspects the user names when there is no CI history, run the single test
20 times in a row in the work copy. Seeing both a pass and a fail CONFIRMS it. Twenty passes is BLOCKED,
reported as "not reproduced in 20 isolated runs: if it fails more often than about 1 run in 7 we would
probably have seen it". Isolated runs miss flakes that depend on test order; say the runs were isolated.
Local reruns never feed the `flaky` ranking, which uses CI outcomes only.
