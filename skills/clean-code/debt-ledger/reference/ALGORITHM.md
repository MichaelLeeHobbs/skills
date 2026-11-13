# Bookkeeping tool algorithm

Implement this to satisfy [CONTRACT.md](CONTRACT.md). Where the two seem to disagree, CONTRACT.md wins and
the disagreement is a bug to report.

## Common steps

1. Parse the arguments. On any usage problem, print `{"t":"error","line":0,"reason":"usage"}`, exit 2.
2. For every subcommand but `adapt`, read every input line (CONTRACT.md "Input lines"). For each line, in
   order, stop at the first failure and print one error record with that line's number, then exit 2:
   1. Not valid UTF-8 (a byte order mark included) or not valid JSON: `bad_json`. `NaN` and
      `Infinity` are not valid JSON. A string or object key holding an unpaired surrogate escape
      (`"\ud800"`) is `bad_json`. When an object repeats a key, the last value wins. These JSON rules
      also apply to the `eslint` and `basedpyright` formats of `adapt`.
   2. Not an object: `not_object`.
   3. `t` absent, not a string, or not accepted by this subcommand: `unknown_type`.
   4. For each required field of that type, in the order CONTRACT.md lists them: absent is
      `missing_field`; present with the wrong type is `bad_field`.
   5. A closed-list field (CONTRACT.md table) with a value outside its list: `bad_field`.
3. Only when every line passed step 2, run the semantic checks for the subcommand (below) in input order.
   The first failing record decides the error, using that record's line number; a record failing two
   checks reports the one listed first. A record that must name another (an `old` its `source`, an
   `adjust` its `count`) may name one that comes later in the input. Exit 2.
4. Compute and print the output. Exit as CONTRACT.md "Exit codes" says.

**Byte order.** "Sorted" means sorted by the UTF-8 bytes of the string, compared byte by byte, a shorter
prefix first. Never use a locale-aware comparison. Sorting by several keys compares the first key, then
the next on a tie. An integer key compares numerically.

**Trim** means removing leading and trailing ASCII spaces and tabs.

**Collapse** means replacing every run of ASCII spaces and tabs with one space, then trimming.

**Short hash** of a string: the SHA-256 digest of its UTF-8 bytes, written as lowercase hex, first 16
characters.

**Dates.** A valid date is exactly `YYYY-MM-DD` with ASCII digits, month 01 to 12, and a day that exists in
that month (February has 29 days when the year is divisible by 4 and not by 100, or divisible by 400).
The day number of a date is the count of days since 1970-01-01 (negative before it), by the proleptic
Gregorian calendar, for every year from 0000 to 9999 (year 0000 is a leap year). Date libraries that
map years below 100 to the 1900s get this wrong. The days between two dates is the difference of their day numbers.

**Basis points.** A ratio `num / den` is `floor(num * 10000 / den)` in integer arithmetic. It is printed as
the integer part of `bp / 10000`, a dot, then `bp mod 10000` padded to four digits: 9600 prints as
`"0.9600"`.

## adapt

Read standard input as bytes. If it is not valid UTF-8, print `bad_json` with line 0 (for `eslint` and
`basedpyright`) or line 1 (for `rubocop` and `phpstan`) and exit 2. A leading byte order mark is removed.
After computing entries, merge entries with the same `path` and `rule` by summing `count`, sort, print, and
print `summary`: `format`, `unit`, `entries` (merged entry records), `units` (sum of `count`), `ruleoffs`.

### eslint

Parse the whole input as one JSON value. Not valid JSON: `bad_json`, line 0. The value must be an object
whose every value is an object whose every value is an object holding an `int` field `count` of at least
1; otherwise `bad_format`, line 0. Each outer key is a `path`, each inner key a `rule`; emit one entry per
pair with that `count`.

### basedpyright

Parse as JSON as for `eslint`. The value must be an object with an object field `files`; each value of
`files` must be an array whose every element is an object with a non-empty string field `code`; otherwise
`bad_format`, line 0. Emit one entry per element with `path` the key, `rule` the `code` and `count` 1.

### rubocop

Process lines (split on LF, one trailing CR removed, line numbers from 1). Keep a current cop (none at the
start) and an "in exclude list" flag (false).

For each line:
1. If its trimmed text is empty or starts with `#`, skip it. The flag is unchanged.
2. If the line starts with a character other than space or tab: its text with trailing spaces and tabs
   removed must end with `:`, otherwise `bad_format` at this line. The current cop becomes that text
   without the final `:`. Clear the flag.
3. Otherwise the line is indented. If there is no current cop: `bad_format` at this line.
   1. If the trimmed text is exactly `Exclude:`, set the flag.
   2. Else if the flag is set and the trimmed text starts with `- `: the item is the rest of the trimmed
      text after `- `, trimmed. If it is at least two characters long and starts and ends with the same
      character, `'` or `"`, remove those two characters. An item empty after that is `bad_format` at
      this line. Emit an entry: `path` the item, `rule` the current cop, `count` 1.
   3. Else clear the flag. If the trimmed text, with every space and tab removed, is exactly
      `Enabled:false`, record the current cop as a rule-off.

