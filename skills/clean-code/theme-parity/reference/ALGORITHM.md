# Parity tool algorithm

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
      `missing_field`; present with the wrong type, or outside its set, is `bad_field`. A `names` array
      that repeats a value is `duplicate`. Then the extra `bad_field` rules CONTRACT.md lists for that
      record (the `cluster` patterns, the three colour fields that must parse).
3. Only when every line passed step 2, run the semantic checks for the subcommand (below) in input
   order. The first failing record decides the error, using that record's line number. Exit 2.
4. Compute and print the output. Exit as CONTRACT.md "Exit codes" says.

**Byte order.** "Sorted" always means sorted by the UTF-8 bytes of the string, compared byte by byte, a
shorter prefix first. Never use a locale-aware comparison.

**Exact numbers.** Every computation below uses exact integers or exact fractions of integers. Never use
floating point except to build the linear table, and there only as that section says.

**Basis points.** A share `num / den` is `bp = floor(num * 10000 / den)`, printed as the integer part of
`bp / 10000`, a dot, then `bp mod 10000` padded to four digits: 9124 prints as `"0.9124"`.

## Colours

A colour string parses to channels `r`, `g`, `b` (integers 0 to 255) and an alpha `a` (an exact fraction
from 0 to 1). The accepted forms, matched against the whole string with no surrounding space:

- `#` then 6 hex digits (`a` = 1), or `#` then 8 hex digits (`a` = last pair / 255). Hex digits in
  either case.
- `rgb(` or `rgba(` (lowercase), the arguments, then `)`. The arguments are either
  - comma form: three or four values separated by commas, each value with any number of ASCII spaces
    around it; or
  - space form: three values separated by one or more spaces, optionally followed by zero or more
    spaces, `/`, zero or more spaces and a fourth value (`rgb(0 0 0/0.5)` parses); zero or more spaces
    after `(` and before `)`.
  The first three values are channels: 1 to 3 ASCII digits, value at most 255. The fourth is the alpha:
  a `dec` (CONTRACT.md) whose value is at most 1, taken as an exact decimal fraction (`0.08` is 8/100).
  Without a fourth value, `a` = 1. `rgb` and `rgba` accept the same arguments.

Anything else does not parse: named colours, `transparent`, percentages, `hsl()`, `oklch()`, `color()`,
`color-mix()`. The collector normalises what it can before writing a row (COLLECT.md).

**Hex output** is `#` and six lowercase hex digits.

## Linear table

For `c` from 0 to 255, `v(c)` is the linear-light value scaled by 10^9:

- `c <= 10`: `v = floor((2 * c * 10^10 + 32946) / (2 * 32946))` in integers (this is `c / 255 / 12.92`
  scaled and rounded half up; 10/255 is below 0.04045 and 11/255 above it).
- `c >= 11`: compute `s = c / 255` and `lin = ((s + 0.055) / 1.055) ^ 2.4` in IEEE double precision, then
  `v = floor(lin * 10^9 + 0.5)`.

`table` prints these 256 values. Its fixture pins every value, so an implementation whose power function
differs in a way that matters fails there and nowhere else.

Checkpoints: `v(0)` = 0, `v(10)` = 3035270, `v(11)` = 3346536, `v(118)` = 181164244, `v(255)` = 1000000000.

## Contrast

**Luminance** of an opaque 8-bit colour: `L = 2126 * v(r) + 7152 * v(g) + 722 * v(b)` (scale 10^13).

For two luminances, `hi` is the larger and `lo` the smaller. `num = hi + 500000000000` and
`den = lo + 500000000000`.

**Need**, in tenths: level AA is 30 for large text and 45 otherwise; level AAA is 45 for large text and
70 otherwise. Printed as the tenths' integer part, a dot, and one digit: 45 prints `"4.5"`, 30 prints
`"3.0"`.

**Pass** when `num * 10 >= den * need`. **Ratio** printed: `q = floor(num * 100 / den)`, then the integer
part of `q / 100`, a dot, and `q mod 100` padded to two digits. The printed ratio is floored, so a failing
pair never prints at or above its need.

**Large text**: `size >= 24`, or `weight >= 700` and `3 * size >= 56`, with `size` as an exact decimal.

## measure

Semantic check: a second `node` with the same `id` is `duplicate`.

For each node, in input order, decide the bucket. The first rule that applies wins:

