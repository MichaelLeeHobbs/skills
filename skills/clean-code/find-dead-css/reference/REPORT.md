# The report and the catalog

Keep the report under 150 lines and save it in the catalog folder as `report.md`. Take every number from
tool output: rules and members from `members`, verdict counts, cells and canaries from `classify`, the
proof from `proof`, the plan counts from `verify --check plan`. Canary rows never appear outside the
Canaries line.

## Header

```
Dead CSS audit: <app>  commit <hash>  <date>   Mode: crawl | static-only
Catalog: <folder in the repo>   Work folder: <path outside the repo>
Inventory: <rules> rules, <members> selector members in <sheets> sheets (<excluded> out of scope: <by reason>)
Crawl: <reached> of <cells> cells reached over <routes> routes (<blocked> blocked: <by reason>)   PASS | FAIL
Verdicts: DEAD <n>  KEEP <n>  SEEN <n>  UNDECIDABLE <n>  UNPROVEN <n> (<by reason>)
Delete list: <rules> rules, <trim> trims, <files> whole files   Proof: CONFIRMED | REFUTED <n> | BLOCKED | not run
Outside use: <none | sources searched | unknown, sheets marked foreign>
Canaries: <n> of 3 as planted, guard <aborted | NOT ABORTED>   PASS | FAIL | not run (static-only)
Hosts reached: <approved host only | list>   Spend: $<total> of $<cap> cap (measured | estimated)
Last run: <date> DEAD <n>, delete list <n> rules | first run
```

If any line says FAIL, say first, above the header, that the run failed and which check. DEAD means
"never appeared in the reached cells of this crawl, and unreferenced": it holds for the crawled browser,
roles, seed and locale, not for every user. Say so under the header.

## Delete list

Only rules the proof CONFIRMED appear here. With the proof BLOCKED or not run, title the section
"Candidates (unproven)". Group by source file, files in path order:

```
src/styles/legacy.scss  DEAD_FILE  4 rules  imported by: src/main.scss:12
src/components/Button.module.scss
  L40-46  .ghost                          DEAD   c:ghost never seen, no reference
  L51-55  .primary, .primary-old          TRIM   remove ".primary-old" (c:primary-old)
  L80-84  .pill .icon                      manual  @extend target of .chip (line 92)
```

Each line: the source line range (from the parser's rule span in the source, not only the start), the
source selector text, the verdict, and the deciding token. TRIM lines name the exact members to remove.
`manual` lines say why they could not be removed mechanically.

Then a **spot-check sample**: 10 delete-list rules picked at even intervals, with the search the reviewer
can run themselves to confirm no reference.

## Other sections, in order

1. **Blocked cells**: each cell, its reason, and how many candidates its sheets would have decided.
2. **UNPROVEN**, grouped by reason, each with the deciding token: `fragment` (show the fragment and
   where it is), `sheet-not-loaded` (the sheet and the routes or states that would load it; add them to
   the plan), `foreign`, `proof` (rules the proof refuted), `static-only`.
3. **Counts only**: KEEP, SEEN (classes built at runtime the crawl saw), UNDECIDABLE.
4. **Out of scope**: at-rules, runtime CSS-in-JS, cross-origin frames, closed declarative shadow roots,
   vendor sheets, each with a count.

## Catalog

A folder inside the target repo: the folder your agent keeps project configuration in, with a
`dead-css/` folder under it, or `.dead-css/` at the repo root if your agent has none. Use the same folder
on every run. The skill writes this folder and nothing else in the repo, and never commits.

| File | Content | Sorted by |
|---|---|---|
| `plan.jsonl` | the approved plan's `route`, `exclude`, `cell` and `allow` records | type, then key |
| `verdicts.jsonl` | one line per delete-list and UNPROVEN member: rule, source file and line, selector, verdict, reason, token | file, then line |
| `history.jsonl` | one line per run: date, commit, host, plan hash, approval, mode, verdict counts, proof result | date |
| `report.md` | the last report | |

Never in the catalog: credentials or sign-in state, the token log, cell records, builds, scripts, mocks
recorded from live traffic, and timings. Before writing, run `verify --check plan` over `plan.jsonl`
again; it must print no `pii_shape` or `unsafe_value` problem. The catalog may name internal hosts and
admin routes: say so before the user commits it to a public repo.

On a re-run, start from `plan.jsonl` (see [PLAN.md](PLAN.md#on-a-re-run)) and fill the header's Last
run line from the last `history.jsonl` line.
