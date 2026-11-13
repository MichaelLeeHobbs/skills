# Bookkeeping tool algorithm

Implement this to satisfy [CONTRACT.md](CONTRACT.md). Where the two seem to disagree, CONTRACT.md wins and
the disagreement is a bug to report.

## Common steps

1. Parse the arguments. On any usage problem, print `{"t":"error","line":0,"reason":"usage"}`, exit 2.
2. Read every input line (CONTRACT.md "Input lines"). For each line, in order, stop at the first failure
   and print one error record with that line's number, then exit 2:
   1. Not valid UTF-8 (a byte order mark included) or not valid JSON: `bad_json`.
   2. Not an object: `not_object`.
   3. `t` absent, not a string, or not accepted by this subcommand: `unknown_type`.
   4. For each field of that type, in the order CONTRACT.md lists them: absent is `missing_field`;
      present with the wrong type, or a closed-list value outside its list, is `bad_field`. A `names`
      array that repeats a value is `duplicate`.
3. Only when every line passed step 2, run the semantic checks for the subcommand (below), record by
   record in input order, each record's checks in the order listed. The first failing record decides the
   error, using that record's line number. Exit 2. Step 2 covers every line before any semantic check
   runs, so a malformed line 9 wins over a `duplicate` on line 3.
4. Compute and print the output. Exit as CONTRACT.md "Exit codes" says.

**Byte order.** "Sorted" always means sorted by the UTF-8 bytes of the string, compared byte by byte, a
shorter prefix first. Never use a locale-aware comparison: `Z.ts` sorts before `a.ts`. Sorting by several
keys compares the first key, then the next on a tie.

**Basis points.** A ratio `num / den` is `bp = floor(num * 10000 / den)` in integer arithmetic. It is
printed as the integer part of `bp / 10000`, a dot, then `bp mod 10000` padded to four digits: 6100
prints as `"0.6100"`, 10000 as `"1.0000"`.

**Ceiling division.** `ceil(a / b)` for integers is `floor((a + b - 1) / b)`.

## close

Semantic checks, by record type:
- `sink`: a second `sink` with the same `symbol` is `duplicate`.
- `conduit`: a second `conduit` with the same `symbol` and `job` is `duplicate`; a `conduit` whose
  `symbol` is also a `sink` `symbol` is `duplicate`, on the `conduit` record wherever the `sink` sits.
- `fn`: a second `fn` with the same `symbol` is `duplicate`; a non-empty `wraps` that names no `call` `id`
  is `unknown_call`.
- `call`, `ref`, `unresolved`: a second record of any of these three types with the same `id` is
  `duplicate`; a non-empty `in_fn` that names no `fn` `symbol` is `unknown_fn`; a non-empty `in_site` that
  names no `call` `id` is `unknown_call`. (`unresolved` has neither field.)
- `opaque`: a second `opaque` with the same `path` is `duplicate`.
- `disposition`: a second `disposition` with the same `id` is `duplicate`; an `id` that names no
  `unresolved` `id` is `unknown_hit`.

Then:

1. **Opaque.** A `call`, `ref` or `unresolved` whose `path` equals an `opaque` `path` is opaque. Count
   them. Every later step ignores opaque records entirely: they are not uses, hits, sites or blocked.
   An opaque call can still sit in an `in_site` chain; step 7 walks through it, and it is never a hit.
   "The wrapped call is opaque" in step 3 means that call record is opaque; the `fn` path plays no part.
2. **Uses.** `uses(F)` is the number of non-opaque `call` records whose `callee` is `F` plus the number of
   non-opaque `ref` records whose `symbol` is `F`.
3. **Conduit table.** A map from symbol to a map from job to `(terminal, source)`. Start with every
   `conduit` record as `(terminal, declared)`. Then repeat until a full pass adds nothing: for each `fn`
   in `symbol` order, skip it if `component` is true, `wraps` is empty, `uses(symbol)` is 0, its `symbol`
   is a `sink` symbol, or the wrapped call is opaque. Let `w` be the wrapped call. Its candidates are
   `(job, marker)` of the sink when `w.callee` is a `sink` symbol, else every `(job, terminal)` in the
   table for `w.callee`, else none. Add each candidate whose job the function does not have yet, as
   `(terminal, auto)`. Existing entries never change.
