# Static check: no browser

Use this only when you cannot drive a browser. It checks the token pairs that source declares, with the
same tool, and every finding is UNPROVEN: source cannot show which colours meet on screen, alpha over an
unknown parent, runtime styles, states or placeholders. A static run never says the app passes.

## Steps

1. Build and prove the tool (SKILL.md step 0). The fixtures still must all pass.
2. Read the token table per theme (SKILL.md step 1), resolving every alias chain to a colour. Normalise
   each value to hex or `rgb()`; a value you cannot normalise stays as written and the tool counts it as
   unparsed. A token that a theme scope does not redefine takes the value of the scope it inherits from,
   usually the root: that inherited value is exactly the bug this check looks for.
3. **Pairs.** Make a pair only where source puts a text colour and a background together: one rule or
   style object that sets both, a component that applies both, or a naming convention the token file
   documents (`--on-primary` with `--primary`). Never pair every text token with every background.
4. For each pair and theme write a `node` row: `fg` the text token's value, `layers` one layer with the
   background token's value, opacity `"1"` and `src` the background token; `canvas` `#ffffff` for a light
   theme and `#000000` for a dark one; `size` `"16"` and `weight` 400 unless the rule sets a size;
   `flags` `["unknown-parent"]` when the background has alpha below 1; `key` the pair's two token names;
   `fg_src` the text token.
5. List every colour literal in component styles as a fixed-colour candidate, with file and line.
6. Run `measure`, `parity` and `cluster` as in the browser run, and `candidates` for the top clusters.
   There is no proof step.

## Its own check

Copy the token file into the work folder and add two canaries to the copy: a text token `--tp-canary-text`
set to `#6b7280` in the root or light scope only, declared in one rule with a background
`--tp-canary-surface` set to `#ffffff` in light and `#1f2937` in dark (the pair must PASS in light and
FAIL in dark, at 4.83 and 3.03),
and a literal `#333333` in a copied component rule (it must appear in the literal list). Run steps 2 to 6
on the copy as well. **The static run fails** when a fixture fails, a canary is not found, or `measure`
returns FAIL.

## Report

The first line, above the header, says "Static only: no screen was rendered; every finding is UNPROVEN."
The header's Rendered line says `no`; Coverage counts pairs, not renders; the Canaries, Ground truth and
Fixes lines say `not run (static)`. Fix lines end in `UNPROVEN` instead of a proof status, and the
decision list adds one item: run the browser check before acting on any fix.
