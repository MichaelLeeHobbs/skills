# Jobs, sinks and markers

## Choosing jobs

Census the jobs a convention source names (CONVENTIONS.md), at most 5, plus any job the user names, at
most 8 in all. A job nobody wrote a convention for gets counts and families but no percentage, and a
drafted convention line in the report. Never pad the list to reach a number.

## Starter jobs

| Job | Grade | Typical sinks (examples, not a list to copy) | Lexical net for `unresolved` |
|---|---|---|---|
| `fetch` (data fetching) | closed | platform `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`; HTTP client libraries; data hooks (`hook`); the shared client module | `fetch`, `.get(`, `.post(`, `.put(`, `.delete(`, `.request(`, `query` |
| `log` (logging) | closed | `console.*`, logging libraries' emit methods, error-reporting SDKs | `log`, `warn`, `error(`, `debug`, `capture` |
| `errorui` (showing an error to the user) | partial | toast, snackbar, alert and modal APIs; error boundary components | `toast`, `alert`, `notify`, `snackbar`, `setError` |
| `authz` (permission checks) | partial | the auth library's guards and hooks; the project's permission module | `can(`, `hasRole`, `isAdmin`, `permission`, `authorize` |
| `validate` (form validation) | partial | schema libraries' parse and validate methods; form libraries' validation options | `validate`, `schema`, `.parse(`, `rules`, `required` |
| user-defined | ask | from the user | from the user |

**Grade.** `closed` means every site reaches a sink the table can name, so the escape bound is the only
gap. `partial` means hand-written sites exist with no sink (an inline `if (user.role === 'admin')`, a
`setError` rendered in markup); the census counts what reaches a sink and the report says "of found
sites" next to the percentage. Graded `closed` jobs fail the run on escapes; `partial` jobs report them.

## The sink table

Freeze it before the scan (SKILL.md step 2), in `sinks.jsonl`:

```
{"symbol":"global#fetch","job":"fetch","marker":"fetch","role":"emit"}
{"symbol":"pkg:@tanstack/react-query#useQuery","job":"fetch","marker":"react-query","role":"hook"}
{"symbol":"pkg:axios#create","job":"fetch","marker":"axios","role":"construct"}
```

- **Where entries come from.** The platform's primitives for the job, every dependency in the package
  manifest classified once (does it do this job? which exports emit?), and every module a convention
  names. Classify each manifest dependency in one pass with the most capable model; record the ones that
  do no job too, so a re-run only classifies new dependencies.
- **One job per symbol.** A logging SDK that ships logs over `fetch` is a `log` sink, and its file is
  never scanned (it is a dependency). When the project's own logger module calls `fetch`, mark that
  module opaque.
- **Roles.** `emit` and `hook` entries become `sink` records (`hook` also drives the `query-hook`
  trigger). `construct` entries are never sinks.
- **Markers** are the family vocabulary: short, stable names (`apiClient`, `react-query`, `axios`). Two
  libraries that a convention treats alike may share a marker; never change a marker between runs
  without bumping the definitions version.
- **Opaque modules.** The files that implement a module a convention names (the shared client, the
  project logger). They are the convention's machinery, so their internal calls are not sites, and the
  module's exports are the sinks.

## Conduits

The tool finds wrappers itself: a non-component function that returns a job call's value (or whose only
statement is that call) and is used at least once becomes a conduit, and its callers become the sites.
At the gate, show the tool's `conduit` records. The user may declare more in `conduits.jsonl`, for
example a helper that logs and toasts (one conduit, two jobs) or one the rule misses. Declared conduits
never need the wrapper shape.
