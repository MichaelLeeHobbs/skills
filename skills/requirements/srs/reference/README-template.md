# <Product> Software Requirements Specification

## Purpose

What this product is for and who it serves, in three to five sentences. This SRS is the contract agents
and people build toward: a requirement here is the definition of done for the work that meets it. It is
allowed to change, and the product's developer decides what gets in.

## Scope

What the product does at the level of capabilities, one line each. Name the systems it talks to.

## Out of scope

Things a reader might expect this product to do that it will not. Each line is a decision, not a gap.
A requirement that falls under one of these lines is scope creep and gets rejected or the line changes
first.

- <Capability the product will not provide, and the reason in one clause>

## User classes

| Class | Who they are | What they need most |
|---|---|---|
| <Operator> | <Day, volume, stakes> | <The job this product does for them> |

## Conventions

These rules govern every file in this folder. Skills and agents that read or write the SRS follow them.

**Files.** `README.md` (this file), one `<area>.md` per area with nested headings for sub-areas,
`interfaces/<name>.md` for contracts other code builds against (each with its own semver in its header),
and `trace.md`, which only the verifier writes.

**Requirement rows.** Every requirement is one row of a table with exactly these columns:

| ID | Requirement | Pri | Verify | Status |
|---|---|---|---|---|

- **ID** `AREA-SUB-NN`: capitals, then a sub-area, then two or more digits. Never reused. A changed
  requirement gets a new ID; the old row's Status becomes `Superseded by <new ID>`.
- **Pri** `P1` required for the end state, `P2` expected, `P3` nice to have.
- **Verify** how proof is obtained (ISO/IEC/IEEE 29148): `Test` (an automated test asserts it),
  `Demonstration` (steps run and observed), `Inspection` (a file and line show it), `Analysis`
  (reasoning written out).
- **Status** `Proposed`, `Accepted`, `Deferred`, `Rejected`, or `Superseded by <ID>`. Anyone may add a
  Proposed row. Only the developer moves a row to Accepted, Deferred or Rejected, in their own words, and
  each such decision gets a dated line in the change log naming every ID it moved, with the word
  Accepted before the IDs it accepts.

**Wording.** `shall` is mandatory, `should` is expected, `may` is permitted. Each requirement is
necessary, singular (one behaviour per row), unambiguous, verifiable, and says what the product does,
not how it is built. Interface specs are the exception: there the exact shape is the requirement.

**Source notes.** A Proposed row discovered during a build or drafted from existing material carries its
source in a note under the table: `AUTH-USR-07: source: discovered while building the login screen, PR 214`.

**Decisions.** A decision that sets how the product behaves changes this SRS in the same change that
records the decision, even when the build comes later. Each row it adds or revises cites the decision's
ID in its source note or change-log line. Decision records live in `<decisions folder, or "none">`,
checked from `<first file name the SRS answers for, or "the first">`.

**Tests.** A test that proves a requirement carries its ID in its name, for example
`AUTH-USR-03: locks the account after 5 failed logins`. Where a language forbids hyphens in names, use
underscores (`test_auth_usr_03_locks_account`).

**Verdicts.** `trace.md` records, per Accepted requirement, one of `Met`, `Partial`, `Not met`,
`Regressed`, or `Cannot verify` (with the reason), and the evidence. Whoever built the work never marks
it Met.

## Areas

| Area | File | What it covers |
|---|---|---|
| <Authentication> | [auth.md](auth.md) | <Sign-in, sessions, lockout> |

Interfaces:

| Interface | File | Version |
|---|---|---|
| <Connector API> | [interfaces/connector.md](interfaces/connector.md) | <1.0.0> |

## Completeness summary

Written by the coverage script. Do not edit between the markers.

<!-- srs-summary:start -->
Not generated yet.
<!-- srs-summary:end -->

## Change log

Newest first. One line per decision: the date, what moved, and the developer's words.

- YYYY-MM-DD: Created.
