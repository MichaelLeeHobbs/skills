# Bookkeeping tool algorithm

Implement this to satisfy [CONTRACT.md](CONTRACT.md). Where the two seem to disagree, CONTRACT.md wins and
the disagreement is a bug to report.

## Common steps

1. Parse the arguments. On any usage problem, print `{"t":"error","line":0,"reason":"usage"}`, exit 2.
2. Read every input line (CONTRACT.md "Input lines"). For each line, in order, stop at the first failure
   and print one error record with that line's number, then exit 2:
   1. Not valid UTF-8 (a byte order mark included) or not valid JSON: `bad_json`.
   2. Not an object: `not_object`.
   3. `t` absent, not a string, or not a type this subcommand accepts: `unknown_type`.
   4. For each field of that type, in the order CONTRACT.md lists them: absent is `missing_field`;
      present with the wrong type is `bad_field`; a closed field holding a value outside its list is
      `bad_field`; a `names` array that repeats a value is `duplicate`.
3. Only when every line passed step 2, run the semantic checks for the subcommand (below). Walk the
   records in input order; the first record that fails any of its checks decides the error, using that
   record's line number. For a "second record with the same key" check, the failing record is the
   later one. When one record fails several checks, the reason listed first for that subcommand wins.
   Exit 2. A `bad_field` on line 9 therefore wins over a `duplicate` on line 3.

**Line numbers** count standard input only: in a fixture, the first line after the arguments is line 1.
If a JSON object repeats a key, the last value wins.
4. Compute and print the output. Exit as CONTRACT.md "Exit codes" says.

**Byte order.** "Sorted" always means sorted by the UTF-8 bytes of the string, compared byte by byte, a
shorter prefix first. Pairs sort by their first part, then their second. Never use a locale-aware
comparison: `Z.ts` sorts before `a.ts`.

**Basis points.** A ratio `num / den` is `floor(num * 10000 / den)` in integer arithmetic, or 0 when
`den` is 0. It is printed as the integer part of `bp / 10000`, a dot, then `bp mod 10000` padded to four
digits: 9600 prints as `"0.9600"`, 10000 as `"1.0000"`.

**Sizes.** Every count printed as "files", "carriers" or "affected" is the size of a set of distinct
paths. Nothing is counted twice.

## sites

Semantic checks: a second `workspace` with the same `name`, a second `pkg` with the same `workspace`
and `name`, a second `alias` with the same `prefix`, a second `builtin` or `module` with the same `lang`
and `prefix`: `duplicate`. A `pkg` or `import` whose `workspace` has no `workspace` record:
`unknown_workspace`.

**Resolve** each `import` record to exactly one of: `ignored`, `unknown`, or a package.

If `lang` is `js`:
1. Find the `alias` records whose `prefix` is a prefix of `spec` (plain string prefix). If any, take
   the longest. Its `target` empty: `ignored`. Otherwise the candidate name `N` is the target; go to
   step 5.
2. `spec` starts with `.` or `/`: `ignored`.
3. `spec` starts with `node:`, or equals a `js` `builtin` prefix, or starts with that prefix followed by
   `/`: `ignored`.
4. Split `spec` on `/`. If the first segment starts with `@`: when there is no second segment or it is
   empty, `unknown`; otherwise `N` is the first two segments joined by `/`. Else `N` is the first
   segment.
5. Go to "Declared lookup".

For any other `lang`:
1. `spec` equals a `builtin` prefix of that `lang`, or starts with it followed by `.` or `/`:
   `ignored`.
2. Among the `module` records of that `lang`, find those whose `prefix` matches the same way. None:
   `unknown`. Otherwise `N` is the `package` of the one with the longest `prefix`.
3. Go to "Declared lookup".

