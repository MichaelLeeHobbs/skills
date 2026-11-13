# Bookkeeping tool algorithm

Implement this to satisfy [CONTRACT.md](CONTRACT.md). Where the two seem to disagree, CONTRACT.md wins and
the disagreement is a bug to report.

## Common steps

1. Parse the arguments. On any usage problem, print `{"t":"error","line":0,"reason":"usage"}`, exit 2.
2. Read every input line (CONTRACT.md "Input lines"). For each line, in order, stop at the first failure
   and print one error record with that line's number, then exit 2:
   1. Not valid UTF-8 (a byte order mark included) or not valid JSON: `bad_json`.
   2. Not an object: `not_object`.
   3. `t` absent, not a string, or not accepted by this subcommand or mode: `unknown_type`.
   4. For each field of that type, in the order CONTRACT.md lists them: absent is `missing_field`
      (optional fields: `want.needle`, `want.paths`); present with the wrong type, or an `enum` value
      outside its list, is `bad_field`. A `names` array that repeats a value is `duplicate`; check the
      element types first, so `["a","a",5]` is `bad_field`.

   Valid JSON is strict: `NaN`, `Infinity` and `-Infinity` are `bad_json`. When an object repeats a key,
   the last value wins. Numeric option values are matched as ASCII digits only.
3. Only when every line passed step 2, run the subcommand's semantic checks over the records in input
   order. The first record that fails decides the error, with its line number. Exit 2.
4. Compute and print the output. Exit 1 if any `problem` record was printed, else 0.

**Byte order.** "Sorted" means sorted by the UTF-8 bytes of the string, compared byte by byte, a shorter
prefix first. Never use a locale-aware comparison. Pairs sort by the first element, then the second;
`n` sorts numerically.

**ASCII whitespace** is space, tab, LF, CR and form feed.

**Basis points.** A ratio `num / den` is `floor(num * 10000 / den)` in integer arithmetic, printed as the
integer part of `bp / 10000`, a dot, then `bp mod 10000` padded to four digits: 500 prints as
`"0.0500"`, 10000 as `"1.0000"`. A ratio with `den` 0 is 0.

## members

Semantic check: a second `rule` with the same `id` is `duplicate`. A selector the steps below reject is
`bad_selector` at that rule's line.

### Split the list

Walk the selector by code point with a depth counter and no open quote:

- Inside a quote: a `\` skips the next code point; the opening quote character closes it.
- `\` skips the next code point. A `\` at the very end rejects.
- `"` or `'` opens a quote.
- `(` and `[` add one to the depth; `)` and `]` subtract one, and a depth below 0 rejects.
- `,` at depth 0 ends a member.

At the end, an open quote or a depth other than 0 rejects. Trim each member of ASCII whitespace. An
empty member rejects (`a,,b`, a trailing comma).

### Read an identifier

Starting at a position, consume code points while one of these holds, and return the decoded text:

- an ASCII letter, ASCII digit, `_` or `-`, or any code point at or above U+0080: append it;
- `\` followed by a hex digit: consume 1 to 6 hex digits as value `v`, then one following ASCII
  whitespace code point if present (CR followed by LF counts as one). Append U+FFFD if `v` is 0, in
  U+D800 to U+DFFF, or above U+10FFFF, else the code point `v`;
- `\` followed by LF, CR or form feed, or by nothing: reject;
- `\` followed by any other code point: append that code point.

### Collect tokens

Walk each member from the start:

- `.`: step past it, read an identifier. Empty rejects. Add `c:` plus the identifier.
- `#`: the same, adding `i:`.
- `[`: step past it and any ASCII whitespace. If the next two code points are `*|`, step past them;
  else if the next is `|`, step past it. Read an identifier. If the next code point is `|` and the one
  after it is not `=` (or there is none), step past the `|` and read the identifier again (the first
  was a namespace). An empty identifier rejects. Add `a:` plus the identifier with ASCII letters
  lowercased. Then skip to the first `]` that is not inside a quote and not escaped, and step past it.
- `:`: step past it, and past a second `:` if present. Read an identifier; empty rejects. If the next
  code point is `(`, skip to its matching `)`, counting nested parentheses and ignoring any inside
  quotes or escaped. Nothing inside the parentheses is a token.
- `\`: read an identifier from here and discard it (an escaped element name).
- `(` anywhere else: skip to its matching `)` as above.
- `"` or `'`: skip to the closing quote; a `\` inside skips the next code point.

