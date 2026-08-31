# The five investigation passes

Run all five before writing a word of the spec. Keep a running inventory and work through it. If the
page is large, note your position so you can resume without re-walking covered ground.

### Pass 1: recon, read-only

Capture the URL including path segments and query parameters, and note which parts look like variables.
Screenshot the initial viewport. Scroll to the bottom in steps, screenshotting as you go, and record the
total page height.

**Find scroll containers inside the page** (sidebars, tables, modals, dropdowns) and scroll each
independently. Content below the fold of an inner container is routinely missed.

Read the full DOM for elements that are present but hidden. Those are usually error slots, empty states
and conditional panels you would otherwise never see rendered. Record the title, favicon and meta tags.
Read the console for framework fingerprints, errors and warnings.

### Pass 2: interaction sweep

**Enumerate every interactive element first, then walk the list.** Improvising the order loses track of
what you have covered.

For each: hover it and record tooltips, cursor and elevation changes. Focus it by keyboard and record
whether the focus ring is visible. Activate it, subject to the safety rules, and record what changed.
Then reverse it, and note if the page does not return to its prior state.

Open and document every one of these that exists: dropdowns and selects, capturing the **complete**
option list rather than the first few; tabs, accordions and disclosure widgets; modals, drawers,
popovers and context menus; date, colour and file pickers; pagination, sorting, filtering and search,
exercised so you can record how the view changes; and every step of any multi-step flow, including its
indicator and back behaviour.

Then tab through the whole page from the top and record the actual focus order.

### Pass 3: state and error harvest

**Verbatim error copy is the single most commonly missing piece of a rebuild spec.** Go get it.

For every form field: submit the form empty and record every required-field message verbatim. Enter
malformed input for the field's type and record the message verbatim. Probe boundaries with overlong
strings, zero, negatives and special characters, and read the constraint attributes from the DOM. Note
*when* validation fires, on blur, change or submit, and whether submit disables until the form is valid.

Also capture where reachable: loading and skeleton states, ideally via a throttled reload; empty states,
by searching for something with no results; success states, but only from non-destructive actions; and
permission-restricted states if role switching is available.

### Pass 4: under the hood

**Network.** Reload with the network log open and record every request the page makes: method, URL
pattern, query and body shape, response shape, status. Then trigger interactions and record the calls
those produce. This turns the API contract from guesswork into an observed contract. **Redact every
token, cookie, password and piece of personal data** before it goes in the spec.

**Storage.** Record the storage and cookie keys the page reads or writes, and what they appear to
control. **Analytics.** Note tracking calls and event names. **Assets.** Record image, icon and font
sources, and the icon set if identifiable. **Computed styles.** Read actual values from the DOM. Do not
eyeball colours from a screenshot.

### Pass 5: responsive and theme

Resize to roughly 375, 768 and 1440 pixels wide and screenshot each. Record what actually reflows:
columns collapsing, navigation becoming a menu, tables restacking, elements disappearing. Find the
breakpoints from the styles if you can read them. Capture both themes if the page has a theme switch.
Note the maximum content width and whether the layout is fluid or fixed.

