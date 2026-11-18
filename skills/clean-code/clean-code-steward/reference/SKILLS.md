# The clean-code skills

One row per skill. The Survey reads this table; every other fact about a skill (its metric, its
comparability fields, its report) comes from the skill's own run record in the ledger.

- **Scope unit.** `repo` means one unit with scope `.`. `package` means one unit per package: every
  folder holding a package manifest that the workspace config lists, or `.` when the repo is a single
  package. Use repo-relative paths with `/`.
- **Probe.** A file listing or a read-only search, never a build, an install, a network call or a run of
  repo code. A hit means "applies". A probe ranks; never show its hits as findings.
- **Setup.** What the skill's own prerequisites need beyond running commands and writing files. When the
  Survey finds one missing, put its name in the unit's `absent` list. The bold names match the
  `degraded` values a skill records, so a degraded run and a missing setup line up.
- **Evidence.** `source` skills age by commits touching the scope; `runtime` skills by days, because
  their evidence (logs, CI runs, rendered pages) changes without a commit. `none` skills record no
  metric and stay out of coverage.
- **Due.** The default threshold. A `source` unit is due after this many commits touching its scope,
  and never sooner than 7 days after its last valid run. A `runtime` unit is due after this many days.
  The user may change a threshold in chat; say so in the scorecard stamp.

| Skill | Domain | Scope unit | Probe (applies when) | Setup | Evidence | Due |
|---|---|---|---|---|---|---|
| find-reinvention | duplicate helpers | package | source files in a language with a parser you can drive (compiler API, tree-sitter grammar, AST module) | **parser** | source | 25 commits |
| find-component-reinvention | duplicate UI components | package | component files (`.tsx`, `.jsx`, `.vue`, `.svelte` or the framework's template files) | **parser**; **browser** and an installed build toolchain for the visual half | source | 25 commits |
| vocabulary-drift | naming and domain terms | repo | source plus at least one other naming surface (schema, routes, UI strings, docs) | **parser** or one pattern per declaration form | source | 25 commits |
| find-dependency-overlap | overlapping libraries | repo | a dependency manifest with a lockfile, at the root or in any workspace | dependencies installed and matching the lockfile (read-only check); **parser**; **build** for bundle sizes | source | 25 commits |
| css-override-census | CSS overrides | package | stylesheets, style blocks or CSS-in-JS in the package | **parser** for each style language; dependencies installed | source | 25 commits |
| find-contract-drift | client and server data shapes | repo | data shapes on more than one side: a client and a server package, DTO or model folders, or schema files (OpenAPI, `.proto`, JSON Schema) | **parser** for every in-scope language | source | 25 commits |
| debt-ledger | TODOs and suppressions | repo | any `TODO`, `FIXME`, `HACK`, `XXX`, inline lint or type suppression, or a lint baseline file | a runtime with JSON and SHA-256 (version control optional) | source | 25 commits |
| triage-todos | stale TODOs | repo | any `TODO`, `FIXME`, `HACK` or `XXX` comment, or a "temporary" or "remove once" comment | version control and read-only issue tracker access (each optional; without them the run is partial) | runtime | 30 days |
| find-dead-code | entry points production never reaches | repo | a router, message consumer registry, scheduler config, feature-flag calls or a client router | **runtime-evidence**: read-only access to a log, trace, analytics or metrics source that returns grouped counts | runtime | 30 days |
| find-dead-css | unused CSS rules | package | stylesheets in a web app package with a dev or start script | **browser**; a safe running host, a build command and roles the user supplies | runtime | 30 days |
| asset-garden | static assets | repo | image, font or SVG files outside dependency and build output folders | version control listing plus a filesystem walk; a raster decoder for the raster pass | source | 25 commits |
| theme-parity | theme contrast | package | a web app with more than one theme (a dark-mode media query, a `data-theme` or theme class, a theme object) | **browser**; a local or test instance the user names | runtime | 30 days |
| type-rhythm | type scale and spacing | package | a web app with a type or spacing scale (tokens, a theme object, scale variables) | **browser** and a running instance | runtime | 30 days |
| find-token-drift | design token drift | package | colour, spacing, radius, font-size, shadow or z-index values in styles or a theme file | a runtime with arbitrary-precision integers; **parser** for each style syntax (a hand-written fallback exists) | source | 25 commits |
| pattern-census | convention coverage | package | a type-checker config (`tsconfig.json` or the language's equivalent) and a stated convention (agent context file, contributing guide, project skill or lint config) | **parser** with name resolution (a compiler or type-checker API) | source | 25 commits |
| test-garden | slow, flaky and weak tests | repo | test files and a CI config file | the suite runs locally with per-test durations; **ci-history**: read access to the CI provider's runs for the flaky lane | runtime | 30 days |
| optimize-comments | comments | package | source files with comments | none | none | never |
| optimize-docs | prose docs | repo | prose docs beyond agent instruction files (README, `docs/`, guides) | none | none | never |

**Cross-readers.** find-component-reinvention, find-dead-code and vocabulary-drift read
find-reinvention's catalog when it exists. That is why Recommend breaks ties in its favour.