Print rule-offs as `ruleoff` records, distinct, sorted by `rule`, after the entries.

### phpstan

Process lines as for `rubocop`. An entry starts at each line whose trimmed text is exactly `-`; lines
before the first such line are ignored. Within an entry, a line whose trimmed text starts with one of
`message:`, `rawMessage:`, `identifier:`, `count:` or `path:` sets that field to the rest of the trimmed
text after the colon, trimmed. Other lines are ignored. When a key repeats within one entry, the last
wins. At the next entry start or the end of input, close the entry:

- `path`: if it is at least two characters long and starts and ends with the same character, `'` or `"`,
  remove those two characters. Absent, or empty after that: `bad_format` at the entry's start line.
- `count`: absent means 1; otherwise one or more ASCII digits, at least 1, else `bad_format` at the entry's
  start line.
- `rule`: `identifier` if present and non-empty; else `message:` plus the short hash of the `message`
  value as written (quotes included), or of `rawMessage` when `message` is absent. Neither present:
  `bad_format` at the entry's start line.

## reuse

Semantic checks: a second `rename` with the same `from` is `duplicate`. After rekeying (below), two `old`
records with the same path, kind, rule, hash and ordinal are `duplicate` (the line of the later record).

1. **Rekey.** For each `old` record whose `path` equals some rename's `from`, replace its path with that
   rename's `to`. `renamed` counts the old records rekeyed. Do not follow chains.
2. **Hash** each `new` record: the short hash of its collapsed `text`.
3. **Group** new records by (path, kind, rule, hash). Within a group, sort by `line`, then input order;
   ordinals are 0, 1, 2 in that order. Group old records by the same key; within a group sort by
   `ordinal` and number them 0, 1, 2 in that order (saved ordinals may have gaps).
4. For each key with `m` old and `n` new members:
   - `m` equals `n`: new member `i` is `reuse`, carrying `dated` and `first_seen` from old member `i`.
   - otherwise: new member `i` below `min(m, n)` is `redate`, carrying `first_seen` from old member `i`;
     new member `i` at or above `m` is `added`; old member `i` at or above `n` is `removed`.
5. Print the new members' records sorted by path, kind, rule, hash, then ordinal. Then the `removed`
   records sorted the same way, using the renumbered ordinal and the rekeyed path. Then `summary`: `old`
   and `new` (record counts), the counts of `reuse` (as `reused`), `redate` (as `redated`), `added` and
   `removed` records, and `renamed`.

## baseline

Semantic checks: a second `source` with the same `source` is `duplicate`. An `old` or `new` whose `source`
has no `source` record is `unknown_source`. A second `old`, or a second `new`, with the same source, path
and rule is `duplicate`. A second `rename` with the same `from` is `duplicate`. A second `inline` with the
same linter, path, rule and scope is `duplicate`. A second `toolchain` is `duplicate`.

**Whole-token match.** A rule occurs in a config line when its exact text appears in the line at a
position where the character before (if any) and the character after (if any) are not an ASCII letter,
digit, `_`, `-`, `/`, `@` or `.`.

**Budgets.** For each (linter, path, rule) key, the line budget is `max(0, new - old)` of its `line`-scope
`inline` record (0 when there is none), and the key is unlimited when its `block`-scope record has `new`
greater than `old`. Budgets are shared by every source with that linter and are used once.

Process sources sorted by `source`. For each:
1. Rekey `old` entries whose path equals a rename's `from` to its `to`; `rekeyed` counts those entries.
   Entries that now share a path and rule have their counts summed.
2. Take every (path, rule) present in the rekeyed old or the new entries, sorted by path then rule. Let `o`
   and `n` be its old and new counts (0 when absent).
   - `n > o`: one change, class `grew` if `o > 0` else `added`, units `n - o`.
   - `n < o`: `u = o - n` units to place, in this order, each step taking what it can from what is left:
     1. `deleted-file`: all of it, if the path appears in a `gone` record.
     2. `moved-inline`: from the key (linter, path, rule): all of it if unlimited, else
        `min(left, remaining line budget)`, reducing the budget.
     3. `moved-blanket`: the same from the key (linter, path, `*`).
     4. `config-changed`: all of it, if the rule occurs in any `config` line.
     5. `fixed`: the rest.
     Print one `change` per class that received units, in this order.
   - `n = o`: nothing.
3. Print the source's `source` record: `unit`; `old` and `new` (sums after rekeying); `in` and `out`
   (units of rises and of drops); units per class; `rekeyed`; `conserved`, true when
   `old + in - out = new` and the class units sum to `in + out`.

Print all `change` records for every source first, in source order, then the `source` records, then
`summary`: `sources`, `changes` (count of `change` records), `fixed_reliable` (false when a `toolchain`
record is present).

## owner

