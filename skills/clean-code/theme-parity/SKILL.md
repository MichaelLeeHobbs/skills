---
name: theme-parity
disable-model-invocation: true
description: >-
  Use for "check dark mode contrast", "audit our themes", "which colours are hard-coded to light mode",
  "is dark mode accessible", "find contrast failures in every theme", "theme parity audit", "re-run the
  theme audit". Renders every screen of a web app in each theme (light and dark at least), measures text
  contrast on the real rendered colour pairs against WCAG, finds colours fixed to one theme, and reports
  the few token edits that fix most failures, each proven by re-rendering with the edit applied. Needs a
  browser you can drive; without one it runs a static check of token pairs from source and marks every
  finding unproven. Expensive and user-invoked. NOT for a full accessibility audit (keyboard, screen
  reader, non-text contrast), visual design review, or applying the fixes.
---

# Theme parity

Find the token edits that make every theme readable, and prove each one by rendering. Never estimate a
ratio: the tool computes every number. Never call a fix PROVEN without the re-render that shows it.

**What it writes.** In the target repo, only its catalog folder ([reference/CATALOG.md](reference/CATALOG.md)).
It edits no code and no tokens, and commits nothing. Everything temporary goes in a work folder outside
the repo.

## Prerequisites

Stop before any cost and say which is missing:
- You can run commands and write files.
- You can drive a browser: load a URL, run script in the page, set the viewport, take a screenshot. If
  not, run the [static check](reference/STATIC.md) instead and say so in the first line of the report.
- The user names the instance to audit: a local or test instance, never production. The user supplies
  any login state and real record IDs. You never enter credentials or create accounts.

**Where data goes.** Never write text content into a row; use a hash of it. Keep screenshots in the work
folder and never send them to a model.

## Roles

You coordinate. You hold the plan and the tool's summaries, never the node rows: the tool reads them.
Render and collect without a model. Attribution and choosing a fix need the most capable model
available to you; with one model, use it for everything. Start each step from tool output in a fresh
context. If you can render several pages at once, do it in batches no larger than your agent's limit on
concurrent work; if you cannot start fresh contexts, say in the report header that steps were not
independent.

## 0. Build and prove the tool

Pick a runtime. Implement [reference/ALGORITHM.md](reference/ALGORITHM.md) to satisfy
[reference/CONTRACT.md](reference/CONTRACT.md) in the work folder. Run every fixture in
`reference/fixtures/`. **If any fixture fails, stop and report which.** Never edit a fixture to make it
pass, and never continue with a partly passing tool.

## 1. Inventory

- **Screens**, from the first source that exists: a list the user gives, the router configuration, a
  sitemap. Never crawl links and never guess route parameters. One instance per route pattern, plus any
  state the user names (an open dialog, an error banner) as its own screen. If the catalog holds
  `screens.jsonl`, start from it and add new routes.
- **Themes** and the switch for each: a media emulation, a class or attribute on the root element, a
  stored setting. Read it from source and write it down as a recipe.
- **Tokens**: each theme's colour tokens and their alias chains, from source (CSS custom properties, a
  token file, a theme object), with the selector or scope that sets each value.

## 1b. Canaries and budget

Plan the canaries in [reference/CANARIES.md](reference/CANARIES.md). Render 5 screens to measure
seconds per render, then estimate: screens times themes for the sweep, plus about 40% for proof, plus
model tokens at the provider's published price. Show the route count, render count, projected time and
spend; get one approval and a time cap. Finish every theme of a screen before starting the next screen.

## 2. Render and collect

For each screen and theme: load it, apply the theme recipe, wait for the page to settle, inject the
canaries on the first screen, and run the collector [reference/COLLECT.md](reference/COLLECT.md) describes.
A redirect to a login page, an error page or a missing route is `blocked` with that reason, never
collected. Write one `render` record per screen and theme, then run `verify --check coverage`.

## 3. Measure

Run `measure` over every node row, then `parity` over the pairs, then `cluster`. Run
`verify --check canaries` on the canary pairs and the parity output.

## 4. Attribute, choose and prove

For the top 10 clusters and every fixed colour that fails in some theme, follow
[reference/PROVE.md](reference/PROVE.md): attribute each side to a token with a confidence label, pick a
fix from the `candidates` table, inject it, re-collect the screens that use the token, and mark the fix
PROVEN, PARTIAL, REFUTED or BLOCKED. Only the user's allowlist exempts a colour; you never decide one
is intentional.

## 5. Ground truth, report and catalog

Run the pixel ground-truth check (COLLECT.md) through `verify --check truth`. Write the report as
[reference/REPORT.md](reference/REPORT.md) lays out and the catalog files as CATALOG.md lists them. Hand
back the report path, header and decision list.

## Check

**The run fails**, and the report says so above the header, when any of these happens:
- a fixture fails, or any `verify` check returns FAIL at its step;
- the theme switch did not take effect on a screen (`switch` problem), so that theme measured nothing;
- a canary is missing or lands in the wrong bucket, or the token canary's fix is not PROVEN;
- ground truth is off on more than 1 sample in 10, or could not run (no screenshots, under 10 samples);
- `measure` returns FAIL: undecided rows above 5%, or unparsed colours above 1%;
- a fix line says PROVEN without its re-render output, or a number in the report did not come from the
  tool.

A run that could not perform one of these checks has failed it. A PARTIAL coverage run may report
failures but never says the app passes.

## If you cannot run work in parallel

Render one page at a time in the same order. The work folder is the progress record: a screen and theme
is done when its rows are written, so a stopped run resumes from what `verify --check coverage` reports
missing.
