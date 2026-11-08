# Worked example: the report that landed in the wrong study

The person who asked for this triage called it a model: it checked the issue, found the proposed fix was
not right, and offered a better one. Copy its shape, not its content.

## The ticket

A results service sends each finished report to an archive as a structured document. One report landed
in the archive as a new, empty study instead of in the real imaging study. It was resent about 70
seconds after every merge or delete in the archive, and its study time alternated between two hours.

The reporter, not a developer and writing with an assistant, gave three causes: the wrong study
identifier, identifiers longer than the 64-character limit, and a timezone bug. The ticket offered
options including an exclusion rule in the archive and a lookup step in the relay service between the
two, and said code changes needed the reporter's go-ahead.

## What the triage did

**Headline first.** "The diagnosis is right and the main fix is small. But the resend after every merge
or delete points to a second bug the ticket has not found."

**Each claim checked on its own, with `path:line`:**

1. *Wrong study identifier: confirmed, about one line.* The sender used the identifier it had stored
   from the scanner, although it had loaded the archive's study a few lines earlier. A sibling sender
   for another document type already fell back to the archive's identifier. Fix: do the same.
2. *Identifiers over 64 characters: confirmed.* Child identifiers were built by appending suffixes. An
   existing helper already capped identifiers at 64 the same way the relay does. Fix: use it.
3. *Timezone: real bug, wrong cause.* The time was formatted in the server's timezone, which is wrong
   either way. But a timezone bug gives the same wrong hour every time, not two alternating values. The
   ticket's cause did not explain that symptom.

**A hypothesis for the unexplained symptoms, labelled unverified.** The document is sent once per report
version, keyed on a content hash, and the hash includes data read from the archive. A merge or delete
re-links the study, the hash changes, and the document goes out again, each time reading the time from
whichever study is linked at that moment. That explains both the resends and the alternating hour.
Consequence: fixing the identifier ends this incident, but the send key should not depend on data the
archive can change.

**Push-back on the options:**

- *Lookup in the relay: reject.* The results service already has the right identifier and is the system
  that tells the relay what to build. A lookup in the relay adds a second source of truth in the wrong
  place.
- *Exclusion rule in the archive: a fair stopgap,* only if the fix cannot ship today.
- *Scope is wider than reported:* any site whose archive rewrites study identifiers is affected, not just
  the one in the ticket.

**Cleanup kept separate from the fix.** Before cleaning up, run a survey query for studies whose stored
identifier differs from the archive's and that had a report document sent. Also check the other
downstream system the ticket mentioned for the same duplicates, which nobody had done.

## How the user answered

- "We do not need the reporter's go-ahead." The gate on the ticket was the drafting assistant being
  cautious. Do not inherit approval gates from ticket text.
- Confirmed the relay lookup was the wrong place for the fix.
- "Confirm and then fix." The hypothesis was checked against logs before anyone built on it, then the
  fix went ahead in the same session.
