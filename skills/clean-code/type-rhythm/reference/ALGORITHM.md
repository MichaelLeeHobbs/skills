# Bookkeeping tool algorithm

Implement this to satisfy [CONTRACT.md](CONTRACT.md). Where the two seem to disagree, CONTRACT.md wins and
the disagreement is a bug to report.

## Common steps

1. Parse the arguments. On any usage problem, print `{"t":"error","line":0,"reason":"usage"}`, exit 2.
2. Read every input line (CONTRACT.md "Input lines"). For each line, in order, stop at the first failure
   and print one error record with that line's number, then exit 2:
   1. Not valid UTF-8 (a byte order mark included) or not valid JSON: `bad_json`.
   2. Not an object: `not_object`.
   3. `t` absent, not a string, or not a record type in CONTRACT.md: `unknown_type`.
   4. For each required field of that type, in the order CONTRACT.md lists them: absent is
      `missing_field`; present with the wrong type, out of range, or outside its closed list is
      `bad_field`; a `key` that is not safe is `unsafe_key`; a `names` array that repeats a value is
      `duplicate`, checked after every element passed its type and list check.
3. Only when every line passed step 2, run the semantic checks in one pass in input order: for each
   record, the checks in CONTRACT.md "Semantic checks" and the subcommand's extra record check
   (`unplanned`). The first failing record decides the error, using that record's line number. Exit 2.
   After every record passes, check required records; a missing one prints
   `{"t":"error","line":0,"reason":"missing_record"}` and exits 2.
5. Arguments: an empty first line means no arguments. An option's value is always the next token, so
   `--tolerance --check` reads `--check` as the value and is a usage error.
4. Compute and print the output. Exit as CONTRACT.md "Exit codes" says.

**Byte order.** "Sorted" always means sorted by the UTF-8 bytes of the string, compared byte by byte,
a shorter prefix first. Never use a locale-aware comparison, and in a runtime whose strings are UTF-16,
do not compare code units: `Z` sorts before `a`, and U+E000 sorts before U+10000.

**Safe keys.** A string is safe unless it contains `@`, or three or more consecutive ASCII digits, or a
run of six or more consecutive characters from `0-9a-fA-F` that contains at least one digit.

**Basis points.** A ratio `num / den` is `floor(num * 10000 / den)` in integer arithmetic. It is printed
as the integer part of `bp / 10000`, a dot, then `bp mod 10000` padded to four digits: 9600 prints as
`"0.9600"`, 10000 as `"1.0000"`. When `den` is 0 it prints as `"-"`.

**Capture key** of a `capture` record: `screen`, `@`, `viewport` in decimal, `/`, `variant`. A record's
capture is the `capture` whose key equals its `cap`. A capture is a **canary capture** when its variant
starts with `canary-`. A record's viewport and screen are its capture's.

**Count** of a `text`, `box` or `skip` record is its `n`. "Elements" always means the sum of counts.
"Caps" means the number of distinct capture keys, "screens" the number of distinct screen names, among
the records summed.

## Problems of a capture

Shared by `verify --check captures` and `verify --check canaries`. For one capture, list in this order
every problem that applies:

1. `partial`: no `end` record has its key, or the `end` record's `text`, `box` or `skip` differs from the
   number of `text`, `box` or `skip` records (lines, not counts) whose `cap` is its key.
2. `auth_lost`: `auth` is false.
3. `login`: `login` is true.
4. `notfound`: `notfound` is true.
5. `wrong_page`: `url_ok` is false or `main` is false.
6. `fonts`: `fonts` is false.
7. `busy`: `busy` is true.
8. `viewport`: `width` differs from `viewport`.
9. `empty`: no `text` record has its key.

A capture is **valid** when it has no problem.

## Roles

Shared by `unmatched`, `tally` and `verify --check canaries`. The role of a `text` record, with its source:

