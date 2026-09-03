---
name: ui-feature-spec
description: >-
  Reverse-engineer a live web page into a build-ready UI and feature specification by operating it, with
  no access to its source. Use for "spec this page", "document this UI", "reverse-engineer this page", or
  before rebuilding or replacing an existing interface. Clean-room by default: it captures behaviour and
  content exactly, and describes appearance by intent rather than copying style values. REQUIRES browser
  control, and cannot be done from a screenshot or a URL alone.
disable-model-invocation: true
---

# Clean-room spec of a live page

Your reader is a developer who has never seen this page, cannot access it, and must rebuild it from your
spec alone. **Anything you fail to record is a feature they will not build.**

You are not describing a screenshot. You are **operating** the page: scrolling it, clicking it, typing
into it, breaking it on purpose, reading what it sends over the wire. A spec written from the first
viewport is a failed spec.

**Done means:** every interactive element exercised, every *variant* of every repeated element
enumerated, every reachable state observed, every user-facing string captured, and everything you could
not reach listed with the reason.

## Requirement

Needs an agent that can drive a real browser: screenshot, scroll, click, type, press keys, resize, and
read the DOM, network log and console.

**There is no reduced version of this.** Without browser control you can only describe a screenshot,
which is the exact failure this skill prevents. If you cannot operate the page, say so and stop rather
than producing something spec-shaped. If one capability is missing but the rest work, continue and
record the gap.

## Step 0: scope it before you touch anything

**Ask these first. Do not start until they are answered.** The safety defaults below assume someone
else's production application, and they will hobble you on a demo you own. The user knows which this is
and you do not.

1. **What is this environment?** Production, staging, a demo instance, or something disposable.
2. **Is destructive testing allowed?** Deleting, sending, purchasing, inviting, publishing, permanent
   settings changes. If yes, ask whether all of it or only some, and what is off-limits.
3. **Whose account is this?** A throwaway you can wreck, or a real account whose state matters.
4. **Are there other roles to switch to?** Permission-gated states are invisible from one role, and the
   spec will silently under-report without them.
5. **How strict is clean-room?** See the rules below. The default omits exact style values. Confirm.
6. **Scope.** This page only, or a flow across pages. Anything explicitly out of bounds.

Record the answers in the spec's metadata. A future reader needs to know a gap was a rule rather than an
oversight.

## Safety, unless step 0 relaxed it

You may be operating someone's real application. Treat it that way until told otherwise.

1. **Never trigger a native alert, confirm or prompt dialog.** These block the automation channel and end
   the session. This one holds even when destructive testing is approved, because it is a tooling limit
   rather than a caution. If a control looks like it will fire one, note it and move on.
2. **No destructive or outward-facing actions.** No deleting, sending, purchasing, inviting, publishing,
   or permanent settings changes. Document such a control from its label, hover state, and any
   confirmation dialog you can safely open, then stop.
3. **Do not log out**, clear storage, or navigate away except to follow a link you can return from.
4. **Prefer reversible probes.** Open a modal and close it. Type into a field and clear it.
5. **Deliberate validation testing is encouraged even under the strictest setting.** Submitting an empty
   or malformed form to harvest real error copy is exactly the probe you should run.
6. **If you are unsure whether an action is safe, do not take it.** Record it as unreached.
7. **Redact secrets.** Tokens, cookies, passwords, keys and real personal data never go in the spec.

## Uniformity is a claim, and it needs evidence

The failure that ruins these specs is sampling a repeated element and generalising. A real run inspected
one component type's property panel, wrote that the style tab was uniform, and was wrong: there were
three distinct shapes. The same run assumed one palette item inserts one node, when two inserted
multi-node composites. Neither error is visible in the finished document.

So: **wherever the interface varies along a dimension, the variation is the specification.** Component
types, row kinds, tabs, item categories, roles, statuses. Enumerate every value, or say which ones you
sampled and that the rest are assumed.

If you write "all X behave the same", you exercised at least three X chosen to be as different from each
other as possible, and you say which three. Otherwise write "X1, X2 and X3 behave the same; the
remaining N were not checked."

The same caution applies to results. **One action can produce more than one thing.** After an insert,
create or import, read the whole resulting structure rather than the one node you expected.

## Work in passes

Six investigation passes, then write. **Do not write any part of the spec until all six are done.** Full
detail in [reference/PASSES.md](reference/PASSES.md).

1. **Recon, read-only.** Full page height, scroll containers *inside* the page, and the hidden elements
   in the DOM that are the error slots and empty states you would never see rendered.
2. **Interaction sweep.** Enumerate every interactive element first, then walk the list. Hover, focus,
   activate, reverse. Complete option lists, never the first few. Then tab through for real focus order.
3. **Variant sweep.** Every value of every dimension the UI varies along. This is where most of the
   real content is.
4. **State and error harvest.** Verbatim error copy is the most commonly missing piece of a rebuild spec
   because it cannot be guessed. Submit empty, submit malformed, probe boundaries. Hunt the empty state
   deliberately; it is easy to never see.
5. **Under the hood.** Network as an observed contract rather than guesswork, storage keys, analytics,
   and history behaviour such as what undo actually restores.
6. **Responsive and theme.** Resize and record what reflows. Both themes if there is a switch.

## Clean-room rules

Full policy in [reference/CLEAN-ROOM.md](reference/CLEAN-ROOM.md), including the one judgement call it
cannot make for you. The short version:

**Capture exactly** what the thing does: structure, behaviour, states, option lists, validation rules,
data shapes, network contracts, keyboard behaviour, accessibility semantics.

**Describe by intent** what it looks like: colour, typography, spacing, shape. **Do not open stylesheets
or source maps, and do not extract computed style values.**

## Evidence tagging

Every non-obvious claim carries its provenance, inline:

`[OBSERVED]` you saw it happen. `[DOM]` read from markup or attributes. `[NETWORK]` read from a real
request or response. `[INFERRED]` a reasonable deduction, not directly observed.
`[ASSUMPTION - VERIFY]` a guess the developer must confirm. `[SAMPLED n/N]` you checked n of N variants
and generalised. `[UNREACHED]` you could not get to it, with the reason.

**Untagged prose is read as observed fact.** Never let an inference sit untagged, and never let a
generalisation from a sample sit without `[SAMPLED n/N]`.

## Two standing rules

**Document only what this page contains.** Do not invent features or import conventions from pages you
have seen elsewhere.

**Be specific about type, state and behaviour.** "A button" is useless. "A primary button, full width on
mobile, disabled until the form is valid, showing a spinner and the text `Saving...` while in flight" is
buildable.

## Write the spec

Only after all six passes. Use the sections in
[reference/SPEC-TEMPLATE.md](reference/SPEC-TEMPLATE.md), in order, written to `<page-slug>-spec.md`.

Three sections carry the weight. The **user stories** are the acceptance contract, and every interactive
component appears in at least one. The **variant matrices** hold the long tail of behaviour and go in
appendices, not inline. The **coverage report** gives enumerated-versus-exercised counts per dimension.
A spec claiming total coverage without those counts is worse than one that names its gaps.

## It is working if

A second run on the same page corrects nothing, it only adds. If a second pass has to write "revision 1
got this wrong", the first run generalised from a sample, and the variant sweep is where to look.
