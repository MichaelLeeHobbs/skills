# Collecting rows from the rendered page

Write the collector yourself in the work folder: a script you run in the page after the theme is applied.
It records raw facts and decides nothing. It has no fixtures: the canaries and the ground-truth check
prove it on every run, so never skip either.

## Before collecting

- Set the viewport to a fixed width (1280 unless the product says otherwise) and the height to the
  document's full height, so nothing is collected off screen.
- Apply the theme recipe, then wait until the page settles: no pending network requests, fonts loaded,
  and two animation frames with no layout change. Disable transitions and animations with an injected
  style so colours are final.
- Probe the canvas: the colour behind the root when neither the root nor the body paints a background.
  Under a dark `color-scheme` it is dark, not white. Read it by giving a temporary element the system
  colour `Canvas` and reading its computed background.

## Which nodes

One row per element that directly contains non-whitespace text, plus `::before` and `::after` with
string content, input placeholders (`::placeholder`, which WCAG does not exempt), and SVG `<text>`.

Set `skip` (the node is counted but not measured) to:
- `hidden`: `display: none`, `visibility: hidden`, `content-visibility: hidden`, zero size, or the
  visually-hidden clip pattern (1px box with overflow hidden or a clip rectangle);
- `offscreen`: entirely outside the document.

Set `exempt` to:
- `disabled`: the element or an ancestor is `:disabled` or has `aria-disabled="true"` (WCAG 1.4.3 exempts
  inactive controls);
- `allowlist`: the node matches a selector on the user's allowlist in the catalog. Never add entries
  yourself.

Text with `aria-hidden` is still measured: sighted users see it.

## Fields

| Field | How to fill it |
|---|---|
| `id` | unique across the run, for example `<screen>|<theme>|<n>` |
| `screen`, `theme` | from the inventory |
| `key` | the same text across themes: screen, a tag-and-position path from the root (`main>div:2>p:1`, no class names), and a short hash of the text |
| `fg` | the computed `color` (for SVG, `fill`; when `-webkit-text-fill-color` is set and not `currentcolor`, that) |
| `layers` | walk from the text's element to the root; keep each element whose computed `background-color` is not fully transparent or whose `opacity` is below 1, innermost first, with `color` the computed background colour, `opacity` the computed opacity as a decimal string, `src` the token that set the background (below) |
| `canvas` | the probed canvas colour |
| `size`, `weight` | computed font size in px as a decimal string, numeric font weight |
| `flags` | every reason from the list below that applies, or `[]` |
| `skip`, `exempt` | as above, or `""` |
| `fg_src` | the token that set the text colour (below) |

**Undecided flags.** Add each that applies between the text and the root: `image` (a background image
that is not `none`), `gradient`, `filter` (`filter` or `backdrop-filter` not `none`), `blend`
(`mix-blend-mode` or `background-blend-mode` not `normal`), `mask`, `clip-text` (`background-clip:
text`), `shadow` (`text-shadow` or `-webkit-text-stroke` on the text), `transform` (a scale transform
that changes the rendered size), `overlap` (the topmost element at the text's centre point, from an
elements-at-point query, is neither the text's element nor one of its descendants), `canvas-text`,
`iframe` (text in a cross-origin frame you cannot read), `shadow-root` (a closed shadow root).

**Colour strings.** Write computed colours as the browser gives them when they are `rgb()`, `rgba()` or
hex. When the browser gives another syntax (`oklch()`, `lab()`, `color()`, `color-mix()`), normalise it:
set it as the fill of a 1 by 1 canvas, draw, and read the pixel back as `rgba(r, g, b, a)` with `a` as a
decimal of the read alpha over 255 rounded to 4 places. If normalising fails, write the original string;
the tool counts it as an unparsed colour.

## Token sources (`fg_src`, layer `src`)

Find the declaration that won for the property, in the matched rules the browser reports or in source:

- it reads `var(--name)`: the source is `--name` followed by `@` and the selector of the rule that set
  that custom property's value in effect on the element (the theme scope or a component scope), for
  example `--text-muted@[data-theme=dark]`;
- it is a colour literal: `literal:` plus the file and line of the rule, or `literal:inline` for an
  inline style;
- the colour was inherited: the source of the ancestor that set it;
- you cannot tell: `""` (the tool then clusters by colour value).

Record the whole alias chain in your notes for step 4; the row needs only the source.

## Render record

After collecting a screen in a theme, write one `render` record (CONTRACT.md): `status` `collected`,
`blocked` with the reason (`auth`, `error 500`, `not found`, `timeout`) or `skipped` with `budget`;
`nodes` the rows written; `root` the colour behind the page (the root's background over the body's over
the canvas, as the collector computes it, or the computed string of the first opaque one); `sentinel` a
short hash of every custom property's resolved value on the root element. Two themes with the same root
colour and the same sentinel did not switch.

## Pixel ground truth

Once per theme, pick 10 PASS or FAIL rows with a recorded seed, at least one from each of the most common
three `bg_src` values and at least two with an alpha layer. For each: scroll it into view, set its text
colour to `transparent` with an injected rule, screenshot its box, restore, and take the median of the
screenshot's pixels. Write a `sample` record with `computed` the row's `bg` from `measure` and `pixel`
that median as `rgb(r, g, b)`. Run `verify --check truth`. If your agent cannot take screenshots, the
check cannot run and the run fails; write "collector not checked against pixels" in the header.
