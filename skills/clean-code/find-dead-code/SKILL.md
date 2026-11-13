---
name: find-dead-code
disable-model-invocation: true
description: >-
  Use for "find dead code", "which routes does nobody call", "is this endpoint still used", "find
  feature flags stuck on", "which screens does nobody open", "is anything still sending this message",
  "re-run the dead code audit". Finds code that is still wired in but never runs in production: routes,
  message handlers, scheduled jobs, feature flags and screens. Joins every entry point with counts from
  logs, traces, analytics, flag and queue metrics; a finding needs zero hits over a proven window and no
  outside caller. Without live evidence it lists leads marked unproven. Expensive and user-invoked. NOT for unused exports or imports (use a linter or an
  unused-export tool), duplicated helpers (use find-reinvention), or deleting the code.
---

# Find dead code

Find the entry points that production never reaches, and prove it. A finding says "no evidence of use
over D days in sources S, and no caller outside its registration". It never says "dead" or "safe to
delete": the owner decides that.

**What it writes.** In the target repo, only its catalog folder ([reference/CATALOG.md](reference/CATALOG.md)).
It edits no code and commits nothing. Everything temporary goes in a work folder outside the repo.

## Prerequisites

Stop before any cost and say which is missing:
- You can run commands and write files.
- You can enumerate the repo's entry points: its router, consumer registry, scheduler config, flag
  calls and client router, by parser or by reading the registration code.
- For live evidence: read-only access to at least one source that can return counts grouped by key.
  Use access the user already has. Never ask for, accept in chat or write down a secret. Without a
  source, the run is static-only (see below), and the user must agree to that.

**Where evidence goes.** Only aggregates leave the evidence source: counts grouped by key, computed
inside the query. Never run a query that returns log lines, events, users, IP addresses or query
strings. If a query fails or returns rows, do not print them: record the failure. Source code goes only
to the model provider you already use.

## Roles

You coordinate and keep the tool's output, not the rows. The most capable model available reads source
in step 4; a cheaper one can enumerate registrations in step 2. With one model, use it for everything.
If you cannot start fresh contexts, continue in one and say so in the report header.

## 0. Build and prove the tool

Every verdict comes from the tool, never from reading counts by eye. Pick a runtime.
Implement [reference/ALGORITHM.md](reference/ALGORITHM.md) to satisfy
[reference/CONTRACT.md](reference/CONTRACT.md) in the work folder. Run every fixture in
`reference/fixtures/`. **If any fixture fails, stop and report which.** Never edit a fixture to make it
pass, and never continue with a partly passing tool.

## 1. Scope, sources and one approval

Record the commit and the run date (UTC). Pick the kinds in scope from
[reference/ENTRIES.md](reference/ENTRIES.md). For each source, fill the qualification fields in
[reference/EVIDENCE.md](reference/EVIDENCE.md) and pick the controls. Ask the user once, in one
message: the sources and the read-only identity used for each, the kinds, the window floors, whether
anything runs less often than quarterly, the known-live controls, the query count and estimated bytes
scanned, and "only counts leave the system". Get one approval and a cap (default 1.25 times the
estimate, or 300 queries). Step 3 never starts without it.

## 2. Inventory

Enumerate every entry of each kind in scope, as ENTRIES.md describes: its key, callers outside its
registration, test references counted apart, age, schedule period, and the `dynamic` list for
registrations you cannot resolve to a literal key. Plant the inventory canary (see Check) in a snapshot
of the repo in the work folder, never in the repo, and enumerate the snapshot.

If the catalog folder holds `keep.jsonl` and `history.jsonl`, read them now: keeps go to the tool as
`keep` records, and the last history line's UNUSED ids as `prior` records.

## 3. Evidence

Run the queries EVIDENCE.md describes: one grouped count query per source, kind and week, never one per
entry; per-day record totals per source; the controls; the unmatched-evidence count. At most two queries
at once. Reaching the cap stops the run cleanly; it resumes from the work folder.

## 4. Join, read, recheck, join again

Run `join`. Then, as [reference/REVIEW.md](reference/REVIEW.md) describes:
- **Read-through.** Read the source of every UNUSED, ENTRY_UNUSED and STUCK row (up to 150, ranked by
  callers then age) for dynamic references, outside callers and paths that must stay. Emit `demote`
  records. Rows past the cap get `pending`.
- **Recheck.** One grouped multi-pattern query per source over every UNUSED row, under a looser key.
  Any hit is a `recheck` demote.

Run `join` again with the demotes. Both passes can only demote.

## 5. Report and save the catalog

Write the report as [reference/REPORT.md](reference/REPORT.md) lays out and append the history line as
CATALOG.md says. Hand back the report path, header and decision list. Delete the work folder, or tell the
user where it is and that it holds counts and a source snapshot.

## Check

Every source gets, per kind:
1. **A live control**: a known-live entry, queried through the same key rule, must show hits. If the
   user names none, use the three busiest entries of that kind and say so.
2. **A zero control**: a synthetic key that cannot exist must show zero.

And every run plants two canaries as `canary` entries. Write each `expect` before the first `join`,
from the day records you measured, never after seeing the output:
3. **Inventory canary.** Register the zero control's synthetic key, as an entry of a kind in scope, in
   the work-folder snapshot. The inventory must find it with no callers. Give it `age_days` equal to its
   need. Expect `UNUSED` when a qualified source has records for every day of its window, else
   `UNPROVEN/short_window` (static-only: `UNPROVEN/no_source`).
4. **Period canary.** A job, or an entry of a kind in scope, with `period_days` 365 and an explicit zero.
   Its need is 402 days. Expect `UNPROVEN/short_window` unless a qualified source has records for all
   402 days, then `UNUSED`.

**The run fails**, and the report says so above the header, when any of these happens:
- any fixture fails in step 0;
- `join` exits 1: a control failed or is missing, the unmatched share passed 200 basis points, or a
  canary came out wrong;
- the inventory did not find the inventory canary;
- a source the user named could not be queried;
- the user supplied a list of known-dead or known-live entries and any came out against it.

A check that could not run has failed. There is no skipped state.

## Static-only fallback

Only when no source exists or the user chooses it. Run every step without queries. `join` with no
`source` records can only output `UNPROVEN/no_source`. Controls 1 and 2 do not apply and the report
lists them as not applicable; canaries 3 and 4 still run and must give `UNPROVEN/no_source`.
The header reads "Live evidence: none. Every finding is unproven." Rank the leads by static signals
(no outside callers, flag fixed in config, no client reference, no tests, last touched).

## If you cannot run work in parallel

Run the queries one at a time and read the rows one at a time, in one context. The work folder is the
progress record: a query is done when its counts file exists, so a stopped run resumes by listing what
is missing.
