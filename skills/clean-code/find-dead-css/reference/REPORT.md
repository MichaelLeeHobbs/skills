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

## Where

Use `clean-code/` inside your agent's project configuration folder, or `.clean-code/` at the repo root if
your agent has none. If a `clean-code/` folder already exists in another folder at the repo root, use
that one; if two exist, stop and name both. This skill's files go in `clean-code/find-dead-css/`; for a
package scope, in `clean-code/find-dead-css/<repo path of the package>/` (for example
`clean-code/find-dead-css/apps/web/`). Write this folder and the shared `clean-code/ledger.jsonl` and
nothing else in the repo; never commit.

**Legacy folder.** On the first write, if `dead-css/` exists beside `clean-code/` (or `.dead-css/` at the
repo root), copy the whole folder into the new home: catalogs, history and user-owned files. A legacy
package subfolder named after a package goes to that package's repo path; if more than one could match,
stop and name the candidates. Say in the report header that you copied it and that the user can delete
the legacy folder. Never read the legacy folder again, and never delete it yourself.

## Catalog

The catalog is this skill's folder from [Where](#where). Use the same folder on every run.

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

## Run record

Replace `report.md` only after this run's own checks are done. Then append exactly one line to
`clean-code/ledger.jsonl`, pass or fail:

```
{"skill":"find-dead-css","scope":".","at":"2026-11-15T14:02:00Z","commit":"<full hash>","check":"pass","degraded":false,"metric":"dead","value":<n>,"comparable":"mode=full;plan=<hash of plan.jsonl>","report":"<path to report.md>"}
```

| Field | Value |
|---|---|
| `skill` | `find-dead-css` |
| `scope` | `.` for the whole repo, else the package's repo-relative path with `/` separators |
| `at` | UTC time the run finished, `YYYY-MM-DDTHH:MM:SSZ` |
| `commit` | the full commit hash read at the start of the run, with `+dirty` appended if the working tree had changes; `none` without version control |
| `check` | `fail` if the report says the run failed; `partial` if any check line reads PARTIAL, UNCONFIRMED, not run, or user's word (a Canaries line of `not run (static-only)` and a Proof of `not run` or `BLOCKED` are `partial`); otherwise `pass` |
| `degraded` | `false`, or the one missing thing: `browser`, `runtime-evidence`, `ci-history`, `build`, `parser`. A static-only run records `browser` |
| `metric` | `dead` |
| `value` | the DEAD count on the report's `Verdicts` line, or `null` in static-only mode, where no member can be DEAD |
| `comparable` | `mode=full` or `mode=degraded`, then `;` and this skill's fields sorted by key: `plan` (the hash of `plan.jsonl` that `history.jsonl` records; `none` in static-only mode). A static-only run's `comparable` starts with `mode=degraded` |
| `report` | repo-relative path of this run's `report.md` |

After appending, check that the file grew by exactly one line and that no earlier line changed. Order in
the file does not matter.
