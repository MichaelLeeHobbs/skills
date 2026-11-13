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
   4. For each required field of that type, in the order CONTRACT.md lists them: absent is
      `missing_field`; present with the wrong type is `bad_field`. A `names` array that repeats a value
      is `duplicate`.
   5. Only after every required field of the record passed step 4: a field CONTRACT.md restricts to a
      closed list or a range, with a value outside it, is `bad_field`.
      These fields are: `group` row `widget`; `diff` `blocked` `reason`, `image` `take` (1 or 2),
      `width` and `height` (at least 1), `px` `take` (1 or 2) and `hex` (only `0-9` and `a-f`); and in
      `tally` every field that has a closed list. A `tally` `outcome` record whose `outcome` is
      `blocked` and has no `reason` is `missing_field`; its `reason` is read only when `outcome` is
      `blocked`, and ignored otherwise.
3. Only when every line passed step 2, run the semantic checks for the subcommand (below) in input
   order. The first failing record decides the error, using that record's line number. Exit 2. A
   `bad_field` on line 9 therefore wins over a `duplicate` on line 3: read the whole input before
   reporting a semantic error.
4. Compute and print the output. Exit as CONTRACT.md "Exit codes" says.

**Byte order.** "Sorted" always means sorted by the UTF-8 bytes of the string, compared byte by byte,
a shorter prefix first. Never use a locale-aware comparison: `Z.ts` sorts before `a.ts`.

**Trim** means removing leading and trailing ASCII spaces and tabs.

**Tokens of a string.** Insert a boundary between a lowercase letter or digit and a following uppercase
letter, and between an uppercase letter and a following uppercase-then-lowercase pair (`XMLParser` gives
`XML Parser`). Split on every character that is not an ASCII letter or digit. Lower-case each piece.
Drop empty pieces. The result is a list in original order; "token set" means the same pieces without
repeats.

**Basis points.** A ratio `num / den` is `floor(num * 10000 / den)` in integer arithmetic. It is printed
as the integer part of `bp / 10000`, a dot, then `bp mod 10000` padded to four digits: 9600 prints as
`"0.9600"`, 10000 as `"1.0000"`.

## slice

Semantic checks: a second `file` with the same `path` is `duplicate`. A second `row` with the same `id`
is `duplicate`. A `row` whose `path` has no `file` record is `unknown_path`.

1. Keep only files that have at least one row. Sort them by `path`.
2. Within each file, keep its rows in input order.
3. Walk the files with an empty current slice. For each file: if the current slice has at least one file
   and `current bytes + file bytes > max-bytes`, close the current slice and start an empty one. Then add
   the file. After the last file, close the current slice if it has a file. A file bigger than
   `max-bytes` therefore always ends up alone.
4. Number closed slices from 1 as `S` plus the number padded to four digits (`S0001`). Past 9999, use the
   number as it is (`S10000`).
5. Print each slice: `slice`, `bytes` (sum of its files), `files` (in order), `rows` (each file's rows in
   order, files in order).
6. Print `summary`: `slices`, `files` (files kept in step 1), `rows` (all rows), `bytes` (sum over kept
   files).

## group

Semantic check: a second `row` with the same `id` is `duplicate`.

1. **Eligible rows** have a `widget` in the eligible widget list.
2. Collect eligible rows by `widget`. The key of each collection is `class:` + the widget.
3. Keys with exactly one member are singles. Drop them.
4. Sort the remaining keys. Number them in key order from `G0001`, padded as for slices. Print each as
   `group` with `id`, `key`, `members` (sorted) and `oversize` (true when the member count is greater
   than `--max-members`).
5. Print `summary`: `rows` (all row records), `eligible`, `groups`, `oversize` (groups printed with
   `oversize` true), `singles` (keys dropped in step 3).

## reuse

Semantic checks: an `old` or `new` `id` with fewer than two `:` characters is `bad_field`; a second
`old` with the same `id` is `duplicate`; a second `new` with the same `id` is `duplicate`.

Split each ID into path, line and name at its last two `:` characters.

1. For each new row, in sorted ID order, print exactly one of:
   1. `reuse`, when some old row has the same `hash`. `from` is the old row with the same `id` if one
      has that hash, otherwise the smallest such old ID.
   2. `changed`, when no old row has its hash, but an old row has the same path and name and that old
      row's hash belongs to no new row. `from` is the smallest such old ID.
   3. `added`, otherwise.
2. Print `removed` for each old row, in sorted ID order, whose hash belongs to no new row and that is no
   `changed` record's `from`.
3. Print `summary`: `old` and `new` (record counts), then the counts of `reuse` (as `reused`), `changed`,
   `added` and `removed` records.

Two new rows may name the same `from`: identical copies of one function both reuse its description, and
two rewritten functions with the same path and name (overloads) may both be `changed` from one old row.

## diff

A **cell** is a pair of `member` and `state`. An **image** is a cell plus a `take`.