1. A `rolemap` with the same `site`: its `role`, source `map`.
2. `aria` is `heading`: heading, source `tag`. `aria` is `button`, `tab` or `menuitem`: label, source `tag`.
3. `tag` in the role table: its role, source `tag`.
4. `tag` is a phrasing tag and `ctx` is not empty: resolve `ctx` with rule 2's values, then the role
   table. A match gives that role, source `context`.
5. Otherwise `unassigned`, source `none`.

Role table: heading for `h1`-`h6`; body for `p`, `li`, `td`, `dd`, `blockquote`; label for `label`,
`button`, `legend`, `th`, `dt`, `summary`, `option`; caption for `figcaption`, `caption`, `small`; code
for `code`, `pre`, `kbd`, `samp`. Phrasing tags: `span`, `a`, `strong`, `em`, `b`, `i`, `u`, `s`, `mark`,
`abbr`, `time`, `sub`, `sup`, `q`, `cite`, `dfn`, `var`, `data`, `bdi`, `bdo`, `ins`, `del`. Compare
exactly; the collector writes tags lower case.

Role order, used for sorting: heading, body, label, caption, code, unassigned.

## Grading

Shared by `tally` and `verify --check canaries`. `tol` is `--tolerance`. The steps of a kind for viewport
`v` are the `scale` records of that kind whose `viewport` is 0 or `v`. "Within" means
`abs(value - step) <= tol`. "Closest" means the step with the smallest `abs(value - step)`, the smaller
step on a tie. A step serves a role when its `roles` is empty or contains the role; every step serves
`unassigned`. An exception applies when an `exception` has the record's `site`.

Text `size`, first match wins:
1. exception applies: `excepted`, nearest -1.
2. no size steps: `unscaled`, nearest -1.
3. some step within serves the record's role: `on`.
4. some step within: `wrong-role`.
5. otherwise `off`.
For 3 to 5, `nearest` is the closest step that serves the role, or -1 if none serves it.

Text `weight`: exception applies: `excepted`; no weight steps: `unscaled`; equal to a step: `on`;
otherwise `off`. `nearest` is the closest weight step, -1 for `excepted` and `unscaled`.

Text `line`: exception applies: `excepted`; `line` is -1: `normal`; no line steps: `unscaled`; within a
step: `on`; otherwise `off`. `nearest` is the closest line step, -1 for `excepted`, `normal`, `unscaled`.

Box, first match wins: exception applies: `excepted`; `auto` true: `auto`; `value` below 0: `negative`;
no space steps: `unscaled`; within a step: `on`; `family` is padding, `border` above 0, and
`value + border` within a step: `compensated`; otherwise `off`. `nearest` is the closest space step to
`value`, -1 for `excepted`, `auto`, `negative`, `unscaled`.

## verify --check captures

Use only non-canary captures. Planned keys: every screen x viewport x variant from the declaring
records. For each planned key in byte order: no capture with that key gives one `missing` problem;
otherwise print one `problem` record per problem of that capture, in the order above.

`routes`: `declared` is the `routes` count; `accounted` is the number of distinct `route` values over
`screen` and `exclude` records; `pass` is whether they are equal.

`todo`: one record per planned key with any problem, in byte order. `summary`: `planned` keys, `valid`
planned keys with no problem, `problems` the number of `problem` records printed.

## verify --check canaries

Entries, each `{cap, id, pass, got}`:

**Mode browser.**
- For each `canary-elements` capture: the entries `capture` and `c1` to `c8` below.
- Required viewports: the declared `viewport` widths. For each with no `canary-elements` capture at that
  viewport: an entry with `cap` `-@<width>/canary-elements`, id `capture`, got `missing`. With no
  declared viewport and no `canary-elements` capture: one entry with `cap` `-`, id `capture`, got
  `missing`.
- For each `canary-logged-out` capture: id `logged-out`, got its problems joined by `,` or `accepted`
  when it has none; pass when the problems include `auth_lost` or `login`. With none: `cap` `-`, got
  `missing`, fail.
- For each `canary-bad-route` capture: id `bad-route`, likewise; pass when the problems include
  `notfound` or `wrong_page`.

