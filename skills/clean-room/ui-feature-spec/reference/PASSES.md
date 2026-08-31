# The six investigation passes

Run all six before writing a word of the spec. Keep a running inventory and work through it. If the page
is large, note your position so you can resume without re-walking covered ground.

## Pass 1: recon, read-only

Capture the URL including path segments and query parameters, and note which parts look like variables.
Screenshot the initial viewport. Scroll to the bottom in steps, screenshotting as you go, and record the
total page height.

**Find scroll containers inside the page** (sidebars, tables, modals, dropdowns) and scroll each one
independently. Content below the fold of an inner container is routinely missed.

Read the DOM for elements that are present but hidden. Those are usually error slots, empty states and
conditional panels you would otherwise never see rendered, and they are the cheapest coverage in the
whole process. Record the title, favicon and meta tags. Read the console for framework fingerprints,
errors and warnings.

## Pass 2: interaction sweep

**Enumerate every interactive element first, then walk the list.** Improvising the order loses track of
what you have covered.

For each: hover it and record tooltips and revealed affordances. Focus it by keyboard and record whether
the focus ring is visible. Activate it, subject to the safety rules, and record what changed. Then
reverse it, and note if the page does not return to its prior state.

Open and document every one of these that exists: dropdowns and selects, capturing the **complete**
option list rather than the first few; tabs, accordions and disclosure widgets; modals, drawers,
popovers and context menus; date, colour and file pickers; pagination, sorting, filtering and search,
exercised so you can record how the view changes; and every step of any multi-step flow, including its
indicator and back behaviour.

Then tab through the whole page from the top and record the actual focus order.

## Pass 3: variant sweep

**This is the pass that separates a first draft from a usable spec.** It is also the one that gets
skipped, because after pass 2 the page feels understood.

First, list the dimensions the interface varies along. Common ones:

- **Item type.** Each type of thing that can be created, dropped, added or selected.
- **Panel or inspector contents,** usually driven by the type of the selected thing.
- **Tab sets,** which are often not the same tabs for every selection.
- **Row kinds** in a table or list: a header row, a grouped row, an empty row, a row in an error state.
- **Roles and permissions**, if step 0 gave you more than one login.
- **Statuses**, such as draft, active, archived, expired.

Then, for each dimension, **exercise every value.** Not a representative sample. Every one. Record the
result as a matrix, one row per value, and put it in an appendix rather than inline, because these
tables get long and should not bury the narrative sections.

Three things to check at every value, because these are where real runs have been wrong:

1. **Does the panel shape change, not just its contents?** Different groupings, different headings, a
   sub-tab that only some values have. A run that checked one value and wrote that the style tab was
   uniform was wrong: there were three distinct shapes.
2. **Does one action produce more than one result?** A run assumed each palette item inserted one node.
   Two of them inserted multi-node composites. After every create or insert, read the whole resulting
   structure, not the node you expected.
3. **Is the feature simply absent for some values?** Absence is specification too, and an empty panel
   with no explanatory message is a finding worth reporting.

If you genuinely cannot exercise every value, say how many you did, which ones, and why you stopped. Tag
every generalisation `[SAMPLED n/N]`. An honest sample is useful. A sample presented as complete is
worse than nothing, because the next person will not re-check it.

## Pass 4: state and error harvest

**Verbatim error copy is the single most commonly missing piece of a rebuild spec.** Go get it.

For every form field: submit the form empty and record every required-field message verbatim. Enter
malformed input for the field's type and record the message verbatim. Probe boundaries with overlong
strings, zero, negatives and special characters, and read the constraint attributes from the DOM. Note
*when* validation fires, on blur, change or submit, and whether submit disables until the form is valid.

Do this for the authoring interface too, not only the content it produces. A run missed a required-field
message entirely because it validated the form being built but never tried to clear a required property
in the builder itself.

Also capture where reachable:

- **Loading and skeleton states**, ideally via a throttled reload.
- **Empty states.** Hunt these deliberately. Search for something with no results, delete down to zero
  if step 0 allows it, or open a fresh instance. An empty state is easy to never encounter by accident
  and it is always part of the rebuild.
- **Success and confirmation states**, from non-destructive actions.
- **Permission-restricted states**, if step 0 gave you another role.

## Pass 5: under the hood

**Network.** Reload with the network log open and record every request the page makes: method, URL
pattern, query and body shape, response shape, status. Then trigger interactions and record the calls
those produce. This turns the API contract from guesswork into an observed contract. **Redact every
token, cookie, password and piece of personal data** before it goes in the spec.

**Storage.** Record the storage and cookie keys the page reads or writes, and what they appear to
control. Note what survives a reload.

**History.** Undo and redo are behaviour, not chrome. Find out what a single undo actually restores: one
field, one node, or the whole document. One run found that undo stored whole-document snapshots, which
is a material rebuild constraint and is invisible unless you test it.

**Analytics.** Note tracking calls and event names. **Assets.** Record icon and font sources, and the
icon set if identifiable, since a rebuild has to source equivalents.

**Not in a clean-room run:** do not open stylesheets or source maps, and do not extract computed style
values. Appearance is recorded by intent in the spec, not by value.

## Pass 6: responsive and theme

Resize to roughly 375, 768 and 1440 pixels wide and screenshot each. Record what actually reflows:
columns collapsing, navigation becoming a menu, tables restacking, elements disappearing.

Note the approximate widths at which the layout changes, from observation rather than from reading
stylesheets. Capture both themes if the page has a theme switch, and describe the difference in terms of
role, such as a surface becoming darker than its container, rather than in values.

Note whether the layout is fluid or fixed, and roughly where the content stops widening.
