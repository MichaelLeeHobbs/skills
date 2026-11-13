# The report

Keep it under 150 lines and save it in the catalog folder as `report.md`. Take every number from tool
output, never from memory: counts from the `tally` summary, roles from `role` records, values from
`value` and `space` records, owners from `owner` records, coverage from `verify --check captures`,
canaries from `verify --check canaries`. Canary captures never enter the tally.

## Header

```
Type rhythm audit: <app>  commit <hash>  <date>   Mode: browser | static (findings unproven)
Environment: <host> (<test | production, approved by the user>)   Tier: full | capped | static
Catalog: <folder in the repo>   Work folder: <path outside the repo>
Since last run: <sizes in use then -> now, off-scale then -> now> | first run
Coverage: <valid> of <planned> captures, routes <accounted> of <declared>   PASS | FAIL
Not measured: <dark theme | dialogs, menus, toasts | excluded routes: n>
Scale: <declared at path | named by the user | none: distribution mode>   Role fit: graded | not graded
Fluid type: <present in source, graded at measured widths only | none found>
Canaries: <passed> of <entries>   PASS | FAIL
Sizes: <sizes_in_use> in use, the scale has <scale_sizes>, <sizes_off> off-scale
Weights: <weights_in_use> in use, scale <scale_weights>, <weights_off> off-scale
Spacing: <space_in_use> values in use, scale <scale_space>, <space_off> off-scale
Unassigned text: <unassigned_bp>   PASS | FAIL
```

"Role fit: not graded" when no size step names its roles. If any line says FAIL, say first, above the
header, that the run failed and which check.

## Per role

One table per role, from `role` and `value` records:

```
Body  3,000 elements on 40 screens, 91% on scale (tag 2,800, context 200)
  size  14px on 2,400 | 15px OFF 270 (2 owners) -> fold to 14px | 16px on 330
  weight 400 on 2,950 | 500 OFF 50
  line  20px on 2,700 | normal 300
  example sites: table.grid td, main#app p.intro, aside.panel li
```

List three example site keys per role so a wrong tag-based role is visible.

## Decisions

One row per role and off-scale value, "add a step" rows first:

```
1. Body 15px (270 elements, 3 owners). Add a step 15px for body, or fold to 14px. Default: add a step.
2. Caption 14px (wrong role: 14px serves body and label). Fold to 12px. Default: fold.
```

Default to "add a step" when 3 or more distinct owners render the value (the `value` record's
`owners`); otherwise "fold to" the `nearest` step serving that role. In distribution mode the first row
proposes a scale: the values covering most text elements per role, for the user to accept or edit.

## Findings by owner

From `owner` records, in their order (screens, then elements). A ticket fixes an owner, not a value:

```
O1  table.grid   15px on 260 elements, 15 screens   trace: located  src/grid/Grid.module.css:12
O2  .MuiTypography-caption   13px on 80 elements   trace: library default -> theme override
```

Then the top spacing findings from `space` and `spacesite` records the same way.

## Tracing

For each owner in the `owner` list, up to 30:
1. Search source for the owner's stable class or id, and for the value in every unit form it could take:
   px, rem at the measured root size, and the utility class or token that produces it.
2. Label the trace `located` (one declaration explains it, cite file and line), `candidates` (several
   could; list up to three), `library default` (the owner is a component library's own class; the fix is
   a theme override), or `unlocated`.
3. When the search finds several near-duplicate literals behind one value, write "see find-token-drift"
   and stop: consolidating source values is that skill's job.

Write a trace as a lead to check, never as proof; only the rendered value is proven.

## Prevention drafts

Drafts for the user to apply; the skill edits nothing. Lines for the repo's agent context file, one per
role, once the decisions are settled: `Body text: 14px or 16px, weight 400, line 20px (tokens: ...)`.
If a component library sets an off-scale size by default, draft the theme override.

## Appendix (catalog folder, not the report)

- The full `tally` output (`tally.jsonl`).
- Unassigned site keys left after the pilot, and the role map.
- Stale exceptions from `stale` records: exceptions whose site no longer renders.