4. **Markers.** The markers of a non-opaque record are a map from job to marker:
   - a `call` whose `callee`, or a `ref` whose `symbol`, is a `sink` symbol: `{job: marker}`;
   - else one whose callee or symbol is in the conduit table: `{job: terminal}` for each of its jobs;
   - an `unresolved` with a `disposition` whose `key` equals its `key` and whose `job` is not `none`:
     `{disposition job: disposition marker}`;
   - anything else: no markers.

   A **hit** is a pair (record, job) for each job in the record's markers.
5. **Unresolved.** For each non-opaque `unresolved`: no `disposition` is problem `undisposed`; a
   `disposition` with a different `key` is problem `stale`; either way it counts as blocked under the
   `unresolved` record's `job`. A matching `disposition` with `job` `none` counts as `not_site`.
   Steps 6 and 7 treat an `unresolved` record as having empty `in_fn` and `in_site`, so it is always a
   site.
6. **Inside conduits.** A hit (x, J) is `inside_conduit` when `x.in_fn` is non-empty and the conduit
   table has job J for `x.in_fn`.
7. **Parents.** For every other hit h = (x, J):
   1. Walk the `in_site` chain from `x`: `a = x.in_site`, then that call's `in_site`, and so on, until it
      is empty or a call repeats. The ancestors are each `a` where (a, J) is a hit that is not
      `inside_conduit`. If there is at least one, the parent of h is (the last one found, J): the outermost.
   2. Otherwise, if `x.in_fn` is a function `F` with no non-opaque `call` whose `callee` is `F` and
      exactly one non-opaque `ref` `r` whose `symbol` is `F`, walk the `in_site` chain from `r` the same
      way, starting at `r.in_site` (`r` itself is never a candidate). The parent of h is the outermost
      such ancestor, if any. This can be h itself; that is a cycle of one, handled below.
   3. Otherwise h has no parent.

   Find every parent first. Then, while following parents from some hit comes back to a hit already
   visited on that walk, remove the parent of every hit on that cycle. Repeat until no cycle remains.
8. **Sites.** A hit that is not `inside_conduit` and has no parent is a site. A hit with a parent is
   `same_as`. The **root** of a hit is where following its parents ends.
9. **Family** of a site s = (x, J): `outer` is x's marker for J. The descendants of s are the hits whose
   root is s, other than s. The leaves are descendants that are nobody's parent. With no leaves,
   `terminal` is `outer`; with leaves whose markers for J are all one value, `terminal` is that value;
   otherwise `terminal` is `mixed`. The family is `trigger:outer>terminal` using x's `trigger`.
