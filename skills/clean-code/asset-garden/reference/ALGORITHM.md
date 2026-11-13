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
      `missing_field`; present with the wrong type, or an `enum` value outside its list, is `bad_field`.
      A `names` array that repeats a value is `duplicate`.
3. Only when every line passed step 2, run the semantic checks for the subcommand (below) in input
   order. The first failing record decides the error, using that record's line number. A record that
   fails two checks reports `duplicate` before `unknown_path`. Exit 2.

JSON edge cases: a repeated key in one object keeps its last value; `NaN` and `Infinity` are not JSON and
make the line `bad_json`.
4. Compute and print the output. Exit as CONTRACT.md "Exit codes" says.

**Byte order.** "Sorted" always means sorted by the UTF-8 bytes of the string, compared byte by byte, a
shorter prefix first. Never use a locale-aware comparison: `Z.svg` sorts before `a.svg`.

**Basis points.** A ratio `num / den` is `floor(num * 10000 / den)` in integer arithmetic. It is printed
as the integer part of `bp / 10000`, a dot, then `bp mod 10000` padded to four digits: 9600 prints as
`"0.9600"`, 10000 as `"1.0000"`.

**Numbering.** `P` plus a number padded to four digits (`B0001`); past 9999, the number as it is.

**Whitespace** means space, tab, LF and CR. **Collapse** means replacing every run of whitespace with
one space and removing leading and trailing whitespace. **Lower** means ASCII lower case only.

## svgnorm

Semantic check: a second `svg` with the same `path` is `duplicate`.

### Parse

Remove one leading U+FEFF from `text`. Scan left to right. The first problem met decides the reason,
and the file prints as `unparsed`:

- `<?xml` followed by whitespace or `?`, before the root element: an XML declaration, dropped. It ends
  at the first `?>`. Any other `<?` anywhere: `pi`.
- `<!--`: a comment, dropped, ending at the first `-->`. Text on both sides of a comment joins.
- `<![CDATA[`: `cdata`. Any other `<!`: `doctype`.
- `&` in text or an attribute value not starting one of `&amp;` `&lt;` `&gt;` `&quot;` `&apos;`,
  `&#` digits `;`, or `&#x` hex digits `;`: `entity`. Allowed references stay as written.
- A start tag: `<`, a name, attributes, optional whitespace, then `>` or `/>`. A name is one character
  from `A-Z a-z _ :` followed by any of `A-Z a-z 0-9 _ : . -`. An attribute is whitespace, a name,
  optional whitespace, `=`, optional whitespace, and a value quoted with `"` or `'` that runs to the
  next matching quote. A value holding `<`, an attribute with no value, or a repeated attribute name in
  one tag is `malformed`.
- An element whose local name (after the last `:`) is `script`: `script`.
- An end tag: `</`, a name, optional whitespace, `>`. It must name the innermost open element.
- Text: everything up to the next `<`.
- Before the root and after it closes, only whitespace, comments and (before) the declaration may
  appear. A second root, an unclosed element, an unterminated tag, comment or declaration, a start or
  end tag without a valid name, no root at all, or text outside the root: `malformed`.
- The root's start tag, once read, with a local name other than `svg`: `not_svg`.
- Within one attribute, the value's problems (`<`, then entities, left to right) come before a repeated
  name.

The result is a tree: each element has a name, its attributes in source order, and children that are
elements or text.

### Strict form

Apply, in order:

1. Remove every element named `metadata`, and every element whose name has a prefix (the part before
   the first `:`) in the editor list, with all their children. Editor list: `inkscape`, `sodipodi`,
   `sketch`, `figma`, `serif`, `i`, `x`, `graph`.
2. Remove every attribute whose name has a prefix in the editor list, every `xmlns:P` attribute where
   `P` is in the editor list, and every attribute named `data-name`.
3. Text children: drop any that are only whitespace; collapse the rest. Text nodes left side by side by
   step 1 stay separate nodes.
4. Collapse every attribute value.
5. `style` attributes: split the value on `;`, collapse each part, drop empty parts and parts with no
   `:`. Split each part at its first `:`; the property is the part before it, collapsed and lowered;
   the value is the part after it, collapsed. A repeated property keeps its last value. Sort by
   property and join as `property:value` with `;` between. If nothing is left, remove the attribute.
