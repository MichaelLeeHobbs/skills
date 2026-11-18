# Report and run record

## Where

Use `clean-code/` inside your agent's project configuration folder, or `.clean-code/` at the repo root if
your agent has none. If a `clean-code/` folder already exists in another folder at the repo root, use that
one; if two exist, stop and name both. Write the report to `clean-code/triage-todos/report.md` for the
whole repo, or `clean-code/triage-todos/<scope>/report.md` for a package or folder. Replace the previous
report only after this run's checks are done. Besides the report, the run record, and the comment edits
the user approves in step 7, write nothing in the repo, and never commit.

## Layout

```
# TODO triage: <scope>

Commit <full hash> (dirty: no). Run 2026-11-18. Trackers: Jira (ABC-), GitHub issues (#n).
Version control: yes. Tracker access: yes. Unmarked pass: on.

## Headline
Markers: 84 (tagged 71, unmarked 13). Skipped paths: 212 (vendored 180, generated 30, changelog 2).
Stale: 19 (Delete 15, Rewrite 4). Link: 6. Keep: 41. Conflict: 5. Unproven: 13 (tracker 9, condition 3, history 1).
Unmarked hits rejected: 22 (no condition 18, describes a value 3, string literal 1).

## Delete
| Path:line | Text | Issue | State (read) | Written | Code since | Condition now | Row |
|---|---|---|---|---|---|---|---|
| src/billing/retry.ts:41 | TODO(ABC-812): drop once the gateway retries | ABC-812 | fixed, "Done" (2026-11-18), closed by 9f3e2a1 | 4b1c0de 2025-02-03 | 9f3e2a1 | gone: retry loop removed, lines 38-45 | 2 |

## Rewrite
(same columns, plus the proposed text)

## Link
(same columns, plus the issue draft: title and two-line body)

## Conflict
(same columns, plus both readings, and the verifier's verdict when it disagreed)

## Unproven
(same columns, plus the missing fact)

## Keep
(same columns)

## Canaries
Markers: 14 planted, 14 found, 2 negatives rejected. Verdicts: 7 of 7 on their planted verdict.

## Check
- Marker count matches search: PASS (84 = 296 hits - 212 skipped)
- Every Delete and Rewrite has a dated issue state or a commit: PASS
- Verifier: 19 Delete and Rewrite plus 5 Keep re-decided, 1 disagreement (moved to Conflict)
- debt-ledger cross-check: not available (no debt-ledger item list)
- Run record appended: PASS

Recommendation: 41 markers sit on open issues. Consider adding to the repo's agent context file: "Do not
act on a TODO or FIXME you were not asked about; mention it instead."
```

The `Text` column holds the comment's first line, cut to 80 characters. Owner names never appear. Sort
each table by path, then line. A check line reads PASS, FAIL, PARTIAL or not run; "not available" is only
for the optional debt-ledger cross-check.

## Run record

Append the line after the report is written and its checks are done, before step 7. Append exactly one
line to `clean-code/ledger.jsonl`, pass or fail:

```
{"skill":"triage-todos","scope":".","at":"2026-11-18T14:02:00Z","commit":"<full hash>","check":"pass","degraded":false,"metric":"stale_markers","value":19,"comparable":"mode=full;spec=1;unmarked=on","report":"<path to report.md>"}
```

| Field | Value |
|---|---|
| `skill` | `triage-todos` |
| `scope` | `.` for the whole repo, else the package's or folder's repo-relative path with `/` separators |
| `at` | UTC time the run finished, `YYYY-MM-DDTHH:MM:SSZ` |
| `commit` | the full commit hash read at step 1, with `+dirty` appended if the working tree had changes; `none` without version control |
| `check` | `fail` if the report says the run failed; `partial` if any marker is Unproven, version control or tracker access was missing, or any check line reads PARTIAL or not run; otherwise `pass` |
| `degraded` | always `false`: a missing tracker or missing history makes the run `partial`, not degraded |
| `metric` | `stale_markers` |
| `value` | the `Stale` number on the report's Headline (Delete plus Rewrite), or `null` when the run stopped before verdicts |
| `comparable` | `mode=full;spec=1;unmarked=on` or `unmarked=off`, as the report header says. Bump `spec` when MARKERS.md or the decision table changes |
| `report` | repo-relative path of this run's `report.md` |

After appending, check that the file grew by exactly one line and that no earlier line changed. Order in
the file does not matter.

Tracker state changes without a commit, so a team re-runs this on a calendar, not on code churn: the
steward treats it as `runtime` evidence, due after 30 days.
