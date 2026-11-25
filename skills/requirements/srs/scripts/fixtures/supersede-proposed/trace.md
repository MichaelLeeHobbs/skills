# Trace

| ID | Verdict | Evidence | Checked | Notes |
|---|---|---|---|---|
| AUTH-USR-03 | Partial | tests/auth.spec.js:7 asserts lockout at 5 but not the 15-minute window | 2026-11-21 abc1234 | |
| AUTH-SES-01 | Cannot verify | - | 2026-11-21 abc1234 | Timeout is read from config that is not in the repo |
| CONN-API-01 | Not met | | 2026-11-21 abc1234 | start() takes no config |
