# Decisions reach the SRS when they are made

A decision about how the product behaves is a requirement change. If the SRS waits for the build, the
decision lives only in a plan's "what would change" list, the old rows keep their old wording, and
verification measures the code against requirements nobody holds any more. So the SRS changes in the same
change that records the decision. Until the developer accepts the new rows, the Proposed rows citing the
decision are the record; once accepted, verification reports them Not met until the code lands. Either
way the gap is visible.

## The rule for the repo's agent instructions

Look in the repo's agent context files (for example `AGENTS.md`, or whichever file your agent loads for
this repo) for a rule with this effect. If none says it, propose adding this text, word for word, and
add it only on the developer's yes:

```
## Decisions that change behaviour update the SRS

When a decision sets how the product behaves (a debate, a ticket, a design review, a chat), add the
docs/srs rows it implies as Proposed rows (a Proposed replacement for an Accepted row) in the same change
that records the decision, even when the build comes later. Each row cites the decision's ID; the
decision record keeps the why. Once accepted, verification reports the rows Not met until the code
lands. A decision that sets no product behaviour says "SRS: none" in its record.
```

If the developer declines, write `Decisions rule: declined, <date>` under Decisions in the SRS README's
Conventions, carry on with the SRS work, and say once in your report that decisions made in this repo
will not reach the SRS automatically. When that line is present, do not propose the rule again.

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

Every other record that no SRS file cites is a `decision-uncited` finding. A folder with no records at
all is a `decisions-empty` finding, because pointing the check at the wrong folder would otherwise pass.
The decisions folder and the SRS folder must not contain each other. The summary line says how many
records were checked; zero checked records is worth a second look.

## Turning the check on in a repo that already has decisions

Records written before the SRS existed would all be flagged at once, and many teams never edit an
accepted record. Do not edit old records to silence the check. Instead:

1. Ask the developer which record is the first one the SRS should answer for (often the next one to be
   written). Record that in the README's Decisions convention: `Checked from <file name>`.
2. Pass it as `--decisions-since <file name>`. The script skips records whose file name sorts before it,
   which works when file names start with a number or a date.
3. For older records that still set live behaviour, offer them in batches of 3 to 5 as mode 2 work, the
   same as bootstrap. Never a wall.

Decisions kept outside files (tracker tickets labelled as decisions, comments on a pull request) cannot
be checked by the script. List them with your tracker and check each by hand: its ID or key appears in
the SRS, or it says it sets no behaviour.
