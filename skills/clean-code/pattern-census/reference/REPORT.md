# The report

Keep it under 150 lines and save it in the catalog folder as `report.md`. Take every number from tool
output: sites, families and conventions from `census`; hits, blocked and conduits from `close`; audit
from `audit`; owners from `owners`. Never a number from memory or a reader's summary.

## Header

```
Pattern census: <package>  commit <hash>  <date>  definitions <version>
Catalog: <folder in the repo>   Work folder: <path outside the repo>
Jobs: <n> (<names>; <closed> closed, <partial> partial)   Patterns: confirmed | UNCONFIRMED
Scanner cases: <passed> of <cases>   PASS | FAIL
Sites: <n> (<same_as> same_as, <inside> inside conduits)   Blocked: <n>   Opaque: <n>
Audit: <sampled> sampled, <upheld> scanner errors upheld   PASS | FAIL | NOT BLIND FAIL
Escape sample: <read> files read over <rounds> rounds, <escapes> escapes   PASS | FAIL
Canaries: <n> of 5 behaved as planted   PASS | FAIL
Known sites: <found> of <given> | none given
Spend: $<total> of $<cap> cap (measured | estimated from tokens)
Since last run: <per job site and coverage change> | definitions changed, not comparable | first run
```

If any line says FAIL or UNCONFIRMED, say first, above the header, that the run failed or is unconfirmed
and which line.

## One block per job

```
data fetching (fetch, closed): 6 families, 2,140 sites, at most 18 missed (95%)
  C1 AGENTS.md:42 (2025-06-03) "Fetch server data with the hooks in src/api/hooks..."
     covers 61.0% to 61.8% of sites
  off-pattern families (top 3; rest in the catalog):
    effect:fetch>fetch          241 sites  63 files  @checkout 70%, @admin 30%
    effect:apiClient>apiClient  164 sites  51 files  @checkout 55%, history: dana (inactive) 45%
    thunk:axios>axios           114 sites  20 files  @admin 100%
```

- The range is `low` to `high` from `census`. When `withheld` is set, print the reason instead of a
  number: "no percentage: the convention is vague", "no percentage: no site matches the rule (stale)",
  "no percentage: range 31 points wide; reading 400 more files would narrow it".
- For a `partial` job, write "of found sites" after the percentage.
- Owners: the top two per family with their share of its sites. History owners say `history:` and mark
  authors with no commit in 90 days `inactive`.

## Decision list

One numbered item per choice the team must make, each with a default:

```
1. Two rules for data fetching: C1 (AGENTS.md, 2025) hooks over apiClient vs C4 (CONTRIBUTING.md, 2021)
   thunks. Default: C1, the newer, which 61% of sites follow.
2. Logging has no written rule; 3 families. Default: add "log through src/lib/logger" (the family with
   the most sites), drafted below.
3. effect:fetch>fetch, 241 sites, @checkout. Default: migrate to C1 and add the lint rule below.
```

## Prevention drafts

Drafts for the user to apply. The skill edits nothing.
- **Lint rule** for the largest off-pattern family, for the linter the repo already uses (a restricted
  import or syntax rule), with the convention's quote in the message.
- **Convention lines** for silent and vague jobs, written as the convention source's own style, each
  naming the module to use.

## Appendix (catalog folder, not the report)

Every family per job with counts and owners, every conduit, every escape and audit disagreement with its
ruling, and the unresolved hits still blocked.

## Owners

1. If the repo has a CODEOWNERS file (root, `.github/`, `docs/` or the platform's other location), turn
   each pattern line into a `rule` record with its line number. In a sectioned file, lines under a
   `[Section]` header carry that section name.
2. For files no rule matches, read version control for the last 12 months: skip commits that touch more
   than 50 files or change whitespace only, and take the two authors with the most remaining commits on
   that file as a `history` record.
3. Run `owners` with the rules, the history records and the sites.
