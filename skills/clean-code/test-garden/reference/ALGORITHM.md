# Bookkeeping tool algorithm

Implement this to satisfy [CONTRACT.md](CONTRACT.md). Where the two seem to disagree, CONTRACT.md wins and
the disagreement is a bug to report.

## Common steps

1. Parse the arguments. On any usage problem, print `{"t":"error","line":0,"reason":"usage"}`, exit 2.
2. Read every input line (CONTRACT.md "Input lines"). For each line, in order, stop at the first failure
   and print one error record with that line's number, then exit 2:
   1. Not valid UTF-8 (a byte order mark included) or not valid JSON: `bad_json`.
   2. Not an object: `not_object`.
   3. `t` absent, not a string, or not accepted by this subcommand or check: `unknown_type`.
   4. For each field of that type, in the order CONTRACT.md lists them: absent is `missing_field`;
      present with the wrong type, or an `enum` value outside its list, is `bad_field`.
3. Only when every line passed step 2, run the semantic checks for the subcommand (below) in input
   order. The first failing record decides the error, using that record's line number. Exit 2. A
   `bad_field` on line 9 therefore wins over a `duplicate` on line 3. When one record fails several
   checks, the check listed first for its type wins.

**JSON details.** Any JSON number syntax is accepted (`1e2` is the int 100). If an object repeats a key,
the last value counts. `NaN` and `Infinity` are not JSON: `bad_json`.

**Letters and digits** below are ASCII only. Any other character is neither.
4. Compute and print the output. Exit as CONTRACT.md "Exit codes" says.

**Byte order.** "Sorted" always means sorted by the UTF-8 bytes of the string, compared byte by byte,
a shorter prefix first. Never use a locale-aware comparison: `Z.ts` sorts before `a.ts`.

**Floor division.** `a / b` below always means the largest integer not above the exact quotient, with
`a` and `b` non-negative and `b` above 0. Compute products before dividing, in exact integer arithmetic.

## verify --check coverage

Semantic checks, each record in input order: a second `file` with the same `path` is `duplicate`; a
second `test` with the same `id` is `duplicate`; a second `except` with the same `path` is `duplicate`;
a second `broken` with the same `path` is `duplicate`; a `test`, `except` or `broken` whose `path` has no
`file` record is `unknown_path`.

For each file in path order, `listed` is the number of `test` records with its path. Print at most one
finding per file, the first that applies:
1. The file has a `broken` record: `broken` with `path`.
2. `listed` is below `declared` and the file has an `except` record: `excepted` with `path`,
   `declared`, `listed`, `reason`.
3. `listed` is 0 and `declared` is above 0: `never_ran` with `path`, `declared`.
4. `listed` is below `declared`: `shortfall` with `path`, `declared`, `listed`, `missing`
   (`declared - listed`).

A file listing more tests than it declares (a parametrised test, a loop) is not a finding.

Print `summary`: `files` (file records), `declared` (sum over files), `listed` (test records), `missing`
(sum of `declared - listed` over `never_ran` and `shortfall` findings), `excepted` (`excepted`
findings), `problems` (`broken`, `never_ran` and `shortfall` findings). Exit 1 if `problems` is above 0.

## verify --check reports

Semantic checks: a second `report` with the same `id` is `duplicate`; a `sample` whose `report` has no
`report` record is `unknown_report`.

For each report in id order, `got` is the number of `sample` records naming it and `sum_ms` the sum of
their `ms`. Print, in this order:
1. `count` with `report`, `expected` (its `tests`), `got`, when `got` differs from `tests`.
2. `time` with `report`, `total_ms` (its `ms`), `sum_ms`, when `sum_ms * 100 < ms` or
   `sum_ms > ms * 64`. The first catches seconds read as milliseconds; the second catches the reverse,
   with room for up to 64 parallel workers.

Print `summary`: `reports`, `samples` (sample records), `problems`. Exit 1 if `problems` is above 0.

## rank

Semantic checks: more than one `window` is `duplicate`, on the second window's line; no `window`, or `days` equal to 0, is
`no_window` with line 0 if absent, else the window's line; a second `job`, `run` or `test` with the same
`id` is `duplicate`; a second `first` for the same `test` is `duplicate`; a second `ignore` with the same
`id` is `duplicate`; a `run` whose `job` has no `job` record is `unknown_job`; a `sample` or `filetime`
whose `run` has no `run` record is `unknown_run`; a `first` whose `test` has no `test` record is
`unknown_test`; a `filetime` whose `path` is the `path` of no `test` record is `unknown_path`; a second
`filetime` with the same `run` and `path` is `duplicate`. Checks run in this order over the whole input:
window count, then each record in input order. A `sample` naming a test with no `test` record is not an
error; it is an orphan.

