# Tool algorithm

Implement this with [COLOUR.md](COLOUR.md) to satisfy [CONTRACT.md](CONTRACT.md). Where they seem to
disagree, CONTRACT.md wins and the disagreement is a bug to report.

## Common steps

1. Parse the arguments. On any usage problem print `{"t":"error","line":0,"reason":"usage"}` and exit 2.
2. Read every input line. For each, in order, stop at the first failure, print one error record with that
   line's number and exit 2: not valid UTF-8 or JSON (a BOM included): `bad_json`; not an object:
   `not_object`; `t` absent, not a string or not accepted: `unknown_type`; then each required field of that
   type in the order CONTRACT.md lists it: absent is `missing_field`, wrong type or outside its closed list
   is `bad_field`. `verify --check canaries` validates only `expect` records.
3. Only when every line passed, run the subcommand's semantic checks over the records in input order. The
   first failing record decides the error, with its line number; exit 2. A `bad_field` on line 9 beats a
   `duplicate` on line 3.
4. Compute and print the output, then exit as CONTRACT.md says.

**Byte order**: compare the UTF-8 bytes of two strings byte by byte, a shorter prefix first. Never a
locale comparison. **Category order**: `colour`, `spacing`, `radius`, `font-size`, `shadow`, `z-index`, then
`other`. Per-category summary and `scope` records cover the first six only, and are printed even when every
count is 0. **Line of a byte offset**: 1 plus the number of LF bytes before it. **Overlap**: spans
`[s, s + l)` and `[a, a + b)` overlap when `s < a + b` and `a < s + l`.

## inspect

Parse each `colour` value by COLOUR.md "Colours" and each `size` value by "Sizes" with its `cat` and
`--root-px`. For a colour print `key`, `L`, `a`, `b` (the OKLab integers, from "sRGB to OKLab" for an sRGB
colour), `alpha`, `Y` (luminance) and `neutral`. For a size print `key` and `class`.

## sweep

Semantic check: a second `src` with the same path is `duplicate`.

For each file in path byte order, scan the UTF-8 bytes of `text` from position 0. IDENT bytes are ASCII
letters, digits, `_` and `-`; non-ASCII bytes are never IDENT. `prev` is the byte before the position (none
at 0). At each position try, in order:

1. **Hex colour.** The byte is `#`, and prev is none or not IDENT, `&` or `#`. Take the longest run of hex
   digits after it. If the run has 3, 4, 6 or 8 digits and the byte after it is absent or not IDENT, emit a
   colour hit over `#` and the run and continue after it.
2. **Functional colour.** prev is none or not IDENT, and for the first of `rgba`, `rgb`, `hsla`, `hsl`,
   `oklab`, `oklch` that matches here ignoring ASCII case and is followed by `(`: find the first `(` or `)`
   after that `(`. If it is `)`, emit a colour hit through it and continue after it. Otherwise no hit.
3. **Length.** The byte is a digit, or a `.` followed by a digit, and prev is none or not an ASCII letter,
   digit, `_`, `.` or `#`. Read digits, then optionally a `.` followed by at least one digit and any more
   digits; call the end `j`. If `px`, `rem` or `em` (lowercase, checked in that order) starts at `j` and the
   byte after it is absent or not IDENT, emit a length hit and continue after the unit. Otherwise continue
   at `j` (so the number's own digits never start another length).
4. Otherwise move one byte on.

Each hit records the path, start, length, line, kind and the hit bytes as `raw`. Print hits, then the
summary: files, hits, colour hits, length hits.

## verify --check occ

Semantic checks in input order: a `src` whose path an earlier `src` had is `duplicate`; an `occ` or `token`
whose path no `src` anywhere in the input has is `unknown_path`.

For each `occ` and `token` in input order, with the file's bytes:
- If `start + len` exceeds the byte length: a `span` problem. Skip the raw and line checks.
- Otherwise, if the bytes at the span differ from the UTF-8 bytes of `raw`: a `raw` problem. For an `occ`,
  if `line` is not the line of `start`: a `line` problem.
- For an `occ` only: if `cat` differs from the property table's category for `prop` (`other` when the
  property is not in the table, compared exactly): a `category` problem.

Print problems in that order, then the summary.

## verify --check coverage

No semantic checks. For each hit, find what accounts for it, in this precedence: any `occ` with the same
path overlapping it, else any `token` with the same path overlapping it, else any `ignore` with the same
path overlapping it (count its reason). A hit with none is a gap. Use sorted spans per path rather than
comparing every hit with every span; the result is the same.

