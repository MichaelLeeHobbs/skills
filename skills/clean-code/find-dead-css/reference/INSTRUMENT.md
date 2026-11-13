# The driver, the token log and the guard

Generate these in the work folder with any browser automation library that can run a script in every
frame before the page's own scripts and intercept every request of a browser context. They are not
fixture-provable, so the self-test page below proves them before the app is crawled.

## Token log

The log is the set of required tokens that appeared on any element during the run, written as the tool
expects them: `c:` class, `i:` id, `a:` attribute name (ASCII lowercase).

Install it as a script that runs before the page's own scripts, in every same-origin frame:

1. **Full walk.** At start and at every checkpoint (after each step and when the cell ends), walk the
   document and every shadow root found, and log each element's class names, id and attribute names.
2. **Mutation observer.** Observe the document and every shadow root for child lists and attributes,
   with old attribute values. For each record, log the tokens of the old value and of the target's
   current attribute, and walk every added node. A class added and removed in one task still shows in
   the old value.
3. **Shadow roots.** Wrap the element method that attaches a shadow root so every root, open or closed,
   is observed and walked when created.
4. **Reading classes.** Split the `class` attribute on ASCII whitespace only (a no-break space is part of
   a class name). Read the attribute, not a class-name property, so SVG elements log correctly. Log only
   connected nodes and nodes from mutation records; content inside a `<template>` is not rendered and is
   not logged.
5. **Filter.** Keep only tokens that appear in the inventory's member tokens or the canaries. Ids and
   attribute values can carry record numbers and names; nothing outside the inventory vocabulary is
   written down.
6. **Quirks mode.** Record each document's compatibility mode. If any reached document was in quirks
   mode, run `classify --fold-case yes`, because class and id selectors match case-insensitively there.

Out of reach, and counted in the report: cross-origin frames, declarative shadow roots created by the
HTML parser with mode closed. If the inventory has rules meant for either, those rules' members are
UNPROVEN; pass their sheets as `foreign` records and say why.

## Network guard

Apply it to the whole browser context, so popups, frames and workers are covered, and block service
workers so no request bypasses it. Check each request in this order and record which rule fired:

1. **Method rule.** Any method other than GET, HEAD or OPTIONS is aborted, except the sign-in request
   for each role, allowed by exact method and path. A GraphQL request whose operation is a mutation is
   aborted. Beacons count as POST.
2. **Host rule.** A request to any host other than the approved one is aborted.
3. **Sockets.** WebSocket and server-sent event connections are refused. An app that needs one to render
   a state gets those cells blocked with reason `socket`, unless the user declares the environment
   disposable for this run.
4. **Deny-listed paths.** A GET whose path contains a deny word from the plan check (`/unsubscribe`,
   `/logout`) is aborted.

An aborted request marks its cell blocked with reason `mutation`, except the guard canary. Writes on view
(a GET that marks a notification read) can still change data; if the user gave a read-only check of the
seed (a row count, a checksum query), run it at start and end, and a change stops and fails the run.

## Cell lifecycle

For each cell, in a fresh browser context: set the width, apply the cell's mocks by request pattern,
run each step with a timeout, then check the `expect` and that the URL is the cell's route. Reached means
all of that held. Record:

```
{"t":"cell","cell":"orders-clerk-empty","status":"reached","sheets":["assets/app-1a2b.css","assets/orders-9f8e.css"]}
```

`sheets` lists the stylesheets in the document and shadow roots at the end, keyed the same way as the
inventory's `sheet`. A blocked cell gets one reason, kept beside the record in the work folder:
`timeout`, `target-missing`, `expect-failed`, `wrong-url`, `mutation`, `socket`, `auth-failed` or
`plan-rot`. Retry a blocked cell once in a new context before recording it.

## Self-test page

Before the crawl, generate a page from this description, serve it from the work folder on loopback with
one stylesheet, and run the driver on it as a one-cell plan. Never ship the page in the skill.

The page holds:

| Element | Expect logged |
|---|---|
| `<div class="st-static">` in the HTML | `c:st-static` |
| an element created by script with class `st-` plus the result of `2 + 3` | `c:st-5` |
| an element whose class `st-flash` is added and removed in the same task | `c:st-flash` |
| an element added and removed in the same task, with id `st-gone` | `i:st-gone` |
| an element with a closed shadow root created by script, holding `<span class="st-shadow">` | `c:st-shadow` |
| a same-origin frame holding `<p data-st-frame>` | `a:data-st-frame` |
| an SVG `<rect class="st-svg">` | `c:st-svg` |
| `<template><b class="st-template"></b></template>` | not logged |
| a span whose class is `st-nbsp`, a no-break space, then `x` | one token holding the no-break space, never `c:st-nbsp` |
| a hidden subtree (`display:none`) holding `<i class="st-hidden">` | `c:st-hidden` |

On load, the page also attempts a POST to its own host, a beacon, a GET to `https://example.invalid/`, a
WebSocket to its own host and a service worker registration. Expect each one aborted or refused, with
the rule that fired: method, method, host, socket, service worker blocked.

Build the inventory for the self-test from its stylesheet, which holds one rule per expected token plus
`.st-template`. The logged set, filtered to that vocabulary, must equal the expected set exactly, and
the blocked list must match exactly. Any difference stops the run.

## Live canaries

In the real crawl, from the same pre-page script:
- on the plan's deepest state (most steps), add a hidden element whose class is assembled at runtime
  from `zz-built-` and a number, and add the matching member row;
- in the first cell, send one POST to the approved host at a path that does not exist and one GET to
  `https://zz-canary.invalid/`. The guard must abort them by the method rule and the host rule. Neither
  marks the cell blocked.