6. Numeric attributes: `d`, `points`, `viewBox`, `x`, `y`, `x1`, `y1`, `x2`, `y2`, `cx`, `cy`, `r`,
   `rx`, `ry`, `fx`, `fy`, `width`, `height`, `transform`, `gradientTransform`, `patternTransform`,
   `stroke-width`, `stroke-dasharray`, `stroke-dashoffset`, `stroke-miterlimit`, `opacity`,
   `fill-opacity`, `stroke-opacity`, `offset`. Rewrite each value as tokens joined by one space. Scan
   left to right:
   - A **number** starts at a digit, or at `+`, `-` or `.` followed by a digit (or `+`/`-` followed by
     `.` and a digit). It is an optional sign, digits, an optional `.` with digits after it, and an
     optional exponent: `e` or `E`, an optional sign, and at least one digit. Without a following digit,
     `e` is not part of the number. `1.5.5` is the two numbers `1.5` and `.5`.
   - A **word** is a run of ASCII letters.
   - Whitespace and `,` separate tokens and are dropped.
   - Any other character is a token by itself.
   Write each number canonically: a number with an exponent is written as it is, minus a leading `+`.
   Otherwise drop a leading `+`, keep the integer digits exactly as written (an empty integer part
   becomes `0`), drop trailing zeros from the fraction and drop the `.` if the fraction is then empty.
   If every digit is `0`, write `0`.
7. Serialise. An element is `<` name, then for each attribute sorted by name ` name="value"` with every
   `"` in the value written as `&quot;`, then `/>` if it has no children, else `>`, the children, and
   `</` name `>`. Text is written as it is. Nothing goes between nodes.

`sprite` is true when any element's local name is `symbol`. `raster` is true when any attribute value
contains `data:image/`. Both are read from the strict tree.

### Loose form

Start from the strict tree before serialising. Apply, in order:

1. Remove every `title` and `desc` element with their children.
2. Remove `width` and `height` from the root element.
3. Paint: for attributes `fill`, `stroke`, `stop-color`, `color`, `flood-color`, `lighting-color`, and
   the same properties inside `style` attributes (not `style` elements), replace the value with `P` unless its lowered value is `none`
   or it starts with `url(`.
4. Ids: walk the elements in document order. Each element with an `id` gets the next of `i1`, `i2`, and
   so on. Map each old id to the new id given at its first occurrence. Then, in every other attribute
   value: a value exactly `#old` becomes `#new`; every `url(#X)` where `X` (the characters up to the
   next `)`) is a mapped id becomes `url(#new)`. Apply the same `url(#X)` rewrite to the text inside
   `style` elements. Unmapped references stay as they are.
5. Round every number token without an exponent in the numeric attributes except `viewBox` to two
   fractional digits, half away from zero, working on the decimal digits, never through a binary
   float: if the fraction has more than two digits, keep two and add one unit in the last kept place
   when the third digit is 5 or more, carrying into the integer digits (`9.995` gives `10`). Then write
   it canonically as in strict step 6 (`-0.004` gives `0`).
6. Serialise as in strict step 7.

## refs

Semantic checks: a second `asset` with the same `path`, `root` with the same `dir` and `url`, `alias`
with the same `prefix`, or `keep` with the same `path` is `duplicate`. A `keep` whose `path` is no asset
is `unknown_path`.

### Resolving a string

Given a value and the file `from` that holds it (hits have no `from`):

1. Cut the value at the first `?` or `#`.
2. If it starts with a scheme (a letter, then letters, digits, `+`, `.` or `-`, then `:`) or with `//`,
   it is external: count it and stop. For a `pattern` or `hit`, an external value resolves to nothing.
3. Percent-decode each `%` followed by two hex digits into a byte, then read the bytes as UTF-8. If they
   are not valid UTF-8, keep the value as it was before this step.
4. Pick candidates:
   - For refs and patterns, if the value starts with an alias prefix (the longest that matches): `dir`
     joined with the rest.
   - Else if it starts with `/`: for each root whose URL (with `/` added at the start and end if
     missing) is a prefix of the value, longest URL first and then `dir` in byte order: that root's
     `dir` joined with the rest after the URL.
   - Else, for refs and patterns: the folder of `from` (everything before its last `/`, or empty)
     joined with the value. Hits that do not start with `/` resolve to nothing.
   Joining `a` and `b` gives `b` if `a` is empty, else `a/b`.
5. Normalise each candidate: split on `/`, drop empty and `.` segments, and let `..` remove the segment
   before it. A `..` with nothing before it means the candidate escapes.
6. A ref resolves to the first candidate that names an asset. If none does, it is dangling: `no_asset`
   when there is no candidate; otherwise, judged on the first candidate, `escapes` if it escaped, else
   `case_only` with `other` set to the smallest asset path that equals it after lowering both, else
   `no_asset`.

A pattern's glob is resolved through steps 2 to 5 (never cut at `?`, which is a wildcard here) using its
first candidate. It is `bad_pattern` when it
resolves to no candidate, escapes, or has `*` or `?` in its first segment. Otherwise it matches every asset path it matches
in full, case-sensitively, where `**` matches any characters, `*` any characters except `/`, and `?`
one character except `/`.

### Status