`coverage` is the share of hits accounted for by an occ or token; `ignored_share` is the share ignored.
`pass` is true when there is at least one hit, no gap, and `floor(ignored * 10000 / hits)` is at most
`--max-ignored-basis-points`. Print gaps sorted by path then start, then the summary.

## cluster

### Semantic checks, in input order

Build the token map from the first record of each (name, mode). Then for each record:
- `token`: `duplicate` if an earlier token had the same name and mode. Otherwise resolve it: while the
  current token is a `ref`, look up (value, the starting token's mode), else (value, `default`); if neither
  exists, `unknown_token`; if the key found is already in this chain (the start included), `cycle`.
- `surface`: `unknown_token` if no token has that name in any mode.
- `scope`: `duplicate` if an earlier scope had the same name.

### Token values

For each token with `cat` not `other`, parse its resolved literal under its own `cat` (COLOUR.md, with
`--root-px`). Unparsed: a `badtoken` record. Parsed: add the token's name to the **token value** for
(cat, key). A token value's names are a set (one name in two modes with the same key appears once), sorted
in byte order; its first name is its **label**.

### Occurrences

Skip `occ` records with cat `other`. For a `ref`: if any token anywhere has that name, count a token use
for the name; otherwise count it under `unresolved` with its site. For a `literal`: parse `value` under
`cat`; unparsed goes to `unparsed` keyed by (cat, value). A parsed one joins the **literal value** for
(cat, key): count a use, add the site `path:line` (sites are distinct), add `value` to its samples and
`prop` to its properties. `sample` is the samples' byte-order first.

**Value order** within a category: sizes by signed value (`sign * mag`, relative units included) then
key bytes; z-index by integer then key bytes; colours and shadows by key bytes.

### Admissibility

`admit(v, t)` is a distance or nothing, for a literal value v and a token value or leader t:
- **Colour**: nothing if exactly one of them has alpha 255, or the alphas differ by more than 8; otherwise
  `d = milli(v, t)`, admitted when `d <= 50`.
- **Size**: nothing unless v is class `normal`, t is class `normal` or `hairline`, and the signs match.
  `d = |v.mag - t.mag|`, admitted when `d * 10000 <= max(floor * 10000, ratio * t.mag)`, with floor 100 and
  ratio 625 for spacing and radius, floor 50 and ratio 0 for font size.
- **Shadow**: same layer count, the same inset flag per layer, every pair of lengths within 100, and every
  pair of colours admitted as colours. `d` is the largest length difference.

### Status

For each literal value of a category except z-index:
1. Key equal to a token value's key: `exact`, anchor that token value's label, distance 0.
2. A size of class `zero`, `hairline`, `relative` or `full`: that class as the status.
3. Otherwise go through the token values in value order and keep the first with the smallest admitted
   distance. Found: anchor its label, distance d, status `snap` for a colour with `d <= 20`, else `near`.

Then the **leaders**: take the values still without a status, sorted by uses (most first), then value
order. For each, among the existing leaders admitting it, take the one with the smallest distance (the
earlier leader on a tie): status `cluster`, `leader` that leader's key, distance d. If none admits it, it
becomes a new leader. At the end a leader with at least one member gets status `cluster` with itself as
`leader` and distance 0; a leader with none gets status `lone`.

**z-index**, first match wins: equal to a token value: `exact`, anchor its label, distance 0. `|v| <= 10`: `local`. Some token value t
with `t < v <= t + 10`: `token_plus_n`, anchor the label of the largest such t, distance `v - t`. There is at
least one token value and v is above all of them: `escalation`. Otherwise `off_ladder`.

Fields with no meaning are `""` (anchor, leader) or 0 (distance). `neutral` is COLOUR.md's neutral test for
colours, false otherwise.

### Output

1. `badtoken` sorted by name then mode.
2. `tokenvalue` per category in category order, then value order: cat, key as `value`, names, neutral.
3. `value` likewise, with sites in byte order.
4. `tokenuse` sorted by token name; `unresolved` sorted by name, with sites.
5. `unparsed` in category order, then value bytes, with sites.
6. For each scope in name order, for each category in category order: the occurrences whose path starts
   with the prefix (as bytes): `uses` (parsed literals), `drift_uses` (those whose value is drift),
   `ref_uses` (refs that counted as token uses).
7. One summary per category in category order, then one whose `cat` is `neutral`.

**Drift** is any status except `exact`, `zero`, `hairline`, `relative`, `full` and `local`. **Matched** is
`exact` or `snap`. A summary over a set of literal values: `values` (count), `uses` (their uses),
`token_values`, `ref_uses` (refs of that category that counted as token uses), `unparsed_uses`,
`drift_values`, `drift_uses`, `matched_values`, `matched_uses`, `literal_share` (`uses` over
`uses + ref_uses`), `by_status` (count of values per status present). The `neutral` summary takes the
neutral colour literal values, the neutral colour token values, colour refs whose token name has at least
one neutral colour token value, and `unparsed_uses` 0.

## measure

Run the semantic checks and analysis of `cluster` (print none of its records).

**Surfaces**: for each `surface` record, every mode of that token whose resolved literal parses as a colour
with alpha 255 (whatever the token's `cat`), once per (name, mode), sorted by name then mode. With none,
use `#ffffff` then `#000000`, in that order, both named by their key and mode `default`.

For each `plan` record in input order, reject (record the line, keep going) the first that applies:
- `unknown_value`: cat is `other` or no literal value of that cat has this key;
- `duplicate`: an earlier accepted plan had the same cat and value;
- `unknown_token`: action SNAP and no parsed token value of this cat carries that token name;
- `bad_intent`: action KEEP and intent is not in CONTRACT.md's list;
- `bad_cite`: action KEEP and cite is not text, a `:`, then one or more digits (the last `:` decides; the
  text before it is non-empty).

An accepted non-SNAP plan gives a result with verdict `NONE`, empty token, shift and contrast, distance 0
and no crossings. For SNAP, take the token's parsed value in that cat from its mode first in byte order.

- **Colour**: `d = milli(value, token)`. Shift `imperceptible` when `d <= 20` and the alphas are equal,
  else `visible`. Threshold T: 45 when the value's properties include `color`; otherwise 30 when they
  include anything other than `background-color`; otherwise none. Contrast: `none` without T;
  `unmeasured` when either alpha is not 255; otherwise for each surface, a crossing when the value's
  contrast with the surface reaches T/10 and the token's does not, written
  `<surface name>@<mode> <value ratio> <token ratio>`; `crossed` with any crossing, else `kept`. Verdict:
  `REFUTED` when crossed; `CONFIRMED` when the shift is imperceptible and contrast is `kept` or `none`;
  otherwise `VISIBLE`.
- **Size**: contrast `none`. A `zero` size has unit px and a positive sign. When units and signs match, distance `|mag difference|`, else 0. `CONFIRMED`
  with shift `within-floor` when they match, the unit is px and the distance is at most the floor (100, or
  50 for font size); otherwise `VISIBLE`, shift `visible`.
- **Shadow**: contrast `none`. Distance the largest length difference when layer counts and inset flags
  match, else 0. `CONFIRMED` (`within-floor`) only when the keys are equal; otherwise `VISIBLE`.
- **z-index**: contrast `none`, distance `|difference|`, `CONFIRMED` (`within-floor`) only when equal,
  otherwise `VISIBLE`.

Print rejects in input order, results in category order then value order, then per category: `before`
(literal values), `planned` (accepted plans), `kept` (KEEP), `snapped` (CONFIRMED), `visible`, `refuted`,
`after` (`before - snapped`).

## diff

Semantic checks: a second `old` with the same (cat, value) is `duplicate`; likewise a second `value`.

For each (cat, value) in either set: only new is `added`; only old is `removed`; anchors differ is
`anchor`; uses differ is `uses`; otherwise no record. Missing sides print uses 0 and anchor `""`. Print in
category order, then value bytes, then the summary; `same` counts keys in both sets with no record.

## verify --check canaries

Semantic check: a second `expect` with the same id is `duplicate`.

For each expect in input order, the matching records are the non-expect records with `t` equal to `rec`,
`value` equal to `value`, and, when `cat` is not empty, `cat` equal to `cat`. Skip a match that lacks
`field`. Collect each other match's `field` as text: a string as itself, an integer in decimal, booleans `true`/`false`, null `null`, anything else as
compact JSON. The canary passes when `want` is among them. `got` is the distinct texts in byte order joined
by `|`, or `missing` when there are none. The summary's `pass` is true when there is at least one canary and
all passed.
