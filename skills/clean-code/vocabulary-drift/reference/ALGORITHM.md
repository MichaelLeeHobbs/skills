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
      `missing_field`; present but of the wrong JSON type, or breaking its type's rule, is `bad_field`.
      Every field CONTRACT.md shows for a type is required, except where it names the only required
      ones (`term` records in the map check, `pick` records in the evidence check).
3. Only when every line passed step 2, run the semantic checks for the subcommand (duplicates and
   unknown references, as CONTRACT.md lists them) in input order. The first failing record decides the
   error, using that record's line number. Within one record, `duplicate` is checked before an unknown
   reference. Exit 2.
4. Compute and print the output. Exit as CONTRACT.md "Exit codes" says.

**Byte order.** "Sorted" always means sorted by the UTF-8 bytes of the string, compared byte by byte,
a shorter prefix first. Never use a locale-aware comparison: `Z.ts` sorts before `a.ts`.

**Trim** means removing leading and trailing ASCII spaces and tabs.

**Integers.** Sums and products use exact integer arithmetic, even past 9007199254740991.

**Basis points.** A ratio `num / den` is `floor(num * 10000 / den)` in integer arithmetic. It is printed
as the integer part of `bp / 10000`, a dot, then `bp mod 10000` padded to four digits: 9600 prints as
`"0.9600"`, 10000 as `"1.0000"`.

## Tokens and lemmas

**Tokens of a string.** Insert a boundary between a lowercase letter or digit and a following uppercase
letter, and between an uppercase letter and a following uppercase-then-lowercase pair (`XMLParser` gives
`XML Parser`). Split on every character that is not an ASCII letter or digit. Lower-case each piece.
Drop empty pieces. The result is a list in original order. Letters are ASCII only: `é` is a separator.

**Classify each token**, in this order:
1. **short**: fewer than 2 characters, or made only of digits.
2. Fold it (below). **stopped**: the token or its fold is in the stop list.
3. **kept**: everything else. Its **lemma** is the fold.

**Fold** a token `w`, first rule that applies:
1. `w` is a key of the irregular table: its value.
2. `w` ends in `ies` and is longer than 4 characters: drop `ies`, add `y` (`studies` gives `study`).
3. `w` ends in `sses`: drop the final `es` (`classes` gives `class`).
4. `w` ends in `xes`, `ches` or `shes`: drop the final `es` (`boxes` gives `box`).
5. `w` ends in `s`, is longer than 3 characters, and does not end in `ss`, `us` or `is`: drop the `s`.
6. Otherwise `w` unchanged.

**Irregular table** (closed; key gives value): `alias` alias, `aliases` alias, `analyses` analysis,
`atlas` atlas, `bias` bias, `caches` cache, `canvas` canvas, `canvases` canvas, `children` child,
`criteria` criterion, `ids` id, `indexes` index, `indices` index, `lens` lens, `lenses` lens, `matrices`
matrix, `movies` movie, `news` news, `people` person, `series` series, `species` species, `statuses`
status, `vertices` vertex.

**Stop list** (closed): `a an and are as at be by do does for from has have if in into is it its no not
of on or so than that the then this to was were will with async await bool boolean class const def else
enum export false function import int let new null number object private public return self static
string true type undefined var void add arg array base create data default delete get handle handler
helper id impl info init item key list load map param prop set temp tmp update use util val value`.

**Lemma set of a site**: the distinct lemmas of the kept tokens of its `text`.

## terms

1. For every site, classify every token of `text`. Add each token to `tokens` and to exactly one of
   `kept`, `stopped`, `short` (repeats within a site count each time).
2. For every lemma in a site's lemma set, the site counts once toward that term. Per term record:
   - `sites`: sites whose lemma set holds the term. `files`: distinct `path` among them.
   - `by_surface`: those sites counted per `surface`, surfaces with 0 left out, keys in byte order.
   - `contexts`: distinct `context` among them, sorted.
   - `forms`: distinct tokens (before folding) that folded to the term, across all sites, sorted.
   - `names`: group those sites by trimmed `text`; each group is `{"text","sites"}`. Sort by `sites`
     descending, then `text` in byte order. Keep the first 10.
