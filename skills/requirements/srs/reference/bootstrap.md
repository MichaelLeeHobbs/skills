# Bootstrap

How to draft a first SRS from a repo that already exists. The output is Proposed rows with sources,
presented a few areas at a time. Nothing becomes Accepted until the developer says so.

## Where to look, in order

Earlier sources state intent; later ones show what was built. Intent wins when they disagree, and the
disagreement is itself a question for the developer.

1. **Product and user docs.** README, user guides, capability or feature lists, help pages. A capability
   list with proof per row is the richest single source.
2. **Design and decision records.** Design docs, architecture decision records, roadmaps. "Won't",
   "not planned" and "non-goal" lines become Out of scope lines, not rows.
3. **Tickets and plans,** if the developer points you at them. An open ticket is a Proposed row at most.
4. **Interfaces.** Public API routes, message schemas, CLI commands and flags, plugin or connector
   contracts. Contracts other code builds against become interface specs.
5. **Data.** Schemas and migrations show what the product stores. Draft a row only for a rule the user
   would notice (retention, uniqueness, who may read it), never for a column.
6. **Tests.** Test names often state behaviour plainly. A test shows that something exists, not that
   it is required, so a row whose only source is a test says so in its source note.
7. **Config and limits.** Timeouts, quotas, size limits and feature flags often hide requirements
   nobody wrote down.

## Drafting rows

- Group by what the user experiences, not by code module. An area is something a user class would
  recognise ("Sign-in", "Channel deployment"), and a sub-area is a coherent slice of it.
- Area codes are short capitals (`AUTH`, `CHAN`). Sub-area codes too (`USR`, `SES`). Write both into the
  area file's headings so readers can decode IDs.
- Turn each claim into one row of the form "The system shall ...". Split compound claims: "creates and
  emails a report" is two rows.
- Strip the how. "Stores sessions in Redis" becomes "shall keep a user signed in across server restarts"
  if that is the real need, or nothing if it is only a design choice.
- Pick Verify by what would really prove it: Test when an automated test can, Demonstration for
  end-to-end flows a person runs, Inspection for "never" rules shown in code or config, Analysis for
  load, capacity and security arguments.
- Pick Pri from the evidence: a documented, shipped capability is usually P1 or P2; a roadmap item is
  P2 or P3. Say which you assumed when it is not obvious.
- Write a source note for every row, under its table.

## Presenting a batch

For each of the 3 to 5 areas: its purpose in one line, its rows, then any conflicts you found between
sources. Close with one question the developer can answer in a line ("accept all but 04, defer 07").
Apply the answers, add the change-log lines, run the check, then present the next batch. Keep a running
list of areas not yet presented so nothing is skipped.