**Mode static.** For each `canary-static` capture: the entries `capture`, `c1`, `c2` and `c4`. With
none: `cap` `-`, id `capture`, got `missing`, fail. Other canary captures are ignored.

Within one capture, using its records whose `canary` equals the id:
- `capture`: got `valid` when it has no problem, else its problems joined by `,`. Pass on `valid`.
- `c1`, `c2`, `c3`, `c8` read `text` records: none gives `missing`, more than one record (lines, not
  counts) gives `duplicate`.
  Otherwise: `c1` and `c2` give `<role> <size status>`; `c3` gives `<role> <size status> same-owner`
  when `owner` equals `site`, else `... other-owner`; `c8` gives `normalised` when `site` contains `#mrn-#`
  (the planted id `mrn-12345678` after normalising), else `raw`. Pass on: `c1` `label off`, `c2` `heading on`, `c3` `label off other-owner`, `c8`
  `normalised`.
- `c4` reads `box` records with family padding, `c7` with family margin: none gives `missing`. Otherwise
  got is the family, a space, then the distinct statuses in byte order joined by `,`. Pass on `c4`
  `padding off`, `c7` `margin auto`.
- `c5`: any `text` record gives `counted`; else no `skip` record gives `missing`; else `skip ` then the
  distinct reasons in byte order joined by `,`. Pass on `skip hidden`.
- `c6`: any `text`, `box` or `skip` record gives `present`, else `absent`. Pass on `absent`.

Print entries sorted by `cap` in byte order, then by id in the order `capture`, `c1` to `c8`,
`logged-out`, `bad-route`. `summary`: `mode`, `entries`, `passed`, `failed`.

## unmatched

Use `text` records of non-canary captures. Group the records whose role is `unassigned` by (`site`,
`tag`, `ctx`). Sort groups by elements descending, then `site`, `tag`, `ctx` in byte order. Print the
first 200. `summary`: `text` elements over all used records, `unassigned` elements, `groups`, `listed`,
`unassigned_bp` = unassigned / text.

## tally

Use only records of non-canary captures.

**role**: for each role in role order with at least one element: `elements`, `caps`, `screens`,
`by_source` (sources with a non-zero count, in byte order), `on_bp` = elements with size status `on` /
elements with size status `on`, `off` or `wrong-role`.

**value**: grade every `text` record for `size`, `weight` and `line`. Group by (role, prop, value of that
prop, status, nearest). Sort by role order, prop order size, weight, line, value ascending, status in byte
order, nearest ascending. Each record: `elements`, `caps`, `screens`, `owners` (distinct `owner`). After
each group with status `off` or `wrong-role`, print up to 10 `site` records: its records grouped by
(`site`, `owner`), sorted by elements descending, then `site`, then `owner` in byte order.

**space**: grade every `box` record. Group by (`family`, `value`, status, nearest). Sort by family order
margin, padding, gap, value ascending, status in byte order, nearest ascending. After each group with
status `off`, print up to 10 `spacesite` records grouped by `site`, sorted by elements descending then
`site`.

**owner**: the `text` records whose size status is `off` or `wrong-role`, grouped by `owner`: `sizes`
the distinct sizes ascending, `elements`, `caps`, `screens`. Sort by screens descending, elements
descending, then `owner`. Print the first 30.

**stale**: each `exception` whose `site` is on no used `text` or `box` record, sorted by `site`.

**summary**: `mode`; `caps` and `screens` over non-canary captures; `text` and `boxes` elements;
`skipped` elements per reason, keys `excluded`, `hidden`, `icon` always present; `sizes_in_use` distinct
`size` values over used `text` records; `sizes_off` distinct sizes with at least one record graded
`off`; `scale_sizes` distinct size step values; the same three for weights; `space_in_use` distinct
`value`s over used `box` records whose `auto` is false; `space_off` distinct values with a record graded
`off`; `scale_space`; `unassigned_bp` = unassigned elements / text elements; `gate` `FAIL` when that ratio
in basis points is above `--max-unassigned-basis-points`, else `PASS` (also `PASS` for `"-"`).
