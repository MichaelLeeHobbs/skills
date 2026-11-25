# Checks by hand

The checks `scripts/srs-lint.mjs` runs, for an agent without Node. Running them by hand is slower and
less reliable, so report that the script did not run. Mark each item pass or fail and name the row.
Ignore tables inside fenced code blocks.

## Requirement rows (every `.md` except README.md and trace.md)

A requirement table is one whose header has both an ID and a Requirement column, in any order.

1. Every requirement table has the columns ID, Requirement, Pri, Verify, Status.
2. Every ID matches `AREA-SUB-NN`: capitals, a hyphen, capitals, a hyphen, two or more digits.
3. No ID appears twice anywhere in the SRS, including in interface specs.
4. No requirement text is empty.
5. Pri is P1, P2 or P3. Verify is Test, Demonstration, Inspection or Analysis.
6. Status is Proposed, Accepted, Deferred, Rejected, or `Superseded by <ID>`.
7. Every `Superseded by <ID>` names an ID that exists, is not the row's own, and is Accepted or itself
   Superseded.
8. Every Proposed or Accepted row outside `interfaces/` uses shall, should or may.

## README.md

9. It exists and has these `##` sections: Purpose, Scope, Out of scope, User classes, Conventions,
   Areas, Completeness summary, Change log.
10. It holds exactly one `<!-- srs-summary:start -->` followed by one `<!-- srs-summary:end -->`.
11. The Areas section names every area and interface file, and every `.md` link in it exists.
12. Every Accepted ID appears, spelled out after the word Accepted, in a Change log item that carries a
    `YYYY-MM-DD` date. An item may wrap onto indented continuation lines.

## trace.md, when it exists

A trace table is one whose header has an ID column.

13. If trace.md names any requirement ID, it holds a trace table, and that table has Verdict and
    Evidence columns.
14. Every ID is a requirement in this SRS, its Status is Accepted, and it appears once.
15. Every verdict is Met, Partial, Not met, Regressed or Cannot verify.
16. Met, Partial and Regressed rows name evidence. Cannot verify rows say why, in Notes or Evidence.

## At least one requirement

17. The SRS holds at least one requirement row. An SRS with none fails.
