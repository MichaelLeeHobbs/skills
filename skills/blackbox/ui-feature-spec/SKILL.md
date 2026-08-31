---
name: ui-feature-spec
description: >-
  Reverse-engineer a live web page into a build-ready UI and feature specification by operating it, with
  no access to its source. Scrolls, clicks, types, breaks forms on purpose, and reads the network, to
  produce a spec complete enough that a developer who has never seen the page can rebuild it. Use for
  "spec this page", "document this UI", "write a spec for this screen", "reverse-engineer this page", or
  before rebuilding or replacing an existing interface. REQUIRES browser control; it cannot be done from
  a screenshot or a URL alone.
disable-model-invocation: true
---

# Black-box a web page into a spec

Your reader is a developer who has never seen this page, cannot access it, and must rebuild it faithfully
from your spec alone. **Anything you fail to record is a feature they will not build.**

You are not describing a screenshot. You are **operating** the page: scrolling it, clicking it, typing
into it, breaking it on purpose, and reading what it sends over the wire. A spec written from the first
viewport is a failed spec.

**Definition of done:** every interactive element has been exercised at least once, every reachable state
has been observed, every user-facing string has been captured verbatim, and everything you could not
reach is listed explicitly with the reason.

## Requirement

This skill needs an agent that can drive a real browser: screenshot, scroll, click, type, press keys,
resize the window, and read the DOM, network log and console.

**There is no reduced version of this.** Without browser control you can produce a description of a
screenshot, which is exactly the failure mode the skill exists to prevent. If you cannot operate the
page, say so and stop rather than producing something spec-shaped.

If one capability is missing but the rest work, continue and record the gap in the coverage report.

| Capability | Use it for |
|---|---|
| Screenshot | Visual state at each step, before-and-after comparisons |
| Scroll | Full page height, plus scroll containers *inside* the page |
| Click, hover, focus | Every control, menu, tab, accordion, tooltip, modal |
| Type and form fill | Valid input, invalid input, boundary input, empty submit |
| Keyboard | Tab order, Enter, Escape, arrow keys, shortcuts |
| Window resize | Actual responsive reflow, not guessed breakpoints |
| DOM read | Element types, ARIA attributes, computed styles, hidden nodes |
| Network read | Real request and response shapes, not guessed endpoints |
| Console read | Errors, warnings, framework fingerprints |

## Safety rules, read before you touch anything

You are operating someone's real application. Treat it that way.

1. **Never trigger a native alert, confirm or prompt dialog.** These block the automation channel and end
   the session. If a control looks like it will fire one, note it and move on.
2. **No destructive or outward-facing actions.** No deleting, sending, purchasing, inviting, publishing,
   or permanent settings changes. If a label suggests destruction, document it from the label, its hover
   state, and any confirmation dialog you can safely open, then stop.
3. **Do not log out**, clear storage, or navigate away except to follow a link you can return from.
   Losing auth ends the audit.
4. **Prefer reversible probes.** Open a modal and close it. Expand an accordion and collapse it. Type
   into a field and clear it. Submit only when the form is clearly non-destructive, such as a search or
   filter, or when submitting invalid data the client will reject before it reaches the server.
5. **Deliberate validation testing is encouraged.** Submitting an empty or malformed form to harvest real
   error copy is exactly the probe you should run, because those strings cannot be guessed.
6. **If you are unsure whether an action is safe, do not take it.** Record it as unreached.

## Work in passes

Five investigation passes, then write. **Do not write any part of the spec until all five are done.**
Full detail for each in [reference/PASSES.md](reference/PASSES.md).

1. **Recon, read-only.** Full page height, scroll containers *inside* the page, and the hidden elements
   in the DOM that are the error slots and empty states you would otherwise never see rendered.
2. **Interaction sweep.** Enumerate every interactive element first, then walk the list. Hover, focus,
   activate, reverse. Complete option lists, never the first few. Then tab through and record real focus
   order.
3. **State and error harvest.** Verbatim error copy is the single most commonly missing piece of a
   rebuild spec, because it cannot be guessed. Submit empty, submit malformed, probe boundaries.
4. **Under the hood.** Network requests as an observed contract rather than guesswork, storage keys,
   analytics, assets, and computed styles read from the DOM rather than eyeballed from a screenshot.
5. **Responsive and theme.** Resize and record what actually reflows. Both themes if there is a switch.

## Evidence tagging

Every non-obvious claim carries its provenance, inline:

`[OBSERVED]` you saw it happen. `[DOM]` read from markup or computed styles. `[NETWORK]` read from a
real request or response. `[INFERRED]` a reasonable deduction, not directly observed.
`[ASSUMPTION - VERIFY]` a guess the developer must confirm before building. `[UNREACHED]` you could not
get to it, with the reason.

**Untagged prose is read as observed fact. Never let an inference sit untagged.**

## Core rules

1. Document only what this page contains. Do not invent features or import conventions from similar
   pages you have seen elsewhere.
2. **Capture all visible text verbatim** and never paraphrase a user-facing string. If copy is truncated
   on screen, get the full string from the DOM.
3. Be specific about type, state and behaviour, not appearance. "A button" is useless. "A primary button,
   full width on mobile, disabled until the form is valid, showing a spinner and the text `Saving...`
   while in flight" is buildable.
4. If content is data-driven, say so, and specify the implied data model and the admin surface someone
   would need to manage it.
5. Redact secrets. Tokens, cookies, passwords, keys and real personal data never go in the spec.

## Write the spec

Only after all five passes. Use the eighteen sections in
[reference/SPEC-TEMPLATE.md](reference/SPEC-TEMPLATE.md), in that order, written to
`<page-slug>-spec.md`.

Two sections carry the weight. The **user stories** are the acceptance contract, and every interactive
component must appear in at least one story, which is how the developer knows the spec is complete. The
**coverage report** is the honest accounting of what you did not reach. A spec claiming total coverage
without evidence is worse than one that names its gaps.

## It is working if

Someone rebuilds the page from the spec without asking you a question, and the copy in their rebuild
matches the original exactly rather than approximately.