10. Print, in order:
    1. A `site` for every site, sorted by `id`: `id` is `x.id` + `:` + J, then `job`, `family`, `path`
       (x's path).
    2. A `conduit` for every (symbol, job) in the conduit table, sorted by `symbol` then `job`, with
       `terminal`, `source` and `uses` (`uses(symbol)`).
    3. A `problem` for every `undisposed` and `stale` unresolved record, sorted by `id`.
    4. A `count` for every job named by a `sink`, the conduit table, a non-opaque `unresolved`, or any
       `disposition` (opaque or not) whose `job` is not `none`, sorted by job: `sites`, `same_as`, `inside_conduit` (hits
       of that job in each state) and `blocked`.
    5. `summary`: `calls`, `refs` and `unresolved` (all records of each type, opaque included), `opaque`
       (step 1), `hits`, `sites`, `blocked`, `not_site`, `problems`.

    Exit 1 if there is any problem.

## census

Semantic checks, by record type:
- `job`: a second `job` with the same `job` is `duplicate`.
- `site`: a second `site` with the same `id` is `duplicate`; a `job` with no `job` record is `unknown_job`.
- `blocked`: a second `blocked` with the same `job` is `duplicate`; `unknown_job` as for `site`.
- `convention`: a second `convention` with the same `id` is `duplicate`; `unknown_job` as for `site`; any
  `allow` or `deny` entry that is not a well-formed key is `bad_field`. A well-formed key is three
  non-empty segments, none containing `:` or `>`, written `trigger:outer>terminal`.
- `stratum`: a second `stratum` with the same `name` is `duplicate`; `read` greater than `files` is
  `bad_field`.
- `escape`: a `stratum` with no `stratum` record is `unknown_stratum`; `unknown_job` as for `site`; a
  second `escape` with the same `stratum`, `job` and `path` is `duplicate`.

**Escape limit table.** `U(k)`, the one-sided 95% Poisson upper limit for k observed events, times 100
and rounded up:

| k | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| U(k) | 300 | 475 | 630 | 776 | 916 | 1052 | 1185 | 1315 | 1444 | 1571 | 1697 |

For each job J (every `job` record):

1. `sites` is the number of its `site` records, `blocked` its `blocked` count (0 if none), `files` the
   number of distinct `path` values among its sites, and `m` is `ceil(sites / files)`, or 1 when `files`
   is 0. `escapes` is the number of its `escape` records; `k(s)` is the number in stratum s.
2. `state` is `unsampled` when there is no `stratum` record or some stratum has `files` at least 1 and
   `read` 0; else `escapes` when some stratum has `k(s)` above 10; else `ok`.
3. `bound` is 0 unless `state` is `ok`. Then it is the sum, over strata with `files` at least 1, of
   `ceil(U(k(s)) * files * m / (100 * read))`.

For each `convention` c of job J, in `id` order:

1. A site is in scope when `scope` is empty or some `scope` pattern matches its `path` (see Patterns).
   `in_scope` is the number of J's sites in scope.
2. A key matches a family when each of the three segments is `*` or equal to the family's segment at the
   same place (split the family at its first `:` and the first `>` after it). A family with no `:`, or
   no `>` after its first `:`, matches no key, not even `*:*>*`.
3. `conforming` is the number of in-scope sites whose family matches some `allow` key and no `deny` key.
4. `stale` is true when `in_scope` is at least 1 and no in-scope site's family matches any `allow` key.
5. `den` is `in_scope + blocked + bound`. When `state` is not `ok` or `den` is 0, `low` and `high` are
   `""`. Otherwise `low` is the basis-point ratio `conforming / den` and `high` is the basis-point ratio
   `min(conforming + blocked + bound, den) / den`.
6. `withheld` is the first that applies: `not_applicable` if `in_scope` is 0; `vague` if `status` is
   `vague`; `stale` if stale; `unsampled` or `escapes` if `state` is that value; `residual` if
   `blocked * 10000 > 500 * (sites + blocked)`; `range` if `high` minus `low` in basis points is above
   2000; else `""`. (`low` and `high` are never `""` when the `range` test is reached: the earlier
   tests catch both causes.)

Print, in order:
1. A `family` record per job and family with `sites` (count), sorted by `job`, then `sites` descending,
   then `family`.
2. A `convention` record per convention, sorted by `id`: `id`, `job`, `in_scope`, `conforming`, `low`,
   `high`, `withheld`.
3. A `job` record per job, sorted by `job`: `job`, `grade`, `sites`, `blocked`, `files`, `escapes`,
   `bound`, `state`.
4. `summary`: `jobs`, `sites` (all `site` records), `conventions`, `withheld` (conventions whose
   `withheld` is not empty), `pass`. `pass` is true when every job's `state` is `ok` and no job with
   `grade` `closed` has `escapes` above 0.

Exit 1 if `pass` is false. A withheld percentage alone never fails the run.

## sample

Semantic checks: a second `seed` is `duplicate`; a second `item` with the same `id` is `duplicate`; a
second `quota` with the same `stratum` is `duplicate`. After those checks pass, no `seed` at all is the
error `no_seed` with `line` 0.

**Hash.** FNV-1a, 32 bits, over the UTF-8 bytes of the seed value, one LF byte, then the item `id`: start
with `h = 2166136261`; for each byte, `h = h XOR byte`, then `h = (h * 16777619) mod 2^32`. Print it as
eight lowercase hexadecimal digits.

For each `quota`, sorted by `stratum`: take the items with that `stratum`, order them by hash ascending
(as an unsigned number), then by `id`, and pick the first `n`, or all if there are fewer. Print a `pick`
for each, with `rank` counting from 1 within the stratum. Then print `summary`: `items` (all `item`
records), `strata` (`quota` records), `picked`. Items whose stratum has no quota are never picked. Exit 0.

## audit

Semantic checks: a second `scan` with the same `id` is `duplicate`; a second `label` with the same `id`
is `duplicate`; a `label` whose `id` has no `scan` is `unknown_id`; a second `ruling` with the same `id`
is `duplicate`; a `ruling` whose `id` has no `scan`, no `label`, or a `label` with the same `family` as
its `scan` is `unknown_id`.

1. A scanned ID with a label of a different family is a disagreement; its `ruling` is the `winner` of its
   ruling record, or `""` if there is none. A scanned ID with no label is missing.
2. Print a `disagree` record per disagreement, sorted by `id`, then a `missing` record per missing ID,
   sorted by `id`.
3. Print `summary`: `sampled` (`scan` records), `labelled` (`label` records), `agree`, `disagree`,
   `upheld` (rulings with `winner` `worker`), `unruled` (disagreements with no ruling), `missing`, and
   `pass`: true when `sampled` is at least 1 and `upheld`, `unruled` and `missing` are all 0.

Exit 1 if `pass` is false. An empty audit never passes.

## owners

Semantic checks: a second `rule` with the same `line` is `duplicate`; a second `history` with the same
`path` is `duplicate`; a second `site` with the same `id` is `duplicate`.

For each site path:
1. For each distinct `section` value among the rules, find the rule in that section with the greatest
   `line` whose `pattern` matches the path (see Patterns). The owner set is the union of the chosen
   rules' `owners`.
2. If at least one rule matched: a non-empty owner set gives those owners with source `codeowners`; an
   empty one gives owner `unowned` with source `none`.
3. If no rule matched: a `history` record for the path with non-empty `owners` gives those owners with
   source `history`; otherwise owner `unowned` with source `none`.

Print an `owner` record per (job, family, owner, source) with `sites` (the number of that family's sites
resolved to that owner and source; a site with two owners counts for each), sorted by `job`, then
`family`, then `sites` descending, then `owner`, then `source`. Then print `summary`: `sites` (`site`
records), and `codeowners`, `history`, `unowned` (sites resolved each way, each site counted once
however many owners it has). Exit 0.

## verify --check scan

Semantic checks: a second `expect` with the same `case` and `id` is `duplicate`; a second `got` with the
same `case` and `id` is `duplicate`.

For each (case, id) in either set: an `expect` with no `got` is `missing`; a `got` with no `expect` is
`extra`; both with different families is `family`. Each problem carries `expected` and `got` (the
families, `""` where absent). Sort problems by `case`, then `id`. Print them, then `summary`: `cases`
(distinct `case` values over both types), `expected` and `got` (record counts), `problems`. Exit 1 if
there is any problem.

## Patterns

Scope patterns and CODEOWNERS patterns use one dialect. Paths are relative to the repo root, with `/`
separators and no leading `/`.

1. If the pattern ends with `/`, remove that `/` and mark it directory-only.
2. If it then starts with `/`, remove that `/` and mark it anchored. Otherwise mark it anchored if it
   contains a `/`.
3. Translate it left to right into a regular expression body. At each position take the first that
   applies: `/**/` becomes `/(?:.*/)?`; `/**` at the very end becomes `/.*`; `**/` at the very start
   becomes `(?:.*/)?`; any other `**` becomes `.*`; `*` becomes `[^/]*`; `?` becomes `[^/]`; any other
   character, including `\`, `[`, `{`, `+` and `.`, matches itself literally. A pattern that is empty
   after steps 1 and 2 matches nothing.
4. The expression is `^` if anchored, else `^(?:.*/)?`, then the body, then `/.*$` if directory-only,
   else `(?:/.*)?$`. `.` matches any character.

A pattern matches a path when the expression matches the whole path. A pattern that names a directory
therefore matches every file under it: `docs` matches `docs/a.md` and `src/docs/b.md`; `/docs/` matches
only `docs/a.md`; `*.ts` matches `src/a.ts`.
