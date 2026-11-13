# The report

Keep it under 150 lines and save it in the catalog folder as `report.md`. Lead with the fixes, not the
sites. Take every number from a tool summary or record, never from memory or a worker's summary. Canary
rows never enter the counts.

## Header

```
Theme parity: <app>  commit <hash>  <date>  instance <url the user named>
Catalog: <folder in the repo>   Work folder: <path outside the repo>
Browser: <name> <version>  viewport <w>  <OS>   Rendered: yes | no (static only)
Threshold: WCAG 2.2 <AA|AAA>   Themes: <list>
Coverage: <collected> of <planned> renders, <blocked> blocked, <skipped> skipped  <coverage>  PASS | PARTIAL | FAIL
Switch: <problems with reason switch> screens did not switch   PASS | FAIL
Nodes: <PASS> pass, <FAIL> fail, <UNDECIDED> undecided, <SKIPPED> skipped, <EXEMPT> exempt
Decided: undecided <undecided_share> (<top reasons>), unparsed colours <colour_share>   PASS | FAIL
Clusters: <clusters>; top 3 hold <top3_share> of failing nodes (n/a under 30)
Fixed colours: <fixed_failing> failing, <fixed_fg + fixed_bg + fixed_both> in all; unmatched keys <missing>
Fixes: <proven> PROVEN, <partial> PARTIAL, <refuted> REFUTED, <blocked> BLOCKED
Canaries: <behaved> of <expected> behaved; proof canary PROVEN | not   PASS | FAIL
Ground truth: <off> of <samples> off by more than 2   PASS | FAIL
Spend: <time> of <cap>, $<total> (measured | estimated from tokens)
```

Where each number comes from: Coverage and Switch from `verify --check coverage`; Nodes and Decided from
the main `measure` summary; Clusters from `cluster`; Fixed colours from `parity`; Canaries from
`verify --check canaries`; Ground truth from `verify --check truth`; Fixes by counting the fix lines.

If any line says FAIL, say first, above the header, that the run failed and which check. A PARTIAL run
says above the header which routes were not rendered (or where the list is).

## Fix lines

The top 10 fixes, ranked by pairs fixed, one line each in this order, then one indented line of detail:

```
F1 --text-muted@[data-theme=dark] #6b7280 -> #9ca3af (gray-400) fixes 212 pairs on 31 screens, worst 3.03 -> 6.99, regressed 0, checked 51 of 51 screens  PROVEN
   declared; alias --text-muted -> --gray-500 (aliased by 14 tokens, so not the target); clusters C0001 C0004; set in src/styles/themes/dark.css:42
F2 literal src/components/Badge.css:18 #333333 -> var(--text-primary) fixes 40 pairs on 9 screens, worst 1.40 -> 15.31, regressed 0  PROVEN
```

Pairs fixed, regressions and worst ratios come from `candidates` and the proof run's `measure`; screens
from `cluster` and the proof screen list.

## Decision list

One numbered item per choice the user must make, each with a default:

```
1. --link in dark: #60a5fa fixes 38 pairs but regresses 2 on --accent-banner (4.62 -> 4.12).
   Default: #60a5fa and darken --accent-banner, a second fix to prove.
2. Cluster C0006 is ambiguous: --text-muted or --icon-muted both render #6b7280 on the settings
   screens. Default: --icon-muted, because the rows sit inside icon buttons (src/Settings.tsx:88).
```

Every REFUTED fix, ambiguous or unattributed top cluster, BLOCKED fix and fix with regressions is an
item.

## Undecided

One line per `undecided` record from `cluster` in its order, top 10, then a note on what would decide
them (for example "40 rows over the --hero gradient on 2 screens: check by eye or flatten the gradient
behind text").

## Prevention drafts

Drafts for the user to apply. The skill edits nothing.

- A lint rule, for the linter the repo already uses, that flags a colour literal in component styles,
  naming the token to use instead for each literal the run found.
- A token-pair test: for each pair the run proved, a check that their values in every theme stay above
  the need, written for the test runner the repo already uses.
- A line for the repo's agent context file naming the theme files and the rule "never set a colour token
  in one theme scope without the others".

## Appendix (catalog folder, not the report)

Every cluster, every fixed colour (passing ones too), every fix's before and after tables, every
blocked screen with its reason, and the routes not rendered.
