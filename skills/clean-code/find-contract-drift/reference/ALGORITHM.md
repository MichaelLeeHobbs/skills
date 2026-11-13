# Drift tool algorithm

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
      `missing_field`; present with the wrong type, or a `word` outside its closed list, is `bad_field`.
      A `names` array or `members` array that repeats a value is `duplicate`. In `verify --check rows`,
      `word` fields only need to be non-empty strings.
   5. These field-form rules are part of each field's type check in step 4, in field order, and give
      `bad_field`: a field of type `id` with fewer than two `:` (a hard error in every subcommand,
      `verify --check rows` included); a config `scope` that is not `shape:` or `path:` followed by at least one character (except in
      `verify --check rows`, which reports it as a problem); a config `value` outside its setting's list
      (same exception).
3. Only when every line passed step 2, run the semantic checks for the subcommand (below) in input
   order. The first failing record decides the error, using that record's line number. Exit 2.
4. Compute and print the output. Exit as CONTRACT.md "Exit codes" says.

**Byte order.** "Sorted" always means sorted by the UTF-8 bytes of the string, compared byte by byte,
a shorter prefix first. Never use a locale-aware comparison.

**Tokens of a string.** Insert a boundary between a lowercase letter or digit and a following uppercase
letter, and between an uppercase letter and a following uppercase-then-lowercase pair (`XMLParser` gives
`XML Parser`). Split on every character that is not an ASCII letter or digit. Lower-case each piece
(ASCII). Drop empty pieces. The result is a list in original order.

**Basis points.** A ratio `num / den` is `floor(num * 10000 / den)` in integer arithmetic, printed as the
integer part of `bp / 10000`, a dot, then `bp mod 10000` padded to four digits: 9600 prints as `"0.9600"`.

**Group numbering.** `G` plus the number padded to four digits (`G0001`); past 9999, the number as is.

## keys

Semantic checks: a second `shape` with the same `id` is `duplicate`. A `field` whose `shape` has no
`shape` record is `unknown_shape`. A second `field` with the same `shape` and `name` is `duplicate`. A
`config` whose scope is `shape:<id>` with no such shape is `unknown_shape`. A second `config` with the
same `scope` and `setting` is `duplicate`.

1. **Effective settings.** For each shape and each of the five settings: if a config row has scope
   `shape:` plus the shape's id, use its value and set `<setting>_at` to that scope. Otherwise take the
   config rows with scope `path:<p>` where the shape's path starts with `<p>` (byte prefix); the longest
   `<p>` wins. Otherwise the value is `unknown` and `<setting>_at` is `*`. A row whose value is `unknown`
   still sets `<setting>_at` to its scope.
2. **Match key**: the field name's tokens joined with single spaces (empty if there are none).
3. **Wire key and note**, the first rule that applies:
   1. `alias` is not empty: `wire` is the alias, `note` is `""`.
   2. The shape's naming is `unknown`: `wire` is the name, `note` is `naming_unknown`.
   3. The naming is `identity`, or the name has no tokens: `wire` is the name, `note` is `""`.
   4. Otherwise `wire` is the naming applied to the tokens:
      - `snake`: joined with `_`. `upper_snake`: each token upper-cased (ASCII), joined with `_`.
      - `kebab`: joined with `-`. `lower`: joined with nothing.
      - `lower_camel`: the first token as is, every later token with its first character upper-cased,
        joined with nothing. `upper_camel`: every token with its first character upper-cased.

      `note` is `ambiguous` when the name has two ASCII uppercase letters in a row, or an ASCII letter
      next to an ASCII digit (either order); otherwise `""`.
4. **Type**: a field of type `date` becomes `date-iso`, `date-epoch-s` or `date-epoch-ms` when the
   shape's `date_write` is `iso`, `epoch-s` or `epoch-ms`; it stays `date` when `date_write` is
   `unknown`.
5. Print `eff` per shape in id order, then `field` per field (shapes in id order, then `pos`, then
   `name`), then `summary`: `shapes`, `fields`, `ambiguous` and `naming_unknown` (fields with that note).

