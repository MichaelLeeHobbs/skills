# The report

Keep it under 150 lines and save it in the catalog folder as `report.md`. Take every number from tool
output: coverage from `verify --check coverage`, headline counts from the `cluster` summaries, after-plan
counts from the `measure` summaries, the since-last-run line from `diff`. Canary records never enter any
count but the Canaries line.

## Header

```
Token drift audit: <package>  commit <hash>  <date>
Catalog: <folder in the repo>   Work folder: <path outside the repo>
Since last run: <added> added, <removed> removed, <anchor> re-anchored | first run
Syntaxes: <parsed list>; lexed: <list or none>   Root: <n>px (<found in file | assumed>)
Surfaces: <token names | assumed white and black>
Coverage: <coverage> of <hits> literals (<ignored_share> ignored)   PASS | FAIL   Tripwire: PASS | FAIL
Canaries: <passed> of <n>   PASS | FAIL
Judged: <n> clusters, <share> of drifted uses; rejected plan rows: <n>
```

If any line says FAIL, say first, above the header, that the run failed and which check.

## Headline

One sentence per category, from its `cluster` summary, and the neutral sentence first:

```
Greys: 41 values in use (612 uses, 71% of grey uses are hard-coded); the theme defines 9; 28 are exact or
within an imperceptible distance of a token. After the CONFIRMED snaps: 19 values.
```

Use `values`, `uses`, `literal_share`, `token_values`, `matched_values` and the measure summary's
`after`. Hairlines, zero, relative units and local z-indexes are counted in `by_status` but not as drift;
say so once. When a category has fewer than 3 token values, write instead: "<n> values in use and no theme
scale; the largest <k> clusters cover <share> of uses", and list those leaders as a proposed scale.

## Per scope

A table: scope, then per category `drift_uses` of `uses`, from the `scope` records, sorted by drift uses.

## Decision list

One numbered item per cluster family, with a default:

```
1. Body-text grey. #767676 (14 uses) and #777 (6) sit 13 milli from --grey-500, but snapping #767676
   drops contrast on white from 4.54 to 4.29 (REFUTED). Default: darken --grey-500 to pass 4.5, then snap.
2. 15px padding (31 uses), 1px from --space-4. CONFIRMED. Default: snap to --space-4.
3. 13px padding (9 uses), no token within 1px (VISIBLE to 12px). Default: none; pick 12px or keep.
```

A default is SNAP only for CONFIRMED results. KEEP decisions with their intent and cited line go in a
short list after the decisions, so the team can copy them into `decisions.jsonl`.

## Top clusters

Per category, each judged cluster: the anchor or leader, its members with uses, status and distance, up to
5 call sites per value (`path:line`), and the verdict. Point to the per-line change list in the work folder
for the rest.

## Appendix

Unresolved refs with sites; unparsed values with sites; bad tokens; the z-index ladder (token values, then
`token_plus_n`, `escalation` and `off_ladder` values); mirrored variables whose values disagree; dynamic
class patterns; exclusions by reason.
