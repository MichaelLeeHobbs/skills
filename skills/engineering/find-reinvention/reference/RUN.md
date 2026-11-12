# Running the copies side by side

## Which groups

The top 10 real groups in judging priority order that have at least one member you can run, plus every
group holding a canary. A member can be run when its `effects` are `pure`, `clock` or `locale` and it
needs nothing from the framework, a closure or an instance.

**Run each positive canary beside its source**, in the same harness, even when grouping or splitting put
them in different groups or parts. The planted difference must show between those two columns.

## How

Do this in a fresh context, or hand it to a worker with this file and the group list.

1. In the work folder, write one throwaway harness per run, never in the repo. Copy in the text of each
   member and of every module-level constant or helper it references, renaming each copy so they cannot
   collide (`m1_formatDate`, `m2_formatDate`).
2. Run the harness with the bare runtime of the language (no test runner, no framework setup, no
   install). A member may import a third-party library the repo already has installed (a date library,
   for example), resolved from the repo's installed packages and only read; repo code is always copied,
   never imported. If a member needs anything else to run, it is BLOCKED with that reason.
3. Turn network access off for the harness process if the platform lets you. If it does not, say so in
   the report header.
4. Never start the application, its servers or its database, and never run code that is not a copied
   member.

## Probe the environment first

- **Time zone.** Format one fixed instant (for example `2026-03-08T07:30:00Z`) under each zone you plan
  to use. If the outputs are identical, the zone switch did not take effect (setting a zone variable is
  silently ignored on some platforms), and every zone-dependent cell is BLOCKED.
- **Clock.** Run members that read the current time only if the runtime can fix the clock without
  installing anything. Otherwise they are BLOCKED.
- **Locale.** Fix one locale (for example `en-US`) and say which in the report.

Run every runnable member twice, once with the zone set to the zone the product mostly serves and once
in UTC, unless the probe blocked zones.

## Inputs per domain

Domain names come from your mapping, so pick the row below closest in meaning to the group's canonical
domain, plus anything the judge's table names.

| Domain | Inputs |
|---|---|
| Timestamp | `null`, undefined, `""`, `"garbage"`, `"2026-01-01"` (date only), `"2026-01-01T00:00:00Z"` (UTC midnight), a time inside a daylight-saving gap for the product zone, epoch 0, a native date object, a number of milliseconds |
| Byte count | `0`, `1`, `1023`, `1024`, `1536`, `1048576`, `1e9`, `1e12`, `2**40`, `2**50`, `-1`, `NaN`, `null` |
| Count or number | `0`, `1`, `999`, `1000`, `1234567`, `-5`, `0.5`, `NaN`, `null` |
| Error | a native error with a message, a subclass with a code field, a plain object with `message`, a string, `null`, an object with no message |
| String test | `null`, undefined, `""`, `"   "`, `"a"`, a number |

For a domain not listed, write the set before running: the empty values, one normal value, the two
boundaries the code branches on, and one value of the wrong type.

Whatever the domain, the set must reach every boundary any member branches on. Read the members' branches
before running and add an input on each side of every threshold the table above misses: a formatter
that stops at TB needs an input past 1 TiB, or its difference from one that stops at GB never shows.

## Output

For each group, one table: rows are inputs (and zone, when run twice), columns are members, each cell
the exact output as a string, with invisible characters shown (a narrow no-break space before AM or PM is
a real difference). Mark each cell `run` or `predicted`. Then set each member's evidence verdict:
CONFIRMED, REFUTED or BLOCKED, as [JUDGE.md](JUDGE.md) defines them.