## group

Semantic checks: a second `shape` with the same `id` is `duplicate`. A `field` or `binding` whose `shape`
has no `shape` record is `unknown_shape`. A second `field` with the same `shape` and `name` is
`duplicate`.

1. **Stop-keys.** For each non-empty match key, count the distinct shapes holding a field with it. It is
   a stop-key when `count >= --min-stop` and `count * 20 > number of shape records`. (The floor keeps
   every key from being a stop-key in a repo of fewer than 20 shapes.)
2. `K(s)` is the set of distinct non-empty match keys of shape `s` that are not stop-keys. `s` is
   **function-bearing** when it has a field of type `function`.
3. **Wrappers.** A shape is a wrapper when its bindings name more than `--max-routes` distinct `route`
   values.
4. **Binding candidates.** For each distinct (`route`, `direction`) pair, the members are the distinct
   non-wrapper shapes with a binding of that route and direction, any role. Key: `bind:` + route + one
   space + direction. Keep it when it has two or more members. Wrappers still join stem and containment
   candidates.
5. **Stem candidates.** Take the tokens of the shape's name (the part of the id after the last `:`).
   If there are two or more, the first is `i`, and the name's first two characters are ASCII uppercase
   letters, drop the first token. Then, while the list is not empty and its last token is one of `dto`,
   `request`, `response`, `model`, `schema`, `type`, `props`, `api`, drop the last token. Join the rest
   with nothing. If the result has four or more characters, ends in `s` and does not end in `ss`, drop
   the final `s`. An empty result gives no stem. A stem with more than `--max-stem` shapes is a
   stop-stem; otherwise a stem with two or more shapes is a candidate with key `stem:` + the stem.
6. **Containment candidates.** Eligible shapes are not function-bearing and have `|K| >= 5`. For each
   ordered pair of distinct eligible shapes `(s, l)` with `|K(s)| <= |K(l)|`, let `shared` be
   `|K(s) ∩ K(l)|`. The pair qualifies when `shared >= 4` and `shared * 5 >= |K(s)| * 4`. The partners of
   a shape are the shapes it qualifies with in either position. A shape with more than `--max-partners`
   partners is a hub. For each eligible non-hub shape `s`, the star is `s` plus every non-hub `l` such
   that `(s, l)` qualifies. Keep a star with two or more members, key `contain:` + the id of `s`.
7. **Prune.** Drop every candidate whose members all have `origin` `generated`. Sort the rest by key and
   sort each member list. Walking in key order, drop a candidate whose member list equals an earlier
   one. Then drop a candidate whose member set is a strict subset of another surviving candidate's,
   except that a `bind:` candidate is dropped only for being a strict subset of another `bind:`
   candidate.
8. **Merge.** Walk the surviving non-`bind:` candidates in key order as `a`. If `a` has not taken part
   in a merge, find the first later non-`bind:` candidate `b` that has not taken part in a merge, shares
   two or more members with `a`, and whose union with `a` has at most `--max-members` members and at
   most `--max-bytes` total `bytes`. If there is one, `a` takes the union of members and appends `b`'s
   keys to its own; remove `b`; mark both as having taken part.
9. **Number** the groups in order of their first key, from `G0001`. Print `group` with `id`, `keys`,
   `members` (sorted).
10. Print `keep` for every pair of groups sharing two or more members, `a` before `b` by id, with
    `shared`, sorted by `a` then `b`.
11. Print `stopstem` (`stem`, `shapes`) sorted by stem; `hub` (`shape`, `partners`) sorted by shape;
    `wrapper` (`shape`, `routes`) sorted by shape.
12. Print `alone` for every shape in no group, sorted by id, with the first reason that applies:
    `wrapper`, `hub`, `stopstem` (its stem is a stop-stem), `function` (function-bearing), `no_key`.
13. Print `summary`: `shapes`, `groups`, `alone`, `stopstems`, `hubs`, `wrappers`, `keeps`.

