# Judging a family

## What the judge gets

Per family: the `families` record, each package's `sites` record, its `size` and `pins` results, its
installed description and its own deprecation or maintenance notice if it has one (the manifest's
`deprecated` field, the README's opening section), and for each primary up to 10 importing files, chosen
to cover every distinct member the extractor saw (excerpts of the importing lines and the lines that use
the bindings, capped at about 3,000 tokens per file). Add the catalog's previous `history.jsonl` lines
for these packages.

Give one family per call, or batch about five small families in one call. Do not tell the judge which
package the counts favour.

## Verdicts

- **REAL**: two or more primaries do the same job in this runtime, and the keeper can do every call the
  other makes (with a plugin or a small change).
- **COMPLEMENT**: the mapping was wrong; one package extends the other. Fix the `map` record, log the
  change in the report, and run `families` again.
- **DIFFERENT_JOB**: the used members do not overlap (d3 used only for scales next to a chart library;
  lodash used only for `debounce` next to a utility belt that has none).
- **TRANSITIONAL**: a migration is already under way: `history.jsonl` shows the loser's call sites
  falling run over run, or the code says so. Report progress instead of a decision.

## The coverage matrix (REAL only)

List every distinct member of each primary the repo uses. For the likely loser, class each member against
the keeper:

- `same`: the keeper has a call with the same behaviour.
- `differs`: the keeper has a call, but behaviour differs on some input (zone default, mutation, format
  tokens, invalid input, rounding, wording). Name the input class.
- `needs-plugin`: the keeper needs a plugin or companion package (name it, and check whether it is
  already installed).
- `no-equivalent`: nothing in the keeper does it.

Every `differs` row is a claim until step 6 runs it. Write the matrix as a translation table: each loser
member and literal (format string, unit name) with the keeper expression it would become. Step 6 runs
these rows.

Also count leaks from the excerpts: places a library type crosses a module boundary (an exported
function's signature, a component's prop type, a store's state shape, an exception type caught in another
module, a schema or model class passed between modules). Each leak changes every consumer. Label the
count `syntactic, lower bound`.

## The keeper rule

In order, the first rule that separates the candidates decides:
1. A package whose own installed files say it is deprecated or in maintenance mode loses.
2. A package that `pins` shows stays in the app anyway (pinned by a dependency that stays) wins, because
   dropping it saves nothing.
3. Fewest `no-equivalent` members in the other direction wins.
4. Fewest leaks to change wins.
5. Most call sites (`refs`) already on it wins.
6. Fewer measured units wins.

A platform built-in (fetch, `Intl`, `crypto.randomUUID`, `URLSearchParams`, Python's `datetime` and
`zoneinfo`) may be the keeper at zero bytes when every target the repo declares supports it; check the
declared targets, not memory.

"Keep both" is a valid default only with the used members that prevent a merge, named.

## Wrappers and the boundary with find-reinvention

When one repo file imports the library and re-exports or wraps it for the rest of the code, report
"behind a wrapper: <file> (<affected> files)". The migration then edits the wrapper, not every caller.
A hand-written function that copies what a library already does is not this skill's finding: name it
and point to find-reinvention.

## Output

One JSON line per family: `family`, `verdict`, `keeper`, `losers`, `reason` (the keeper rule that decided,
by number), `no_equivalent`, `needs_plugin`, `leaks`, `wrappers`; then the translation table rows, each
with `member`, `literal`, `keeper_expression`, `class`, `input_class`.
