# Read-through and recheck

Both passes run after the first `join` and can only demote. Their output is `demote` records for the
second `join`. Neither may turn any row into UNUSED, ENTRY_UNUSED or STUCK.

## Read-through

**Which rows.** Every UNUSED, ENTRY_UNUSED and STUCK verdict, ranked by callers (fewest first) then age
(oldest first). Read the first 150. Each row past the cap gets `{"t":"demote","id":"<id>","reason":"pending"}`
and the report header says how many.

**Who.** The most capable model available, in a fresh context per batch of about ten rows, with this
brief and nothing about the counts:

> For each entry below you get its id, kind, the registration code and the handler's full source. Look
> for anything that could reach it without passing through the evidence sources, or that means it must
> stay: a key built at run time, a caller outside this repo named in code, config or docs (a partner
> webhook, a mobile client, a scheduled job on another host, an email link), a gateway or proxy rewrite
> that sends other paths here, a security, recovery, audit or compliance path (password reset, account
> lockout, disaster recovery, data export on request). Answer one JSON line per entry: `id`, `finding`
> (`none`, `external` or `dynamic`), and the file and line that decide it. Say `none` only when you read
> the whole handler and its registration.

**Output.** `external` becomes `{"t":"demote","id":"<id>","reason":"external"}`. `dynamic` means the
inventory missed a dynamic registration: set `dynamic: true` on that entry and add it to the dynamic
count. Security, recovery and compliance paths are `external` with the reason in the report, so the
owner sees them listed apart.

## Recheck

The read-through cannot see traffic. The recheck asks the logs one more time, under a looser key, for
every UNUSED row:

- Build one pattern per row: the path template without its mount prefix, with every parameter as a
  wildcard, plus the last two path segments on their own. For a handler, the message type alone. For a
  screen, the template without the app prefix.
- A pattern whose literal part is a single common word (`list`, `status`, `export`, `index`) is too
  generic to search: demote that row with `pending` and say why in the report.
- Run one grouped query per source holding every pattern, returning a count per pattern, over the same
  window. If the source cannot take many patterns in one query, batch them, at most 50 per query.
- Any real hit is `{"t":"demote","id":"<id>","reason":"recheck"}`. Name the matching pattern in the
  report so the owner can find the rewrite or prefix the key rule missed.

## Check

- Every demote id is a row from the first `join`'s output; the tool rejects an unknown id.
- The second `join`'s count of UNUSED, ENTRY_UNUSED and STUCK rows is never higher than the first's,
  and each class's ids are a subset of the first run's. If either fails, a demote record is wrong or an
  input changed between runs: the run fails.
