# The report

Keep it under 150 lines and save it in the catalog folder as `report.md`. Everything else goes in the
appendix. Take every number from tool output, never from memory or a worker's summary: coverage from
`verify --check coverage`; rows, exclusions, slices, verdicts, evidence, cells, families, spend and the
families metric from `tally`; the since-last-run line from `reuse`; pairs, looks and boxes from `diff`.
Canary rows never enter `tally`, groups or decisions.

## Header

```
Component reinvention audit: <package>  commit <hash>  <date>
Catalog: <folder in the repo>   Work folder: <path outside the repo>
Since last run: <reused> reused, <changed> changed, <added> added, <removed> removed | first run
Coverage: <coverage> over <files> files (<adjusted> adjusted: <reasons>)   PASS | FAIL
Rows: <total> (<eligible> eligible; <by widget, top 8>)   Excluded: <total> (<by reason>)
Groups: <judged> judged of <groups>; <oversize> classes split; residuals judged <n> of <m>
Visual proof: rendered | FAIL (not run: <trigger>)   Locale <x>, zone <y>, fonts <loaded | fallback>
Rendered: <ok> of <cells> cells (<unreachable> unreachable, <blocked> blocked by reason, <cut> cut)
Evidence: <confirmed> CONFIRMED, <refuted> REFUTED, <unproven> BLOCKED
Spend: $<total> of $<cap> cap (measured | estimated from tokens)
Canaries: <n> of 4 behaved as planted   PASS | FAIL
Families implemented 2+ times: <n> (last run: <n> | first run)
```

If any line says FAIL, say first, above the header, that the run failed and which check. In a static
run, every finding below carries "unproven".

## Decision list

One numbered item per widget family that disagrees, not per group, ordered by import sites to move:

```
1. Status badge. 5 copies (+2 wrappers, not counted), 3 looks in `warning`, 1 cannot show `neutral`.
   Default: keep shared/ui/StatusBadge (design-system component). Move 17 import sites in 9 files.
   Proof: CONFIRMED in 4 of 5 states; `long` predicted only. Sheet: <absolute path>.
```

Each item says: copies, wrappers excluded, how many looks in the worst state, unreachable states, the
default with its reason (the canonical rule in JUDGE.md), the migration size from `tally` (`sites`), the
proof level, and the sheet path.

## Top families

Each one:

```
G3  badge: job status, order status, device state      6 members  4 VARIANT  1 SAME  1 DIFFERENT
  members:  shared/ui/StatusBadge.tsx:8   library      41 importers  [canonical]
            jobs/JobsPage.tsx:40 StatusChip hand-rolled  0 importers  hardcoded
            ...
  state       StatusBadge   StatusChip     OrderPill      (rendered | predicted)
  warning     look 1        look 2  42 px  look 1
  neutral     look 1        unreachable    look 1
  if merged onto StatusBadge: StatusChip shows amber where it showed orange in `warning` (box 2,1-60,22).
  wrappers:   OrderPill wraps the library Chip; counts as a consumer.
```

"If merged" lines come only from `pair` records that are noticeable, per state. A predicted state is
marked predicted and never supports an "if merged" line on its own.

## Families 11 to 30

One line each:

```
G14  empty-state  3 members  2 VARIANT  canonical shared/ui/EmptyState.tsx  differs: default text, action placement
```

## Prevention drafts

Drafts for the user to apply. The skill edits nothing.

- **Import rules**, ready to paste, for the linter the repo already uses: forbid importing the
  third-party components the design system wraps from outside the design system, and forbid importing
  the retired copies' paths, each with the canonical import path in the message.
- **A literal-colour rule** for the style linter, if the repo has one, when the decision list shows
  `hardcoded` styling driving the differences.
- **A migration map** per family from the frozen adapters: for each copy, which canonical props replace
  its props in each state.
- **Catalog lines** for the repo's agent context file, one per canonical component: name, import path,
  and one line on its states. Mark them valid only once the decision list is settled.

## Appendix (catalog folder, not the report)

- Every group with its verdicts, looks, pairs and evidence (`verdicts.jsonl`).
- Removed since last run, and any family left with one member, which is a resolved duplicate.
- Components classed `other`, with their notes, as candidates for the widget list.
- The state tables used in this run.