## diff

Semantic checks, in this order per record: a second `shape` with the same `id`, a second `eff` for one
shape, a second `field` with the same `shape` and `name`, a second `field` in one shape with the same
`wire`, a second `group` with the same `id`, and a second `accept` with the same `anchor`, `member`,
`a_field`, `m_field` and `kind` are `duplicate`. An `eff`, `field`, `binding` or `accept` naming no
shape is `unknown_shape`, and so is a `group` with a member that has no `shape` record or no `eff`
record.

**The eff string** of a shape is `naming=<v>;inclusion=<v>;unknown_properties=<v>;unknown_enum=<v>;date_write=<v>`.

### Anchor and mode

For each group in id order, take its members sorted by id; "member order" below means this order.
- If its first key starts with `bind:` and contains a space after it, the route is the text between
  `bind:` and the last space and the direction is the text after it. The producers are the members with a binding for that route and
  direction with role `produces`. If there is at least one, the mode is `directional`, the anchor is the
  smallest producer id, and the consumers are the other members with a binding for that route and
  direction with role `consumes`.
- Otherwise the mode is `peer` and the anchor is the member with the smallest rank, then the most
  `importers`, then the smallest id. Rank: `side` `server` is 0; else `origin` `generated` is 1; else
  `side` `spec` is 2; else 3.

Compare the anchor `A` with every other member `M` in member order: directionally when `M` is a consumer,
otherwise as peers.

### Alignment

