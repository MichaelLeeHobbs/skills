# Patterns: what counts as an item

Write the strict patterns you use as `pattern` records (`kind`, `lang`, `text`) and save them in the
ledger's `patterns.jsonl`. `tally` hashes them; a changed pattern set breaks the trend, so change patterns
only on purpose and say so in the report.

## Scope

Search every tracked text file at the pinned commit. Skip, and count by reason:
- binary files;
- vendored or generated paths: the repo's own markings (for example version-control attributes that mark
  files vendored or generated), dependency folders (`node_modules`, `vendor`, `.venv`), and build output
  (`dist`, `build`, `target`, `out`) when ignored by the repo;
- the ledger folder and the baseline files themselves.

## Kinds

| Kind | What | `rule` | `scope` |
|---|---|---|---|
| `marker` | `TODO`, `FIXME`, `HACK` or `XXX` in a comment, upper case, as a whole word | the tag | empty |
| `inline` | a suppression that names one or more rules: one item per rule | the rule | `line` or `block` |
| `blanket` | a suppression that names no rule | `*` | `line` or `block` |

`line` scope covers one line (a trailing comment, a next-line directive). `block` scope covers a region or
the whole file (an own-line disable that runs until an enable, a file-level directive, an attribute or
annotation on a declaration). `linter` names the tool the suppression talks to; it must equal the
`linter` of that tool's baseline source in BASELINES.md, so budgets match.

**Owner tag.** A marker written `TODO(x)` or `FIXME(x)` has tag `x`; otherwise the tag is empty. `owner`
keeps only ticket keys and team handles, so a person's name in a tag never reaches the ledger.

**Comment text** for the hash is the line from the comment leader to the end of the line: the code
before a trailing comment is left out, so editing that code keeps the item's identity.

## Comment forms

Strict patterns anchor on a comment leader. Cover every form the language allows:

| Languages | Forms |
|---|---|
| C family (JS, TS, Java, Kotlin, C, C++, C#, Go, Rust, Swift, Scala, PHP, Dart) | `//` line comment, trailing `//`, `/* */` on one line, ` * ` lines inside a block comment, JSX `{/* */}` |
| Hash family (Python, Ruby, shell, YAML, TOML, Perl, R, PowerShell, Makefile) | `#` line comment, trailing `#`; Python docstring lines also count for markers |
| SQL, Lua, Haskell | `--` |
| HTML, XML, Markdown, Vue and Svelte templates | `<!-- -->` |
| CSS, SCSS, Less | `/* */`, and `//` in SCSS and Less |

A marker inside a string literal is not an item. A hit you cannot place in a comment goes to the loose
leftovers and needs an exclusion reason.

## Suppressions

| Linter (`linter`) | Directive | Kind and scope |
|---|---|---|
| ESLint (`eslint`) | `eslint-disable-next-line r1, r2`, `eslint-disable-line r1` | inline, line; no rules: blanket, line |
| ESLint (`eslint`) | own-line `eslint-disable r1` (block comment) | inline, block; no rules: blanket, block |
| TypeScript (`tsc`) | `@ts-expect-error`, `@ts-ignore` | blanket, line |
| TypeScript (`tsc`) | `@ts-nocheck` | blanket, block |
| Ruff or Flake8 (`ruff` or `flake8`, as the repo uses) | `# noqa: E501, W291` | inline, line; bare `# noqa`: blanket, line |
| Ruff (`ruff`) | file-level `# ruff: noqa: E501` | inline, block; bare: blanket, block |
| mypy (`mypy`) | `# type: ignore[code]` | inline, line; bare: blanket, line |
| Pyright or basedpyright (`pyright`) | `# pyright: ignore[rule]` | inline, line; bare: blanket, line |
| Pylint (`pylint`) | `# pylint: disable=x` | inline; trailing: line, own line: block |
| RuboCop (`rubocop`) | `# rubocop:disable Cop/Name`, `# rubocop:todo Cop/Name` | inline; trailing: line, own line: block |
| PHPStan (`phpstan`) | `@phpstan-ignore id`, `@phpstan-ignore-next-line`, `@phpstan-ignore-line` | with an identifier: inline, line; without: blanket, line |
| Psalm (`psalm`) | `@psalm-suppress Issue` | inline, block |
| golangci-lint (`golangci`) | `//nolint:r1,r2` | inline, line; bare: blanket, line |
| Rust (`clippy`) | `#[allow(lint)]`, `#![allow(lint)]` | inline, block |
| Java, Kotlin (`javac`, `kotlin`) | `@SuppressWarnings("x")`, `@Suppress("x")` | inline, block |
| clang-tidy (`clang-tidy`) | `// NOLINT(check)`, `// NOLINTNEXTLINE(check)` | inline, line; bare: blanket, line |
| C# (`csc`) | `#pragma warning disable CS0168` | inline, block |
| SwiftLint (`swiftlint`) | `swiftlint:disable:next r`, `swiftlint:disable r` | inline; `:next`: line, otherwise block |
| ShellCheck (`shellcheck`) | `# shellcheck disable=SC2086` | inline, line |
| Stylelint (`stylelint`) | `stylelint-disable-next-line r`, `stylelint-disable r` | inline; bare: blanket |

Re-enable directives (`eslint-enable`, `rubocop:enable`) are not items. A language or linter missing here:
add a row in your run, name it in the report, and include its pattern in the pattern set.

## Loose pattern

Case-insensitive, no comment anchor, one count per line per keyword:

```
todo|fixme|hack|xxx|eslint-disable|noqa|type:\s*ignore|ts-ignore|ts-expect-error|ts-nocheck|
pyright:\s*ignore|pylint:\s*disable|rubocop:(disable|todo)|nolint|phpstan-ignore|psalm-suppress|
SuppressWarnings|@Suppress|#!?\[allow|pragma warning disable|swiftlint:disable|shellcheck disable|
stylelint-disable
```

The loose count exceeds the strict count by design (`todoList`, `hackathon`, keywords in strings and
prose). Coverage checks that every excess hit has a stated exclusion reason; it does not prove recall.
The canary file does.

## Canary file

One per language present, in the work folder at `__canary__/canary.<ext>`, written in that language's
syntax. Plant:
- one marker of each tag (`TODO`, `FIXME`, `HACK`, `XXX`), one of them written `TODO(PROJ-1)`;
- one trailing-comment marker after code, and one in each other comment form the language has;
- one inline suppression per directive row for that language, one naming two rules (two items);
- one blanket suppression, line and block scope where the language has both;
- negatives: an identifier containing `todo` (`todoList`), the string literal `"TODO: not a comment"`,
  and the word `hackathon` in a comment.

The expected result is the list above, written down before the search runs. Found items must match it
exactly in count, kind, rule, scope and tag, and every negative must appear only as an excluded loose hit.