The split counts `(` and `[` on one depth, so a member such as `[)(]` passes it. When a skip above finds
no closing `]` or `)`, skip to the end of the member; this does not reject.
- Anything else: step past it.

The member's `tokens` are the collected tokens without repeats, sorted.

Output each member as CONTRACT.md shows. `untokened` counts members whose `tokens` is empty.

## refs

Semantic checks: a second `src` with the same `path`, or a second `want` with the same `token`, is
`duplicate`. A `want.paths` entry with no `src` record is `unknown_path`.

All matching is on UTF-8 bytes. A **name byte** is an ASCII letter, ASCII digit, `_`, `-`, or any byte at
or above 0x80.

For each `want`: the needle `N` is `needle` if given, else `token` without its first two characters.
The texts searched are the `src` records named in `paths` if given, else all `src` records, in `path`
byte order.

1. **Exact.** `N` occurs at offset `p` in text `T` with no name byte at `p - 1` (or `p` is 0) and no
   name byte at `p + len(N)` (or that is the end of `T`). If any text has one, the result is `exact`
   at the first text in path order that has one, at its smallest such offset.
2. **Fragment**, only when no text has an exact match. The candidates, in this order:
   - prefixes `N[0, k)` for `k` from `len(N) - 1` down to 3 where byte `N[k-1]` is `-` or `_`;
   - suffixes `N[k, len(N))` for `k` from 1 up to `len(N) - 3` where byte `N[k]` is `-` or `_`.

   A prefix `P` matches at `p` when `P` occurs there, there is no name byte at `p - 1` (or `p` is 0), and
   the bytes at `p + len(P)` begin with one of `${`, `#{`, `{`, `<%`, `'`, `"`, or a backtick.
   A suffix `S` matches at `p` when `S` occurs there, there is no name byte at `p + len(S)` (or that is
   the end), and the bytes before `p` end with one of `}`, `%>`, `'`, `"`, or a backtick.

   For each text in path order, try the candidates in order; the first candidate with a match in that
   text gives the result `fragment`, at its smallest offset in that text, with `via` set to the
   candidate. The first text with any fragment match decides.
3. Otherwise the result is `none`.

`line` is 1 plus the number of LF bytes before the match offset. Output one `ref` per `want` sorted by
`token`, then the summary counts.

## classify

Semantic checks, per record in input order:

- `member`: a second record with the same `(rule, n)` is `duplicate`. Then, if the member has tokens,
  every unseen token (below) must have a `ref` record with that exact `token`, else `missing_ref`.
- `ref`, `plan`, `foreign`: a repeated key is `duplicate`.
- `cell`: a repeated `cell` is `duplicate`; a `cell` with no `plan` record is `unknown_cell`.
- `canary`: a repeated `rule` is `duplicate`; a `rule` with no `member` record is `unknown_rule`.

**Folding.** With `--fold-case yes`, fold a `c:` or `i:` token by lowercasing its ASCII letters; leave
`a:` tokens unchanged. With `--fold-case no`, folding changes nothing. Folding applies only to the seen
test: `ref` records are looked up by the member's original token, for `missing_ref` and for verdicts. The seen set is the folded `seen`
tokens. A member token is **unseen** when its folded form is not in the seen set. In static mode every
token is unseen.

**Loaded sheets.** `L` is the union of `sheets` over `cell` records with status `reached`.

### Verdict for each member

1. No tokens: `UNDECIDABLE`, token `""`.
2. Let `U` be the unseen tokens, sorted. `U` empty: `SEEN`, token `""`.
3. Let `D` be the tokens in `U` whose `ref.kind` is `none`. If `D` is not empty, the member is a
   candidate with token `D[0]`:
   - static mode: `UNPROVEN`, reason `static-only`;
   - else the member's `sheet` has a `foreign` record: `UNPROVEN`, reason `foreign`;
   - else the `sheet` is not in `L`: `UNPROVEN`, reason `sheet-not-loaded`;
   - else `DEAD`.
4. Else let `F` be the tokens in `U` whose kind is `fragment`. If `F` is not empty: `UNPROVEN`, reason
   `fragment`, token `F[0]`.
5. Else `KEEP`, token `U[0]`.

A member's **verdict string** is its verdict, plus `:` and the reason when it is `UNPROVEN`.

### Canaries

A canary rule is one named by a `canary` record. Its `got` is the verdict string shared by all its
members, or `MIXED` if they differ. `ok` is `got` equal to `expect`. Canary members are printed with the
other members but are left out of rule records, file records and every summary count except `canaries`
and `canaries_ok`.

