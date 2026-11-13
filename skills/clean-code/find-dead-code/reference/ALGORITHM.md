# Join tool algorithm

Implement this to satisfy [CONTRACT.md](CONTRACT.md). Where the two seem to disagree, CONTRACT.md wins and
the disagreement is a bug to report.

## Common steps

1. Parse the arguments. Exactly one argument, `join`, is valid. Otherwise print
   `{"t":"error","line":0,"reason":"usage"}` and exit 2.
2. Read every input line (CONTRACT.md "Input lines"). For each line, in order, stop at the first failure
   and print one error record with that line's number, then exit 2:
   1. Not valid UTF-8 (a byte order mark included) or not valid JSON: `bad_json`.
   2. Not an object: `not_object`.
   3. `t` absent, not a string, or not a record type: `unknown_type`.
   4. For each field of that type, in the order CONTRACT.md lists them: absent is `missing_field`;
      present with the wrong type, or a value outside its closed list, is `bad_field`. A `names` array
      that repeats a value is `duplicate`. `policy.floor` of 0 is `bad_field`.
   5. The single-record rules in CONTRACT.md: a breach is `bad_field`.
3. Only when every line passed step 2, run the semantic checks below over the records in input order,
   each record's checks in the order listed. The first failing record decides the error, with that
   record's line number. Exit 2.
4. If no `run` record exists, print `{"t":"error","line":0,"reason":"missing_run"}` and exit 2.
5. Compute and print the output. Exit as CONTRACT.md "Exit codes" says.

## Semantic checks

"A second X" means the later record fails; the first is kept, and every lookup by name or id uses the
first. `keep` and `prior` ids are not checked against entries: a keep for an id no entry has is counted
as orphan. When no `run` record exists, skip the `last` check; step 4 then reports `missing_run`. A field
error on any line beats a semantic error on an earlier line, because step 2 reads every line first.

- `run`: a second `run` is `duplicate`.
- `policy`: a second `policy` for the same kind is `duplicate`.
- `source`: a second `source` with the same name is `duplicate`.
- `entry`: a second `entry` with the same `id` is `duplicate`. For a control role: a `source` no
  `source` record declares is `unknown_source`; a declared source whose `kinds` lacks the entry's
  `kind` is `bad_field`.
- `day`: an undeclared `source` is `unknown_source`. A second `day` with the same source and date is
  `duplicate`.
- `hit`: an undeclared `source` is `unknown_source`. An undeclared `id` is `unknown_entry`. A source
  whose `kinds` lacks the entry's kind is `bad_field`. `arm` must be non-empty when the entry's kind is
  `flag` and empty otherwise, else `bad_field`. A non-empty `last` on or after the run date is
  `bad_field`. A second `hit` with the same source, id and arm is `duplicate`.
- `unmatched`: an undeclared `source` is `unknown_source`. A `kind` not in that source's `kinds` is
  `bad_field`. A second `unmatched` with the same source and kind is `duplicate`.
- `demote`: an undeclared `id` is `unknown_entry`. A second `demote` with the same id and reason is
  `duplicate`.
- `keep`: a second `keep` with the same id is `duplicate`.
- `prior`: a second `prior` with the same id is `duplicate`.

## Definitions

**Byte order.** "Sorted" always means sorted by the UTF-8 bytes of the string, compared byte by byte,
a shorter prefix first. Never use a locale-aware comparison. Sorting by two keys compares the first,
then the second.

**Day number.** For a date `y-m-d`: let `a = 1` when `m <= 2`, else `0`; `y2 = y - a`; `m2 = m + 12a -
3`; `day = 365*y2 + floor(y2/4) - floor(y2/100) + floor(y2/400) + floor((153*m2 + 2)/5) + d`. Only
differences between day numbers are used, so the constant offset does not matter. Leap years follow
the Gregorian rule. Let `R` be the day number of the run date.

**Basis points.** A ratio `num / den` is `floor(num * 10000 / den)` in integer arithmetic, and 0 when
`den` is 0. It prints as the integer part of `bp / 10000`, a dot, then `bp mod 10000` padded to four
digits: 150 prints as `"0.0150"`, 10000 as `"1.0000"`.

**Need.** `floor(e)` is the entry kind's `policy.floor` when given, else its default floor.
`need(e) = max(floor(e), ceil(period_days * 11 / 10))`, computed in exact integer arithmetic as
`(period_days * 11 + 9) div 10`. The window of `e` is the `need(e)` days numbered `R - need(e)` to
`R - 1`. `start(e) = R - need(e)`.