1. `skip` is not empty: `SKIPPED`, `reason` = the value of the `skip` field.
2. `exempt` is not empty: `EXEMPT`, `reason` = the value of the `exempt` field.
3. `flags` is not empty: `UNDECIDED`, `reason` = the first flag in byte order.
4. `fg`, `canvas` or any layer `color` does not parse: `UNDECIDED`, `reason` = `colour`.
5. `canvas` has alpha other than 1: `UNDECIDED`, `reason` = `canvas`.
6. Otherwise composite, measure, and set `PASS` or `FAIL`; `reason` = `""`.

For buckets other than `PASS` and `FAIL`, `ratio`, `need`, `fg` and `bg` are `""`. `large` is always
computed from `size` and `weight`.

**bg_src** is the `src` of the first layer (innermost first) whose `color` does not parse to alpha
exactly 0, so a colour that does not parse counts; `"canvas"` when there is none.

**Compositing.** Work in premultiplied colour: a colour `(r, g, b, a)` becomes `(r*a, g*a, b*a, a)`, all
exact fractions. `over(A, B) = A + (1 - A.a) * B`, each of the four components. Scaling by `o` multiplies
all four components by `o`.

- Glyph: `G = premul(fg)`. Background: `B = (0, 0, 0, 0)`.
- For each layer `i` from the innermost: `G = over(G, premul(color_i))`, `B = premul(color_i)` if `i` is
  the innermost layer, else `B = over(B, premul(color_i))`; then scale both `G` and `B` by `opacity_i`.

  Within one element the text paints over that element's background, so layer 0's colour goes under the
  glyph. A layer's opacity applies to it and everything inside it as one group.
- Finally `G = over(G, premul(canvas))` and `B = over(B, premul(canvas))`. Both now have alpha 1.
- Round each channel half up: for a fraction `n / d`, `floor((2 * n + d) / (2 * d))`. The rounded `G` is
  the text colour, the rounded `B` the background colour; print both as hex in `fg` and `bg`.

With no layers, `B` stays `(0, 0, 0, 0)` until the canvas step.

**Summary.** Count each bucket. `undecided_by_reason` counts UNDECIDED nodes by `reason`. With
`m = PASS + FAIL + UNDECIDED`: `undecided_share` is UNDECIDED / `m` and `colour_share` is the UNDECIDED
nodes with reason `colour` / `m`, both in basis points. `result` is `FAIL` when `m` is 0, when the
undecided basis points exceed `--max-undecided-basis-points`, or when the colour basis points exceed
`--max-colour-basis-points`; otherwise `PASS`. When `m` is 0, print both shares as `"0.0000"`. Exit 1 on
`FAIL`.

## parity

Semantic checks: a second `pair` with the same `id` is `duplicate`; a second `pair` with the same `key`
and `theme` is `duplicate`.

1. The themes are the distinct `theme` values. If there are fewer than two, print the summary with every
   count other than `themes` and `keys` as 0, and exit 1.
2. For each distinct key, in byte order:
   - present in fewer than all themes: `missing`;
   - otherwise, any of its records with a bucket other than `PASS` or `FAIL`: `undecided`;
   - otherwise `joined`. Let the fg values and bg values be the sets over its records. One fg value and
     several bg values: side `fg`. One bg value and several fg values: side `bg`. One of each: side
     `both`. Otherwise not fixed.
3. For each fixed key print `fixed`: `value` is the constant colour (the fg value for `both`), `src` the
   matching `fg_src` or `bg_src` of the record whose theme sorts first (`fg_src` for `both`), and
   `fails_in` the sorted themes whose record is `FAIL`.
4. Summary: `themes`, `keys`, `joined`, `missing`, `undecided`, the count of each side, and
   `fixed_failing`, the fixed keys with a non-empty `fails_in`. Exit 0.

## cluster

Semantic check: a second `pair` with the same `id` is `duplicate`.

1. **Targets.** A record's fg target is `fg_src` when it is not empty, else its `fg`. Its bg target is
   `bg_src` when it is not empty, else its `bg`.
2. **Clusters.** Group `FAIL` records by theme, fg target and bg target. For each: `pairs`, `screens`
   (distinct `screen` values), `worst` (the lowest ratio, compared as hundredths) and `need` (the highest
   need, compared as tenths). Print `worst` and `need` exactly as the string in the record that holds
   them, the first such record in input order on a tie; never reformat them. Sort by `pairs` descending, then theme, fg target, bg target in byte order.
   Number them `C` plus four digits from `C0001` (past 9999, the number as it is).
