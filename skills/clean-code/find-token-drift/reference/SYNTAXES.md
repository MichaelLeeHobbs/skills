# Syntaxes: what each one yields

For each syntax the target uses, the extractor emits `token` and `occ` records as
[CONTRACT.md](CONTRACT.md) defines them. Spans are UTF-8 byte offsets into the file; `raw` is the exact
source text at the span; `value` is what the tool parses. Detect a syntax by its files or imports, never
by assuming the stack.

## The rules every extractor follows

- **Style contexts only.** Count a value when it sets a style: a CSS declaration, a `style` attribute or
  binding, `sx`, a styled or emotion template or object, `StyleSheet.create`, a theme object, a Tailwind
  class. A `margin` key in a chart config object is not style.
- **One occurrence per value.** `padding: 8px 16px` is two occurrences with `prop` `padding`. A mixed
  shorthand uses the longhand per part: `border: 1px solid #ccc` gives `1px` as `border-width` (`other`)
  and `#ccc` as `border-color`.
- **Every literal in a style context is an occurrence**, including widths and border widths with category
  `other`, so the coverage check accounts for them.
- **Theme-scale uses are refs**, with `value` set to the token's name: `var(--x)`, `$x`, `@x`,
  `theme.spacing(2)`, `theme.palette.text.secondary`, Tailwind scale classes like `p-4` or `bg-gray-500`.
- **JS unitless numbers** take the property's unit: px for lengths, none for `z-index`. `value` is
  `"16px"`; `raw` stays `16`.
- **A value the tool cannot parse** (`darken($c, 10%)`, `color-mix()`, `calc()`, an interpolation) is still
  an occurrence with its text as `value`. It shows in the report as unparsed rather than vanishing.
- **Dynamic text** (`bg-${tone}-500`, a colour built by concatenation) cannot be resolved: emit nothing and
  let `sweep` count any literal parts; give the report one line per pattern.

## Per syntax

**CSS, CSS modules, SCSS, LESS, Vue `<style>` and `<style module>`, Svelte `<style>`.** Parse with a CSS
parser (PostCSS with the SCSS or LESS syntax). Declarations give occurrences. Custom properties
(`--x: value`) under `:root`, `html` or a theme selector give tokens; a `[data-theme=dark]` or
`prefers-color-scheme: dark` block gives the same names in mode `dark`. SCSS `$x` and LESS `@x`
definitions give tokens; `@use` namespaces (`tokens.$grey-500`) resolve to the variable name; maps
(`$greys: (500: #777)`) give one token per entry named `$greys.500`. `v-bind()` in CSS is a ref to the
bound name.

**Inline styles.** JSX `style={{ padding: 16 }}` and Vue `:style="{ padding: '16px' }"`: parse the
expression with the language's parser; camelCase keys convert to kebab case for `prop`.

**styled-components and emotion.** Template literals: parse the static parts as CSS; an interpolation
`${({theme}) => theme.colors.text}` is a ref to `colors.text`; any other interpolation is unparsed. Object
styles follow the inline-style rule.

**MUI.** `createTheme` gives tokens: `palette.*` colours, `spacing` (the base unit), `shape.borderRadius`,
`typography.*.fontSize`, `zIndex.*`, `shadows[n]`. In `sx`, `p: 2` and `m`, `px`, `mt` and friends are refs
to the spacing scale; `borderRadius: 2` is a ref to `shape.borderRadius` (a multiple of it, not 2px); a
string like `'text.secondary'` is a ref to that palette path. A literal string with units (`'13px'`) is a
literal.

**Tailwind.** Tokens come from the resolved theme. Reading the resolved config runs the project's config
file: ask once before doing that, and otherwise read the config statically, following `presets` and
`extend`. With `theme.colors` replaced, the default palette is not a token source; with `extend`, it is, and
the report header says how many default values were included. Tailwind v4 `@theme` blocks in CSS give
tokens directly (often `oklch()`). Classes: scale classes are refs; arbitrary values (`p-[13px]`,
`bg-[#777]`) are literals with `raw` the whole class and `value` the bracket content. Class strings inside
`clsx`, `cva` and `className` templates count when they are static.

**Design-token JSON (W3C format, Style Dictionary).** Each leaf with a value is a token named by its
path; `{group.name}` values are refs. `$type` or the group name gives the category.

**SCSS variables mirrored as CSS variables.** Both are token sources; extract both. The report flags any
pair with the same base name and different values.

## The canary file

Write it in the target's main token syntax plus one occurrence per detected syntax, in a plausible path
inside the work folder copy. Canary token names start with `canary-` so they cannot collide with real ones.
