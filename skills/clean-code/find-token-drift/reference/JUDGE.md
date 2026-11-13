# The judge

The judge decides intent; the tool already decided distance. Give the judge, per batch, the `value`
records of the clusters it judges, the token values of that category, the team decisions that apply, and
read access to the source at the recorded commit. It never computes or restates a number: every number in
its output comes from tool records.

## What it judges

Per category, the 15 clusters with the most uses (a cluster is a leader and its members, or a token
anchor and the values anchored to it), plus the canary cluster in the canary run. Before judging, apply
the catalog's `decisions.jsonl`: a row whose value matches and whose scope prefix covers the value's sites
becomes the plan row without judging. A KEEP row is judged again when `diff` reports its anchor changed.

## One plan row per value

Read at least one call site per value, and every site when they disagree in role.

- **SNAP** `token`: the value means what the token means. When two tokens are admissible, prefer the
  semantic one for the role over the nearest raw value (`text.secondary` for body text over `grey-700`),
  because the semantic token follows dark mode. A SNAP to a token in another category is a reject.
- **NEW**: a cluster with no fitting token, used widely enough to deserve one. Give a name in the
  project's token naming in the report, not in the plan row.
- **KEEP** `intent` and `cite` (`path:line` of the line that shows the intent): `palette` (data
  visualisation series), `brand` (a third party's or the product's fixed brand colour), `hairline`
  (deliberate 1px work), `optical` (a nudge to align an icon or baseline), `local-layer` (a z-index inside a
  component's own stacking context), `state` (a hover, focus or disabled shade derived on purpose),
  `third-party` (styles copied to match an embedded widget).
- **SPLIT**: one value plays two roles (a grey used for text and for borders). Say which sites belong to
  which role in the report; the next run judges each part.

Defaults: a value whose status is `exact` needs no row. A `snap` or `near` value anchored to a token gets
SNAP to that token unless the source shows another intent. A `lone` value with one use gets no row.

## After `measure`

A REFUTED snap is never a default: the decision list offers fixing the token, KEEP, or a different token,
with the crossing shown. A VISIBLE snap goes to the decision list with its distance and no default. Only
CONFIRMED snaps become defaults.

## Calibration

None beyond the canary: the palette canary (Check item 9) is judged with the real batch and must come
back KEEP `palette`. If it does not, the run fails; do not re-prompt the judge with the answer.
