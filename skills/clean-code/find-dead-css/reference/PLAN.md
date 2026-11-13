# The crawl plan

The plan is the expensive, reviewable part of a run. You draft it once, the user approves it, a
generated driver replays it, and it is kept in the catalog so a re-run only reviews what changed.

## Where routes and states come from

Read these, in this order, and draft from them. Never click around the live app to discover states.

1. **The router configuration**, read with the language's parser. Every route is a `route` record.
2. **End-to-end tests**: they hold working step sequences for logging in, opening dialogs and reaching
   states. Translate their steps; do not run them.
3. **Component stories**: exports named for states (Empty, Loading, Error, Disabled) name the states a
   screen has.
4. **Existing mocks and fixtures** in the repo: the responses that produce empty, loading and error
   states. Use only mocks the repo already has; never record one from a live response.

A dynamic route (`/orders/:id`) gets one cell per data shape the seed provides (an order with lines, an
order with none), never one per row. A route you cannot reach safely is an `exclude` with its reason.

## Cells

A cell is one route, one role, one state and one width. Plan:
- every state of every route at the default width;
- the default state of each route at every other width band, one width per band, the bands taken from
  the inventory's `@media` width conditions;
- one state per theme or feature flag the app switches with script (a theme toggle, a flag in local
  storage). Colour-scheme and print media need no cells: the token test ignores media conditions.

A **state** is a sequence of steps from the default page that ends with an `expect`: a role and
accessible name that must be present (`alertdialog`, `status No orders`). A state that only differs by
data (a long list) is a separate cell only when the seed has that data.

## Records

The plan is three record types for `verify --check plan`, kept sorted in the catalog's `plan.jsonl`:

```
{"t":"route","route":"/orders"}
{"t":"exclude","route":"/debug","reason":"dev only"}
{"t":"cell","cell":"orders-clerk-empty","route":"/orders","role":"clerk","state":"empty","steps":[["auth","clerk"],["goto","/orders"],["fill","searchbox","Search","zz-nomatch"],["press","Enter"]],"expect":"status No orders"}
```

Widths, mocks and the seed's data shape go in extra fields (`width`, `mocks`, `seed`) that the tool
ignores and the driver reads.

Steps come from a closed list. Locate elements by ARIA role and accessible name, never by a CSS class or
id: a locator that uses a class keeps that class alive and depends on the thing being measured.

| Step | Does |
|---|---|
| `["goto", path]` | navigate to a path on the approved host |
| `["auth", role]` | sign in as the role from its environment variable or sign-in state file |
| `["click", role, name]` | click the element with that role and name |
| `["fill", role, name, value]` | type into it; value is `zz-<anything>` or `env:NAME` |
| `["press", key]` | press a key |
| `["wait", role, name]` | wait until that element is present |

## What `verify --check plan` refuses

- a route that is neither planned nor excluded, and a cell or exclusion naming a route that does not
  exist;
- an unknown step or a wrong argument count;
- a `goto`, `click`, `fill` or `wait` whose path or name contains a deny word (delete, remove, send,
  submit, publish, pay, log out and the rest in ALGORITHM.md), unless an `allow` record names that cell
  and step. Use `allow` only for a step that opens a confirmation without confirming it, and show every
  `allow` at approval;
- a `fill` value that is not a synthetic `zz-` value or an environment variable reference;
- any argument with an `@` or a run of 7 or more digits, which is the shape of an email, phone number or
  record number.

The deny list is English and name-based. It is a backstop; the network guard in
[INSTRUMENT.md](INSTRUMENT.md#network-guard) is the control.

## Approval

Show one screen, not the records: routes planned and excluded (with reasons), cells by role and state,
width bands, themes and flags, mocks used, every `allow`, the host, the guard rules, the build command,
estimated wall time (cells times about 4 seconds, divided by parallel contexts) and the model cost of
drafting. One approval covers all of it. Record the date, commit, host and a hash of `plan.jsonl` in
`history.jsonl`. A re-run shows only the plan's changes and gets a new approval for those.

## On a re-run

Validate the saved plan first. A step that no longer finds its element blocks its cell with reason
`plan-rot`; fix the step and re-approve rather than dropping the cell. Add cells for routes the router
gained; the tool's `route_unplanned` problem lists them.
