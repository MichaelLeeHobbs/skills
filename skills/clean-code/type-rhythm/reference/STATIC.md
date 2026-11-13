# Static-only fallback

Use this tier when no browser can be driven or no script can run in the page. Mark every finding
`unproven (static)` and write `Mode: static` in the header: declarations miss the cascade, inheritance,
browser defaults and runtime styles.

## Records

Write `{"t":"mode","mode":"static"}`. Treat each stylesheet or styled component file as one capture:
`screen` is its path, `viewport` 0, variant `static`, every header flag set to the passing value,
`width` 0. Declarations inside width queries are read too and graded against all-viewport steps; the
header says so. Declare the matching `screen` records, `{"t":"viewport","width":0}`,
`{"t":"variant","variant":"static"}`, and a `routes` record whose `count` is the number of
style files found by a second, independent search, so `verify --check captures` proves every file was
read.

For each rule:
- A declaration of font size, weight or line height becomes one `text` record. `site` is the selector,
  normalised as COLLECTOR.md normalises tokens. `tag` is the selector's last element type if it has one,
  else `div`, so roles come only from selectors that name a tag or a role-map entry. `owner` equals
  `site`. Resolve rem against 16px unless the source sets the root size. A value you cannot resolve to
  pixels (a variable with no literal, `inherit`, a viewport unit) is left out and counted in the report.
- Each margin, padding or gap declaration becomes `box` records, one per side, `auto` true for an `auto`
  margin, `border` from a border width declared in the same rule.
- Write an `end` record per file with the record counts.

## Canary

Write one extra file in the work folder, never in the repo, holding a rule for each of: a `label` at an
off-scale size (c1), an `h2` at a step serving heading (c2), a `div` with off-scale padding (c4), chosen
as CAPTURE.md "Canaries" chooses `m` and `s`. Read it the same way as a capture with variant
`canary-static`, and run `verify --check canaries`. It must pass.

## What the report can and cannot say

It can say which declared values sit off the scale and where they are declared. It cannot say how many
elements render them, which role an element plays when the selector does not say, or whether a
declaration wins the cascade. Count by declarations, never by elements, and say so in the header.
