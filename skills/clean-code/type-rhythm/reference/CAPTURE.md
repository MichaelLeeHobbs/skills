# Capturing screens

How to build the screen list, prepare a safe environment, run the capture loop and plant the canaries.

## Screen list

1. Read the router (route table, file-based routes, framework config). List each route pattern once.
2. Count route declarations a second, independent way: search source with the router's own pattern
   (for example every `path:` entry, or every page file). Write `{"t":"routes","count":N}` from that
   count.
3. Exclude, with reason `side-effect`, every route whose path contains one of: `logout`, `signout`,
   `sign-out`, `delete`, `remove`, `approve`, `reject`, `confirm`, `verify`, `unsubscribe`, `export`,
   `download`, `impersonate`, `callback`, `oauth`, `reset`, `activate`, `accept`, `pay`, `checkout`.
   Exclude routes the user names, with their reason.
4. For each remaining route, one `screen` record with the route pattern. A route with parameters needs
   an example value from the user or a seed file; keep the concrete URL only in the work folder.
5. States no URL reaches (an open dialog, a tab) are out of scope unless the user gives a URL for them;
   the header says dialogs, menus and toasts were not measured.
6. Show the user the whole list, included and excluded, with example parameters. Capture nothing until
   they confirm it.

`verify --check captures` fails when included plus excluded routes do not equal the count.

## Environment

- Ask which environment and host to use. Default to a test or staging environment. Production, or any
  environment holding real customer data, needs the user's separate explicit yes, recorded in the header.
- The user starts the app and signs in once, in a browser profile used only for this run. Never type,
  store or ask for credentials.
- Navigate by URL only. Never click, type, submit, save, delete or confirm. Refuse downloads.
- Read only the collector's output. If your browser control returns page snapshots or screenshots to you
  on each step, tell the user before capturing, and offer test data or the static tier instead.
- Markers: one selector that exists only when signed in (`auth`), one for the sign-in form (`login`),
  one for the not-found page (`notfound`), from the user or read from source. Never match on page text.
- Viewports: the user's, else 1440 and 390. Variants: `base`. A dark theme is measured only when the user
  asks; then ask how to switch it, else emulate the dark colour-scheme preference, and add it as a variant.

## The capture loop

Generate a loop that runs on this machine, outside your context, for every screen x viewport x variant:

1. Set the viewport. Navigate to the screen's URL.
2. Wait until idle: `document.fonts.status` is `loaded`, no `[aria-busy="true"]`, and the DOM has not
   changed for 500 ms. Give up after 15 s and capture anyway; the header then says `busy`.
3. Run the collector with this capture's parameters. Write its output to `<name>.jsonl.tmp`, then rename
   it to `<name>.jsonl` only when the write completed. A stopped run never leaves a partial final file.
4. Print one progress line per capture, never the records.
5. Stop at the first capture whose header has `auth` false or `login` true, and report it.

A capture is redone by deleting its file. Each capture key appears in one file only, because the tool
rejects a second header for the same key.

## Canaries

Run these after the capture check passes. Each is its own capture with a reserved variant, so it never
mixes with real captures.

**Capture canaries.**
- `canary-logged-out`: one real screen, in a fresh browser context that shares no storage with the
  signed-in profile, closed afterwards. It must be rejected (`auth_lost` or `login`).
- `canary-bad-route`: a path that cannot exist (`/type-rhythm-canary-404`) under the signed-in session.
  It must be rejected (`notfound` or `wrong_page`).

**Element canaries** (`canary-elements`, one per viewport, on one real screen). Before running the
collector, append one plain container `div` to the main landmark and create inside it, setting every
style through the element's style property (an injected stylesheet is blocked by a strict style policy):

| Id | Element | Style | Text |
|---|---|---|---|
| c1 | `label` | font-size `m` | yes |
| c2 | `h2` | font-size a step serving heading, weight a weight step | yes |
| c3 | `div` holding a `label` (the label carries the id) | font-size `m` on the div only | on the label |
| c4 | `div` | padding `s` on every side | no |
| c5 | `span` | position absolute, width and height 1px, overflow hidden, clip `rect(0 0 0 0)`, font-size `m` | yes |
| c6 | `span` | display none, font-size `m` | yes |
| c7 | `div` 210px wide holding a `div` (it carries the id) | inner: width 10px, height 10px, margin `0 auto` | no |
| c8 | `p` with `id="mrn-12345678"` | none | yes |

Set `data-type-rhythm-canary` to the id. `m`: the midpoint, rounded down to a hundredth, of the first
pair of adjacent size steps further apart than twice the tolerance plus 2 hundredths. `s`: the same
over space steps. If no such pair exists, the canaries cannot be built and the run fails. In
distribution mode, give the canary check and the injection this stand-in scale instead: sizes 1200,
1600 and 2400 (heading), weights 400 and 700, spaces 800 and 1600. The tally still gets no scale.

If the app's own styles override a canary (an `!important` rule, for example), the check fails and the
report names the rule. Do not work around it.

## Estimate

Time per capture is navigation plus the idle wait plus the collector, about 2 to 5 s on a typical app;
measure it on the pilot and multiply by the planned captures plus canaries. Model work is the pilot's
role mapping, one tally read and the traces: about 30 owners, each needing the source files that define
it. The Capped tier adds every capture's output to your context: estimate it from the pilot's file
sizes, and stop at 40 captures.