**Qualifying runs.** Only runs with `attempt` equal to 1 count. Ignore samples and filetimes on any other
run completely: a rerun of failed shards holds only those shards and would inflate their share.

**Ranked items.** Each `test` record is an item of kind `test` with id `id`. Each distinct `path` that has
at least one `filetime` on a qualifying run is an item of kind `file` with id `path`.

**Measurements of an item**, from qualifying runs only:
- A test's measurements are its samples whose `status` is not `skip`: one `(run, ms)` pair each.
- A file's measurements are one pair per `filetime` record: `(run, overhead)`, where overhead is the
  filetime's `ms` minus the sum of `ms` over that run's non-skip samples whose test has that `path`, or 0
  if that is negative.

An item's `seen runs` is the set of distinct runs in its measurements. If it is empty, a test item is
`unseen` and a file item cannot occur; unseen items are not printed.

**First day** of an item: for a test, the smaller of its `first` record's `day` (if any) and the
earliest `day` among its seen runs; for a file, the earliest `day` among its seen runs.

For each item with measurements:
1. `n` is the number of measurements; `sum` the sum of their ms; sort the ms values ascending.
2. `mean` = `sum / n`. `median` is the value at zero-based index `(n - 1) / 2`. `p90` is the value at
   index `(9n + 9) / 10 - 1`, which is the nearest-rank 90th percentile (it equals `max` below 10
   measurements). `max` is the last value.
3. For each job `j`, in id order: `sampled` is the number of qualifying runs of `j` whose `day` is at
   least the item's first day; `seen` is the number of its seen runs belonging to `j`. When `sampled`
   is above 0, the job contributes `runs(j) * seen * 1000 / (sampled * days)`, floored per job.
   `exec_milli` is the sum of the contributions: executions per day, times 1000.
4. `cost_ms_day` = `sum * exec_milli / (n * 1000)`.
5. `basis`: the distinct `basis` values of the jobs with `seen` above 0, sorted, joined with `+`.
6. `flags`, in this order: `ignored` if an `ignore` record has this id; `low_n` if `n` is below 5;
   `thin` if the total of `seen` over all jobs is below 3.

Print `slow` records with `id`, `kind`, `cost_ms_day`, `exec_milli`, `n`, `mean`, `median`, `p90`,
`max`, `basis`, `flags`, sorted by `cost_ms_day` descending, then `mean` descending, then `kind` (`file`
before `test`), then `id`.

Print `summary`: `tests` (test records), `ranked` (printed items of kind `test`), `files` (printed items
of kind `file`), `unseen`, `orphans` (distinct `test` values on qualifying-run samples of any status
that name no `test` record), `ids_unstable` (true when `orphans * 20` is above the number of distinct
`test` values on qualifying-run samples of any status), `samples` (sample records on qualifying runs), `runs` (qualifying runs).

## flaky

Semantic checks: window as in `rank`; a second `job` with the same `id` is `duplicate`; an `outcome`
whose `job` has no `job` record is `unknown_job`.

1. Drop outcomes with status `skip`. Group the rest by `(test, commit)` into pairs.
2. Classify each pair:
   - **event** when it has a `flaky` outcome, or both a `pass` and a `fail`. Its type is
     `contradicted` when it has both `pass` and `fail`, otherwise `retry_passed`.
   - **red** when every outcome is `fail` and there are at least two.
   - **single_fail** when it is one `fail` outcome.
   - otherwise clean.
3. **Bursts.** For each commit, `observed` is the number of pairs with that commit and `events` the
   number of event pairs. The commit is a burst when `events` is at least the larger of `--burst-min`
   and `(observed * burst-bp + 9999) / 10000` (the share rounded up). Pairs of burst commits leave every
   later step and count.
4. For each test with at least one event pair: `events` (its event pairs), `contradicted`,
   `retry_passed`, `observed` (its pairs), `rate_bp` = `events * 10000 / observed`. Each event pair costs
   the `ms` of one job: among the pair's `fail` and `flaky` outcomes, the job with the smallest id.
   `cost_ms_day` = (sum of its event costs) / `days`. `first_day` and `last_day` are the smallest and
   largest `day` over the non-skip outcomes of its event pairs.
5. Tests with `events` at least `--min-events` print as `flaky` with `id`, `cost_ms_day`, `events`,
   `contradicted`, `retry_passed`, `observed`, `rate_bp`, `first_day`, `last_day`, sorted by
   `cost_ms_day` descending, then `events` descending, then `id`. Tests with fewer events count as
   `below_min`.
