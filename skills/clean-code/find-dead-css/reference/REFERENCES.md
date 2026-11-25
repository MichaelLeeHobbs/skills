# Static references

Run after the crawl, for the tokens the crawl never saw. The tool searches; nothing here needs a model
except deciding the corpus and the CSS-module mapping.

## The corpus

Stream each file as one `src` record (`path`, `text`) to `refs`:

- every tracked file at the recorded commit, except stylesheet sources (`.css`, `.scss`, `.sass`,
  `.less`, `.styl`), lock files, binaries and paths the user excludes. Show the exclusion list at
  approval, and exclude committed secrets and seed data holding real records;
- from stylesheet sources, only the lines that use a class from another rule (`@extend`, `composes`,
  `@apply`), each as its own record, so a rule kept alive by another rule counts as referenced;
- the built JavaScript output of step 1's build. It holds the library code the app actually ships, so a
  class a date picker or menu library sets in a state the crawl missed is still found;
- the canary corpus file (Check, canary 3).

Give each record its `fragments` value as [Exact-only files](#exact-only-files) says.

Never send the corpus to a model to search. The tool reads it once.

## Exact-only files

Prose or a test that mentions a class prefix reads the same as code that builds every class with that
prefix. Set `fragments` to `no` on these files and no others, so an exact name in them counts and a piece
of a name does not:

- prose: `.md` and `.txt` files, licences, and instructions for agents;
- test files, their fixtures and component stories;
- lint, formatter and agent configuration.

Every other file is `yes`: product source, built JavaScript, templates, every other app and package in
the repo, server and build-time code, code generators, all other configuration (a utility-class safelist
names classes), `.mdx`, data files and the canary corpus file. Apply the same rule to outside sources.

A file on the list is still `yes` when a built source map lists it, a `yes` file imports or reads it, any
app, site or email renders it, or you are unsure. A wrong `yes` leaves a dead rule unproven. A wrong
`no` can call a live rule dead.

Write the globs for the `no` files to the catalog's `exact-only.txt`, one per line in byte order, LF after
each, with `!` before a path that stays `yes`: a file is `no` when it matches a glob line and no `!` line.
Show the globs and how many files they match at approval. In static-only mode, which has no plan to
approve, show them before running `refs`.

## Tokens to search

One `want` per token that appears in an unseen member: every token of every member whose tokens did not
all appear in the crawl. `classify` stops with `missing_ref` if one is missing.

## Prefix probes

Before classifying, test that the corpus can return `none` at all. For every class token in the
inventory, canaries left out, take each prefix of 3 bytes or more that ends at a `-` or `_`:
`card--wide` gives `card-` and `card--`. In a separate `refs` run over the same corpus, send one `want` per
distinct prefix, numbered from 0, with a nonce of ASCII letters and digits:

```
{"t":"want","token":"c:probe0","needle":"card--zz<nonce>"}
```

For a CSS-module class use its local name and add its importers as `paths`. On an exact match, use
another nonce.

- `none`: no `yes` file holds that prefix or a shorter one as a fragment.
- `fragment` in a file that [Exact-only files](#exact-only-files) lists: it was given the wrong value. Set
  that file to `no`, and run `refs` and the probes again.
- `fragment` in any other file, or in one you are unsure about: the app may build names from that
  prefix, so a token that starts with it cannot be what makes a rule DEAD. Report the prefix, its tokens
  and the place. The place is the first in path order; look for code among the others before saying code
  builds the name. Never set a file to `no` because a probe found a fragment in it.

The line is FAIL when a fragment in a listed file is left after the correction, or the probes did not run;
PARTIAL when there was at least one probe and none returned `none`; otherwise PASS. With no prefix to
probe, no prefix fragment is possible: write `none to probe` and PASS. The probes do not test suffixes
(`__title`), ids or attribute names.

## CSS modules

A module class is renamed at build (`.primary` becomes `Button_primary_x1`), so the built name appears
in no source and in every built module map. For each token from a module stylesheet:

1. Find its local name from the source map or the build's class map.
2. Find the files that import that module, with the language's parser.
3. Send `{"t":"want","token":"c:Button_primary_x1","needle":"primary","paths":[<importers>]}`.

If an importer that is not exact-only reads the module with a computed key (`styles[variant]`), send a `ref` with kind
`fragment` for every token of that module instead of searching: any of them could be built.

## How matches count

`refs` reports `exact` (the name as a whole token), `fragment` (a string piece such as `btn-` or
`__title` beside an interpolation or concatenation in a file that may build names, which could build
the name) or `none`. A member is KEEP when every unseen token has an exact match, UNPROVEN `fragment`
when a fragment is the best match, and a DEAD candidate when one unseen token has no match at all.
Element names are never evidence: a member with only element names is UNDECIDABLE.

## Outside use

Ask the prerequisite question about use outside the repo before any cost. Then:

- **Evidence given**: the user supplies checkouts of the consumers, exports of the CMS or markdown
  content, email templates or server templates. Add them to the corpus as more `src` records. List the
  sources in the report header.
- **No evidence, or unknown**: send a `foreign` record for every sheet that outside content could use.
  Those sheets' candidates come out UNPROVEN `foreign`, never DEAD.
- **A published package** (it has a public package manifest, or the user says so): the deliverable is
  a deprecation-candidate list, titled "unused in the known consumers", naming the consumers searched.
  Its docs site cannot prove a class dead, because its examples render every class.

Custom properties, `@keyframes`, `@font-face` and other at-rules are out of scope and counted as such.
