# The run record

This skill keeps no catalog and writes no report file. It leaves one line in a shared ledger so a team
can see when the pass last ran and whether it succeeded.

## Where

Use `clean-code/` inside your agent's project configuration folder, or `.clean-code/` at the repo root if
your agent has none. If a `clean-code/` folder already exists in another folder at the repo root, use that
one; if two exist, stop and name both. This skill keeps no files in `clean-code/optimize-docs/` and
creates no such folder. Besides the doc edits the pass itself makes, write only the shared
`clean-code/ledger.jsonl` and nothing else in the repo; never commit.

## Run record

Append the line only after step 6's report is done. Append exactly one line to `clean-code/ledger.jsonl`,
pass or fail:

```
{"skill":"optimize-docs","scope":".","at":"2026-11-15T14:02:00Z","commit":"<full hash>","check":"pass","degraded":false,"metric":null,"value":null,"comparable":"mode=full","report":null}
```

| Field | Value |
|---|---|
| `skill` | `optimize-docs` |
| `scope` | `.` for the whole repo, else the repo-relative path of the tree in scope (a directory, a docs site's folder, or one file) with `/` separators |
| `at` | UTC time the run finished, `YYYY-MM-DDTHH:MM:SSZ` |
| `commit` | the full commit hash read at the start of the run, with `+dirty` appended if the working tree had changes; `none` without version control |
| `check` | `fail` if the pass did not meet "It is working if" (a section without a verdict, a deletion with no fact to point at, or claim extraction that missed a doc); `partial` if any claim is reported unchecked, or the conservative branch of step 1 was taken because you could not ask; otherwise `pass` |
| `degraded` | always `false`: this skill has no degraded mode |
| `metric` | `null` |
| `value` | `null` |
| `comparable` | `mode=full`; this skill has no comparability fields |
| `report` | `null` |

After appending, check that the file grew by exactly one line and that no earlier line changed. Order in
the file does not matter.
