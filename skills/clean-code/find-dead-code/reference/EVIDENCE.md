# Evidence: qualifying sources and querying them

A zero counts only from a source shown able to see hits, over days it actually covers, unsampled.

## Source record

Fill one `source` record per source before any candidate query:

| Field | How to decide it |
|---|---|
| `source` | a short label you choose (`access-logs`), never a hostname, account ID or resource name |
| `kinds` | the kinds whose keys this source can see |
| `sampled` | true when the source keeps less than every request or event (trace sampling, analytics sampling, log sampling). A sampled source never proves a zero; any real hit from it still makes the entry LIVE |
| `success_logged` | false when successful requests are dropped (error-only logs, 2xx filtered) |
| `scope_confirmed` | true only when the user confirms the source sees every production deployment, region and tenant, and no path reaches the code around it (an edge cache, a second ingress, an internal caller on another network). Analytics that filter internal staff traffic or consent-declined users are not scope-confirmed for staff screens |
| `absent_is_zero` | true when a key with no traffic simply has no rows (logs, traces, page views). False when the source lists every key it knows (flag service, scheduler, queue metrics), so a missing key means an unknown key, not a zero |

Measure, never trust stated retention: query the per-day record total for every day from the start of
the longest window to the day before the run, and pass each as a `day` record. A day with no records is a
gap; the tool fails coverage for any window holding one.

## Windows

All dates are UTC days. The run date is today in UTC. An entry's window is its need in whole days,
ending the day before the run date. Never shorten a window to get a verdict. Default floors: 110 days
for route, handler, job and screen (longer than a quarter); 30 days for flags. Override a floor with a
`policy` record only when the user asks, and print it in the header.

## Controls

Per source and kind, before candidates are read:
- **Live control** (`control_live`): an entry the user knows is used, queried with the same key rule as
  candidates. Prefer one low-traffic entry over the busiest, and one per ingress when traffic arrives by
  more than one route (public, partner, internal). If the user names none, take the three busiest keys
  of that kind from the grouped query and say so.
- **Zero control** (`control_zero`): a synthetic key that cannot exist, shaped like a real one
  (`route:GET /api/v1/zz-canary-<random>`). It must come back zero. A hit means the query matches
  loosely, so every zero from that source is suspect.

A failed or missing control fails that source and kind for every entry, and fails the run.

## Unmatched evidence

Count, per source and kind, the evidence rows the key rule could not match to any entry, against the
rows it matched, over non-synthetic traffic with a status below 400. Pass them as an `unmatched` record.
Above 200 basis points (2 percent) the key rule is missing something (a prefix, a rewrite, a template
form) and the tool fails that source and kind. For a source with `absent_is_zero` true the record is
required; leaving it out fails the gate.

## Queries

- One grouped query per source, kind and week, returning key and count, and the last day each key had a
  real hit. Never one query per entry: at a few hundred entries that multiplies scan cost by hundreds.
- Count synthetic traffic (uptime monitors, scanners, the user's listed bot patterns) separately, by
  classifying inside the query, and return counts per class, never the user agents or addresses.
- Strip query strings and map identifier-like path segments to the template inside the query, so no
  identifier leaves the source.
- For flags, read evaluation counts per variation only. Never read targeting rules or segment lists:
  they can hold user or tenant identifiers.
- At most two queries at once; back off when throttled; use pre-aggregated metrics where they exist.
- A query that errors or returns rows: record the failure and do not print the output. Retry once. If it
  still fails, the run fails (SKILL.md Check) unless the user agrees to drop that source or kind; then
  remove the kind from the source's `kinds` and list it in the header as not queried. Never pass a
  partly queried source: its silence would read as zeros.

## Turning results into records

For each entry and source with any traffic: one `hit` record with `real` (total real hits over the
queried range), `synthetic`, and `last` (the last UTC day with a real hit, `""` when `real` is 0). A flag
gets one `hit` per variation, with `arm` set to the variation name. Where the source returns an explicit
zero for a key it lists, write a `hit` with `real` 0. Write nothing for a key the source did not return.

## Cost estimate

Before the approval: bytes scanned per source is roughly the days queried times the daily volume, and
the query count is sources times kinds times weeks, plus the controls and the recheck. Show both and the
price if the source publishes one.
