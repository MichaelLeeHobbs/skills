# Judging groups

## What the judge decides

The tool already says where the copies differ and in which direction. The judge reads source to decide
what those differences mean.

**Member verdict**, for each member against the anchor:
- **SAME_CONTRACT**: the same payload on the same wire.
- **PROJECTION**: the same payload, and the member deliberately declares a subset (a summary view, a
  form). PROJECTION silences only `MISSING` and `EXTRA` cells; a `TYPE`, `ENUM_*`, `NULLABILITY` or
  `PRESENCE` cell on a field both declare stays live.
- **DIFFERENT**: not the same payload. Add the note `layer` (a storage entity, a view model built from the
  DTO) or `entity` (another thing that shares vocabulary). The member leaves the diff.

**Cell verdict**, for every BREAKING, DISAGREE, local UNRESOLVED or rename cell:
- **REAL**: the payload really differs as the cell says. Cite the deciding line on both sides.
- **TRANSFORMED**: code the tool cannot see makes the two agree: a custom serializer, a per-constant enum
  rename, a client interceptor that renames keys or revives dates, a mapper the consumer runs before
  reading. Cite the transform as `path:line`. `verify --check evidence` fails a cite that is not a line of
  an inventoried file. One transform may cover a class of cells (an interceptor for every consumer under a
  path); cite it once with the scope it covers.

A rename candidate is REAL when the two fields carry the same value, and is dropped otherwise.

## Implies every call fails

When a REAL cell would make a live endpoint fail on every call (a required field the producer never
sends, an enum spelling the consumer always rejects), search once more for a transform. If none is
found, keep the cell REAL with its rank and flag it "implies every call fails: confirm the consumer is in
use". Never demote or drop it.

## Never launder a verdict

A cell with no cited line on both sides is `uncited`, never `diffed`. A config kind with no producer run
is never CONFIRMED (see [PROVE.md](PROVE.md)). If you are tempted to write CONFIRMED without a run output
in front of you, the evidence is BLOCKED.

## Calibrate before judging

1. Build a calibration set from real shapes only, never canaries: two pairs you settle as SAME_CONTRACT
   by reading both, one PROJECTION, one DIFFERENT that shares vocabulary (an auth claims shape beside a
   user profile, a storage entity beside its DTO).
2. Judge the set twice, each time with a fresh judge that sees only the brief and the set.
3. If any verdict differs between the two runs, or from the answer you settled, the brief is unclear.
   Rewrite it and judge the set twice again.
4. When both runs agree with the settled answers, freeze the brief. A changed brief means calibrating
   again.

## Judge brief

Give each judge call one group (or about ten small groups batched in one call) and this brief:

> You are given the full source of several data shapes, the serializer and validator configuration that
> applies to each with its `file:line`, any client interceptors and mappers on the path, and a table of
> differences computed from the parsed fields. The table can be wrong; trust the source. The first shape
> is the anchor. For every other shape give one member verdict: SAME_CONTRACT, PROJECTION or DIFFERENT
> (with note `layer` or `entity`). For every listed cell give REAL or TRANSFORMED, with the line on each
> side that decides it, or the `path:line` of the transform. Do not guess from names. Reply as JSON lines:
> one `member` line per shape with `group`, `member`, `verdict`, `note`, then one `cell` line per cell with
> `group`, `member`, `a_field`, `m_field`, `kind`, `verdict`, `lines` or `cite`.

Do not tell the judge which grouping key proposed the group or that canaries exist.

## Rank order

Judge, and later report, in this order: BREAKING on a consumer that parses a list (one bad element fails
the whole list), other BREAKING, groups whose anchor is a generated shape (a hand-written shadow: the fix
is to import the generated type), DISAGREE by importers, then local UNRESOLVED.