Fields are taken in `pos`, then `name` order.
1. **Aligned pairs**: an anchor field and a member field with the same `wire`.
2. **Wire-name pairs**: among the unaligned fields, for each non-empty match key held on both sides,
   sort each side's fields with that key by `wire` and pair them in order, up to the shorter list. Each
   pair gives one `WIRE_NAME` cell: UNRESOLVED with cause `local` if either field's note is
   `ambiguous`; else UNRESOLVED with cause `config:naming@<scope>` if either note is `naming_unknown`
   (scope is that shape's `naming_at`; if both, the smaller cause string); else BREAKING when
   directional and DISAGREE between peers. Wire-name pairs get no other cells.
3. The rest are **unmatched**. Directional: each unmatched anchor field gives an `EXTRA` cell and each
   unmatched member field a `MISSING` cell (rules below). Peers: they give no cells; add their count to
   the group's `hints`.
4. **Rename candidates** (both modes) pair an unmatched anchor field with an unmatched member field.
   The type family is: the number set (`int32`, `int53`, `int64`, `bigint`, `decimal`, `number`) gives
   `number`; the date set (`date-iso`, `date-epoch-s`, `date-epoch-ms`, `date`, `date-object`) gives
   `date`; any other type is its own family. Two fields are compatible when their families are equal or
   one is `string` and the other `date-iso`. A compatible pair qualifies when their token sets share at
   least one token, or when each side has exactly one unmatched field of that family (families equal).
   Rank qualifying pairs by shared tokens (more first), then the absolute difference of `pos`, then the
   anchor field name, then the member field name. Take them greedily in that order, skipping a pair if
   either field is already taken. Print each taken pair as `rename` with `shared`.

### Resolving unknowns

Each cell kind below reads a fixed list of attributes. When none is `unknown`, compute the outcome
directly. Otherwise compute it under every combination of values for the unknown ones:
`presence` (`required`, `optional`), `nullable` (`yes`, `no`), inclusion (`always`, `non-null`),
`unknown_properties` (`ignore`, `fail`, `strip`), `unknown_enum` (`fail`, `null`, `default`), and a type
of `date` (`date-iso`, `date-epoch-s`, `date-epoch-ms`). An outcome is a (kind, dir) pair or no cell.

- Every combination gives the same outcome: use it.
- Every combination gives LOOSE or no cell: no cell.
- Otherwise: one cell of the kind named below, dir UNRESOLVED, with the cause of the unknown attribute
  that ranks first: `local`, then any `config:` cause, then `lang-nullability`; ties by byte order.

Causes: an unknown `presence` or `nullable` is `lang-nullability`. An unknown setting is
`config:<setting>@<scope>`, with the scope from that shape's `<setting>_at`. A type of `date` is
`config:date_write@<scope>`.

Every non-UNRESOLVED cell has cause `""`.

### Directional cells (anchor A produces, member M consumes)

For an anchor field `a` (inclusion from A's eff) and member field `m`:
- `omit` is true when `a.presence` is `optional`, or `a.nullable` is `yes` and inclusion is `non-null`.
- `sendsNull` is true when `a.nullable` is `yes` and inclusion is `always`.
- `req` is true when `m.presence` is `required` and (M's `side` is not `server` or `m.validated` is
  `yes`).
- `acceptsNull` is true when `m.nullable` is `yes`.

| Kind | Reads | Outcome |
|---|---|---|
| `EXTRA` (unmatched `a`) | M's `unknown_properties` | `fail`: BREAKING; `ignore` or `strip`: LOOSE |
| `MISSING` (unmatched `m`) | `m.presence` | `req`: BREAKING; else LOOSE |
| `PRESENCE` | `a.presence`, `a.nullable`, inclusion, `m.presence` | `omit` and `req`: BREAKING; neither: LOOSE; else no cell |
| `NULLABILITY` | `a.nullable`, inclusion, `m.nullable` | `sendsNull` and not `acceptsNull`: BREAKING; `acceptsNull` and not `sendsNull`: LOOSE; else no cell |
| type (`TYPE`, `WIDTH`, `FORMAT`) | a type of `date` on either side; UNRESOLVED kind `FORMAT` | the type rules below |
| `ENUM_VALUES`, `ENUM_SPELLING` | M's `unknown_enum` when M's `side` is `server`; UNRESOLVED kind `ENUM_VALUES` | the enum rules below |

**Type rules**, with producer type `tp` and consumer type `tc`, the first that applies:
1. `tp` is `date-object`: treat it as `date-iso`.
2. `tc` is `any`: no cell.
3. `tp` is `any` or `unknown`, or `tc` is `unknown`: `TYPE` UNRESOLVED, cause `local` (not resolved by
   combinations).
4. `tc` is `date-object`: `FORMAT` BREAKING.
5. Both are in (`date-iso`, `date-epoch-s`, `date-epoch-ms`) and differ: `FORMAT` BREAKING.
6. One is `string` and the other `date-iso`: no cell.
7. Wire families differ: `TYPE` BREAKING. Wire family: `string`, `date-iso` and `enum` are string;
   the number set and `date-epoch-s`, `date-epoch-ms` are number; `object` and `map` are object; any
   other type is its own family.
8. Both are number family: if either is `date-epoch-s` or `date-epoch-ms`, or they are equal, no cell.
   If `tp` is `number`: `tc` `decimal` is `WIDTH` LOOSE, any other is `WIDTH` LATENT. If `tc` is
   `number`: `tp` `int32` or `int53` is `WIDTH` LOOSE, any other is `WIDTH` LATENT. Otherwise rank
   `int32` 1, `int53` 2, `int64` 3, `bigint` 4, `decimal` 5: `tp` lower is `WIDTH` LOOSE, higher is
   `WIDTH` LATENT.
9. Otherwise no cell.

**Enum rules**, only when the anchor field is `enum` or `string` and the member field is `enum`:
1. Anchor field `string`: `ENUM_VALUES` UNRESOLVED, cause `local`.
2. Equal value sets: no cell.
3. Equal after ASCII lower-casing every value: `ENUM_SPELLING` BREAKING.
4. Some anchor value is not a member value: `ENUM_VALUES`; when M's `side` is `server`, BREAKING for
   `unknown_enum` `fail` and LOOSE for `null` or `default`; otherwise BREAKING.
5. Otherwise (the member is a superset): `ENUM_VALUES` LOOSE.

### Peer cells

| Kind | Reads | Outcome |
|---|---|---|
| `PRESENCE` | `a.presence`, `m.presence` | different: DISAGREE |
| `NULLABILITY` | `a.nullable`, `m.nullable` | different: DISAGREE |
| type | a type of `date` on either side; UNRESOLVED kind `FORMAT` | the first that applies: either `any`: no cell; either `unknown`: `TYPE` UNRESOLVED `local`; both in (`date-iso`, `date-epoch-s`, `date-epoch-ms`, `date-object`) and different: `FORMAT` DISAGREE; one `string` and one `date-iso`: no cell; wire families differ (`date-object` is its own family): `TYPE` DISAGREE; both number family, neither an epoch date, different: `WIDTH` LATENT; else no cell |
| enum | none | both `enum`: equal sets no cell; equal after lower-casing `ENUM_SPELLING` DISAGREE; else `ENUM_VALUES` DISAGREE |

### Accepts and output

An accept matches a cell with the same `anchor`, `member`, `a_field`, `m_field` and `kind`. When its
`anchor_hash` and `member_hash` equal the two shapes' current hashes, the cell is not printed and counts
as accepted. Otherwise the cell is printed followed by a `reopened` record.

For a MISSING cell `a_field` is `""`; for an EXTRA cell `m_field` is `""`. Within a group, sort cells by
member id, `a_field`, `m_field`, then kind in this order: `MISSING`, `EXTRA`, `PRESENCE`,
`NULLABILITY`, `TYPE`, `WIDTH`, `FORMAT`, `ENUM_VALUES`, `ENUM_SPELLING`, `WIRE_NAME`. Sort renames by
member id, then `a_field`.

`gdiff`: `group`, `mode`, `anchor`, `members` (every member in order, with `id`, `hash` and the eff
string), `hints`, and `judge`: true when the group printed a BREAKING or DISAGREE cell, an UNRESOLVED
cell with cause `local`, or a rename.

`summary`: `groups`, `cells` (printed), a count per dir, `renames`, `accepted`, `reopened`, `judge`
(groups with `judge` true).

## verify --check rows

Semantic check: a second `shape` with the same `id` is `duplicate`.

For each record in input order, collect problems in this order. `key` is the shape id for a shape,
`<shape>.<name>` for a field, `<shape> <route>` for a binding and `<scope> <setting>` for a config.
- `shape`: `bad_value` for `side`, then `origin`.
- `field`: `unknown_shape`; `duplicate_field` if an earlier field has the same shape and name; then
  `bad_value` for `type`, `presence`, `nullable`, `validated`.
- `binding`: `unknown_shape`; `bad_value` for `direction`, then `role`.
- `config`: `bad_value` for `setting`; `bad_value` for `value` (only when the setting is valid, against
  its list); `bad_value` for `basis`; `bad_scope` when the scope is not `shape:` or `path:` followed by
  at least one character; `unknown_shape` for a `shape:` scope naming no shape; `duplicate_config` if an
  earlier config has the same scope and setting.

Only `bad_value` carries `field`. Print the problems, then `summary` with `shapes`, `fields`, `bindings`,
`configs` (record counts) and `problems`. Exit 1 if there is any problem.

## verify --check coverage

Semantic checks: a second `count` with the same `path` is `duplicate`. An `adjust` whose `path` has no
`count` record is `unknown_path`. A second `adjust` for the same `path` is `duplicate`.

1. `files` is the number of `count` records; `adjusted` the number of `adjust` records.
2. Over files that are not adjusted: `parser` and `pattern` are the sums; `covered` is the sum of
   `min(parser, pattern)` per file.
3. `coverage` is the basis-point ratio `covered / pattern`, or 0 when `pattern` is 0.
4. `adjusted_share` is the basis-point ratio `adjusted / files`, or 0 when `files` is 0.
5. `pass` is true when `files >= 1`, `coverage >= --min-basis-points` and
   `adjusted_share <= --max-adjusted-basis-points`.
6. Print `short` for every non-adjusted file with `parser < pattern`, sorted by path; then `adjusted` for
   every adjusted file, sorted by path; then `summary`. Exit 1 if `pass` is false.

## verify --check groups

Semantic checks: a second `shape`, `group` or `alone` with the same identifier is `duplicate`. A `keep`
naming a group with no `group` record is `unknown_group`.

Problems:
- each shape (by id) in no group and no `alone` record: `unplaced`;
- each group member or `alone` shape with no `shape` record: `unknown_member`, once per id;
- each shape (by id, `shape` records only) in a group and also `alone`: `both`;
- each pair of groups (`a` before `b` by id) sharing two or more members with no `keep` naming the pair
  in either order: `overlap` on `a` with `other` `b` and `shared`.

Sort by kind in that order, then `id`, then `other`. Print them, then `summary` with `shapes`, `groups`,
`alone`, `problems`. Exit 1 if there is any problem.

## verify --check evidence

A cell's key is (`group`, `member`, `a_field`, `m_field`, `kind`). Semantic checks: a second `cell`,
`evidence` or `transform` with the same key, a second `file` with the same `path`, and a second `run`
with the same `class` are `duplicate`.

**Config kinds** are `WIRE_NAME`, `ENUM_SPELLING`, `FORMAT` and `WIDTH`. A class **ran** when it is not
empty and has a `run` record.

1. For each `evidence` in input order: no cell with its key is `unknown_cell` (check nothing else for
   it). Otherwise, if `verdict` is `CONFIRMED`: `basis` `sample`, `diffed` or `uncited` is
   `not_confirmable`; `basis` `run` whose class did not run is `confirmed_without_run`; `basis`
   `typecheck` on a config kind whose class did not run is `confirmed_without_run`. Then, whatever the
   verdict, `basis` `diffed` on a config kind is `diffed_config_kind`.
2. For each `transform` in input order: no cell with its key is `unknown_cell`. Otherwise split `cite`
   at its last `:`; it is `bad_cite` unless the part after it is one or more digits with a value from 1
   to that file's `lines`, and the part before it is the `path` of a `file` record.
3. For each `cell` in input order with dir BREAKING and neither an `evidence` nor a `transform` with
   its key: `no_evidence`.

Print problems in that order with `kind`, `group`, `member`, `a_field`, `m_field` and `cell_kind` (the
key's kind), then `summary` with `cells`, `evidence`, `transforms`, `problems`. Exit 1 if there is any
problem.

## reuse

Semantic checks: a second `old` with the same `group`, and a second `new` with the same `group`, are
`duplicate`.

For each `new` in group order: the matching old records are those whose member `id` set equals its own.
- If a matching old has the same set of (`id`, `hash`, `eff`) triples, print `reuse` with `from` set to
  the smallest such old group.
- Else, if there is a matching old, compare with the smallest matching old group: `judge` with reason
  `hash` if any member's hash differs, otherwise `config`.
- Else `judge` with reason `new`.

Print `summary`: `old`, `new`, `reused`, `judge`.

## tally

Semantic check: a second `cap` record is `duplicate`.

Print the seven records in CONTRACT.md order:
1. `shapes`: `total`; `by_side` and `by_origin` with keys sorted, holding only values that occurred.
2. `excluded`: `total` is the sum of `count`; `by_reason` sums `count` per `reason`, keys sorted.
3. `groups`: `total` is the number of `gdiff` records; `reused` the number of distinct `reuse` groups;
   `judge` the number of `gdiff` records with `judge` true whose group has no `reuse` record.
4. `cells`: counts per dir, always all five keys.
5. `causes`: `local` counts UNRESOLVED cells with cause `local`; `by_cause` counts every other
   UNRESOLVED cell per cause, keys sorted.
6. `evidence`: counts of each verdict, always all three keys; `by_basis` per basis, keys sorted.
7. `spend`: `total_cents` is the sum of `usd_cents`; `cap_cents` is the cap or 0; `over_cap` is true
   when the cap is above 0 and the total exceeds it; `by_phase` sums per `phase`, keys sorted.

An object with no keys prints as `{}`. Exit 0.