**Declared lookup.** If `N` equals the non-empty `package` of any `workspace` record, the import is
`ignored` (a workspace of this repo, not a dependency). Otherwise look for a `pkg` with the import's
`workspace` and `name` equal to `N`, then for one with workspace `.` and that name. If found, the
package is its `real`, or its `name` when `real` is empty. If not found, the package is `N` and the pair
(import's `workspace`, `N`) is undeclared.

**Per package** `P`, over the import records that resolved to it:
- `files`: distinct `file` values (the direct files, `D`). `statements`: number of records. `refs`: sum
  of `refs`.
- `forms`: records per `form`. `areas`: distinct files per `area`. `workspaces`: distinct workspaces,
  sorted.
- **Carriers** `C`: start with the files of records resolved to `P` whose form is `reexport`. Then
  repeatedly add the `from` of every `edge` with form `reexport` whose `to` is in `C`, until nothing
  changes. Cycles end because a file is added once. `carriers` is the size of `C`.
- **Affected**: the union of `D`, `C`, and the `from` of every `edge` (either form) whose `to` is in
  `C`. `affected` is its size.

**Unused.** For each `pkg` whose `kind` is not `peer`, let `E` be its `real`, or its `name` when `real` is
empty. It is used when an import record resolved to package `E` and either the `pkg` workspace is `.` or
the record's workspace equals the `pkg` workspace. A `pkg` whose `name` starts with `@types/` is also used
when its base package is the `name` or effective package of any `pkg` record, or any import record in
any workspace resolved to it. The base of `@types/x` is `x`; the base of `@types/scope__x` is `@scope/x` (the first `__` becomes
`/`). Print one `unused` record, with the declared `name` as `package`, for each unused `pkg`, sorted by
workspace then package.

**Output.** One `package` record per package that any record resolved to, sorted by package. Then
`unused`. Then one `undeclared` record per distinct undeclared pair, sorted. Then one `unknown` record per
distinct (`file`, `spec`) pair that resolved to `unknown`, sorted. Then `summary`: `imports` (number of
`import` records), `ignored` (records resolved to `ignored`), `packages`, `unused`, `undeclared`,
`unknown` (counts of the records printed). Exit 1 if `unknown` is above 0.

## families

Semantic checks: a second `pkg` with the same `workspace` and `name`, a second `runtime` with the same
`workspace`, a second `job` with the same `id`, a second `map` with the same `package` and `job`:
`duplicate`. A `pkg` whose `workspace` has no `runtime` record: `unknown_workspace`.

1. **Declared pairs.** For each `pkg`, its effective package is `real`, or `name` when `real` is empty.
   Its runtime is `tooling` when `kind` is `dev`, otherwise the `runtime` of its workspace. Collect the
   distinct (effective package, runtime) pairs.
2. **Problems.**
   - `unmapped`: each distinct effective package with no `map` record of that `package`. `job` is `""`.
   - `unknown_job`: each `map` whose `job` is no `job` record's `id`.
   - `bad_extends`: each `map` whose `role` is `primary` and whose `extends` is not empty; or whose
     `role` is not `primary` and no `map` exists with `package` equal to its `extends`, the same `job`,
     and role `primary` (an empty `extends` never matches).
   Problems cover every `map` record, declared or not. Sort them by kind in the order `unmapped`,
   `unknown_job`, `bad_extends`, then by `package`, then by `job`.
3. **Families.** For each known job (a `job` record's `id`) and each runtime that occurs in the declared
   pairs: the primaries are the distinct effective packages declared in that runtime that have a `map`
   for this job with role `primary`. With two or more primaries it is a family. Its attached packages
   are the distinct effective packages declared in that runtime or in `tooling` that have a `map` for
   this job whose role is not `primary` and whose `extends` is one of the primaries. Both lists sorted.
4. Order families by job, then runtime, and number them from `F0001` (four digits, then the number as it
   is past 9999).
5. Print the problems, the families, then `summary`: `packages` (distinct effective packages),
   `mapped` (those with at least one `map` record), `families`, `problems`. Exit 1 if there is any
   problem.

## pins

Semantic checks, per record in input order:
- An instance ID (`from`, `to`, `id`, `root`) must contain `@` at a position after the first character;
  otherwise `bad_field`. Its name is the part before the last such `@` (`@scope/x@1.2.0` has name
  `@scope/x`).
- A second `app` with the same `app`, a second `local` with the same `id`, a second `size` with the same
  `app` and `package`: `duplicate`.
- A `drop` or `size` whose `app` has no `app` record: `unknown_app`.

Only `dep` edges of kind `prod` or `peer` are followed. An instance is dropped when its name is one of
the drop's `names`. The root is never treated as dropped.

For each `drop`, in input order:
1. `R`: every instance reachable from the app's root, root included.
2. `K`: every instance reachable from the root without entering a dropped instance, root included.
3. If no instance in `R` is dropped: status `absent`.
4. `pinned_by`: the distinct instances in `K`, other than the root and other than `local` instances,
   that have a followed edge to a dropped instance, sorted. If non-empty: status `pinned`.
5. Otherwise status `gross`. `closure` is the distinct names of the instances in `R` and not in `K`,
   sorted. `initial` and `lazy` are the sums of those fields over the `size` records with the drop's
   `app` whose `package` is in `closure`.

For `absent` and `pinned`, `closure` is `[]` and both sums are 0. Print each `drop` record with `names`
sorted, then `summary` with `drops` and the count of each status. Exit 0.

## bytes

Semantic checks, per record in input order: a second `chunk` with the same `app` and `chunk`, a second
`rename` with the same `alias`: `duplicate`. A `chunk` whose `mappings` fails any decode rule below:
`bad_field`.

**Decode** `mappings`:
1. An empty string has no groups. Otherwise split it on `;` into groups; group `g` describes output
   line `g`. More groups than entries in `lines`: `bad_field`.
2. An empty group has no segments. Otherwise split it on `,`; an empty segment is `bad_field`.
3. Each segment is base64 VLQ. Alphabet: `A`-`Z` are 0 to 25, `a`-`z` 26 to 51, `0`-`9` 52 to 61, `+` 62,
   `/` 63; any other character is `bad_field`. Read characters into values: for each character's value
   `c`, add `(c & 31)` shifted left by 5 bits per earlier character of this value; when `(c & 32)` is 0
   the value ends. A segment that ends inside a value is `bad_field`. For a finished value `v`, the low
   bit is the sign: the number is `v >> 1`, negated when `v & 1` is 1.
4. A segment holds 1, 4 or 5 numbers; any other count is `bad_field`.
5. The first number adds to the column, which restarts at 0 for every group. The second adds to the
   source index, the third and fourth to the original line and column, the fifth to the name index;
   these four carry on across groups, starting at 0. A column below 0, below the previous segment's
   column in the same group, or above `lines[g]` is `bad_field` (equal to either is allowed). Original
   line, original column and name index are never range-checked. A source index outside the `sources`
   array is `bad_field`.

**Attribute** each line `g` of `lines`: the units before the first segment's column are unattributed. A
segment covers from its column to the next segment's column in the group, or to `lines[g]` for the last
one. A 1-number segment's units are unattributed. A line with no group or no segments is entirely
unattributed. Otherwise the units go to the segment's source string, classified as follows:
1. An empty string is unattributed.
2. If it contains `://`, keep only the part after the first `://`.
3. Split it on `/`. Find the last segment equal to `node_modules` that is followed by a non-empty
   segment. None: first-party.
4. If the following segment starts with `@`: when the segment after it exists and is not empty, the
   package is the two joined by `/`, otherwise unattributed. If it starts with `.`: unattributed.
   Otherwise the package is that segment. The copy root is every segment up to and including the
   package's last segment, joined by `/`.
5. If a `rename` has the package as `alias`, use its `package` instead. The copy root stays the path
   as written, so an aliased install and a plain install count as two copies.

**Per app.** `total` is the sum of `lines` over the app's chunks. Units in chunks with `initial` true
count as `initial`, the rest as `lazy`. Only segments covering at least one unit count toward packages
and copy roots. `copies` is the number of distinct copy roots of that package in the app. `first_party`
is the units that went to first-party sources. `unattributed` is `total` minus `first_party` minus every
package's units. `coverage` is the basis-point ratio `(total - unattributed) / total`. `pass` is true
when `total` is above 0 and `coverage` is at least `--min-basis-points`.

**Output.** For each app in sorted order: a `size` record per package with at least one unit, sorted by
package, then the `app` record. Then `summary`: `apps`, `chunks` (number of `chunk` records), `failed`
(apps whose `pass` is false). Exit 1 if `failed` is above 0.

## verify --check coverage

Semantic checks: a second `count`, `adjust`, `tracked` or `exclude` with the same `path` as an earlier
record of its own type: `duplicate`. An `adjust` whose `path` has no `count` record: `unknown_path`.

1. `unlisted`: each `tracked` path with no `count` and no `exclude` record, sorted.
2. Over files that are not adjusted, per workspace and in total: `parser` is the sum of `parser`,
   `pattern` the sum of `pattern`, `covered` the sum of `min(parser, pattern)` per file, `coverage` the
   basis-point ratio `covered / pattern`.
3. A workspace passes when its `pattern` is 0 or its `coverage` is at least `--min-basis-points`. Every
   workspace named by a `count` record gets a record, even when all its files are adjusted.
4. `adjusted_share` is the basis-point ratio of `adjust` records to `count` records.
5. `pass` is true when there is at least one `count` record, the total `coverage` is at least
   `--min-basis-points`, `adjusted_share` is at most `--max-adjusted-basis-points`, every workspace
   passes, and nothing is unlisted. An empty input never passes.
6. Print the `unlisted` records; a `short` record for each non-adjusted file whose `parser` is below its
   `pattern`, sorted by path; an `adjusted` record per `adjust`, sorted by path; the `workspace` records,
   sorted; then `summary` with `files` (count records), `adjusted`, `unlisted`, then the totals,
   `coverage`, `adjusted_share` and `pass`. Exit 1 if `pass` is false.
