# Inventory: what becomes a record

Read every source at the recorded commit. Use a real CSS parser for each language the repo has (PostCSS
with its SCSS and Less syntaxes, the Sass or Less compiler's own parser, or a CSS tokenizer for your
runtime). Use the language's own parser to reach CSS inside component files. Never find rules with a
regular expression.

## Scope

| Source | What to read |
|---|---|
| Stylesheets: `.css`, `.scss`, `.sass`, `.less`, `.styl`, `.pcss` | every rule |
| Style blocks in `.vue`, `.svelte`, `.astro`, `.html` | every rule in each `<style>` block |
| CSS-in-JS template literals (`styled.x`, `styled(X)`, `css`, `createGlobalStyle`; not `keyframes`) | every rule in the literal |
| Object styles (`sx`, `style`, `makeStyles`, `createStyles`, `styled` with an object, `withStyles`) | selector keys, `zIndex`, and string values ending in `!important` |

Out of scope, and counted by reason in the report: vendored and build output, `node_modules` and its
equivalents, generated files, test fixtures and stories, and minified files.

## Flattening

Records describe the source, with nesting resolved and nothing else expanded.

- Resolve nesting (`&`, nested rules, `@nest`) into full selectors. Each nested rule gets the line of
  its own selector.
- Element-level styles (an inline `style`, an `sx` object, a styled component's root, a template
  literal's top level) use `*` as the selector. A nested key `'& .x'` under them becomes `* .x`.
- Do not expand mixins, `@extend`, `@include`, loops or functions. Count each `@extend` and
  `@include` per file and report the totals, because the census cannot see what they generate.
- Skip rules inside `@keyframes`, `@font-face`, `@page` and `@property`, and rules whose selector is
  only a Sass placeholder (`%name`). Count each skip by reason.
- Strip comments from selectors. Collapse a selector that spans lines into one line of text.
- A selector built from interpolation (`#{$x}`, `${prop}`) that you cannot resolve statically: record
  it as written. The tool marks it bad, and the report counts bad rules.

## Records

Write one record per line, in the shapes CONTRACT.md lists for `census`:

- `file`: every in-scope file, with `path` (repo-relative, forward slashes), `bytes`, `canary`, and
  `parsed` (false when its parser failed; record no rules for it then).
- `rule`: every style rule after flattening. `id` is `path:line`, plus `:n` from the second rule on the
  same line (`a.tsx:40:2`). `selector` is the flattened selector list.
- `decl`: every declaration that is `!important` or sets `z-index`. `id` is the rule id plus `:` plus
  the property (`a.css:12:color`, a second same-named property gets `:2`). Convert a JS property name
  to its CSS form (`zIndex` is `z-index`). `value` is the source text without `!important`, so a JS
  expression such as `theme.zIndex.modal + 1` is kept as written.

Keep the inventory and the census output in the work folder, never in the repo.

## Coverage count

The coverage check compares the files your parser stage recorded with an independent walk of the
repo. The walk writes one `count` record per tracked file that is in scope by the table above: every
file with a stylesheet extension, every component file containing `<style`, and every script file
containing a CSS-in-JS marker (`styled`, `css\``, `sx=`, `sx:`, `makeStyles`, `createStyles`,
`withStyles`, `style={{`). Use plain text search for the walk, not the parser, so the two stages fail
differently. Run `verify --check coverage`; it must pass.

A file the walk counts but holds no CSS (a marker in a comment) is still a `file` record, with no
rules. A parse failure is `parsed` false, never a missing record.
