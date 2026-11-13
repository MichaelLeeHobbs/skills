# The report

Keep it under 150 lines and save it in the catalog folder as `report.md`. Take every number from tool
output, never from memory or a worker's summary: coverage from the `verify --check coverage` summary;
sites and terms from the real `terms` summary; mapping from `verify --check map`; candidates, verdicts,
strength, seeds and spend from `tally`; canaries from `verify --check evidence`; the since-last-run line
from `reuse`.

## Header

```
Vocabulary audit: <repo or package>  commit <hash>  <date>
Catalog: <folder in the repo>   Work folder: <path outside the repo>
Since last run: <reuse> reused, <rejudge> rejudged, <added> added, <removed> removed | first run
Coverage: <groups> surface/extension groups, <failed> failed, <problems> problems   PASS | FAIL
Sites: <sites> (<by surface>)   Terms: <terms>   Tokens: <kept> kept, <stopped> stopped, <short> short
Contexts: <list or "top-level folders">   Seeds: <files> files, <read> of <lines> lines | none
Concepts: <concepts>   Mapped: <mapped> of <required> required terms   PASS | FAIL
Candidates: <judged> judged of <total> (rest cut by rank)
Verdicts: <SYNONYM> synonym, <DISTINCT> distinct, <HOMONYM> homonym, <GENERIC> generic; <structural> structural
Calibration: <classes calibrated> | not independent
Spend: $<total> of $<cap> cap (measured | estimated from tokens)
Canaries: <passed> of 3 behaved as planted   PASS | FAIL
Drifting concepts: <n> (last run: <n> | first run)
```

If any line says FAIL, say first, above the header, that the run failed and which check.

## Decision list

One numbered item per concept that needs a choice, in candidate rank order. Each gives a default:

```
1. Imaging study. Names: study (schema, 41 types, 210 sites), exam (UI and viewer, 96 sites),
   imagingStudy (12 sites). SYNONYM, structural (api/types.ts:14:3, web/viewer/Exam.tsx:8:7).
   Default: code name `study`; rename exam (88 code sites, 140 references by search) and imagingStudy.
   UI label: "Exam" today. Default: keep "Exam" for users.
2. exam (HOMONYM). Means the order in apps/scheduling/ (31 sites), the study elsewhere (96 sites).
   Default: rename the scheduling sense to `order` (31 sites); the other sense follows decision 1.
3. order vs study. DISTINCT, parent-of (api/db/schema.sql:22:5: studies.order_id). Keep both.
   No action; glossary line only.
```

A decision whose default renames anything names the persisted and public sites it leaves as aliases.
A `usage` SYNONYM says "unconfirmed: confirm before renaming" and has no rename default.

## Glossary

One line per concept, sorted by name, ready to paste into the repo's agent context file and docs:

```
study  An imaging study: one acquisition session, owned by one order. Not: exam (retired), imagingStudy.
order  A clinician's request for imaging; produces one or more studies. Not: requisition. Sort order is unrelated.
```

Mark it valid only once the decision list is settled.

## Prevention drafts

Drafts for the user to apply. The skill edits nothing.
- **Lint rule**, ready to paste, for the linter the repo already uses: flag new identifiers containing a
  retired name, with the canonical name in the message. Scope a homonym's rule to the paths of the
  retired sense.
- **The cause**, if a context file or contributing guide uses a retired name or tells contributors to
  name things per feature: quote the line and draft the replacement.

## Appendix (catalog folder, not the report)

- Every claim with its cites and sense counts (`claims.jsonl`).
- Resolved since last run: concepts `reuse` reported removed.
- Claims dropped after failing `verify --check evidence` twice, with their problems.
- The concept list and mapping (`concepts.jsonl`, `mapping.jsonl`).