**Hits of e in s** are the `hit` records with that source and id (one per arm). A hit record is **in
window** for `e` when `real > 0` and the day number of `last` is at least `start(e)`.

**Active keep.** A `keep` for the id whose `review_by` day number is at least `R`.

## Gates

For every source, for every kind in its `kinds`, sorted by source then kind:

1. The controls are the entries whose role is `control_live` or `control_zero`, whose `source` is this
   source, and whose `kind` is this kind.
2. A `control_live` passes when at least one of its hits in this source is in window for it. A
   `control_zero` passes when every one of its hits in this source has `real` 0 and `synthetic` 0 (no
   hit record also passes).
3. `live_controls` and `zero_controls` count the passing controls of each role. `failed_controls`
   counts the failing ones.
4. `unmatched` is the basis points of `unmatched / (matched + unmatched)` from the `unmatched` record
   for this source and kind, or `""` when there is none.
5. `reason`, first match:
   - `control` when `failed_controls > 0`, `live_controls = 0`, `zero_controls = 0`, the unmatched
     basis points exceed 200, or there is no `unmatched` record and the source's `absent_is_zero` is
     true;
   - `sampled` when `sampled` is true;
   - `blind_spot` when `success_logged` or `scope_confirmed` is false;
   - otherwise `""`.
6. `pass` is `reason = ""`. A gate with reason `control` counts in `gates_failed`.

Print one `control` record per control entry, sorted by id: `real` and `synthetic` summed over its hits
in its source, and `pass` from step 2.

## Verdicts

For every entry whose role is `candidate` or `canary`:

1. **Applicable sources** are the sources whose `kinds` include the entry's kind.
2. **Live arms** are the distinct `arm` values of the entry's hit records, across all applicable
   sources, that are in window for it. The entry is **LIVE** when its kind is `flag` and it has two or
   more live arms, or its kind is anything else and it has at least one. A LIVE entry has reason `""`
   and an empty `reasons` list. Skip to step 6.
3. Collect reasons:
   - `dynamic` when `dynamic` is true;
   - `kept` when the id has an active keep;
   - `too_new` when `age_days < need`;
   - `synthetic_only` when the entry has no live arm and at least one of its hit records has
     `synthetic > 0`;
   - each demote reason given for the id;
   - source reasons: with no applicable source, `no_source`. Otherwise give each applicable source a
     state, first match: its gate reason for this kind when not `""`; `short_window` when any day of
     the window has no `day` record for that source or one with `records` 0; `no_evidence` when the
     entry has no hit record in that source and the source's `absent_is_zero` is false; otherwise the
     source **answers**. When no applicable source answers, add every state found. When at least one
     answers, add no source reason.
4. With any reason: class `UNPROVEN`, `reasons` the distinct reasons in the precedence order of
   CONTRACT.md, `reason` the first of them.
5. With no reason: for a `flag`, one live arm gives `STUCK` and none gives `UNUSED`. For any other kind,
   `callers = 0` gives `UNUSED` and `callers > 0` gives `ENTRY_UNUSED`. Reason `""`, empty `reasons`.
6. `got` is the class, or `UNPROVEN/` and the reason for an UNPROVEN entry.

Print one `canary` record per canary, sorted by id: `need`, `expect`, `got`, and `pass` when `got`
equals `expect`.

Print one `verdict` record per candidate, sorted by id. `revived` is true when the class is LIVE and a
`prior` record names the id.

## Summary

Over candidates only (never controls or canaries):

- `candidates`: how many.
- `by_class`: every class, keys in byte order, each with its count (zero included).
- `by_reason`: for UNPROVEN candidates, the count per headline `reason`, only reasons that occur, keys in
  byte order.
- `revived`: candidates with `revived` true.
- `keep_redundant`: LIVE candidates with an active keep.
- `keep_orphan`: `keep` records whose id is not a candidate's id.
- `keep_expired`: `keep` records whose id is a candidate's id and whose `review_by` day number is below
  `R`.
- `gates_failed`: gates with reason `control`.
- `canaries`: canary entries. `canaries_failed`: canaries whose `pass` is false.

Exit 1 when `gates_failed > 0`, `canaries_failed > 0` or `canaries = 0`. Otherwise exit 0.
