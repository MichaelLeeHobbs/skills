# Bookkeeping tool algorithm

Implement this to satisfy [CONTRACT.md](CONTRACT.md). Where the two seem to disagree, CONTRACT.md wins and
the disagreement is a bug to report.

## Common steps

1. Parse the arguments. On any usage problem, print `{"t":"error","line":0,"reason":"usage"}`, exit 2.
2. Read every input line (CONTRACT.md "Input lines"). For each line, in order, stop at the first failure
   and print one error record with that line's number, then exit 2:
   1. Not valid JSON: `bad_json`.
   2. Not an object: `not_object`.
   3. `t` absent, not a string, or not accepted by this subcommand or check: `unknown_type`.
   4. For each required field of that type, in the order CONTRACT.md lists them: absent is
      `missing_field`; present with the wrong type is `bad_field`. A `names` array that repeats a value
      is `duplicate`.
   5. For `tally` only: a closed-list field with a value outside its list is `bad_field`.
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

## strings

Semantic check: a second `row` with the same `id` is `duplicate`.

Trim each row's `domain_in`. Skip empty results. Print one `string` record per distinct value, sorted, with
`rows` set to how many rows had it. Then `summary` with `rows` (all row records) and `strings` (distinct
values).

## group

Trim every `map` `value` before comparing it. Semantic checks: a second `row` with the same `id` is
`duplicate`. A second `map` with the same trimmed `value` is `duplicate`. An eligible row (below) whose
trimmed `domain_in` equals no trimmed `map` `value` is `unmapped`.

1. **Eligible rows** have `kind` `utility`, `method` or `framework-bound`.
2. **Job key** of an eligible row: `job:` + the mapped domain ID + `>` + its `domain_out`.
3. **Stem key**: take the token list of `name`. If it has two or more tokens and the first is one of
   `get`, `format`, `to`, `is`, `use`, `handle`, `on`, drop the first. Join the rest with nothing
   between them. The key is `stem:` + that string. (`formatDatetime` and `formatDateTime` both give
   `stem:datetime`; `total` stays `stem:total`.) A name with no tokens gets no stem key.
4. Collect each key's members. Drop keys with one member. Drop stem keys with more than `--max-stem`
   members and record each as a stop stem.
5. Sort the remaining keys. Each key's members, sorted, form a candidate. Walking candidates in key
   order, drop any whose member list equals an earlier one. Then drop any candidate whose members are a
   strict subset of another candidate's members.
6. Number the survivors in key order from `G0001`, padded as for slices. Print each as `group` with `id`,
   `key`, `members`.
7. Print each stop stem as `stopstem` with `stem` (without the `stem:` prefix) and `rows` (its member
   count), sorted by stem.
8. Print `summary`: `rows` (all row records), `eligible`, `groups`, `stopstems`.

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

**Kinds that need edge slots**: `utility`, `method`, `framework-bound`.

For each row in input order, collect problems in exactly this order:
1. `bad_kind` if `kind` is not in its list.
2. `bad_visibility` if `visibility` is not in its list.
3. `bad_verb` if `verb` is not in its list.
4. `bad_domain_out` if `domain_out` is not in its list.
5. `bad_effects` if `effects` is not in its list.
6. `empty` with `field`, for each of `domain_in`, `empty`, `invalid`, `zone_or_units` in that order,
   whose trimmed value is the empty string.
7. If `kind` needs edge slots: `na_not_allowed` with `field`, for each of `empty`, `invalid`,
   `zone_or_units` in that order, whose trimmed, lower-cased value is exactly `n/a`.
8. `restates_name` if trimmed `domain_in` is not empty and, after removing stopwords from the tokens of
   `domain_in`, the set is empty or every token in it is also a token of `name`.

Print the problems, then `summary` with `rows`, `rejected` (rows with at least one problem) and
`problems`. Exit 1 if there is any problem.

## verify --check map

Semantic check: a second `domain` with the same `id` is `duplicate`.

The strings are the distinct `value`s of `string` records. Ignore `map` records whose `value` is not one
of them. For each string:
- No `map` record: `unmapped`.
- At least one `map` record names a domain ID with no `domain` record: `unknown_domain`, reported once.
- Its `map` records name two or more distinct domain IDs: `conflict`.

A string can have both `unknown_domain` and `conflict`; report each. A string is mapped when it has at least one `map` record and none of the three problems. Sort problems by
kind in the order `unmapped`, `unknown_domain`, `conflict`, then by `value`. Print them, then `summary`
with `strings` (distinct), `mapped`, `domains` (count of `domain` records) and `problems`. Exit 1 if
there is any problem.

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

Semantic check: a second `cap` record is `duplicate`.

Print the seven records in CONTRACT.md order:
1. `rows`: `total` row records; `by_kind` and `by_visibility` as objects with keys sorted, holding only
   values that occurred.
2. `excluded`: `total` is the sum of `count`; `by_reason` sums `count` per `reason`, keys sorted.
3. `slices`: counts of `done` and `blocked`.
4. `verdicts`: counts of `SAME`, `VARIANT`, `DIFFERENT`, always all three keys.
5. `evidence`: counts of `CONFIRMED`, `REFUTED`, `BLOCKED`, always all three keys.
6. `jobs`: `reinvented` is the number of distinct `job` values with at least one `SAME` or `VARIANT`
   verdict.
7. `spend`: `total_cents` is the sum of `usd_cents`; `cap_cents` is the cap or 0 if there is none;
   `over_cap` is true when the cap is above 0 and the total exceeds it; `by_phase` sums per `phase`, keys
   sorted.

An object with no keys prints as `{}`. Exit 0.