### Roll-ups

For each rule that is not a canary, `dead` is the sorted `n` of its `DEAD` members. If `dead` is not
empty, print a `rule` record: verdict `DEAD` when every member is `DEAD`, else `TRIM`. Its `file` is the
`file` of its member with the lowest `n`.

For each non-empty `file` taken by those rules' `file` (every non-canary rule has one, from the same
lowest-`n` member): print a `file` record when every non-canary rule with that file has verdict `DEAD`.
`rules` is how many there are.

### Cells and problems

Crawl mode only: `cells` is the number of `plan` records, `reached` the number of `cell` records with
status `reached`, `blocked` is `cells - reached` (a planned cell with no record counts as blocked).
`blocked_bp` is the basis points of `blocked / cells`. In static mode all three counts are 0 and
`blocked_bp` is `"0.0000"`.

Print problems in this order:

1. `canary`, key the rule, for each canary whose `ok` is false, sorted by rule.
2. `route_unreached`, key the route, for each distinct `plan.route` with no reached cell, sorted.
3. `blocked_over`, key `""`, when `blocked_bp` is above `--max-blocked-basis-points`.
4. `no_cells`, key `""`, when crawl mode has no `plan` record.

### Summary

Counts over non-canary members: `members`, then one count per verdict (`dead`, `keep`, `seen`,
`undecidable`, `unproven`), `by_unproven` mapping each reason that occurs to its count, `rules_dead` and
`rules_trim` (rule records by verdict), `files_dead` (file records), the cell counts, `canaries` (canary
records) and `canaries_ok`.

## verify --check plan

Semantic checks: a repeated `route.route`, `exclude.route`, `cell.cell` or `(allow.cell, allow.step)` is
`duplicate`.

Problems, all collected, then sorted by `key` and `reason` (byte order). Two problems with the same key
and reason (a cell and an exclusion both naming an unknown route `x`) are both printed:

- `route_unplanned`, key the route: a `route` with no `cell` and no `exclude` naming it.
- `unknown_route`: a `cell` (key the cell) or `exclude` (key the route) naming a route with no `route`
  record.
- For each `cell` and each step at index `i` from 0, key `<cell>#<i>`:
  - `bad_step`: the first string is not a verb below, or the number of strings after it differs from
    the verb's count. Check nothing else for that step.

    | Verb | Arguments |
    |---|---|
    | `goto` | path |
    | `auth` | role |
    | `click` | role, name |
    | `fill` | role, name, value |
    | `press` | key |
    | `wait` | role, name |

  - `denied`: the path of a `goto`, or the name of a `click`, `fill` or `wait`, contains a deny word,
    and no `allow` record names this cell and step. To find words, lowercase the ASCII letters and split
    into maximal runs of ASCII letters. A deny word is one of `approve`, `archive`, `buy`, `checkout`,
    `confirm`, `delete`, `destroy`, `erase`, `invite`, `logout`, `pay`, `publish`, `purchase`,
    `reject`, `remove`, `reset`, `send`, `signout`, `submit`, `transfer`, `unsubscribe`, or the
    consecutive pairs `log out` and `sign out`.
  - `unsafe_value`: a `fill` value that neither starts with `zz-` followed by at least one character,
    nor is `env:` followed by an ASCII uppercase letter or `_` and then only ASCII uppercase letters,
    digits and `_`.
  - `pii_shape`: any argument contains `@` or a run of 7 or more ASCII digits.
- `unknown_allow`, key `<cell>#<step>`: an `allow` naming a cell with no `cell` record, or a step index
  not less than that cell's step count.

Summary: `routes`, `excluded` and `cells` count records, `steps` sums the steps of all cells, `problems`
counts problem records.

## proof

No semantic checks beyond step 2.

For each key in the union of all keys, sorted: `b`, `a` and `e` count its `before`, `after` and
`expect` records.

- `e > b`: `expect_absent`.
- Otherwise `a > b - e`: `not_removed`; `a < b - e`: `extra_removed`.
- Separately, if the `decl` values of its `after` records, counted with repeats, are not all contained in
  those of its `before` records (each `before` value used at most once): `changed`.

Print problems sorted by key, then `reason` for one key in the order above. Summary: `keys` is the
union size, `before`, `after` and `expected` count records, `removed` sums `max(0, b - a)` over keys,
`problems` counts problem records.