Semantic checks, on `line` records in input order. Remove one trailing CR, trim. Skip a line that is empty,
starts with `#`, or starts with `[` or `^[` (a section header). Otherwise split it on runs of spaces and
tabs: the first piece is the pattern, the rest are owners. The pattern is `unsupported_pattern` if it
contains `\`, `[`, `]` or `{`, or starts with `!`.

**Pattern grammar.** Remove one trailing `/` and note it as directory-only. The pattern is anchored if it
starts with `/` (remove it) or still contains a `/`. Split it on `/` into pattern segments.

A pattern segment matches a path segment when, reading `*` as any run of characters (possibly empty) and
`?` as exactly one character, the whole path segment matches. Every other character matches itself.

Split the item path on `/` into path segments, `L` of them.

- **Anchored.** The pattern matches if its segments match the first `k` path segments for some `k` from 1
  to `L`, where a pattern segment exactly `**` matches zero or more path segments. `k` below `L` (the
  pattern names a folder holding the path) is allowed unless the last pattern segment is exactly `*`.
  Directory-only patterns need `k` below `L`.
- **Not anchored** (one segment): the pattern matches if it matches any path segment, or any but the last
  when directory-only. A lone `**` here is an ordinary segment pattern and matches any path segment.

**Resolve** each item, in input order:
1. `tag`: if the tag matches `^[A-Z][A-Z0-9]*-[0-9]+$` (a ticket key) or `^@[^/ ]+/[^ ]+$` (a team handle),
   the owner is the tag.
2. `codeowners`: find the last kept line whose pattern matches the path. Its team owners are the owners
   that start with `@` and contain `/`, in order, joined with one space. If there are any, that is the
   owner. Otherwise (no match, or the last match lists only individuals or nothing), go on.
3. `package`: the longest `package` path that equals the item's folder or one of its ancestor folders (the
   item path starts with it followed by `/`), comparing length in bytes. A package path `.` matches
   every item and counts as length 0, so any other matching package wins over it.
4. `folder`: the path's first segment when it has a `/`, otherwise `.`.

Print one `owner` per item, then `summary`: `items` and `by_source`.

## verify --check coverage

Semantic checks: a second `count` with the same `path` is `duplicate`. A second `adjust` for the same
`path` is `duplicate`. An `adjust` whose `path` has no `count` record is `unknown_path`.

1. `files` is the number of `count` records. `adjusted` is the number of `adjust` records.
2. Over files that are not adjusted: `found` is the sum of `found`, `loose` the sum of `loose`, `covered`
   the sum of `min(found, loose)` per file.
3. `coverage` is the basis-point ratio `covered / loose`, or 0 when `loose` is 0 and `found` is above 0,
   or 10000 when both are 0.
4. `adjusted_share` is the basis-point ratio `adjusted / files`, or 0 when `files` is 0.
5. `pass` is true when `files` is at least 1, `coverage` is at least `--min-basis-points`, and
   `adjusted_share` is at most `--max-adjusted-basis-points`. An empty input never passes.
6. Print a `short` record for every non-adjusted file whose `found` is less than its `loose`, sorted by
   `path`. Then an `adjusted` record for every adjusted file, sorted by `path`. Then `summary`. Exit 1 if
   `pass` is false.

## tally

Semantic checks: a second `run` is `duplicate`. A second `last` is `duplicate`. A second `source`, or a
second `lastsource`, with the same `source` is `duplicate`. After every other check, no `run` record is
`missing_run` with line 0.

1. `counts`: `markers`, `inline`, `blanket` are the item counts of each kind. `by_tag` counts `marker`
   items per `rule`.
2. `owners`: `by_owner` counts all items per `owner`.
3. `ages`: for each item, empty `dated` counts as `unknown`; otherwise `days` is the days from `dated` to
   the run date, 0 if negative, and falls in `0-29`, `30-89`, `90-364`, `365-729` or `730+`. Always print
   all six keys in the order shown in CONTRACT.md.
4. `oldest`: items with a non-empty `dated`, sorted by `dated`, then `path`, `line`, `kind`, `rule`; the
   first 20, each with `days` as in step 3.
5. **Pattern hash.** For each `pattern` record build the compact JSON object `{"kind":..,"lang":..,"text":..}`
   with keys in that order, escaped as CONTRACT.md "Output format" says. Sort these strings, join each
   followed by LF, and take the full SHA-256 hex (64 lowercase characters) of the UTF-8 bytes. With no
   patterns, hash the empty string.
6. `history`: `date`, `commit` and `spec` from `run`; `patterns` the pattern hash; the three counts from
   step 1; `sources` maps each `source` record's `source` to its `units`.
7. `trend`: with no `last` record, `comparable` false, `reason` `first_run`, and every delta 0 with
   `sources` mapping this run's sources to 0. Otherwise each count delta is this run minus `last`;
   `sources` maps every source in either this run or the `lastsource` records to this run's units minus
   the last (an absent side is 0). `reason` is the first that applies: `spec_changed` if `spec` differs
   from `last.spec`; `patterns_changed` if the pattern hash differs from `last.patterns`;
   `not_descendant` if `descends` is false; else `ok`. `comparable` is true only for `ok`.

Exit 0.
