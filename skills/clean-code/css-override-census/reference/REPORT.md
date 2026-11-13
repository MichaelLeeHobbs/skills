# The report

Keep it under 150 lines and save it in the catalog folder as `report.md`. Take every number from tool
output: coverage from `verify --check coverage`, counts from the `census` summary, causes from
`verify --check causes`, the layer count from `verify --check layers`, canaries from the `canaries`
record. Canary records never enter a count, a proposal or a decision.

## Header

```
CSS override census: <package>  commit <hash>  <date>
Catalog: <folder in the repo>   Work folder: <path outside the repo>
Coverage: <coverage> over <counted> files (<unparsed> unparsed)   PASS | FAIL
Rules: <rules> (<bad> bad selectors)   Skipped: <by reason>   Unexpanded: <n> @extend, <n> @include
!important: <important> in <important_rules> rules  by cause: <by_cause>  (<blocked> BLOCKED)
Library internals: <internal_rules> rules use <internal_tokens> internal classes; <dead_tokens> dead now
Deep chains: <deep_rules> rules with <deep>+ compounds   ID selectors: <id_rules>   Max specificity: <a,b,c>
z-index: <z_distinct> distinct values in <z_uses> uses; <layers> layers needed; <z_named_distinct> named
Canaries: <n> of <m> behaved as planted   PASS | FAIL
Since last run: <metric changes from history.jsonl> | first run
```

If any line says FAIL, say first, above the header, that the run failed and which check.

## Decision list

One numbered item per choice the team has to make, each with a default:

```
1. Adopt the 4 z layers (base 0-10, sticky 100-110, overlay 1200-1350, toast 9999). Default: yes.
2. Toast stacks under the date picker popup (DatePicker.tsx:88 sets 1400, Toast.tsx:12 sets 1300).
   Default: move toast above all overlays.
3. Put the component library in a lower cascade layer. Removes 112 of 140 library-cause !important.
   Default: yes, once the injection order change in theme.ts is reviewed.
```

## Dead overrides

Every dead token with each rule using it: `path:line selector`, and the library version installed.
Mark each safe to delete unless a lockfile or workspace pins another version of that library.

## Library internals by component

One line per component group: `MuiButton-  14 rules  9 files  dead 2  public alternative: <API> (<doc
file>)`.

## The z ladder

The `z` records as a table with their proposed layer, then the drafted tokens.

## Hot spots and files

The top 10 `hot` rules with the proposed rewrite, then the top 10 `filestat` files by
`important + internal_rules + deep_rules + id_rules`.

## Appendix (catalog folder, not the report)

- Every `!important` with its cause and `why` line.
- Heads that match a UI dependency but got no prefix, each with its reason.
- The full `filestat` table and the unparsed file list.
