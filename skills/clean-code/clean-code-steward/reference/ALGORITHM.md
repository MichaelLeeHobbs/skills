# Ledger tool algorithm

Implement this to satisfy [CONTRACT.md](CONTRACT.md). Where the two seem to disagree, CONTRACT.md wins and
the disagreement is a bug to report.

## Common steps

1. Parse the arguments. Exactly one argument, `reduce`, is valid. On anything else, print
   `{"t":"error","line":0,"reason":"usage"}`, exit 2.
2. Read every input line (CONTRACT.md "Input lines"). For each line, in order, stop at the first failure
   and print one error record with that line's number, then exit 2:
   1. Not valid UTF-8 (a byte order mark included) or not valid JSON: `bad_json`.
   2. Not an object: `not_object`.
   3. `t` absent, not a string, or not one of `now`, `unit`, `ledger`, `report`, `git`: `unknown_type`.
   4. For each required field of that type, in the order CONTRACT.md lists them: absent is
      `missing_field`; present with the wrong type or form is `bad_field`. An `absent` array that repeats
      a value is `duplicate`.
3. Only when every line passed step 2, run the semantic checks (CONTRACT.md "Input records") in input
   order. The first failing record decides the error, using that record's line number. Then, if there
   is no `now` record, print `{"t":"error","line":0,"reason":"no_now"}`. Exit 2 on either.
4. Compute and print the output (below). Exit 1 if any ledger record was rejected, else 0.

**Byte order.** "Sorted" always means sorted by the UTF-8 bytes of the string, compared byte by byte,
a shorter prefix first. Never use a locale-aware comparison.

**Times.** A `time` is exactly 20 characters: four digits, `-`, two digits, `-`, two digits, `T`, two
digits, `:`, two digits, `:`, two digits, `Z`. Month 01 to 12; day 01 to the month's length (February
has 29 days when the year is divisible by 4 and either not by 100 or by 400); hour 00 to 23; minute
and second 00 to 59. Its value in seconds is `days(y, m, d) * 86400 + h * 3600 + min * 60 + s`, where
`days` counts days from 1970-01-01 in integer arithmetic (`floor` division throughout):

```
y2  = y - (1 if m <= 2 else 0)
era = floor(y2 / 400)
yoe = y2 - era * 400
mp  = m - 3 if m > 2 else m + 9
doy = floor((153 * mp + 2) / 5) + d - 1
doe = yoe * 365 + floor(yoe / 4) - floor(yoe / 100) + doy
days = era * 146097 + doe - 719468
```

Two times compare by value, which for valid times is the same as byte order.

**Days since** a time `a`: `floor((now - a) / 86400)` in seconds, and 0 if that is negative.

**Basis points.** A ratio `num / den` is `floor(num * 10000 / den)` in integer arithmetic. It prints as
the integer part of `bp / 10000`, a dot, then `bp mod 10000` padded to four digits: 4800 prints as
`"0.4800"`, 30000 as `"3.0000"`.

## reduce

### 1. Read the ledger

Take the `ledger` records in `line` order. For each, remove one trailing CR from `text`.

1. **Duplicates.** A text equal to an earlier record's text is a duplicate: print a `problem` with
   `reason` `duplicate` and `of` set to the smallest earlier `line` with that text. It takes no further
   part.
2. **Rejection.** Check the rest as CONTRACT.md "Ledger records" says. A failure is a `problem` with its
   reason (and `field` for `missing_field` and `bad_field`). Rejected records take no further part.
3. The rest are **valid records**. A valid record is **dirty** when `commit` ends in `+dirty`. Its
   **base commit** is `commit` without `+dirty`.

The **order key** of a valid record is its `at` value, then its `line`. "Latest" means greatest order
key; "earlier" means smaller order key.

### 2. Rows

The row keys are every `unit`'s `skill` and `scope`, plus the `skill` and `scope` of every valid record.
For each key:

1. **Unit class**: no unit is `unknown`; else `applies` false is `not_applicable`; else `kind` `none`
   is `no_metric`; else `applies`.
2. **L**, the latest valid record with this key, if any. `line`, `metric`, `value`, `at` and `commit`
   come from L, all `null` without one.
3. **Age.** Without L, `days` and `commits` are `null`. With L, `days` is the days since L's `at`.
   `commits` is the `commits` of L's `git` fact when that fact exists, has `ancestor` true, and L's
   commit is not `none`; otherwise `null` ("age unknown").
