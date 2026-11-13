# Rows: what goes in the manifest

## What counts as a row

Every named callable in tracked source, found by the language's parser (a compiler API, a tree-sitter
grammar, the language's own AST module). Assign `kind` from the syntax, never from the file or folder it
sits in. A formatter declared as a private top-level const inside a page component is a `utility`. Take the first row of
this table that matches, top to bottom: a component that calls hooks is a `component`.

| Kind | Rule |
|---|---|
| `component` | a capitalised function or class that returns markup (JSX, a template) |
| `framework-bound` | named like a hook (`useThing`) or calls one; a view or signal handler the framework calls |
| `override` | implements a framework or interface method by name: `render`, `toString`, `__str__`, `save`, `ngOnInit` |
| `handler` | a named function nested in a component that handles an event |
| `method` | any other method on a class |
| `utility` | any other named function: declarations, named const arrows, top-level consts in any file |

`visibility` is `exported` (importable from outside the file or module), `private` (top level, not
exported), or `inner` (nested inside another function).

**Exclude, and count each exclusion by reason:** anonymous callbacks; functions that are values of
object-literal properties (`onSuccess: () => ...`, `render: ...` in a config object); tests and test
helpers; stories; generated code; type declaration files; vendored and build output. None of these are
reported as rows, and every one shows up in the report header as a count.

**Re-exports** (`export { formatBytes } from './format'`) are not rows. Record them as `alias_of` the
row they re-export, and count them as importers of it.

For every row record: `id` (`path:line:name`), `path`, `line`, `end` (last line), `name`, `kind`,
`visibility`, `signature` (the parameter list and return type as written, whitespace collapsed; step 4
splits oversize groups by it), a content hash of the function's source, `importers` (count) and
`imported_by` (files).

## Coverage count pattern

The coverage check compares, per file, how many named callables the parser found **before any
exclusion** with how many a plain line pattern matches. The pattern is a cross-check that the parser saw
the file, not a second enumerator. A line counts once. Write a `count` record for every file in scope,
meaning every source file not excluded as a whole (tests, stories, generated, declaration, vendored and
build files are out).

TypeScript and JavaScript, count a line when it matches any of:
- `^\s*(export\s+)?(default\s+)?(async\s+)?function\b`
- `^\s*(export\s+)?(const|let|var)\s+[A-Za-z_$][\w$]*\s*(:[^=]+)?=\s*(async\s+)?(\([^)]*\)|[A-Za-z_$][\w$]*)\s*(:[^=]+)?=>`
- `^\s*(export\s+)?const\s+[A-Za-z_$][\w$]*\s*=\s*(React\.)?(useCallback|memo|forwardRef)\(`

Do not count `useMemo` consts: they hold values, not callables. Do not count a matching line that ends
in `;` with no body, such as an overload signature or a `declare function` line. Class methods are not
in the pattern, so files with classes show parser surplus, which the check allows. The pattern also
matches example code inside comments; a file short by one or two for that reason needs no adjustment
while the total passes.

Python: `^\s*(async\s+)?def\s+\w+`. It also matches `def` inside docstrings and multi-line strings; a
file where that happens is adjusted with that reason.

For another language, write one pattern per declaration form before step 1 and list it in the report. If
you cannot write one, coverage cannot be checked and the run fails.

## Row slots

Workers fill these for every row. The closed lists are the tool's lists; a value outside them is
rejected.

| Slot | Content |
|---|---|
| `verb` | `format`, `parse`, `convert`, `validate`, `check`, `compare`, `sort`, `filter`, `group`, `map`, `merge`, `build`, `extract`, `normalize`, `compute`, `count`, `find`, `generate`, `render`, `wrap`, `guard` |
| `domain_in` | what the input **means**, in two to four words, the noun only: "byte count", "timestamp", "error of unknown shape". No clauses about the caller or the purpose: those make every string unique and the mapping step unworkable. Not its type, and not the function's name reworded. If the function takes one parameter object, describe the value it reads from it: a grid cell formatter taking `{ value }` describes `value` |
| `domain_out` | `text`, `number`, `boolean`, `date`, `collection`, `record`, `markup`, `none` |
| `empty` | what it returns or does for null, undefined, empty string or zero |
| `invalid` | what it returns or does for input of the right type that makes no sense |
| `zone_or_units` | time zone, units, rounding or locale it applies; for timestamp output also say `date-only`, `date-time` or `day label`; `none` if nothing applies |
| `effects` | `pure`, `clock` (reads the current time), `locale` (reads locale or settings), `framework` (needs the framework running), `io` |

For `utility`, `method` and `framework-bound` rows the three edge slots must say something; `n/a` is
rejected. Other kinds may use `n/a`.

The tool rejects a row whose `domain_in` words are all words of the function's name. `formatDate` with
"the date value" is rejected (after dropping "the" and "value", only "date" is left, and it is in the
name); `formatBytes` with "byte count" passes because "count" is not in the name.

## Worker brief

Give each worker one slice and this brief, and nothing else from the run:

> Read every file listed below in full. For each row ID listed, return exactly one JSON line with `id`
> and the slots defined below. Return every listed ID and no other. Describe what the code does, not
> what its name says: read the body, including module constants it uses. Fill the edge slots from the
> code's actual branches; if the code has no branch for empty input, say what happens anyway (for
> example "throws TypeError" or "returns 'Invalid Date'"). Write the lines to `<slice>.out.jsonl` under
> a temporary name, then rename it when complete. Return one line: the slice ID and the row count.

Append the slot table above to the brief. The worker never sees other slices, the taxonomy, or the
candidate groups.

## Worked example

`ReadinessPage.tsx`, line 26, a private top-level const in a page component:

```
const formatDate = (iso: string | null): string => (iso ? new Date(iso).toLocaleDateString() : '-');
```

Row: `kind` utility, `visibility` private, `verb` format, `domain_in` "timestamp as ISO string",
`domain_out` text, `empty` "returns '-'", `invalid` "returns 'Invalid Date'", `zone_or_units`
"local zone, date-only, browser locale", `effects` locale.
