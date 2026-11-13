# Baselines: which files, and how to check each adapter

Search the tracked files at the pinned commit for every file name below. Each match is one source; its
`source` name is its path from the repo root.

## Supported

| File name | Tool and `linter` | `--format` | Unit | Independent count for coverage |
|---|---|---|---|---|
| `eslint-suppressions.json` | ESLint bulk suppressions, `eslint` | `eslint` | violations | `loose` = lines holding `"count"`; `found` = the `adapt` summary's `entries` |
| `baseline.json` under a `.basedpyright` folder | basedpyright, `pyright` | `basedpyright` | violations | `loose` = lines holding `"code"`; `found` = `units` |
| `.rubocop_todo.yml` | RuboCop, `rubocop` | `rubocop` | pairs | `loose` = lines matching `^\s+-\s`; `found` = `units` plus the items of lists under keys other than `Exclude`, counted by search |
| `phpstan-baseline.neon` | PHPStan, `phpstan` | `phpstan` | violations | `loose` = the sum of the numbers after `count:` plus the entries with no `count:` line; `found` = `units` |

Pass the counts as one `count` record per baseline file, with the file's path, to the same
`verify --check coverage` call as the items or to a separate one; either way it must pass. These counts
are deliberately cruder than the adapter, so a disagreement points at a parsing bug.

RuboCop writes `Enabled: false` instead of an exclude list once a cop has too many offending files.
`adapt` reports those cops as `ruleoff` records. Save them in the ledger and list them in the report: a
cop that moves from an exclude list to a rule-off makes the baseline shrink while the debt grows. On a
re-run, a cop that is a rule-off now and was not last run counts as `config-changed` for its dropped
entries: add a `config` record holding the cop's name.

## Detected but not supported

A file with one of these names fails the run, because no fixture proves an adapter for it. Name it and
say that support needs a sample file, an `adapt` format in ALGORITHM.md and fixtures first.

| File name | Tool |
|---|---|
| `psalm-baseline.xml` | Psalm |
| `lint-baseline.xml` | Android lint |
| `baseline.xml` or `detekt-baseline.xml` holding `<SmellBaseline>` | detekt |
| `.betterer.results` | betterer |

## Config files for `config-changed`

Pass to `baseline` the added and removed lines (not the context) since the last run's commit of every
configuration file of the linters that own a source: for example `eslint.config.*`, `.eslintrc*`,
`pyproject.toml`, `ruff.toml`, `.ruff.toml`, `setup.cfg`, `.flake8`, `pyrightconfig.json`, `.rubocop.yml`,
`phpstan.neon`, `phpstan.neon.dist`. A rule named in one of those lines has its unexplained drops counted
as `config-changed` instead of `fixed`. This is a proxy: it does not resolve the configuration, so a rule
turned off by a shared preset is missed. Set `toolchain` when a linter or preset version changed in a
manifest or lockfile, so the report marks `fixed` unreliable for this run.

Config-level ignores that carry no count (for example per-file ignore lists in a linter's configuration)
are not items. Their effect on a baseline shows as `config-changed`.
