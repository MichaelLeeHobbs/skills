# Collector specification

The collector is a function you generate that runs inside the page and returns one capture as JSON Lines
text. It reads computed styles and the DOM. It has no role logic and no scale logic, and it records no
page text.

## Limits

The collector reads only. It must not use network calls, timers, storage, cookies, history, events,
clicks, form submission or any DOM write. Before using it, search its source for `fetch`,
`XMLHttpRequest`, `sendBeacon`, `WebSocket`, `EventSource`, `localStorage`, `sessionStorage`,
`indexedDB`, `cookie`, `.click(`, `submit`, `dispatchEvent`, `setAttribute`, `appendChild`, `innerHTML`,
`setTimeout`. Any hit fails step 0.

## Parameters

One object: `screen`, `viewport` (the planned width), `variant`, `auth`, `login` and `notfound` (CSS
selectors, each non-empty), `route` (a regular expression source matched against the path), `exclude`
(a list of CSS selectors for third-party and user-content regions, possibly empty).

## Header

```
{"t":"capture","screen":...,"viewport":...,"variant":...,"width":...,"auth":...,"login":...,"notfound":...,"url_ok":...,"main":...,"fonts":...,"busy":...}
```

- `width`: `window.innerWidth`.
- `auth`, `login`, `notfound`: whether the selector matches any element.
- `url_ok`: whether `route` matches `location.pathname`.
- `main`: whether `main, [role="main"]` matches any element.
- `fonts`: whether `document.fonts.status` is `"loaded"`.
- `busy`: whether `[aria-busy="true"]` matches any element.

## The walk

Visit elements once, in document order, starting at `document.body`. Each element derives its state from
its parent's stored state, so no step walks back up the tree. For `body`, treat the parent state as
empty: not hidden, not excluded, no anchor, no context, no canary.

For each element `e` with computed style `cs`:

1. **Not rendered.** If `cs.display` is `none`, skip `e` and its whole subtree: no records at all.
2. **Hidden**: `cs.visibility` is not `visible`, or `e` is faded. Faded, inherited: the parent is
   faded; or `cs.opacity` is `0`; or `e` is clipped, meaning its bounding box is at most 1px wide and
   at most 1px high and `cs.overflowX` is `hidden` or `clip`, or `cs.clip` is
   `rect(0px, 0px, 0px, 0px)`. Visibility is read on each element and does not pass down, because a
   `visibility: visible` child of a hidden parent renders.
3. **Excluded**, inherited: the parent is excluded, or `e` matches any `exclude` selector.
4. **Canary**, inherited: `e`'s `data-type-rhythm-canary` attribute if present, else the parent's value,
   else `""`.
5. **Anchor** for children: `e`'s identity part (below) when `e` has a non-empty `id` or `data-testid`,
   else the parent's anchor.
6. **Context** for children: `e`'s trimmed, lower-cased `role` attribute when it is `heading`, `button`,
   `tab` or `menuitem`; else `e`'s tag when it is in the role table (ALGORITHM.md, "Roles", not the phrasing
   list); else the parent's context. `e`'s own `ctx` is the parent's context for children.
7. **Site key**: the parent's anchor, a space, then `e`'s identity part; or the identity part alone when
   there is no anchor.
8. **Size owner**: when `e` is `body`, or its size differs from its parent's size, `e`'s own site key;
   else the parent's owner.

**Identity part**: the lower-case tag; then `#` and the normalised `id` if it has a non-empty one, else
`[data-testid=` normalised test id `]` if it has a non-empty one; then for each of the first three
stable class names in `classList` order, `.` and the normalised class.

**Stable class**: drop a class that starts with `css-`, `sc-`, `jsx-`, `emotion-` or `svelte-`, or whose
part after the last `_` or `-` is five or more ASCII letters and digits with at least one of each. Count
every dropped class on every visited element as `hashed` (a `display: none` subtree is not visited).

**Normalise** a token: if it contains `@`, it becomes `#`. Otherwise replace each run of six or more
characters from `0-9a-fA-F` that contains a digit with `#`, then each run of three or more digits with
`#`. Then keep the first 32 characters.

## Records

- **Text owner**: `e` has a direct child text node containing a non-whitespace character. If excluded:
  a `skip` with reason `excluded`. Else if hidden: `skip` `hidden`. Else if every non-whitespace character
  of its direct text is in U+E000 to U+F8FF, or the lower-cased `cs.fontFamily` contains `icon`: `skip`
  `icon`. Else a `text` record: `tag` lower case, `aria` the lower-cased trimmed `role` attribute or `""`,
  `ctx`, `size` = round(px of `cs.fontSize` x 100), `weight` = the integer value of `cs.fontWeight`,
  `line` = -1 when `cs.lineHeight` is `normal`, else round(px x 100).
- **Box**: when `e` is not hidden, not excluded and has at least one client rect. For each side of
  margin and padding, and for `rowGap` and `columnGap` when `cs.display` contains `flex` or `grid` and
  the value is in px: round(px x 100); skip zeros. Padding carries that side's border width, rounded the
  same way, as `border`; margin and gap carry 0. Left and right margins are `auto` when their rounded
  values differ by at most 1, are above 0, and the element's bounding width plus both margins, in
  unrounded px, is within 1px of the parent's content width (`clientWidth` minus its left and right
  padding).

Round half away from zero. Combine identical records within the capture and set `n` to how many there
were: `text` on every field but `n`, `box` on `site`, `family`, `value`, `border`, `auto`, `canary`,
`skip` on `reason`, `canary`. Every record carries `cap`, the capture key (CONTRACT.md).

## Output

The header line; then `text`, `box` and `skip` records, each group sorted by the UTF-8 bytes of its
serialised line; then `{"t":"end","cap":...,"text":...,"box":...,"skip":...,"hashed":...}` with the
number of lines in each group. Serialise as CONTRACT.md "Output format" says, keys in the order shown in
CONTRACT.md "Record types". LF after every line.

## Fixtures

`fixtures/collector/NN-name.html` is a page; `NN-name.params` holds the parameter object;
`NN-name.out` is the exact expected output. Open the page from a local file at a 800 by 600 viewport,
wait until `document.fonts.status` is `loaded`, run the collector with the parameters, and compare its
output byte for byte. Any difference stops the run.

Before opening a fixture page, check it: only the tags `html`, `head`, `meta`, `title`, `style`, `body`,
`main`, `section`, `div`, `span`, `strong`, `p`, `h1` to `h6`, `label`, `small`, `ul`, `li`, `button`; only the
attributes `charset`, `lang`, `id`, `class`, `style`, `role`, `aria-busy`, `data-testid`, `data-exclude`,
`data-type-rhythm-canary`; no comments; no `url(`, `\`, `expression(` or `image-set(` anywhere in the
file, and no `@` outside a `data-testid` value. Anything else fails the check, and the page must not be
opened.
