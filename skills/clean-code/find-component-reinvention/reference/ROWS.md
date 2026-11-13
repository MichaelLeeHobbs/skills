# Rows: what goes in the component manifest

## What counts as a row

Every component in tracked source, found by the language's parser (a compiler API, a tree-sitter grammar,
the framework's own template compiler):

- a capitalised function, named const arrow, or memo or forward-ref wrapper that returns markup;
- a class that extends the framework's component base and renders markup;
- a single-file component (one per file; its name is the file name without the extension);
- a class carrying the framework's component decorator.

**Exclude, and count each exclusion by reason:** tests and test helpers; stories and other component
workshop files; generated code; type declaration files; vendored and build output. Components defined
inline as values of object-literal properties (a column definition's `cell: () => ...`) are counted as
`inline` and excluded.

For every row record: `id` (`path:line:name`), `path`, `line`, `end`, `name`, `visibility` (`exported`,
`private`, `inner`), `hash`, `importers` (count of files that import it), `imported_by` (files), and
`imports`: the local names every import statement in the row's file binds (`Chip`, `DataGrid`,
`useQuery`), so `wraps` can be checked against them.

`hash` is the SHA-256, in lowercase hex, of the row's source lines from `line` to `end`, joined with LF
and with any trailing CR removed from each line. Re-runs and the catalog depend on this exact definition.

A design-system package inside the repo is inventoried like any other code; its rows get `relation`
`library`. A design-system package installed from outside the repo is not inventoried; JUDGE.md adds its
component to a group as a reference member.

## Coverage count pattern

The coverage check compares, per file, how many candidates the parser found **before any exclusion and
before the markup test** (every capitalised named function, const arrow, memo or forward-ref wrapper, and
class extending a component base; one per single-file component; one per decorated component class) with
how many a plain line pattern matches. A line counts once. Write a `count` record for every file in scope:
every file with a markup extension, plus any other source file where the parser found markup, minus the
whole-file exclusions above.

Script and markup files of the JSX family, count a line when it matches any of:
- `^\s*(export\s+)?(default\s+)?(async\s+)?function\s+[A-Z]`
- `^\s*(export\s+)?(const|let|var)\s+[A-Z][\w$]*\s*(:[^=]+)?=\s*(async\s+)?(\([^)]*\)|[A-Za-z_$][\w$]*)\s*(:[^=]+)?=>`
- `^\s*(export\s+)?const\s+[A-Z][\w$]*\s*=\s*(React\.)?(memo|forwardRef)\(`
- `^\s*(export\s+)?(default\s+)?class\s+[A-Z][\w$]*\s+extends\s+[\w$.]*Component\b`

Single-file components count 1 per file on both sides. Decorated component classes count each line
matching `^\s*@Component\(`. Do not count a matching line that ends in `;` with no body. For another
framework, write one pattern per declaration form before step 1 and list it in the report. If you cannot
write one, coverage cannot be checked and the run fails.

## Cross-check against find-reinvention's catalog

If the repo holds find-reinvention's `rows.jsonl` (in its `reinvention/` catalog folder, CATALOG.md),
run `reuse` with its `component` rows as `old` and this inventory as `new`. Every `removed` record whose
file still exists at this commit is a component one of the two inventories missed: name it and fail the
coverage check. Its hashes may come from another definition, so expect `changed` records and ignore them.

## Row slots

Workers fill these for every row. The closed lists are the tool's lists (CONTRACT.md "Closed lists"); a
value outside them is rejected.

| Slot | Content |
|---|---|
| `widget` | what a user would call the thing on screen, from the widget list. `badge` covers status badges, tags, chips and pills; `choice` covers checkboxes, radios and switches. A whole screen is `page`, a frame that only positions children is `layout`, a component that only supplies context is `provider`, a composite that does one product job (an order summary panel) is `feature`. `other` when nothing fits, with a `note` saying what it is |
| `displays` | what it shows, as a noun of two to four words: "order status", "search results", "unread message count". Not the component's name reworded |
| `relation` | `library`: it is the shared design-system component. `wrapper`: its root is one imported component and it adds no styling of its own. `restyled`: its root is one imported component and it overrides that component's styling. `hand-rolled`: built from native markup |
| `wraps` | for `wrapper` and `restyled`, the imported local name of the component it wraps; otherwise `none` |
| `styling` | `tokens` (theme tokens or design-system props only), `hardcoded` (literal colours, sizes or fonts), `mixed`, `inherited` (no styling of its own) |
| `effects` | every one that applies: `context`, `store`, `router`, `fetch`, `clock`, `storage` (browser storage), `io`; or `pure` alone |
| `note` | free text, optional; required when `widget` is `other` |

The tool rejects a row whose `displays` words are all words of its name, and fails the slice set when
more than 10% of rows are `other` (raise the limit only with a reason in the report).

## Worker brief

Give each worker one slice and this brief, and nothing else from the run:

> Read every file listed below in full. For each row ID listed, return exactly one JSON line with `id`
> and the slots defined below. Return every listed ID and no other. Describe what the component renders
> and how, not what its name says: read the markup it returns, the components it renders, and the style
> rules and module constants it uses. Pick `relation` from its root element: one imported component as
> the root with no styling of its own is `wrapper`; the same with style overrides is `restyled`; native
> markup is `hand-rolled`. Write the lines to `<slice>.out.jsonl` under a temporary name, then rename it
> when complete. Return one line: the slice ID and the row count.

Append the slot table above and the widget list to the brief. The worker never sees other slices or the
groups.

## Worked example

`JobsPage.tsx`, line 40, a private top-level const in a page:

```
const StatusChip = ({ s }: { s: JobStatus }) => (
  <span style={{ background: s === 'failed' ? '#d32f2f' : '#2e7d32', borderRadius: 12 }}>{s}</span>
);
```

Row: `widget` badge, `displays` "job status", `relation` hand-rolled, `wraps` none, `styling` hardcoded,
`effects` [pure]. "job status" passes the name check because "job" is not a word of `StatusChip`.
