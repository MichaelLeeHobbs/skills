# Census tool algorithm

Implement this to satisfy [CONTRACT.md](CONTRACT.md). Where the two seem to disagree, CONTRACT.md wins
and the disagreement is a bug to report.

## Common steps

1. Parse the arguments. On any usage problem, print `{"t":"error","line":0,"reason":"usage"}`, exit 2.
2. Read every input line (CONTRACT.md "Input lines"). For each line, in order, stop at the first failure
   and print one error record with that line's number, then exit 2:
   1. Not valid UTF-8 (a byte order mark included) or not valid JSON: `bad_json`.
   2. Not an object: `not_object`.
   3. `t` absent, not a string, or not accepted by this subcommand or check: `unknown_type`.
   4. For each required field of that type, in the order CONTRACT.md lists them: absent is
      `missing_field`; present with the wrong type is `bad_field`.
   5. A closed-list field (`prefix` `status`, `cause` `cause`) with a value outside its list:
      `bad_field`.
3. Only when every line passed step 2, run the semantic checks for the subcommand (below) in input
   order. The first failing record decides the error, using that record's line number. Exit 2. A
   `bad_field` on line 9 therefore wins over a `duplicate` on line 3.
4. Compute and print the output. Exit as CONTRACT.md "Exit codes" says.

**Byte order.** "Sorted" means sorted by the UTF-8 bytes of the string, compared byte by byte, a
shorter prefix first. Never use a locale-aware comparison: `Z.css` sorts before `a.css`.

**Trim** means removing leading and trailing ASCII spaces, tabs, CR and LF.

**Basis points.** A ratio `num / den` is `floor(num * 10000 / den)` in integer arithmetic, and 0 when
`den` is 0. It prints as the integer part of `bp / 10000`, a dot, then `bp mod 10000` padded to four
digits: 9800 prints as `"0.9800"`, 10000 as `"1.0000"`.

**Specificity** is a triple `[a, b, c]`. Compare two by `a`, then `b`, then `c`. The maximum of an empty
list is `[0, 0, 0]`. Adding two triples adds each part.

## Selector parsing

Parse a rule's `selector` as a selector list. Any failure anywhere, including inside a pseudo-class
argument, makes the whole rule **bad**. Work on Unicode code points.

**Whitespace** is space, tab, LF, CR and form feed.

**Ident.** One or more ident characters. An ident character is an ASCII letter or digit, `-`, `_`, any
code point at or above U+0080, or an escape. An escape is `\` followed by:
- one to six hex digits, then one optional whitespace character, which is consumed. The value is that
  code point; 0, a surrogate (U+D800 to U+DFFF) or anything above U+10FFFF becomes U+FFFD;
- otherwise any one code point other than LF, which is taken literally (`\:` is `:`, `\/` is `/`).

A `\` at the end of the input or before LF is a failure. An ident's value is its text with escapes
replaced by their values.

**Selector list.** One or more complex selectors separated by `,`. Whitespace around each is ignored.
An empty item (a leading, trailing or doubled comma, or an all-whitespace list) is a failure.

**Complex selector.** A compound, then zero or more pairs of combinator and compound. After a compound,
skip whitespace. If the next character is `>`, `+` or `~`, it is the combinator: consume it, skip
whitespace, and a compound must follow. Otherwise, if whitespace was skipped and the next character can
start a compound (`*`, `#`, `.`, `[`, `:`, `\` or an ident character), the combinator is a descendant
combinator. Otherwise the complex selector ends; the
next character must be `,` or the end of the list. A **relative** complex selector (only inside `:has`)
may begin with `>`, `+` or `~` before its first compound.

**Depth** of a complex selector is its number of compounds. Compounds inside pseudo-class arguments do
not add to it.

**Compound.** One or more simple selectors with nothing between them. A simple selector is one of:

| Form | Specificity | Classes collected |
|---|---|---|
| `*` | `[0,0,0]` | none |
| ident (a type selector) | `[0,0,1]` | none |
| `#` ident | `[1,0,0]` | none |
| `.` ident | `[0,1,0]` | the ident's value |
| `[` attribute `]` | `[0,1,0]` | see below |
| `:` name, not followed by `(` | see pseudo-classes | none |
| `:` name `(` arguments `)` | see pseudo-classes | from parsed arguments |
| `::` name, optionally `(` arguments `)` | see pseudo-elements | from parsed arguments |

Any other character where a simple selector must start is a failure. That includes `&` (unflattened
nesting), `%` (a Sass placeholder), `|` (namespaces are not supported) and `/` (a comment left in).