3. Print term records sorted by `term`, then `summary`: `sites` (all site records), `tokens`, `kept`,
   `stopped`, `short`, `terms`.

## sample

**Hash.** FNV-1a 32-bit over the UTF-8 bytes of the site `id`: start at 2166136261; for each byte,
XOR it in, then multiply by 16777619 modulo 2^32. Compare hashes as unsigned integers.

**Surface order**: `schema`, `type`, `route`, `code`, `ui`, `doc`.

1. For each `want`, its **matching sites** are the sites whose lemma set holds `term` and whose trimmed
   `text` equals no trimmed `exclude` value.
2. Group the matching sites into **cells** by (`surface`, `context`). Order cells by surface order, then
   `context` in byte order. Within a cell, order sites by hash, ties by `id` in byte order.
3. Pick round-robin: take the first site of each cell in cell order, then the second of each cell that
   has one, and so on, stopping as soon as `--per-term` sites are picked or none are left. `picks` lists
   them in pick order. `cells` is the number of cells; `cells_picked` the number of cells with at least
   one pick. `sites` is the number of matching sites.
4. A candidate's `sites` is the number of distinct site IDs matching any of its wants; `surfaces` the
   number of distinct surfaces among those sites; `terms` its want terms, sorted.
5. Rank candidates by `surfaces` descending, then `sites` descending, then `candidate` in byte order.
   `rank` counts from 1.
6. Print each candidate, then its pick records by `term` in byte order. Then `summary`: `candidates`, and
   `picks` (the total length of all `picks` lists).

## reuse

For every concept named by an `old` or `new` record, sorted by `concept`:
- only `new`: `added`, reason `""`.
- only `old`: `removed`, reason `""`.
- the two `names` lists hold different sets: `rejudge`, reason `names`.
- the `new` `cells` hold a value the `old` `cells` do not: `rejudge`, reason `cells`.
- otherwise `reuse`, reason `""`.

Then `summary` with the four counts. A cell that disappeared is not a reason to rejudge.

## tally

- `verdicts`: count of `claim` records per verdict, all four keys always present.
- `strength`: count per strength, both keys always present.
- `candidates`: `judged` is the count with status `judged`; `total` counts every `candidate` record.
- `seeds`: `files` (seed records), `lines` and `read` (sums), `pass` true when every seed has
  `read` equal to `lines` (true with no seeds).
- `spend`: `total_cents` sums every `spend`; `cap_cents` is the `cap` value or 0; `over_cap` is true when
  a cap exists and `total_cents` is greater than it; `by_phase` sums per `phase`, keys in byte order.

Exit 1 when `seeds` `pass` is false, else 0.

## verify --check coverage

Extension of a path: the part of its last `/`-separated segment after the last `.` in that segment, or
`""` when the segment has no `.` or only a leading one.

**Problems**, collected in this kind order, each kind sorted by `path` then `surface`:
1. `unbucketed`: a `tracked` path with no `file` record.
2. `double`: a path with two or more `file` records (reported once).
3. `untracked`: a `file` path with no `tracked` record (reported once).
4. `uncounted`: a (`path`, `surface`) that has sites but no `count` record. `sites` is that site count.
5. `unmeasured`: a surface that has sites but no `count` record with that surface anywhere. `path` is
   `""`; `sites` is the surface's site count. Sorted by `surface`. Its files are also reported
   `uncounted`.
6. `no_sites`: a `count` with `pattern` above 0 whose (`path`, `surface`) has no sites. `pattern` is
   set; `sites` is 0.

Every problem prints `kind`, `path`, `surface`, `pattern`, `sites`, with `""` or 0 where the kind sets
none.

