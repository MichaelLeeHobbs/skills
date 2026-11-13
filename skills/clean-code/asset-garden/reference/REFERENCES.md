# References: what to extract and how to feed `refs`

## The extraction script

Write one script that reads every tracked text file in the snapshot once and writes `ref`, `pattern` and
`count` records. A model never reads every file: at 8,000 source files that costs millions of tokens and
skips files silently. Use the language's parser where one is installed; a careful pattern per file kind
is acceptable when it is cross-checked by `refcov`.

Keep a value only when, after cutting `?` and `#`, it ends in an asset extension, or it is a name the
project's icon registry maps to a file. Record `from` as the repo-relative path with `/` separators and
the case the version-control listing reports, on every platform.

## Sources to extract

Every project:
- Imports and requires of asset files, including suffixes such as `?url`, `?raw`, `?inline`, `?react`.
- CSS `url()`, `@import`, `@font-face src` (every format listed), `image-set()`.
- HTML and template attributes: `src`, `href`, `poster`, `data-src`, and **every candidate** of `srcset`
  and `imagesrcset`, not only the first.
- Markdown images and links; MDX imports.
- SVG files: `href`, `xlink:href`, `url(#...)` to other files, `<image>` and `<use>` of external files.
  These are refs whose `from` is an asset; `refs` follows them only from reachable assets.
- Web app manifests, `browserconfig.xml`, service-worker precache lists, sitemap and robots files.
- Build and framework config: copy plugins, asset globs, sprite plugins reading a folder. A config that
  reads a whole folder becomes a `pattern`.
- Server code reading files from disk (PDF renderers, email templates, image processing): a literal
  path is a `ref`, a computed one a `pattern`.
- Tests and stories count as references for the extraction, but are excluded from icon use sites.

Per stack:

| Stack | Served roots | Also read |
|---|---|---|
| Vite | `public/` at `/` | `import.meta.glob` (a pattern; eager or not), `new URL(x, import.meta.url)` |
| webpack | config `output.publicPath`, copy plugin targets | `require.context(dir, deep, regexp)` (a pattern) |
| Next.js | `public/` at `/` | `next/image` `src`, metadata objects; `app/` route files are conventions in the tool |
| Angular | `angular.json` `assets` entries (input folder at its output path) | `[src]` and `[ngSrc]` bindings with literal values |
| SvelteKit | `static/` at `/` | `$app/paths` base prefixes |
| Plain HTML/CSS | the folder the server serves | nothing else |

Declare every served root as a `root` record and every import alias (from the bundler config and the
compiler's path mapping) as an `alias` record. Monorepos: one set per app, with each app's paths
prefixed by its folder.

## String-built references

For each site where a path or icon name is computed (`` `flags/${code}.svg` ``, `<Icon name={x}>`,
`icons[name]`), read the site and decide:
- If the possible values form a finite list in the code (an object's keys, an enum, an array literal,
  a registry file), write one `ref` per value. A value that resolves to nothing is a real dangling
  reference.
- Otherwise write a `pattern` whose glob has a literal folder before the first `*`
  (`./flags/*.svg`). `refs` rejects a glob that starts with a wildcard: it would protect everything.
- An icon name that comes from API or CMS data with no list in the code: write the pattern for the
  folder and count the site as `uncounted` for the icon pass.

Report the `pattern_share` from the `refs` summary. Above 0.5000 the unused findings say little; name the
patterns that cause it.

## Coverage: `verify --check refcov`

Per file, `extracted` is the count of reference strings the script wrote; `pattern` is a second, broader
count of lines in that file mentioning any asset extension or a registry name. Use a different method
from the extractor (a plain substring search, not the extractor's own pattern), so a shared mistake does
not hide. Give each file its `kind` (extension or template language) so a stack the script handles badly
fails on its own instead of hiding in the total.

## Stem audit: `verify --check audit`

For each candidate (`weak` or `unreferenced`, outside vendored units), take the stem: the file name
without extension, lowered. Search every tracked text file for it as a whole token. Then:
- Stem shorter than 4 characters: result `skipped`.
- No hits: `none`.
- Hits: read up to the first 3. If any is a reference the extraction missed (a new reference class), the
  result is `gap`; otherwise `noise`. Record `hits` and `read`.

At more than 300 candidates, audit the 300 with the largest files, and say so in the report.

## Request recordings and logs

Only when the user put the pass in scope:
- Run the project's own end-to-end suite or its local preview server against `localhost` only, with no
  real credentials and no writes to any non-local backend. Record request paths only: no query strings,
  headers or cookies. Bundlers rename and inline files, so map each request through the build's asset
  manifest to a source path where one exists, and count the requests that map to nothing.
- Reduce user-supplied access logs and CMS exports on the machine to request paths, then to `hit`
  records. Never put raw log lines in the work folder, a prompt or the catalog.

A hit can only move an asset toward used. An asset that is `hit` but has no static reference is a gap in
the extraction: name it in the report.