A **convention** asset has a path segment `.well-known`, or a lowered last segment matching one of
`favicon.*`, `apple-touch-icon*`, `android-chrome-*`, `mstile-*`, `safari-pinned-tab.svg`,
`browserconfig.xml`, `*.webmanifest`, `manifest.json`, `robots.txt`, `sitemap*.xml`, `humans.txt`,
`security.txt`, or, when an earlier path segment is `app`, one of `icon*`, `apple-icon*`,
`opengraph-image*`, `twitter-image*` (here `*` matches any characters).

An asset is **served** when it lies under a root's `dir` (its path starts with `dir/`, or `dir` is
empty).

1. **Base status**, first match: `referenced` if a ref whose `from` is not an asset path resolves to it;
   `convention`; `hit` if a hit resolves to it; `pattern` if a good pattern matches it; `served`; `kept`
   if a keep names it; otherwise it is a candidate.
2. **Reach**: repeat until nothing changes: a candidate that a ref from a non-candidate asset resolves to
   stops being a candidate.
3. **Final status**, first match: `referenced` if a ref from a non-asset file, or from a non-candidate
   asset, resolves to it; the base status if it is not a candidate; `weak` if a ref from any asset
   resolves to it; `unreferenced`.

### Output

1. One `asset` record per asset, sorted by path.
2. One `dangling` record per distinct `from`, `value` and reason, sorted by `from`, then `value`.
3. One `pattern` record (with `matched`, the assets it matches) or `bad_pattern` record per distinct
   `from` and `glob`, sorted by `from`, then `glob`.
4. One `unit` record per distinct non-empty `unit`, sorted: `files` in it, and `used`, those whose status
   is `referenced`, `hit` or `pattern`.
5. `summary`: `assets`; the count of each status in the order CONTRACT.md lists; `candidates`, the `weak`
   and `unreferenced` assets whose `unit` is empty; `dangling` (records printed); `unmatched_hits` (hit
   records that resolve to no asset, external ones included); `external` (ref records counted external); `pattern_share`, the basis-point ratio
   of `pattern` assets to all assets, or `"0.0000"` with no assets.

Exit 1 if any `bad_pattern` was printed.

## dupes

Semantic checks: a second `file` with the same `path` is `duplicate`, as is a second `hash` with the same
`path` and `algo`. A `norm` or `hash` naming no `file` is `unknown_path`. If two `norm` records share a
path, the later one wins.

1. **Bytes groups**: files grouped by `sha`, keeping groups of two or more. `members` sorted; `reclaim`
   is the sum of `bytes` of every member but the first.
2. **Strict groups**: `norm` records grouped by `strict`, keeping groups whose members have two or more
   distinct `sha` values. `reclaim` is 0.
3. **Loose groups**: `norm` records with `sprite` false, grouped by `loose`, keeping groups whose members
   have two or more distinct `strict` values. `reclaim` is 0.
4. Number each tier from 1 (`B`, `S`, `L`) in the order of each group's first member, and print bytes,
   then strict, then loose groups in that order.
5. **Near pairs**, per `algo`:
   - The representative of each distinct file `sha` among that algorithm's hashes is the hash record
     with the smallest path, chosen from all of them.
   - A hash whose number of 1 bits is below 8 or above 56 is degenerate: count it (over all hash
     records). A degenerate representative takes part in no pair.
   - A candidate pair is two representatives `a` and `b`, `a` before `b` in byte order, whose hashes
     differ in at most `--max-distance` bits, and whose shapes agree: with `p = width_a * height_b` and
     `q = width_b * height_a`, `|p - q| * 10000 <= aspect-basis-points * max(p, q)`.
   - For each representative, order its candidate pairs by distance, then the other path; its first
     `--neighbours` are its top pairs. Keep a pair that is a top pair of either end.
6. Sort kept pairs from all algorithms by distance, then `a`, then `b`, then `algo`. Print the first
   `--max-pairs`.
7. `summary`: `files`, the group count per tier, `pairs` printed, `capped` (true when kept pairs exceeded
   the limit), `degenerate`, and `reclaim` summed over bytes groups.

## size

Semantic checks: a second `file` with the same `path`, `dims` or `optimised` for the same path is
`duplicate`. Any other record naming no `file` is `unknown_path`. If two `norm` records share a path,
the later one wins.

For each file in path order, print its flags in this order, each with `value` and `limit`:

1. `over_cap`: `bytes` above the cap for its kind. Value `bytes`, limit the cap.
2. `pixels`: a `raster` with `dims` and at least one `render`, where `width * 10000` exceeds
   `rw * dpr * factor-basis-points`, `rw` being the largest render width. Value `width`, limit
   `floor(rw * dpr * factor-basis-points / 10000)`.
3. `optimise`: an `optimised` record smaller than `bytes`, whose saving `bytes - optimised` is at least
   `--min-saving-bytes` and with `saving * 10000 >= min-saving-basis-points * bytes`. Value the saving,
   limit `--min-saving-bytes`.
