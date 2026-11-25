# Authentication

## Users (USR)

| ID | Requirement | Pri | Verify | Status |
|---|---|---|---|---|
| AUTH-USR-01 | The system shall require a password of at least 12 characters. | P1 | Test | Accepted |
| AUTH-USR-02 | The system shall lock an account after 3 failed sign-ins. | P1 | Test | Superseded by AUTH-USR-03 |
| AUTH-USR-03 | The system shall lock an account after 5 failed sign-ins within 15 minutes. | P1 | Test | Accepted |
| AUTH-USR-04 | The system should show remaining attempts \| before lockout. | P3 | Test | Proposed |

AUTH-USR-04: source: discovered while building the sign-in screen.

## Sessions (SES)

| ID | Requirement | Pri | Verify | Status |
|---|---|---|---|---|
| AUTH-SES-01 | The system shall end a session after 30 minutes without activity. | P2 | Inspection | Accepted |
| AUTH-SES-02 | The system may remember a device for 30 days. | P3 | Test | Deferred |

```
| ID | Requirement | Pri | Verify | Status |
|---|---|---|---|---|
| AUTH-USR-01 | A fenced example row is ignored, so this duplicate is not a finding. | P9 | Guess | Maybe |
```
