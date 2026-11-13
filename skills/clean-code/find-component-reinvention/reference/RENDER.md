# Rendering, capture and evidence

This step runs the repo's own code: the bundler and its configuration build the members, and a browser
executes them. Every rule here is a requirement with a check. Write the harness, the build configuration,
the calibration page and the pixel extractor in the work folder from these requirements; none of them is
ever saved in the repo or the catalog.

## The cut

Order the judged groups, then take groups in order until 12 groups or 240 cells, whichever comes first:

1. Groups with at least one VARIANT come before groups with none.
2. Within that, the top group of each widget class comes first (classes in byte order), so dialogs,
   tables and pickers are not crowded out by buttons.
3. Then by import sites of the group's members (sum of `importers`), highest first, then by member count,
   then by group ID.

Within a group, render the canonical copy, any reference member, and up to 7 more members by importers.
Canary groups render outside the count. Record every planned cell as a `cell` record, and every group or
member left out as cut in the report header.

## Adapters

For each planned member and state, the judge writes an adapter: the props that bring that member to that
state with the state's payload, written from source after the cut and before any render, then frozen.

Store each adapter as data: a JSON object of props. Three markers stand for values JSON cannot hold, and
the list is closed:

| Marker | Means |
|---|---|
| `"$noop"` | a function that does nothing and returns nothing |
| `"$field:<name>"` | a function returning the `<name>` field of its first argument |
| `"$text:<s>"` | a child node holding the text `<s>` |

A member that needs any other function, element or expression for a state is BLOCKED for that cell with
reason `adapter_inexpressible`. Never add a marker that evaluates text. An adapter may not set styling
props the member does not use for that state in the app.

## Before anything is built

The approval in step 1b names three things: the repo's build toolchain will run on this machine from an
exported copy; nothing will be installed; no screenshot leaves the machine. If the user declines, take
the static fallback.

## The export and the build

1. Export the recorded commit as an archive and extract it into the work folder. Do not create a linked
   checkout of the repo: that writes into the repo's version-control folder and runs its checkout hooks.
2. Resolve installed packages from the repo's installed package folder through a link, and alias every
   workspace package to its copy in the export, so nothing resolves to live source.
3. Write the harness's own build configuration. Take from the repo's configuration only module aliases,
   the framework plugin, the style pipeline and constant definitions. Leave out every plugin that uploads,
   reports, analyses, registers a service worker or posts telemetry.
4. Run the bundler's own executable directly, never through the package manager's scripts, with a
   cleared environment: set only what the build needs, and give every environment variable the
   configuration reads an unreachable loopback value. If the build needs a variable whose name contains
   `KEY`, `TOKEN`, `SECRET` or `PASSWORD`, stop and take the static fallback.
5. Put the bundler's cache in the work folder, or turn caching off. Turn network access off for the build
   process. If the platform cannot, take the static fallback.
6. Build once to files. Repair at most three times, editing harness files only. Then check the bundler's
   module list: any module resolved from the live tree fails the step (`live_source_imported`, static
   fallback).

## The harness page

- One entry per framework the toolchain already builds. A member in a framework it cannot build without
  an install is BLOCKED `build_failed`.
- A provider shell copied from what the app's root mounts, read as text (and from the component
  workshop's global decorators, if the repo has one): the real theme and translations, an in-memory
  router, a fresh store and data client, the fake user, feature flags at their defaults.
- Each member mounted alone in its frame (STATES.md) inside an error boundary, with its adapter's props.
- Animations, transitions and the text caret switched off; the clock fixed to `2026-03-10T14:30:00Z`; one
  locale and one time zone fixed and named in the report.
- Per cell, the page records console errors, error-boundary hits and requests still pending at capture.

## The browser

- A browser you can drive from a script without a window, with a fresh profile in the work folder. Never
  the user's own profile.
- From the first page load, block every request not to the harness: page requests, sockets, event
  streams, beacons, workers and prefetches. Refuse service-worker registration.
- Serve only the build output, from a file address or a server bound to 127.0.0.1 that you stop when the
  step ends. Never the repo's development server or its proxy configuration.

## Controls before any member is captured

1. **Containment.** The calibration page tries one outside fetch, one outside socket and one
   service-worker registration. All three must fail, or take the static fallback.
2. **Calibration.** The calibration page shows known solid colours (`000000`, `ffffff`, `ff0000`,
   `00ff00`, `0000ff`, `7f7f7f`). Capture and extract it; every pixel must come back exactly, or take the
   static fallback (the capture path is changing colours).
3. **Zone.** Format one fixed instant under the chosen zone and under UTC. Identical output means the
   zone did not take effect; say so in the report.
4. **Fonts.** Wait until the page reports its fonts loaded. Hosted fonts fail with the network off; that
   is allowed only when every member falls back to the same font. Otherwise the cell is BLOCKED
   `font_mismatch`.

## Capture and extraction

For each planned cell: load the page fresh, mount the member in its state, wait for fonts and for no
pending request, capture the frame at scale 1 with reduced motion. Do it twice (take 1 and take 2).

Extract the pixels in the same browser: draw the capture into a canvas served from the harness origin (a
file-address image can block reading it back), read the pixels, and write `image` and `px` records
(CONTRACT.md `diff`) straight to one input file per group in the work folder. The pixel text never
passes through the agent's context: a viewport frame is about 6 MB per take.

A cell whose page recorded a console error, a boundary hit or a pending request gets a `blocked` record
with that reason instead of images. Write `unreachable` records from the judge's `-` labels and `predict`
records from its look labels.

## Diff, evidence and sheets

Run `diff` once per group. Problems mean the cell bookkeeping is wrong: fix the records and run it
again. Take outcomes, pairs, looks and evidence from its output only. If more than a quarter of a
group's cells are not `ok`, the group's members are reported BLOCKED whatever the evidence says.

Build one sheet per group: rows are states, columns are members with the canonical copy first, each cell
the take 1 capture at 1:1, the `box` of each noticeable pair against the canonical copy outlined,
`unreachable` and BLOCKED cells as labelled placeholders, and the commit and state names drawn into the
image. Save sheets in the work folder and keep it until the user deletes it.

## After the step

Before the step, write a marker file. After it, and before the catalog is written:

- list every file newer than the marker under the live tree, ignored files included, and under every
  folder the installed-package links resolve to;
- compare the version-control status with the one recorded at the start, to catch deletions.

Any change outside the catalog folder fails the run. Hand the user the list; never reset or clean their
tree. Then delete the browser profile and the export.

## Blocked reasons

`adapter_inexpressible`, `boundary_hit`, `build_failed`, `cap_reached`, `console_error`, `font_mismatch`,
`import_failed`, `needs_network` (an unmatched request changed the render), `pending_request`,
`render_threw`, `timeout`. `unstable` and `blank` are set by `diff`, never by hand.

## Static fallback triggers

No browser you can drive; the user declines the build; secret-named variables required; network cannot
be turned off for the build; the build fails three times; live source imported; containment or
calibration fails; the provider shell cannot be assembled. Any one ends the visual half: skip steps 5
and 6, report every member's evidence as BLOCKED, and fail the run (SKILL.md "Check").
