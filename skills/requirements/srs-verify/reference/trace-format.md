# Trace format

`docs/srs/trace.md` is the verifier's record: one row per Accepted requirement that has been checked.
Only verification writes it. The format check reads it, so keep the columns exactly.

```
# Trace

Verdicts for Accepted requirements. Written by verification only; the author of a piece of work never
marks it Met.

| ID | Verdict | Evidence | Checked | Notes |
|---|---|---|---|---|
| AUTH-USR-01 | Met | `tests/auth.spec.js:12` "AUTH-USR-01: rejects short passwords"; `npm test -- auth.spec` passed | 2026-11-24 3f2a91c | |
| AUTH-USR-03 | Partial | `tests/auth.spec.js:30` asserts lockout at 5 failures; no test of the 15-minute window | 2026-11-24 3f2a91c | Window unproven |
| AUTH-USR-04 | Met | Demonstration: signed in as admin on staging build 3f2a91c, unlocked a locked user, user signed in | 2026-11-24 3f2a91c | |
| AUTH-SES-02 | Met | Inspection: `src/log/redact.ts:18` strips `token` from every log record; the only other logger calls are in `src/auth/session.ts:40,77`, neither logs the token | 2026-11-24 3f2a91c | |
| AUTH-SES-01 | Cannot verify | | 2026-11-24 3f2a91c | Idle timeout is read from deployment config that is not in the repo |
```

## Columns

- **ID**: an Accepted requirement ID. One row per ID.
- **Verdict**: `Met`, `Partial`, `Not met`, `Regressed` or `Cannot verify`.
- **Evidence**: what a sceptic would re-run or re-read: test name and file with the command and result,
  demonstration steps and what was observed, file and line, or analysis (or a link to a section below
  the table holding it). Required for Met, Partial and Regressed.
- **Checked**: the date and the revision (commit hash) the verdict applies to.
- **Notes**: what is missing for Partial, the reason for Cannot verify, and anything for the developer.
  Cannot verify needs a reason here or in Evidence.

## Keeping it true

- Replace a row when you re-verify that ID. Keep other rows as they are.
- Remove the row when its requirement is superseded, deferred or rejected. The replacement ID gets its
  own row when verified.
- Long analysis goes in a `## <ID> analysis` section below the table, linked from the Evidence cell.
- A table cell cannot hold a raw `|`. Write `\|`.
