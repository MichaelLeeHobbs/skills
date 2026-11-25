# Static references

Run after the crawl, for the tokens the crawl never saw; the prefix probes run before it. The tool
searches; nothing here needs a model except deciding the corpus, the exact-only files and the CSS-module
mapping.

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

Set `fragments` to `no` on the approved [exact-only files](#exact-only-files), and on no other record.

Never send the corpus to a model to search. The tool reads it once.

## Exact-only files

A sentence or a test that mentions `ui-` reads the same as code that builds every `ui-*` class. Such a
file can be made exact-only: an exact name in it still counts, a piece of a name does not. Every file
starts out counting for both. Propose a file only when all of these hold:

1. A [prefix probe](#prefix-probes) found its fragment there.
2. It is prose (`.md`, `.txt`, a licence, instructions for agents), a test or a test's fixture, a
   component story, or lint, formatter, test-runner or agent configuration. Product source is none of
   these, whatever its path or name.
3. You opened it and searched for its uses. No app, site, email, generator or build step imports it, loads
   it by path (a file-system route, an import glob), reads its content or renders it, and no built source
   map lists it. A test runner running it, a code host showing it and a component explorer showing a
   story do not count.

When unsure, do not propose it. A file that wrongly counts leaves a dead rule unproven. A file wrongly
made exact-only can call a live rule dead. The user approves each path with the plan; a path not approved
keeps counting. In static-only mode, ask before running `refs`.

Save the approved paths to the catalog's `exact-only.txt`: the `src` record's `path`, one per line, in byte
order, none repeated, LF after each, UTF-8 without a byte order mark. Paths only, never globs. The file is
empty when there are none. On a re-run, start again with no exact-only file; a path that meets the
conditions again keeps its approval.

## Tokens to search

One `want` per token that appears in an unseen member: every token of every member whose tokens did not
all appear in the crawl. `classify` stops with `missing_ref` if one is missing.

## Prefix probes

Test that the corpus can return `none` at all, in step 2, before approval: the probes need only the
inventory and the corpus step 5 will use. In static-only mode, run them before `refs`. For every class
token in the inventory, canaries left out, take each prefix of 3 bytes or more that ends at a `-` or
`_`: `card--wide` gives `card-` and `card--`. In a `refs` run of their own, send one `want` per distinct
pair of prefix and `paths`, numbered from 0, with a nonce of ASCII letters and digits:

```
{"t":"want","token":"c:probe0","needle":"card--zz<nonce>"}
```

A CSS-module class uses its local name and adds its importers as `paths`; any other class has no `paths`.
For a module read with a computed key send no probe, and count its tokens in `k` below. On an exact
match, use another nonce.

- `none`: no file that counts for fragments holds that prefix or a shorter one as a fragment.
- `fragment` in a file that meets conditions 2 and 3 of [Exact-only files](#exact-only-files): propose the
  file, treat it as exact-only, and run the probes again. Repeat until none is left.
- `fragment` in any other file: the app may build names from that prefix, so a token that starts with it
  cannot be what makes a rule DEAD. The place is the first in path order; look at the others before
  saying code builds the name.

If the user does not approve every path, run the probes once more with the approved ones. Report that last
run: `m` is the summary's `wants` and `n` its `none`, `c` the inventory's class tokens, modules included
and canaries not, and `k` those that start with a prefix whose probe was `fragment`.

The line is FAIL when the probes did not run, or when `refs` treated a file as exact-only that is not in
the approved `exact-only.txt`; PARTIAL when `m` is above 0 and `n` is 0; otherwise PASS. With no prefix to
probe, no prefix fragment is possible: write `none to probe` and PASS. The probes do not test suffixes
(`__title`), ids or attribute names.

## CSS modules

A module class is renamed at build (`.primary` becomes `Button_primary_x1`), so the built name appears
in no source and in every built module map. For each token from a module stylesheet:

1. Find its local name from the source map or the build's class map.
2. Find the files that import that module, with the language's parser.
3. Send `{"t":"want","token":"c:Button_primary_x1","needle":"primary","paths":[<importers>]}`.

If an importer that is not exact-only reads the module with a computed key (`styles[variant]`), send a
`ref` with kind `fragment` for every token of that module instead of searching: any of them could be built.

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