6. Print `red` for each test with at least one red pair, `id` and `commits` (its red pairs), sorted by
   `commits` descending then `id`.
7. Print `burst` for each burst commit with `commit`, `events`, `observed`, sorted by `commit`.
8. Print `summary`: `outcomes` (outcome records, skips included), `pairs` (before burst removal),
   `events` (event pairs outside bursts), `burst_commits`, `flaky` (printed), `below_min`, `red`
   (tests printed as red), `single_fail` (single_fail pairs outside bursts).

## verdict

Semantic checks: a second `test` with the same `id` is `duplicate`; a `baseline` or `mutant` whose `test`
has no `test` record is `unknown_test`; a second `baseline` for the same test is `duplicate`; a second
`mutant` with the same `test`, `kind` and `attempt` is `duplicate` when `kind` is `R`, `A` or `S`. Any
number of `C` and `B` records may share an attempt.

For each test, the decisive kind is `S` when `expects_error` is true, otherwise `A`. Records of the other
of `A` and `S` are ignored. Decide the class with the first rule that applies:

1. No baseline, or `green` below 2: blocked, reason `baseline`.
2. No `R` record with attempt 1: blocked, reason `no_probe`. If its result is `invalid`, `timeout` or
   `no_result`: blocked with that result as the reason. If it is `not_reached`, the class is
   `unreached`. If it is anything else but `reached`: blocked, reason `bad_result`.
3. No decisive record with attempt 1: blocked, reason `no_decisive`. Attempt 1 result `invalid`,
   `timeout` or `no_result`: blocked with that reason.
4. Attempt 1 `killed_marker`: killed.
5. Attempt 1 `killed`: with attempt 2 `killed` or `killed_marker`, killed; with attempt 2 `survived`,
   blocked, reason `unstable`; with no attempt 2, blocked, reason `no_rerun`.
6. Attempt 1 `survived`: with attempt 2 `survived`, the class is `cannot_fail`; with attempt 2 `killed`
   or `killed_marker`, blocked, reason `unstable`; with no attempt 2, blocked, reason `no_rerun`.
7. Any other decisive result in attempt 1 or 2 where rules 4 to 6 read it: blocked, reason
   `bad_result`.
8. Killed: `survivors` is the number of the test's `C` and `B` records, of any attempt, with result
   `survived`. Above 0: `weak`.
   Otherwise `ok`. (`killed`, `equivalent`, `none`, `invalid`, `timeout` and `no_result` value records
   never make a test weak.)

`proof` is `CONFIRMED` for `cannot_fail`, `unreached` and `weak`; `REFUTED` for `ok`; `BLOCKED` for
blocked. `reason` is empty except for blocked. `survivors` is 0 except for `weak`.

Print `verdict` records with `id`, `class`, `proof`, `reason`, `survivors`, sorted by `id`. Print
`summary`: `tests`, then the count of each class in the order `cannot_fail`, `unreached`, `weak`, `ok`,
`blocked`, then `by_reason` (blocked reasons and their counts, keys in byte order, `{}` when none).

## group

Semantic check: a second `helper` with the same `id` is `duplicate`.

**Normalised body.** Replace every run of the characters space, tab, LF, CR, form feed and vertical tab
with one space, then remove a leading and a trailing space.

**Tokens of a name.** Insert a boundary between a lowercase letter or digit and a following uppercase
letter, and between an uppercase letter and a following uppercase-then-lowercase pair (`XMLParser` gives
`XML Parser`). Split on every character that is not an ASCII letter or digit. Lower-case each piece.
Drop empty pieces.

**Stem.** Take the tokens of `name`. If there are two or more and the first is one of `make`, `create`,
`build`, `get`, `new`, `mock`, `fake`, `setup`, `with`, drop the first. Join the rest with nothing
between them. A name with no tokens has no stem.

1. **Same-body keys.** Group helpers whose normalised body is non-empty and identical. For each group
   with two or more members, the key is `same:` plus its smallest member id.
2. **Stem keys.** Group helpers by stem. Drop stems with one member. A stem with more than `--max-stem`
   members is a stop stem: record it and drop it. The key of each remaining stem is `stem:` plus the stem.
3. Each key's members, sorted, form a candidate. Sort candidates by key. Walking them in key order, drop
   any whose member list equals an earlier one. Then, in one pass over the list left after that, drop
   every candidate whose members are a strict subset of another candidate's members in that list.
4. Number the survivors in key order from `G0001` (four digits, padded with zeros; past 9999, the number
   as it is). Print each as `group` with `id`, `key`, `members`.
5. Print each stop stem as `stopstem` with `stem` and `helpers` (its member count), sorted by stem.
6. Print `summary`: `helpers`, `groups`, `stopstems`.
