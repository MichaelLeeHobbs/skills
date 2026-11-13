# Running the translation table side by side

This file restates the harness rules in full, because a skill installs as one folder and may not point
at another skill's files.

## Which families

Up to three REAL families, in decision order, whose used members are pure values: dates, IDs, validation,
number formatting, utility functions. A family that needs the network, a browser canvas, a running
framework or shared state (HTTP clients, charts, state stores) is `not run: needs <what>`. The run is
optional; when it does not run, every `differs` row stays `predicted`.

## How

1. In the work folder, write one throwaway harness per family, never in the repo. It imports both
   libraries from the repo's installed packages, read only, and never imports repo code.
2. Run it with the language's bare runtime: no test runner, no framework, no install.
3. Turn network access off for the harness process if the platform lets you; if it does not, say so in
   the report header.
4. Never start the application, its servers or its database.

## Probe the environment first

- **Time zone.** Format one fixed instant (`2026-03-08T07:30:00Z`) under each zone you plan to use. If
  the outputs are identical, the zone switch did not take effect, and every zone-dependent row is
  `BLOCKED`.
- **Clock.** Run members that read the current time only if the runtime can fix the clock without
  installing anything. Otherwise they are `BLOCKED`.
- **Locale.** Fix one locale (`en-US`) and say which.

Run every row twice: in the zone the product mostly serves and in UTC, unless the probe blocked zones.

## Inputs

For each translation-table row, run the loser's call and the keeper's expression on the same inputs:
the literal the repo passes, plus the input set for the domain.

| Domain | Inputs |
|---|---|
| Timestamp | `null`, undefined, `""`, `"garbage"`, `"2026-01-01"`, `"2026-01-01T00:00:00Z"`, a time in a daylight-saving gap for the product zone, epoch 0, a native date object, a number of milliseconds |
| Duration and arithmetic | adding 1 month to Jan 31, adding 1 day across a daylight-saving change, the difference of two dates 1.5 days apart, start of week |
| ID | ten generated values: check length, alphabet and uniqueness, never equality |
| Validation | a valid value, `null`, `""`, a wrong type, an extra unknown field, a value just past each bound the schema states |
| Number | `0`, `-0`, `0.5`, `1.005` (rounding), `1234567.891`, `-5`, `NaN`, `null` |

For a mutating call (one whose result is discarded in the repo), also check whether the original value
changed after the call.

## The planted wrong translation

Add one row to the first family's table whose keeper expression is deliberately wrong (a format token
of the wrong case, a month off by one). It must show as differing. If it does not, the harness is not
comparing and the run fails.

## Output

For each row: the inputs, each library's exact output as a string (invisible characters shown), and a
result: `CONFIRMED same`, `DIFFERS` or `BLOCKED` with the reason. "Breaks if migrated" lines in the report
come only from `DIFFERS` rows, each multiplied by the `refs` of the files that call that member.
