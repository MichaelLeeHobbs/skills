# Fixture SRS

## Purpose

A small product used to test the SRS scripts.

## Scope

Sign-in and a connector API.


- Single sign-on with outside identity providers.

## User classes

| Class | Who they are | What they need most |
|---|---|---|
| Operator | Signs in daily | A quick, safe sign-in |

## Conventions

Rows use | ID | Requirement | Pri | Verify | Status |, as in the template.

| ID | Requirement | Pri | Verify | Status |
|---|---|---|---|---|

## Areas

| Area | File | What it covers |
|---|---|---|
| Authentication | [auth.md](auth.md) | Sign-in and lockout |
| Billing | [billing.md](billing.md) | Not written yet |

## Completeness summary

<!-- srs-summary:start -->
Not generated yet.

## Change log

- 2026-11-20: Accepted AUTH-USR-01, AUTH-USR-03, AUTH-SES-01. "Lockout at five, not three."
- 2026-11-18: Accepted CONN-API-01 and AUTH-USR-02 (later superseded).
- 2026-11-18: Created.