3. **Undecided.** Group `UNDECIDED` records by theme, `reason` and `bg_src` (as given, even if empty).
   Count `pairs` and `screens`. Sort by `pairs` descending, then theme, reason, bg_src.
4. **Summary.** `pairs` is every record, `fail` the FAIL records, `clusters` the cluster count, `top3`
   the pairs in the first three clusters, `top3_share` = `top3 / fail` in basis points, or `""` when
   `fail` is below 30.

## candidates

Semantic checks: a second `node` with the same `id` is `duplicate`; a second `target` is `duplicate`; a
second `candidate` with the same `name` is `duplicate`. After those, no `target` at all is `no_target`
with line 0.

1. A node **uses** the target when its `theme` equals the target's theme and, for side `fg`, its `fg_src`
   equals the target's `src`; for side `bg`, any layer's `src` equals it.
2. A node is **affected** when it uses the target and `measure` rules 1 to 5 do not apply to it.
3. **Before**: measure every affected node as it is. Print `before` with `affected`, `fail` (FAIL count)
   and `worst` (lowest ratio, `""` when none are affected).
4. For each candidate in input order, replace on every affected node the target's colour with the
   candidate's colour string (side `fg`: `fg`; side `bg`: the `color` of every layer whose `src` equals
   the target's `src`), and measure again. Compare each node's bucket before and after: `fixed` is FAIL
   to PASS, `regressed` PASS to FAIL, `still_failing` FAIL to FAIL. `worst` is the lowest ratio after,
   `""` when none are affected.

## verify --check coverage

Semantic checks: a second `screen` with the same `screen` and `theme` is `duplicate`; a second `render`
with the same `screen` and `theme` is `duplicate`; a `render` whose screen and theme no `screen` record
planned is `unknown_screen`.

1. For each planned screen and theme, in the order `(screen, theme)` sorts by bytes (screen first):
   - no render: problem `missing`;
   - status `collected` and `nodes` 0: problem `empty`;
   - status `blocked` or `skipped` and `reason` empty: problem `no_reason`.
2. Then for each screen in byte order, take its `collected` renders sorted by theme. For each pair of
   them `(i, j)` with `i` before `j` in that order: when `root` is equal and `sentinel` is equal, problem
   `switch` with `theme` = theme `j` and `with` = theme `i`.
3. Every problem has `with` = `""` except `switch`.
4. Summary: `planned`, `collected`, `blocked`, `skipped`, `missing` (counts by status, and planned with
   no render), `problems`, and `coverage` = `collected / (planned - skipped)` in basis points
   (`"0.0000"` when the denominator is 0). `result` is `FAIL` when the denominator is 0, when coverage
   is below `--min-basis-points`, or when there is any problem; else `PARTIAL` when `skipped` is above 0;
   else `PASS`. Exit 1 only on `FAIL`.

## verify --check canaries

Semantic checks: a second `pair` with the same `id` is `duplicate`; a second `fixed` with the same `key`
is `duplicate`.

For each `expect` and `expect_fixed` record, in input order:

- `expect`: no `pair` with its `id` is problem `missing` (`want` the expected bucket, `got` `""`); a
  different bucket is problem `bucket` (`want` and `got` the buckets); otherwise, when its `fg_src` is not
  empty and differs from the pair's, problem `src` (`want` and `got` the sources).
- `expect_fixed`: no `fixed` with its `key` is problem `not_fixed` (`want` the side, `got` `""`); a
  different side is problem `side`.

Each problem prints `id` (the `id` or `key`), `reason`, `want`, `got`. Summary: `expected` (the
`expect` and `expect_fixed` records together), `behaved` (those with no problem), `result` `FAIL` when `expected` is 0 or any problem exists,
else `PASS`. Exit 1 on `FAIL`.

## verify --check truth

No semantic checks. For each `sample` in input order, `delta` is the largest absolute difference between
the `computed` and `pixel` channels (alpha ignored). When `delta` exceeds `--max-channel-delta`, print
problem `off` with that `delta`. Summary: `samples`, `off`, `result` `FAIL` when `samples` is 0 or when
`off * 10000 > max-off-basis-points * samples`, else `PASS`. Exit 1 on `FAIL`.

## table

Print the 256 `lin` records. Exit 0.