Semantic checks, each record in input order:
- `cell`: a second `cell` for the same cell is `duplicate`.
- `blocked`, `unreachable`, `predict`: no `cell` record for its cell is `unknown_cell`; a second record
  of the same type for the same cell is `duplicate`.
- `image`: no `cell` record for its cell is `unknown_cell`; a second `image` for the same image is
  `duplicate`; a `width` or `height` different from the first `image` record in the input is `bad_size`;
  any `y` from 0 to `height - 1` with no `px` record for this image is `missing_row`.
- `px`: no `image` record for its image is `unknown_image`; a second `px` with the same image and `y` is
  `duplicate`; `y` not less than the `height` of the first `image` record for its image, or a `hex`
  length other than 6 times that record's `width`, is `bad_field`.

### Outcomes

Walk the cells sorted by `member`, then `state`. For each, count which of these it has: at least one
`image`, a `blocked`, an `unreachable`.

- None: problem `missing`. No outcome.
- Two or three: problem `conflict`. No outcome.
- Only `unreachable`: outcome `unreachable`.
- Only `blocked`: outcome `blocked` with its `reason`.
- Only images, but take 1 or take 2 is absent: problem `missing_take`. No outcome.
- Both takes, and any row's `hex` differs between them: outcome `unstable`.
- Otherwise, if every pixel of take 1 has the same value: outcome `blank`.
- Otherwise: outcome `ok`. An `ok` cell with no `predict` record also gets problem `no_prediction`.

Print the problems in that cell order, as `problem` with `member`, `state`, `kind`. Then print one
`outcome` record per cell that has an outcome, in the same order, with `member`, `state`, `outcome`, and
`reason` only for `blocked`.

### Pixel difference

For two `ok` cells in the same state, compare their take 1 images position by position. Read each pixel's
six hex digits as `r`, `g`, `b` from 0 to 255. Compute, in exact integer arithmetic:

```
Y = 299*r + 587*g + 114*b
I = 596*r - 274*g - 322*b
Q = 211*r - 523*g + 312*b
delta = 5053*dY*dY + 2990*dI*dI + 1957*dQ*dQ
```

where `dY`, `dI`, `dQ` are the differences between the two pixels' values. The largest possible `delta`
is below 2^50, so 64-bit integers or exact doubles hold it. A position **differs** when
`delta > 3521500000000`. There is no anti-aliasing exclusion: an edge that moves is a difference.

- `pixels`: the number of positions that differ.
- `region`: the size of the largest set of differing positions connected through any of their eight
  neighbours. Compute it with an explicit queue or union-find, never recursion: one region can hold every
  pixel of the frame.
- `box`: `[x0,y0,x1,y1]`, the smallest and largest column and row among differing positions, or `[]` when
  `pixels` is 0.
- `noticeable`: `region` is at least `--min-region`.

### Pairs, looks and bridges

Walk the states that have at least one `ok` cell, sorted. For each state, take its `ok` members sorted.

1. For every pair of those members, `a` before `b`, print `pair` with `state`, `a`, `b`, `pixels`,
   `region`, `box`, `noticeable`.
2. Form looks: walk the members in order. Put each into the first existing look, in the order looks were
   made, where it is not noticeable against every member already in that look. If there is none, start a
   new look. Print `looks` with `state` and `looks`, each look a list of members in the order they joined.
3. For each member in order, and each look in order that does not hold it: if at least one member of
   that look is not noticeable against it, print `bridge` with `state`, `member` and `look` (the look's
   position, counting from 1).

A state with one `ok` member prints one `looks` record holding it and no pairs or bridges.

### Evidence

For each member that appears in any `cell` record, sorted, find its comparable states: states, sorted,
where its cell is `ok`, at least one other member's cell is `ok`, and every `ok` cell in that state has a
`predict` record. In each comparable state:

- measured: the members of the look that holds it;
- predicted: the members with `ok` cells in that state whose predicted `look` equals its own.

The state is a mismatch when the two sets differ. Print `evidence` with `member`, `result`, `states` (the
number of comparable states) and `mismatch` (the mismatched states, sorted). `result` is `BLOCKED` when
there are no comparable states, `CONFIRMED` when there is no mismatch, and `REFUTED` otherwise.

### Summary

Print `summary` with `cells` (`cell` records), then the count of each outcome (`ok`, `unreachable`,
`unstable`, `blank`, `blocked`), `problems`, `pairs` (`pair` records printed), `confirmed`, `refuted`, and
`unproven` (`BLOCKED` evidence). Exit 1 if there is any problem.

## verify --check ids

Semantic check: a second `expect` with the same `slice` and `id` is `duplicate`.

For each slice that appears in any record:
- Every expected ID with no `got` record is `missing`.
- Every `got` ID that is not expected in that slice is `extra`.
- Every `got` ID that appears in two or more `got` records for that slice is `duplicate`, reported once.

An ID can be both `extra` and `duplicate`. Sort problems by `slice`, then `id`, then kind in the order
`missing`, `extra`, `duplicate`. Print them, then `summary` with `expected` (count of `expect` records),
`got` (count of `got` records) and `problems`. Exit 1 if there is any problem.