**Attribute.** `[`, optional whitespace, an ident (the attribute name), optional whitespace, then
either `]`, or an operator (`=`, `~=`, `|=`, `^=`, `$=`, `*=`), optional whitespace, a value (an ident
or a quoted string), optional whitespace, an optional ident (a flag such as `i`), optional whitespace,
`]`. A quoted string starts with `'` or `"` and ends at the next unescaped matching quote; inside it,
`\` followed by LF is removed and other escapes follow the ident rule. An unterminated string is a
failure. When the attribute name, compared ASCII case-insensitively, is `class` and the value is not
empty, collect the whole value as one class token, whatever the operator (`[class*="Mui"]` collects
`Mui`).

**Arguments.** After `(`, scan to the matching `)`. Track nesting of `(` and `[`, skip quoted strings
and escapes, with one depth counter: `(` or `[` raises it, `)` or `]` lowers it. A `)` at depth 0 ends
the arguments. A `]` at depth 0, or reaching the end with no ending `)`, is a failure (`:lang([)` is
bad). The text between the parentheses is the argument text.

**Pseudo-classes.** Compare names ASCII case-insensitively.
- `before`, `after`, `first-line`, `first-letter` without arguments (legacy pseudo-elements):
  `[0,0,1]`. With arguments they fall under "any other name with arguments".
- Any other name without arguments: `[0,1,0]`.
- `where(L)`: parse L as a selector list; `[0,0,0]`.
- `is(L)`, `not(L)`: parse L as a selector list; the maximum specificity of its complex selectors.
- `has(L)`: parse L as a list of relative complex selectors; the maximum of their specificities.
- `nth-child(X)`, `nth-last-child(X)`: if X contains, outside any nested parentheses, whitespace then
  `of` (ASCII case-insensitive) then whitespace, parse the text after that whitespace as a selector list;
  `[0,1,0]` plus its maximum. Otherwise `[0,1,0]`.
- `host(L)`, `host-context(L)`: parse L as a selector list; `[0,1,0]` plus its maximum.
- Any other name with arguments: `[0,1,0]`; the argument text is not parsed.

**Pseudo-elements.** `::` name: `[0,0,1]`. `::slotted(L)`: parse L as a selector list; `[0,0,1]` plus its
maximum. Any other pseudo-element with arguments: `[0,0,1]`; the argument text is not parsed.

A compound's specificity is the sum of its simple selectors. A complex selector's specificity is the
sum of its compounds. Classes collected from parsed arguments join the rule's class tokens.

## census

Semantic checks: a second `file` with the same `path`, `rule` with the same `id`, `decl` with the same
`id`, `prefix` with the same `prefix` or `presence` with the same `token` is `duplicate`. A `rule`
whose `path` has no `file` is `unknown_path`. A `decl` whose `rule` has no `rule` record is
`unknown_rule`. When one record fails two of these, report the first in this list. Only when every
record passes them, compute every rule's internal tokens (below) and check each `presence` in input
order: one whose `token` is not an internal token of any rule is `unknown_token`, at its own line. A
`duplicate` on line 5 therefore wins over an `unknown_token` on line 2.

**Per rule.** A rule is a canary rule when its file has `canary` true.
1. Parse the selector. A bad rule gets `selectors` 0, `spec` `[0,0,0]`, `depth` 0, no class tokens.
2. Otherwise `selectors` is the number of complex selectors in the top-level list, `spec` the maximum
   of their specificities, `depth` the maximum of their depths.
3. **Internal tokens.** For each distinct class token, find the longest `prefix` it starts with. The
   token is internal when that prefix's `status` is `internal` or `hashed`. A token matching no prefix,
   or whose longest match is `public`, is not internal. `internal` lists the rule's internal tokens
   sorted.
4. `important` is the number of its `decl` records with `important` true, bad rule or not.
5. A rule is **deep** when `depth >= --deep`, and an **id rule** when `spec[0] >= 1`.

**z-index values.** Take each `decl` whose trimmed `prop`, ASCII-lowercased, is `z-index`. Trim its
`value` and classify it, first match wins:
1. **literal**: an optional `-` followed by 1 to 15 ASCII digits. Its number is the decimal value
   (`-0` and `00` are 0).
2. **keyword**: ASCII-lowercased, one of `auto`, `inherit`, `initial`, `unset`, `revert`,
   `revert-layer`.
3. **named**, compared case-sensitively: one of `var(--` N `)`, `var(--` N `,` F `)` where F has no `(` or `)`, `$` N, `@` N, or
   a dotted path `I.I` with one or more dots. N is one or more of ASCII letters, digits, `-` and `_`.
   I is an ASCII letter, `_` or `$` followed by any ASCII letters, digits, `_` or `$`.
4. **expression**: anything else, the empty string included.

**Output.**
1. `m` for every rule, sorted by `id`.
2. `token` for every token that is internal in at least one rule, sorted: `library` and `status` from
   its longest prefix, `rules` the number of rules (canary included) listing it in `internal`, `canary`
   true when all of those rules are canary rules, `present` from its `presence` record or `null`.
3. `head`: over non-canary rules that are not bad. The head of a class token is the token up to and
   including the first `-` or `_` after its first code point, or the whole token when there is none
   (`MuiButton-root` gives `MuiButton-`, `-x-y` gives `-x-`, `card` gives `card`). One record per
   distinct head, sorted, with `rules` the number of rules having at least one class token with that
   head. Every class token counts here, internal or not.
4. `z`: over decls of non-canary rules, one record per distinct literal number, ascending: `uses` is
   how many decls have it, `files` how many distinct files.
5. `zname`: over decls of non-canary rules, one record per distinct trimmed named value, sorted, with
   `uses`.
6. `hot`: take non-canary rules that are not bad. Sort by `spec` descending, then `depth` descending,
   then `id` ascending. Print the first `--top` with `rank` from 1.
7. `filestat`: for each non-canary file with at least one rule that has `important > 0`, a non-empty
   `internal`, is deep, or is an id rule: `rules` (all its rules), `important` (sum), `internal_rules`,
   `deep_rules`, `id_rules`.
8. `summary`, over non-canary records: `files` (non-canary `file` records), `rules`, `selectors` (sum),
   `bad`, `important` (sum), `important_rules` (rules with `important > 0`), `internal_rules`,
   `internal_tokens` (`token` records with `canary` false), `dead_tokens` (those with `present` false),
   `unchecked_tokens` (those with `present` null), `deep_rules`, `id_rules`, `max_spec` (over rules
   that are not bad), `z_uses` (literal decls), `z_distinct` (`z` records), `z_named_uses`,
   `z_named_distinct` (`zname` records), `z_expression_uses`, `z_keyword_uses`.
9. `canaries`, the same counts over canary records: `files`, `rules`, `bad`, `important`,
   `internal_rules`, `dead_tokens` (`token` records with `canary` true and `present` false),
   `deep_rules`, `id_rules`, `max_spec`, `z_uses`, `z_named_uses`. Printed even when there is no canary
   file.

Exit 0.

## slice

Semantic checks: a second `file` with the same `path` or `item` with the same `id` is `duplicate`. An
`item` whose `path` has no `file` is `unknown_path`.

1. Keep only files that have at least one item. Sort them by `path`.
2. Within each file, keep its items in input order.
3. Walk the files with an empty current slice. For each file: if the current slice has at least one file
   and `current bytes + file bytes > max-bytes`, close the current slice and start an empty one. Then
   add the file. After the last file, close the current slice if it has a file. A file bigger than
   `max-bytes` always ends up alone.
4. Number closed slices from 1 as `S` plus the number padded to four digits (`S0001`). Past 9999, use the
   number as it is (`S10000`).
5. Print each slice: `slice`, `bytes` (sum of its files), `files` (in order), `items` (each file's items
   in order, files in order).
6. Print `summary`: `slices`, `files` (files kept in step 1), `items` (all items), `bytes` (sum over kept
   files).

Exit 0.

## verify --check coverage

Semantic checks: a second `count` with the same `path`, or a second `file` with the same `path`, is
`duplicate`.

Ignore `file` records with `canary` true. Then:
- each counted path with no `file` record is a `missing` problem;
- each counted path whose `file` has `parsed` false is an `unparsed` problem;
- each `file` path nobody counted is an `extra` problem.

`counted` is the number of `count` records, `parsed` the counted paths whose `file` has `parsed` true,
`unparsed` and `missing` and `extra` the problem counts, `coverage` the basis-point ratio
`parsed / counted`. `pass` is true when `missing` and `extra` are 0 and the coverage basis points are at
least `--min-basis-points`. Print the problems sorted by `path`, then by `kind` in byte order, then the
summary. Exit 0 when `pass`, else 1.

## verify --check causes

Semantic checks: a second `decl` with the same `id`, or a second `cause` with the same `id`, is
`duplicate`.

- Each `decl` with `important` true and no `cause` is a `missing` problem.
- Each `cause` whose `decl` has `important` false is a `not_important` problem.
- Each `cause` whose `id` matches no `decl` is an `unknown` problem.

`important` counts important decls, `classified` those with a cause, `problems` all problems.
`by_cause` counts the causes of important decls, all six keys in byte order. Print the problems sorted
by `id`, then by `kind` in byte order, then the summary. Exit 0 with no problem, else 1.

## verify --check layers

Semantic checks: a second `z` with the same `value`, `layer` with the same `name`, `layer` with the
same `order`, or `assign` with the same `value` is `duplicate`. An `assign` whose `layer` has no
`layer` record is `unknown_layer`.

1. `unassigned`: each `z` value with no `assign`, ascending.
2. `unused`: each `assign` value with no `z` record, ascending.
3. `inversion`: sort the `z` values that have an `assign` ascending. For each value after the first,
   when its layer's `order` is lower than the previous value's layer's `order`, print an inversion with
   `value` that value and `after` the previous one. (No inversions means every layer holds one unbroken
   run of the sorted ladder.)
4. `empty_layer`: each layer no `assign` names, ascending by `order`.

Print the problems in that order, then the summary: `values` (`z` records), `layers`, `assigned` (`z`
values with an `assign`), `problems`. Exit 0 with no problem, else 1.
