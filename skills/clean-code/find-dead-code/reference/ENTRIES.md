# Entries: what goes in the inventory

## Kinds

An entry is a place where production can reach code from outside it. Enumerate every one of each kind
in scope, from the registration code, never from a folder name.

| Kind | Key (`id` is `kind:key`) | Found in | Evidence that counts |
|---|---|---|---|
| `route` | HTTP method, a space, then the full path template with every mount prefix and global prefix resolved from code: `route:GET /api/v1/reports/:id` | router setup, controller decorators, file-system routes | access logs, traces, gateway logs |
| `handler` | queue or topic name as deployed (with any environment suffix), plus the message type for a typed handler on a shared queue: `handler:billing-events#invoice.reissued` | consumer registration, infrastructure config | queue metrics (sent, received, dead-lettered), consumer logs |
| `job` | job name as the scheduler knows it: `job:month-end-close` | scheduler config, cron files, infrastructure config | scheduler run history, job logs, a run-history table |
| `flag` | flag key resolved through constants: `flag:new-checkout` | flag evaluation calls | flag service evaluation counts by variation |
| `screen` | client router template: `screen:/admin/reports/:id` | client router | product analytics page views |

Use the same key rule for an entry, its controls and the evidence query. Write the rule down per kind
in the report, including how mount prefixes and file-system routes were resolved.

**Not in v1:** whole services or ports judged from network flow logs. Flow logs give an address and a
port, not an entry key, so the controls cannot prove the key rule. The report lists `service` under
kinds not covered.

## Flags

The candidate for a flag is the arm that never runs, not the flag. A flag served one variation for the
whole window is STUCK: the code in the other arm is the finding. Note in the report, per STUCK flag:
- the default the client library falls back to when the flag service is down, which is often the unused
  arm, so deleting that arm changes outage behaviour;
- whether the flag is a kill switch or rollback path the owner keeps on purpose;
- any helper the unused arm calls that other code also calls.

## Callers

`callers` counts references to the entry's handler from outside the files that register it. The router
file that registers a route handler does not count; another module calling the same handler function
does. Test files are counted apart (`tests` in the work folder, shown in the report) and are never
callers. An entry with zero hits and callers above zero is ENTRY_UNUSED: the entry point is unused, the
code behind it is not.

State the rule you used, per kind, in the report. For decorator or file-system routing, where no file
imports the handler, `callers` counts calls to the handler from elsewhere.

When a find-reinvention catalog exists (a `rows.jsonl` with the fields `id`, `path`, `name`, `kind`,
`importers`, `imported_by`, `alias_of`, recorded at the same commit), read the handler's row for
`imported_by` and subtract the registering files. Otherwise count references with the parser. This
skill never needs that catalog.

## Dynamic registrations

A registration whose key you cannot resolve to a literal (a computed path, a loop over a config list,
reflection, a plugin registry, a flag key built from a string) goes in with `dynamic: true`. The tool
never calls it UNUSED. Count these in the report header; a large count means the inventory is weak, and
the report says so.

## Age

`age_days` is the number of days from the earliest commit that added the entry's key string to the run
date. Use the commit date, never the author. With no history, or a key you cannot trace, use 0: the tool
then says `too_new` rather than guessing.

## Period

`period_days` is 0 except where the entry fires on a schedule or a known calendar. For a job, compute it
from the schedule as the longest gap between two consecutive firings over four years: a daily job is 1,
`0 0 31 * *` (the 31st only) is 61, a yearly job is 365, a 29 February job is 1461. For any entry the
user says runs less often than quarterly (a year-end export route, a quarterly partner batch), set
`period_days` from what they say, or 365 when they cannot say. Never infer a period from a name.

The tool computes the need from it: `max(floor, ceil(1.1 x period))`. A yearly entry needs 402 days of
evidence, so most log retention cannot prove it, and the report says so.

## Worked example

`src/routes/reports.ts` registers `router.get('/legacy-export', legacyExport)` under
`app.use('/api/v1/reports', reportsRouter)`. Entry: `route:GET /api/v1/reports/legacy-export`, callers 0
(only `reports.ts` imports `legacyExport`), tests 1, age 900 days, period 0, dynamic false. With a
qualified access log covering 110 days and an explicit zero, the tool says UNUSED. If the user says the
finance team runs it every January, `period_days` 365 gives a need of 402 and the verdict becomes
`UNPROVEN/short_window`.
