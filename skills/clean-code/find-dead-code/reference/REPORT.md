# The report

Keep it under 150 lines and save it in the catalog folder as `report.md`. Take every number from the
second `join` output: the gates, controls, canaries, verdicts and `summary`. Never take a number from
memory, a query result read by eye, or a worker's summary. Never paste a log line, a user, an address or
a query string into it.

## Header

```
Dead code audit: <repo>  commit <hash>  run <UTC date>
Catalog: <folder in the repo>   Work folder: <path outside the repo, or deleted>
Live evidence: <source labels> | none. Every finding is unproven.
Kinds: <kinds in scope>   Not covered: service<, others>   Dynamic: <n> registrations
Windows: route <d>, handler <d>, job <d>, screen <d>, flag <d> days (floors; jobs and calendar entries longer)
Gates: <passing> of <total> source-kind pairs pass; failed on control: <n>   PASS | FAIL
Controls: <passing> of <total> pass   Unmatched: <worst source and kind> <ratio>
Canaries: <n> of <n> matched   PASS | FAIL
Candidates: <n>   UNUSED <n>  ENTRY_UNUSED <n>  STUCK <n>  LIVE <n>  UNPROVEN <n> (<by reason>)
Read-through: <n> of <m> read (rest pending)   Recheck: <n> patterns, <n> hits, <n> too generic
Earlier UNUSED claims overturned: <revived> (first run | prior: none)
Keeps: <active>, <redundant> redundant, <expired> expired, <orphan> orphan
Spend: <queries> queries, <bytes> scanned, of the approved cap
```

If any line says FAIL, say first, above the header, that the run failed and which check. Static-only
runs print "Live evidence: none. Every finding is unproven." and list controls as not applicable.

## Findings

List at most 100 rows across these sections; count the rest. Group by kind inside each section.

**UNUSED** (sorted by kind, then fewest test references, then oldest):

```
route:GET /api/v1/reports/legacy-export   need 110d   callers 0   tests 1   age 900d
  no evidence of use over 110 days in access-logs, gateway-logs; recheck: no hit
```

**ENTRY_UNUSED**: the same, plus the outside callers by file, so the owner sees the code that stays.

**STUCK flags**: the flag, the served arm, the unused arm's size in lines, the client library's fallback
arm, and "kill switch or rollback path: yes | no | unknown".

**Kept apart**: rows demoted `external` for security, recovery, audit or compliance reasons, each with
its reason. These are not findings.

**UNPROVEN**: counts by reason, then the 20 rows most likely to become findings (those whose only
reason is `short_window`, `too_new` or `sampled`), each with what would prove it: a longer source, a
date, an unsampled source.

## Decision list

One numbered item per call the owner must make, each with a default:

```
1. route:GET /api/v1/reports/legacy-export: remove the route and its handler? Default: remove after
   one release behind a 410 response, because no evidence of use over 110 days and no outside caller.
2. flag:new-checkout served "true" for 200 days: remove the false arm (412 lines)? The client falls
   back to false when the flag service is down. Default: keep until the fallback is changed to true.
3. job:year-end-statements needs 402 days, logs keep 90: add a run-history query? Default: yes.
```

## Proposed keeps

For entries the owner confirms are rare but alive, draft `keep.jsonl` lines for them to add:
`{"id":"route:GET /api/v1/tax/annual","reason":"filed each April","review_by":"2027-05-31"}`. The skill
never writes `keep.jsonl` itself.

## Warning

End the report with one line: "This report lists unused entry points, some on security-relevant paths.
Read it before committing or sharing it."