**Groups.** Group `count` records by (`surface`, extension of `path`). For each group: `pattern` is the
sum of `pattern`; `sites` is the sum, over its count records, of the sites with that `path` and
`surface`; `matched` is the sum of `min(sites, pattern)` per count record. Skip groups with `pattern` 0.
`coverage` is the basis-point ratio `matched / pattern`; `pass` is true when that ratio is at least
`--min-basis-points`.

**Summary**: `tracked` (tracked records), `files` (distinct `file` paths), `by_bucket` (distinct paths
per bucket, using each path's first `file` record), `groups` (group records printed), `failed_groups`, `problems`, and `pass`:
true when there are no problems and no failed group.

## verify --check map

A term is **required** when its `sites` is at least `--min-sites`, or its `by_surface` has a value above
0 under `type`, `schema` or `route`.

**Problems**, in this kind order:
1. `unmapped`: a required term with no `map` record. Sorted by `term`.
2. `unknown_term`: a `map` whose `term` has no `term` record. Sorted by `term`, then `to`; `concept`
   is the `to` value.
3. `unknown_concept`: a `map` whose `to` is neither `not-domain` nor a concept `id`. Sorted by `term`,
   then `to`; `concept` is the `to` value.
4. `unused_concept`: a concept no `map` points to. Sorted by `id`; `term` is `""`, `concept` is the
   `id`.

Each prints `kind`, `term`, `concept` (`""` where none).

**Summary**: `terms`, `required`, `mapped` (required terms with at least one map), `concepts`, `multi`
(terms with two or more distinct `to` values other than `not-domain`, known concept or not), `pass` (no
problems).

## verify --check evidence

The **sampled set** of a candidate is the union of the `picks` of every `pick` record with that
`candidate`.

For each claim in `id` order, run these checks in order, appending problems as found. `detail` is
what the kind says, else `""`.
1. `no_cites`: `cites` is empty.
2. For each cite in order: `unknown_site` (detail: the cite) when no site has that `id`; else
   `not_sampled` (detail: the cite) when it is not in the claim's candidate's sampled set.
3. For each name in order: `name_not_cited` (detail: the name) when no cited site that exists has the
   name in its lemma set.
4. `too_few_names`: verdict `SYNONYM` or `DISTINCT` with fewer than 2 names; or any other verdict with
   no names.
5. `no_relation`: verdict `DISTINCT` and relation `""`. `bad_relation`: any other verdict with a
   relation other than `""`.
6. For `HOMONYM` only:
   1. `too_few_cites` when fewer than 2 cites.
   2. For each name in order, its senses are the claim's `sense` records whose `term` is that name, in
      input order. Assign every input site (cited or not) whose lemma set holds the name to the first
      of its senses whose `prefix` is a byte prefix of the site's `path`; a site matching no sense is
      not counted. A sense's `sites` is the count assigned to it.
      Then: `no_senses` (detail: the name) when it has fewer than 2 senses; else `no_catch_all`
      (detail: the name) when the last sense's `prefix` is not `""`; else `empty_sense` (detail: the
      sense's `concept`) for each of its senses with 0 sites, in input order.
   3. `bad_sense` (detail: the term) for each of the claim's `sense` records, in input order, whose
      `term` is not one of its names.
7. For any other verdict: `bad_sense` (detail: the term) for each of the claim's `sense` records, in
   input order.

`strength` is `structural` when at least one existing cited site has surface `type` or `schema`, else
`usage`. The claim record's `problems` is the number of problems its checks appended.

Then for each `expect`, sorted by `claim`: `missing` when no claim has that `id`; else `canary_wrong`
(detail: `expected <expected verdict> got <claim verdict>`) when the verdicts differ.

Print, for each claim in `id` order, its claim record followed by a sense record for each sense whose
`term` is one of its names (`HOMONYM` only), in input order. Then the problems in the order collected.
Then `summary`: `claims`, `structural`, `usage`, `canaries` (expect records), `canaries_passed`,
`problems` (all problems, expect problems included), `pass` (no problems).