4. **Report check**, for L with a non-null `report` and `check` not `fail`. Take the `report` fact for
   L's line. Strip a trailing `+dirty` from the fact's `commit`. In this order, the first that applies is
   the mismatch: no fact is `unchecked`; `found` false is `missing`; `commit` when L's commit is `none` and the
   fact's commit is not exactly `none`, or when L's commit is a hash and the fact's commit is shorter
   than 7 characters or is not a prefix of L's base commit; the fact's `value` differs from L's `value` (`null` equals only `null`) is `value`; the
   fact's `date` differs from the first 10 characters of L's `at` is `date`. No mismatch means verified.
5. **Status**, the first that applies:
   1. No L: `unmeasured`.
   2. L's `check` is `fail`: `failed`, `reason` L's `degraded` when it is a string, else `null`.
   3. A report mismatch: `unverified`, `reason` the mismatch word.
   4. L is dirty: `unproven`, `reason` `dirty`.
   5. L's `check` is `partial`: `unproven`, `reason` `partial`.
   6. L's `degraded` is a string: `unproven`, `reason` that string.
   7. L's `value` is 0: `clean` when `commits` is 0 and, for a `runtime` unit, `days` is less than the
      unit's `due`; otherwise `was_clean`.
   8. Otherwise `measured`.
   Then, for an `applies` row whose unit's `absent` is not empty and whose status is `unmeasured`,
   `failed` or `unproven`: the status becomes `needs_setup` and `reason` the `absent` values joined
   with `,` in their input order.
6. **Last good**: the latest valid record with this key whose `check` is `pass`, `degraded` false and
   that is not dirty, L included. `good_line` and `good_value` are its `line` and `value`, or `null`.
7. **Trend.** `none`, with `delta`, `prev_line` and `trend_key` all `null`, unless the status is
   `clean`, `was_clean` or `measured`, L's `value` is not `null`, and `commits` is not `null`. Otherwise
   find **P**: the latest valid record with this key that is earlier than L, has `check` `pass`,
   `degraded` false, is not dirty, has a non-null `value`, a commit other than `none`, and a `git` fact
   with `ancestor` true.
   - No P: `new_baseline`.
   - P's `comparable` differs from L's: `not_comparable`, `prev_line` P's line, `trend_key` as below.
   - Otherwise `delta` is L's value minus P's value, `prev_line` P's line, and `trend` is `down` when
     `delta` is negative, `up` when positive, `same` when zero.

   **Differing key.** Split each `comparable` on `;` into pairs, and each pair at its first `=` into key
   and value. Over the union of keys in byte order, the first key present in only one of the two, or
   with different values, is `trend_key`. If there is none, `trend_key` is `comparable`.
8. **Ratio**, only for an `applies` row of kind `source` or `runtime` with status `clean`, `was_clean`
   or `measured`: for `source`, `commits / due` when `commits` is not `null`; for `runtime`,
   `days / due`. Otherwise `null`. Keep the basis-point integer for ranking.
9. **Due**, only for an `applies` row of kind `source` or `runtime` whose unit's `absent` is empty;
   every other row is not due:
   - status `unmeasured`, `unproven`, `unverified` or `failed`: due;
   - `commits` is `null`: due (age unknown);
   - kind `source`: due when `commits >= due` and `days >= 7`;
   - kind `runtime`: due when `days >= due`.

### 3. Rank

Sort the due rows by, in order:
1. Tier: 1 for `unmeasured` and `unproven`; 2 for `failed` and `unverified`; 3 for the rest.
2. Within tier 3: `commits` `null` first, then the ratio's basis points, larger first.
3. Skill `find-reinvention` before any other skill.
4. Scope `.` before any other scope.
5. `skill`, then `scope`, in byte order.

`rank` is the position from 1. Rows that are not due have `rank` `null`.

### 4. Print

1. Every `row`, sorted by `skill` then `scope`, with the fields in CONTRACT.md order.
2. For each scope with at least one `applies` row, sorted, a `coverage` record over its `applies` rows:
   `units` (count), `measured` (status `clean`, `was_clean` or `measured`), `clean` (status `clean`),
   `due`, `needs_setup` (status `needs_setup`).
3. `total`: the same five counts over every `applies` row, zeros when there is none.
4. Every `problem`, sorted by `line`.
5. `summary`: `read` (all `ledger` records), `shown` (rows with an L), `duplicates`, `superseded`
   (valid records minus `shown`), `rejected`, `rows`, `due` (rows due), `through` (the greatest `at`
   among valid records, or `null`).
