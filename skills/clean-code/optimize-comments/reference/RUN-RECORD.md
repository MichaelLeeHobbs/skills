# The run record

This skill keeps no catalog and writes no report file. It leaves one line in a shared ledger so a team
can see when the pass last ran and whether it succeeded.

## Where

Use `clean-code/` inside your agent's project configuration folder, or `.clean-code/` at the repo root if
your agent has none. If a `clean-code/` folder already exists in another folder at the repo root, use that
one; if two exist, stop and name both. This skill keeps no files in `clean-code/optimize-comments/` and
creates no such folder. Besides the comment edits the pass itself makes, write only the shared
`clean-code/ledger.jsonl` and nothing else in the repo; never commit.

## Run record

Append the line only after step 5's checks are done. Append exactly one line to `clean-code/ledger.jsonl`,
pass or fail:

```
{"skill":"optimize-comments","scope":".","at":"2026-11-15T14:02:00Z","commit":"<full hash>","check":"pass","degraded":false,"metric":null,"value":null,"comparable":"mode=full","report":null}
```

| Field | Value |
|---|---|
| `skill` | `optimize-comments` |
| `scope` | `.` for the whole repo, else the package's repo-relative path with `/` separators; for a single file or a diff, the repo-relative path of the file or of the directory holding the changed files |
| `at` | UTC time the run finished, `YYYY-MM-DDTHH:MM:SSZ` |
| `commit` | the full commit hash read at the start of the run, with `+dirty` appended if the working tree had changes; `none` without version control |
| `check` | `fail` if the pass did not succeed (step 5: a comment unaccounted for, a fixed exception removed, or a check failed or could not run); `partial` if any outside fact is reported unverified; otherwise `pass` |
| `degraded` | always `false`: this skill has no degraded mode |
| `metric` | `null` |
| `value` | `null` |
| `comparable` | `mode=full`; this skill has no comparability fields |
| `report` | `null` |

After appending, check that the file grew by exactly one line and that no earlier line changed. Order in
the file does not matter.