## verify --check rows

Semantic check: a second `row` with the same `id` is `duplicate`.

**Stopwords**: `a`, `an`, `the`, `of`, `to`, `for`, `in`, `on`, `and`, `or`, `value`, `input`.

For each row in input order, collect problems in exactly this order:
1. `bad_widget` if `widget` is not in the widget list.
2. `bad_relation` if `relation` is not in its list.
3. `bad_styling` if `styling` is not in its list.
4. `bad_effects` if `effects` is empty, holds a value not in its list, or holds `pure` together with any
   other value.
5. `empty_displays` if trimmed `displays` is the empty string.
6. `restates_name` if trimmed `displays` is not empty and, after removing stopwords from the tokens of
   `displays`, the set is empty or every token in it is also a token of `name`.
7. `wraps_not_imported` if `relation` is `wrapper` or `restyled` and trimmed `wraps` is empty, is
   `none`, or equals no value in `imports` (compared exactly, `imports` values untrimmed).
8. `wraps_on_hand_rolled` if `relation` is `hand-rolled` and trimmed `wraps` is not `none`.

Print each as `problem` with `id` and `kind`. Then count `other`, the rows whose `widget` is exactly
`other`, and `other_share`, the basis-point ratio `other / rows` (0 when there are no rows). If
`other_share` is greater than `--max-other-basis-points`, print `problem` with `kind` `other_share` and
`share`. Print `summary` with `rows`, `rejected` (rows with at least one row problem), `problems` (all
problem records), `other` and `other_share`. Exit 1 if there is any problem.

## verify --check groups

Semantic checks: a second `group` with the same `id` is `duplicate`. A `part` or `keep` naming a group
with no `group` record is `unknown_group`.

1. For each group that has at least one part: every group member found in no part is `lost`; every part
   member that is not a group member is `foreign`, reported once per member.
2. For each pair of distinct groups, taking `a` before `b` in byte order: count members they share. If
   the count is 2 or more and no `keep` record names this pair (either order), it is `overlap` on group
   `a` with `other` set to `b` and `shared` set to the count.

Sort problems by `group`, then kind in the order `lost`, `foreign`, `overlap`, then by `id` or `other`.
Print them, then `summary` with `groups` (count of `group` records), `split` (groups with at least one
part) and `problems`. Exit 1 if there is any problem.

## verify --check coverage

Semantic checks: a second `count` with the same `path` is `duplicate`. An `adjust` whose `path` has no
`count` record is `unknown_path`. A second `adjust` for the same `path` is `duplicate`.

1. `files` is the number of `count` records. `adjusted` is the number of `adjust` records.
2. Over files that are not adjusted: `parser` is the sum of `parser`, `pattern` is the sum of `pattern`,
   `covered` is the sum of `min(parser, pattern)` per file.
3. `coverage` is the basis-point ratio `covered / pattern`, or 0 when `pattern` is 0.
4. `adjusted_share` is the basis-point ratio `adjusted / files`, or 0 when `files` is 0.
5. `pass` is true when `files` is at least 1, `coverage` is at least `--min-basis-points`, and
   `adjusted_share` is at most `--max-adjusted-basis-points`. An empty input never passes.
6. Print a `short` record for every non-adjusted file whose `parser` is less than its `pattern`, sorted
   by `path`. Then an `adjusted` record for every adjusted file, sorted by `path`. Then `summary` with the
   fields in CONTRACT.md order, `coverage` and `adjusted_share` printed as basis-point strings. Exit 1 if
   `pass` is false.

## tally

Semantic checks: a second `cap` record is `duplicate`. A second `family` with the same `group` and
`member` is `duplicate`.

Print, in this order:
1. `rows`: `total` row records; `eligible`, those whose `widget` is in the eligible list; `by_widget` and
   `by_relation` as objects with keys sorted, holding only values that occurred.
2. `excluded`: `total` is the sum of `count`; `by_reason` sums `count` per `reason`, keys sorted.
3. `slices`: counts of `done` and `blocked`.
4. `verdicts`: counts of `SAME`, `VARIANT`, `DIFFERENT`, always all three keys.
5. `evidence`: counts of `CONFIRMED`, `REFUTED`, `BLOCKED`, always all three keys.
6. `cells`: counts of each outcome (`ok`, `unreachable`, `unstable`, `blank`, `blocked`), always all five
   keys, then `by_reason` counting `blocked` outcomes per `reason`, keys sorted.
7. One `family` per distinct `group` of `family` records, sorted by group: `copies` (records with role
   `copy`), `wrappers` (role `wrapper`), `sites` (sum of `importers` over role `copy`).
8. `reinvented`: `groups` is the number of distinct `group` values of `verdict` records with at least one
   `SAME` or `VARIANT`.
9. `spend`: `total_cents` is the sum of `usd_cents`; `cap_cents` is the cap or 0 if there is none;
   `over_cap` is true when the cap is above 0 and the total exceeds it; `by_phase` sums per `phase`, keys
   sorted.

An object with no keys prints as `{}`. Exit 0.
