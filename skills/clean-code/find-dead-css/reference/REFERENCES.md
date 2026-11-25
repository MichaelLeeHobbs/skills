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

Set `fragments` to `no` on a file that never runs in the shipped app: prose (`.md`, `.txt`, unless the
app renders it), tests and their fixtures, component stories, lint and agent configuration. An exact name
there still counts as a reference. A piece of one does not, because such a file cannot build a class name
in the app, and prose or a test that mentions a class prefix would otherwise look like code building
every class with that prefix. Leave it at `yes` for product source, built JavaScript, templates, outside
sources, the canary corpus file and any file you are unsure about: a wrong `no` can call a live rule
dead. Show the patterns set to `no` at approval.

Never send the corpus to a model to search. The tool reads it once.

## Tokens to search

One `want` per token that appears in an unseen member: every token of every member whose tokens did not
all appear in the crawl. `classify` stops with `missing_ref` if one is missing.

## Prefix probes

Before classifying, test that the corpus can return `none` at all. Take the distinct first segments of the
inventory's class tokens, leaving out CSS-module classes: the name up to and including its first `-` or
`_`, when that is at least 3 bytes. In a separate `refs` run over the same corpus, send one made-up name per segment:
`c:<segment>zz<nonce>`, the nonce ASCII letters and digits only. On an exact match, use another nonce.

- `none`: a dead class with that segment can be found.
- `fragment` in product source, built JavaScript, a template or an outside source: the app may build
  names from that segment. A class token that starts with it can never be DEAD. Report the segment, how
  many class tokens start with it, and the fragment's place.
- `fragment` in any other file: that file should be `no`. The run fails. Correct the corpus and run
  `refs` again.

## CSS modules

A module class is renamed at build (`.primary` becomes `Button_primary_x1`), so the built name appears
in no source and in every built module map. For each token from a module stylesheet:

1. Find its local name from the source map or the build's class map.
2. Find the files that import that module, with the language's parser.
3. Send `{"t":"want","token":"c:Button_primary_x1","needle":"primary","paths":[<importers>]}`.

If an importer reads the module with a computed key (`styles[variant]`), send a `ref` with kind
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
