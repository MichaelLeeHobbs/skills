# Decisions reach the SRS when they are made

A decision about how the product behaves is a requirement change. If the SRS waits for the build, the
decision lives only in a plan's "what would change" list, the old rows keep their old wording, and
verification measures the code against requirements nobody holds any more. So the SRS changes in the same
change that records the decision, and verification reports the new rows Not met until the code lands.
That keeps the gap visible.

## The rule for the repo's agent instructions

Look in the repo's agent context files (for example `AGENTS.md`, or whichever file your agent loads for
this repo) for a rule with this effect. If none says it, propose adding this text, word for word, and
add it only on the developer's yes:

```
## Decisions that change behaviour update the SRS

When a decision sets how the product behaves (a debate, a ticket, a design review, a chat), add or
revise the docs/srs rows it implies in the same change that records the decision, even when the build
comes later. Each row cites the decision's ID; the decision record keeps the why. Verification reports
the rows Not met until the code lands. A decision that sets no product behaviour says "SRS: none" in its
record.
```

If the developer declines, carry on with the SRS work, and say once in your report that decisions made
in this repo will not reach the SRS automatically.

## Recording one decision

1. Find every row the decision touches: rows it narrows, contradicts or makes obsolete, and behaviour
   it adds that no row covers. Search all SRS files, not just the obvious area.
2. Draft the rows as in mode 2. A Proposed row is revised in place; an Accepted row gets a replacement
   row with a new ID. Each source note cites the decision:
   `DATA-HL7-09: source: decision 0042-hex-escape-switch, issue 194`.
3. Put each default the decision fixes in its own row. "Off by default" is behaviour.
4. Show the rows with the decision and ask the developer to accept the wording in the same answer. The
   decision ("build the switch") settles the behaviour, not the text you drafted. On their yes, apply mode
   4 and quote their words. If they do not answer, the rows stay Proposed with the decision cited, which
   still records it.
5. In the decision record, name the row IDs it set.

Never write "SRS: update when built" in a plan. That is the gap this page exists to close.

## What counts as a decision's ID

`srs-lint --decisions <dir>` reads every `.md` file in that folder and its subfolders, except
`README.md`, `index.md` and any file with `template` in its name. A record's ID is the token after an
`ID:` line if it has one, and otherwise its file name without `.md`. The record is cited when that ID
appears as a whole token anywhere in the SRS (a source note or a change-log line). The script skips a
record that:

- says `SRS: none` on a line of its own (it decides no product behaviour; give the reason on that line), or
- has a status of Proposed, Draft, Rejected, Superseded, Deprecated or Withdrawn, written as a
  `Status: <word>` line or as the first word under a `## Status` heading.

Every other record that no SRS file cites is a `decision-uncited` finding.

Decisions kept outside files (tracker tickets labelled as decisions, comments on a pull request) cannot
be checked by the script. List them with your tracker and check each by hand: its ID or key appears in
the SRS, or it says it sets no behaviour.