4. `embedded_raster`: its `norm` has `raster` true. Value `bytes`, limit 0.
5. `legacy_font`: a `font` whose lowered extension (after the last `.` of the last segment) is `ttf`,
   `otf`, `eot` or `woff`, when a file of any kind exists at exactly the same folder and stem plus
   `.woff2` (case-sensitive). Value
   `bytes`, limit 0.

Then, for a `raster` with `dims` and no `render`, a `no_render` record. Finally `summary`: `files`,
`flagged` (files with a flag), `flags`, `no_render`, `saving` (sum of `optimise` values).

## meanings

Semantic checks: a second `use` with the same `file` and `icon`, or a second `label` for an icon, is
`duplicate`. A `use` whose icon has no `label` is `unlabelled`.

The meaning `other` is never reported as a meaning. For every other meaning `m` in the labels of used
icons, and each family: `sites` is the number of distinct files in uses of that family whose icon's
labels include `m`; `designs` is the number of distinct `design` values among those uses. Print a
`meaning` record for each `m` with two or more families, sorted by meaning, families ordered by `sites`
descending then family. `summary`: `icons` (distinct used icons), `sites` (use records), `meanings`
(distinct meanings other than `other` in used icons' labels), `mixed` (meaning records), `other` (used
icons whose labels include `other`), `uncounted` (sum of `count`).

## verify --check inventory

Semantic check: a second `listed` with the same `by` and `path` is `duplicate`.

1. For each listing (`vcs`, then `walk`) with no records, an `empty` problem.
2. `V` is the vcs paths not in walk, `W` the walk paths not in vcs. For each path in `V`, sorted, pair it
   with the smallest unpaired path in `W` that is equal after lowering both: a `case_only` problem with
   `path` from vcs and `other` from walk. Remove both.
3. Each remaining path in `V` is `missing_from_walk`; each in `W` is `missing_from_vcs`.

Print `empty` problems first, then the rest sorted by `path`, then kind in the order `missing_from_walk`,
`missing_from_vcs`, `case_only`. `summary`: `vcs` and `walk` record counts and `problems`.

## verify --check refcov

Semantic check: a second `count` with the same `path` is `duplicate`.

Per kind: `files`, `extracted` and `pattern` sums, `covered` the sum of `min(extracted, pattern)` per
file, `coverage` the basis-point ratio `covered / pattern` (`"1.0000"` when `pattern` is 0), and `pass`
when `coverage` is at least `--min-basis-points`. The check passes when there is at least one file and
every kind passes. Print a `short` record for every file whose `extracted` is below its `pattern`,
sorted by path; then `kind` records sorted by kind; then `summary` with `files`, `kinds` and `pass`.

## verify --check audit

Semantic check: a second `candidate` or a second `audit` with the same `path` is `duplicate`.

- A candidate with no audit: `missing`. An audit with no candidate: `extra`.
- For an audit of a candidate, check in this order and stop at `inconsistent`:
  - `inconsistent`: result `none` with `hits` or `read` above 0; result `noise` or `gap` with `hits` 0 or
    `read` above `hits`.
  - `underread`: result `noise` or `gap` with `read` below `min(hits, 3)`.
  - `gap`: result `gap`.
  - `bad_skip`: result `skipped` with a stem of 4 or more characters (Unicode code points).

Sort problems by path, then kind in the order `missing`, `extra`, `inconsistent`, `underread`, `gap`,
`bad_skip`. `summary`: `candidates`, `audited` (audits of candidates), `gaps` (`gap` problems),
`problems`.

## verify --check labels

Semantic check: a second `vocab` with the same `meaning` is `duplicate`.

- A used icon with no label: `unlabelled`. A label for an icon no use names: `extra`.
- For each label of a used icon (the first, when an icon has several): each meaning that is not `other`
  and not in the vocabulary is `unknown_meaning` with `meaning`; more than two meanings is `too_many`.
- An icon with more than one label: `repeated`, once.

Sort problems by icon, then kind in the order `unlabelled`, `extra`, `unknown_meaning`, `too_many`,
`repeated`, then meaning. `summary`: `icons` (distinct used icons), `labels` (label records), `problems`.

## verify --check canaries

No semantic checks beyond step 2.

- `expect_status` passes when an `asset` record with that `path` has that `status`.
- `expect_group` with tier `pair` passes when a `pair` record has `a` and `b` as its two paths in either
  order; with another tier, when a `group` of that tier has both in `members`.
- `expect_apart` passes when no `group` of any tier has both in `members` and no `pair` has both.
- `expect_meaning` passes when a `label` for that icon lists that meaning.

Print one `canary` record per expectation in input order, with the expectation's line number. `summary`:
`canaries`, `passed`, `failed`. Exit 1 if any failed or there were no expectations: a canary check with
nothing to check has not checked anything.
