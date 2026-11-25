# Authentication

Sign-in, sessions and account lockout for every user class. Area code `AUTH`.

## Users and passwords (USR)

| ID | Requirement | Pri | Verify | Status |
|---|---|---|---|---|
| AUTH-USR-01 | The system shall require a password of at least 12 characters when a user sets or changes it. | P1 | Test | Accepted |
| AUTH-USR-02 | The system shall lock an account after 3 failed sign-ins within 15 minutes. | P1 | Test | Superseded by AUTH-USR-03 |
| AUTH-USR-03 | The system shall lock an account after 5 failed sign-ins within 15 minutes. | P1 | Test | Accepted |
| AUTH-USR-04 | The system shall let an administrator unlock a locked account. | P2 | Demonstration | Accepted |
| AUTH-USR-05 | The system should tell a user how many sign-in attempts remain before lockout. | P3 | Test | Proposed |

AUTH-USR-05: source: discovered while building the sign-in screen; the design shows a remaining-attempts hint.

## Sessions (SES)

| ID | Requirement | Pri | Verify | Status |
|---|---|---|---|---|
| AUTH-SES-01 | The system shall end a session after 30 minutes without activity. | P1 | Test | Accepted |
| AUTH-SES-02 | The system shall not write session tokens to application logs. | P1 | Inspection | Accepted |
| AUTH-SES-03 | The system may offer a "remember this device" option for 30 days. | P3 | Test | Deferred |

## What the rows show

- AUTH-USR-02 changed from 3 attempts to 5. The change got a new ID (AUTH-USR-03) and the old row
  points at it. The old ID is never used again.
- AUTH-USR-05 is Proposed with its source note. It stays Proposed until the developer decides.
- AUTH-SES-02 is a negative requirement proven by Inspection: a reviewer reads the logging code and cites
  file and line.
- No row says how: none names a library, a table or a framework.
