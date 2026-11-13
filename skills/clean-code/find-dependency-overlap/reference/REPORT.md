# The report

Keep it under about 120 lines and save it in the catalog folder as `report.md`. Take every number from a
tool output record or a run table. A number with no record behind it is a failed run; write
`not measured: <reason>` instead. Canary records never enter totals or decisions.

## Header

```
Dependency overlap audit: <repo>  commit <hash> [dirty]  <date>
Catalog: <folder in the repo>   Work folder: <path outside the repo>
Since last run: <new packages> new, <removed> removed, <families resolved> resolved | first run
Inventory: <workspaces> workspaces, <packages> direct packages (<mapped> mapped)   Lockfile check: PASS | user's word
Coverage: <coverage> over <files> files (<adjusted> adjusted, <excluded> excluded)   PASS | FAIL
Sites: <imports> imports, <unknown> unknown, <unused> unused, <undeclared> undeclared
Families: <n> (<real> REAL, <complement> COMPLEMENT, <different> DIFFERENT_JOB, <transitional> TRANSITIONAL)
Bundle: <app> <coverage> | <app> not measured: <reason> ...
Canaries: <n> of 4 behaved as planted   PASS | FAIL
Side-by-side: <n> families run, <m> rows   Network off: yes | no | not run
```

If any check failed, say first, above the header, that the run failed and which check.

## Decision list

One numbered item per REAL family, keeper first. Lead with the two counts that size the work: files to
edit (the loser's direct files) and files affected (its `affected`). For backends, put leaks third.

```
1. Dates in browser:web. Keep luxon, drop moment + moment-timezone + chartjs-adapter-moment.
   Files to edit 40, affected 152 (behind a wrapper: src/lib/date.ts). Call sites 214 (lower bound).
   No equivalent: moment.updateLocale (1 file). Needs plugin: none. Leaks: 3 (DatePicker props, 2 store fields).
   Saving in web: 74,210 initial, 0 lazy (gross). In admin: pinned by react-datepicker@4.8.0, saves 0.
   Breaks if migrated (run): week start Sunday -> Monday (18 refs), "Invalid date" -> "Invalid DateTime" (6 refs).
   Default: keep luxon, because moment's README declares maintenance mode (keeper rule 1).
```

The default follows the keeper rule in [JUDGE.md](JUDGE.md). Without a run, replace the "Breaks if
migrated" line with "Behaviour differences (predicted, not run): ..." and keep it to the matrix's
`differs` rows.

Then one line each for COMPLEMENT fixes, DIFFERENT_JOB families and TRANSITIONAL progress.

## Side findings

- Unused direct packages (`unused`) and undeclared imports (`undeclared`), each with its workspace.
- Two resolved versions of one package shipping in one app (`copies` above 1), with units.
- Tooling families (test runners, linters) kept to one line each: they cost install time, not bundle.
- Non-literal dynamic imports and requires, with their files.

## Prevention drafts

Drafts for the user to apply. The skill edits nothing.

- **Lint rule**, ready to paste, for the linter the repo already uses: restrict imports of each loser,
  with a message naming the keeper (`no-restricted-imports` style for JavaScript, a banned-import rule for
  Python). Mark it valid only once the decision is settled.
- **Context-file lines** for the repo's agent context file, one per job with a keeper:
  ``Dates: use luxon (DateTime); moment is being removed. Formatting helpers live in src/lib/date.ts.``

## Appendix (catalog folder, not the report)

Every family's verdict, coverage matrix and translation table (`verdicts.jsonl`), the full `sites`,
`bytes` and `pins` outputs for this run, and the mapping changes made this run.
