# Inventory and import extraction

How to produce the records the tool reads in steps 1 and 2. Everything here runs read-only against the
installed tree. Save every record file in the work folder.

## Workspaces

List workspaces from the package manager's workspace globs (the `workspaces` field, the workspace file,
the Python workspace table), minus anything under `node_modules` or a virtual environment. Never count
every manifest on disk: example and fixture folders hold manifests that are not workspaces. Write one
`workspace` record per workspace, `.` for the root, with the package name it publishes or `""`.

Write one `runtime` record per workspace: where its production code runs, as `<kind>:<name>`
(`browser:web`, `node:api`, `python:worker`, `cli:tools`). Two workspaces bundled into one app share a
runtime. Ask the user once if a workspace's runtime is not clear from its build scripts.

## Direct dependencies and the graph

Take direct dependencies from the package manager's own listing, depth 0, per workspace, never from
reading manifests by hand. Then check the installed tree matches the lockfile. If it does not, stop.

| Ecosystem | Direct dependencies | Lockfile check | Graph for `pins` |
|---|---|---|---|
| pnpm | `pnpm list -r --depth 0 --json` | `node_modules/.pnpm/lock.yaml` has the same resolved packages as `pnpm-lock.yaml` | `pnpm list -r --depth Infinity --json` per app, or `pnpm why <name>` per candidate |
| npm | `npm ls --workspaces --depth 0 --json` | `npm ls --all` exits 0 (no missing or invalid) | `npm ls --all --json`, or `npm explain <name>` |
| yarn | `yarn workspaces list --json`, then each workspace's resolved entries from `yarn info --json` | none known to be read-only: ask the user to confirm a fresh frozen install | `yarn why <name>` |
| uv | `pyproject.toml` dependency tables per member; versions from `uv.lock` | `uv lock --check`, then the environment's installed versions equal the lock's | `uv tree --invert --package <name>` |
| pip | requirements files; versions from `pip list --format json` | `pip check` | `pipdeptree -r -p <name> --json` if installed, otherwise the `Requires` fields of installed metadata |
| Go | `go list -m -json all` with `Indirect` false | `go mod verify` | `go mod graph` |
| Cargo | `cargo metadata --format-version 1 --no-deps` | `cargo metadata --locked` succeeds | `cargo metadata --format-version 1` |

Run only checks that write nothing. If the ecosystem has none, ask the user to confirm the install is
fresh and say in the header that the lockfile check was the user's word.

Write one `pkg` record per direct dependency per workspace. `kind` is `prod`, `dev`, `peer` or
`optional`; Python dependency groups for development and Go or Cargo dev-dependencies are `dev`. For an
alias (`"x": "npm:y@1"`), `name` is `x` and `real` is `y`. Python names are normalised: lower case, runs
of `-`, `_` and `.` become one `-`. Use the same normalisation in `module` records.

For `pins`, write one `dep` record per edge of the resolved graph for each app (`kind` from the listing:
`prod`, `dev`, `peer`, `optional`, `peer_optional`), one `local` record per workspace instance, and one
`app` record per shipped app with its root instance.

## Setup records for `sites`

- `alias`: every path alias from the compiler and bundler config (`paths`, `baseUrl` folders, `resolve.alias`,
  `#imports` in a manifest). A target that is a folder in the repo is `""`. A target that swaps one package
  for another is that package's name.
- `builtin`: the platform's own modules. For Node, the list the runtime itself reports (its builtin module
  list); for Python, the interpreter's standard library module names. Never type the list from memory.
- `module` (languages other than JavaScript): module prefix to package. Python: from each installed
  distribution's record of files (the top-level packages and modules it installs), using the longest
  dotted path the distribution owns, so namespace packages (`google.cloud.storage`, `azure.storage.blob`)
  map correctly. If two distributions provide the same prefix, list both to the user and keep the one the
  lockfile marks direct; never guess. Exclude the project's own editable install. Go and Java: the module
  or group path of each dependency.

## Import forms

The extractor emits one `import` record per statement, with `refs` set to how many times the bindings it
introduces are referenced in that file (count identifier references the parser resolves to that binding;
a member access through a variable holding the binding still counts; a value passed away counts once).
`refs` is a lower bound and the report says so.

| Form | JavaScript and TypeScript | Python |
|---|---|---|
| `static` | `import x from`, `import { a }`, `import * as` | `import x`, `from x import y`, including inside `try`/`except ImportError` |
| `type_only` | `import type`, `import { type a }` when every binding is a type | imports inside `if TYPE_CHECKING:` |
| `side_effect` | `import "x"` | `import x` whose name is never referenced (record `refs` 0) |
| `reexport` | `export ... from "x"`, `export * from "x"` | `from x import *` in an `__init__.py`, or names imported and listed in `__all__` |
| `dynamic` | `import("x")` with a literal | `importlib.import_module("x")` with a literal |
| `require` | `require("x")` with a literal | not used |
| `config_ref` | a package named as a string in a config file the build or test runner loads (a plugin, preset, transform, environment) | a package named in server, worker or database configuration (`-k gevent`, `postgresql+psycopg://`), or an entry point |

A dynamic import or require whose argument is not a literal gets no record; list each one in the report's
side findings with its file.

Also emit one `edge` record per import or re-export between two repo files (`form` `import` or
`reexport`), after resolving the relative path or alias to the file it names.

**Areas.** `test`: files matching the test runner's own include globs, plus `__tests__/`, `*.test.*`,
`*.spec.*`, `test_*.py`, `*_test.py`, `conftest.py`, stories. `tooling`: build, lint and test config files
and `scripts/`. Everything else is `shipped`.

**Files in scope.** Every file version control tracks whose extension can hold imports: write a `tracked`
record for each. Files whose imports the parser cannot reach (`.vue`, `.svelte`, `.mdx` without their
compiler; generated, vendored and build output) get an `exclude` record with the reason. For `.vue` and
`.svelte`, parse the script block when you can instead of excluding the file.

## Count patterns for the coverage check

Per file, `parser` is the number of import statements the parser found, and `pattern` the number of lines
the language's pattern matches. The pattern cross-checks that the parser saw the file; it is not a second
extractor.

- JavaScript and TypeScript: a line counts when it matches any of `^\s*import\b`,
  `^\s*export\s.*\bfrom\s*['"]`, `\brequire\(\s*['"]`, `\bimport\(\s*['"]`.
- Python: `^\s*(from\s+[\w.]+\s+import\b|import\s+[\w.])`.

A multi-line import counts once in both. The pattern also matches imports inside comments and strings,
so a file one or two short for that reason needs no adjustment while its workspace passes. For another
language, write one pattern per import form before step 2 and list it in the report. If you cannot write
one, coverage cannot be checked and the run fails.
