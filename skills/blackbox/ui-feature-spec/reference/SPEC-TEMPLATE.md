# The spec template

Write to `<page-slug>-spec.md`. Use exactly these sections, in this order. Do not wrap the document in a
code block. Reference captured screenshots by filename where they clarify a section.

Style: concise but complete. Tables for repetitive structured data. Verbatim quotes over paraphrase. No
commentary outside the spec, and no summary of your own process except in section 17.

## 0. Spec metadata

Page name and title, URL pattern with variables marked such as `/orders/:id`, one-line purpose. Page
type: form, dashboard, list, detail, landing, settings, wizard, other. Date captured, and the product it
belongs to if identifiable. Query parameters and deep-link behaviour.

## 1. Overview and context

Two to four sentences on what the page does and why it exists. Who uses it and at what point in their
journey. Prerequisites: authentication, prior steps, permissions, feature flags. Entry points in and
exits out.

## 2. Personas and user stories

The acceptance contract for the rebuild. A first-class deliverable, not a formality.

**2.1 Personas.** Derive them from evidence on the page: role switchers, permission-gated controls, copy
addressing a specific audience. Not from imagination. For each, give the name, what they are trying to
accomplish here, and what they can see or do that others cannot. If the page serves exactly one persona,
say so rather than inventing a second.

**2.2 Stories.** One table row each:

| ID | Story | Persona | Priority | Components | Endpoints |
|---|---|---|---|---|---|
| US-01 | As a `<persona>`, I want to `<action>`, so that `<benefit>`. | ... | Must / Should / Could | C-03, C-04 | `POST /api/x` |

Rules for the story set:

- Each story is independently testable and describes user-visible value. No stories about implementation.
- **Every interactive component in section 5 appears in the Components column of at least one story.**
  This is a hard coverage requirement and it is how the developer knows the spec is complete. Verify it
  in section 18.
- Cover the happy path, then validation failure, empty state, error state, permission variation, and
  cancel or back behaviour. A page with only happy-path stories is under-specified.
- Aim for the smallest set that achieves full coverage. Do not pad.

**2.3 Acceptance criteria.** Scenarios per story, in given-when-then form, verifiable by someone with no
access to the original page. Quote real copy:

> **Then** the field shows the error `Please enter a valid email address.` below the input, in red.

Where you observed the behaviour, write it as fact. Where you are specifying intent you could not
verify, tag the scenario `[ASSUMPTION - VERIFY]`.

## 3. User flows

The main task flow step by step. Alternate and error paths, including cancel and browser back. For
multi-step flows, every step, its indicator, and whether state survives navigating backward.

## 4. Page layout and structure

Layout pattern: columns, grid, maximum content width, alignment, density. Region breakdown in DOM order.
A text wireframe of the visual hierarchy. Responsive behaviour at each width tested, with observed
breakpoints. Layering for overlays, sticky elements and modals.

## 5. Component inventory

Every element in reading order with a stable ID such as `C-01`, so section 2 can reference it. For each:

- **ID and name**
- **Type**, the specific control, not a generic noun
- **Label and copy**, all associated verbatim text
- **Default or placeholder value**
- **Options**, the full enumerated list, never "etc."
- **States:** default, hover, focus, active, selected, disabled, loading, error, empty, success. What
  visibly changes in each state you observed. Mark the ones that do not apply.
- **Behaviour** on interaction
- **Constraints:** required, maximum length, allowed format, minimum, maximum, pattern
- **Data source:** static, or the endpoint that populates it

## 6. Interactions and behaviour

Event flows, including conditional and dependent fields. Navigation and redirects, and what happens
after key actions. Client feedback: toasts, inline messages, modals, optimistic updates. Animations with
rough durations. Keyboard interactions and shortcuts. Anything that autosaves, debounces, polls or
refreshes on a timer.

## 7. Validation and error handling

A table of every field: rule, trigger point, and the **verbatim** message. Form-level validation and what
blocks submit. Server error handling and how failures surface. Network failure and timeout behaviour if
observable.

## 8. Content states

For the page and each relevant component: loading, empty, error, success, and partial or
permission-restricted. Quote the copy shown in each. State explicitly where a state does not apply or
could not be reached.

## 9. Data model and API contract

Observed, not guessed. Mark anything inferred.

Entities implied by the page, with fields, types and relationships. A table of every request: method,
URL pattern, trigger, request shape, response shape, status codes seen, tagged `[NETWORK]` for observed
and `[INFERRED]` for deduced. Which elements are static versus fetched. The admin surface for
data-driven content: who manages it and what fields. Authentication, roles and permission rules
affecting visibility.

## 10. Client state and persistence

What lives in component state versus a global store versus the URL. Storage and cookie keys observed and
what they control. What survives a reload and what does not.

## 11. Third-party and embedded services

Payment widgets, captchas, maps, chat, analytics, embedded frames, externally hosted fonts and scripts.
Name each and say what it is responsible for, because a rebuild has to account for it.

## 12. Accessibility

Semantic structure: landmarks and heading order as they actually appear. Labels, alternative text and
roles present, and ones that are missing. Observed tab order and focus management, including focus
trapping in modals. Contrast, and whether any state is signalled by colour alone. A short list of gaps
worth fixing in the rebuild.

## 13. Visual design and theme

From computed styles, not from a screenshot.

Colour palette: background, surface, primary and accent, text, border, status colours. Typography:
families, weights, sizes and line heights per text role. Spacing scale, radii, shadows, density.
Iconography style and source. A proposed token set a developer could centralise, with names and values.
Dark mode variants if present.

## 14. Content inventory

A single table of every user-facing string: a suggested localisation key, the verbatim copy, and where
it appears. This is what makes the rebuild's copy match rather than approximate.

## 15. Non-functional notes

Performance: large lists, lazy loading, pagination, virtualisation, image sizes. Localisation needs,
including date, number and currency formats observed. Privacy, legal or compliance copy present. Search
metadata.

## 16. Rebuild checklist

An ordered, checkable list a developer works through to reconstruct the page, from layout to components
to wiring to states. This is the section they will actually work from.

## 17. Coverage report

Honest accounting of what you did and did not reach.

- Interactive elements enumerated versus exercised, as a count.
- Every element or state you could not reach, with the reason: destructive, permission-gated, requires
  data you do not have, would have triggered a blocking dialog, capability unavailable.
- Anything that behaved inconsistently across attempts.

**Do not omit this section.** A spec that claims total coverage without evidence is worse than one that
names its gaps.

## 18. Open questions and assumptions

Everything ambiguous, hidden or guessed. Everything a developer must confirm with product or design
before building. And the section 2.2 coverage check: confirm every interactive component appears in at
least one story, or list the ones that do not and explain why.
