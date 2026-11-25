# Panels

Each seat's brief. Open every brief with the seat's two-line identity, then the shared rules: read-only,
read the shared brief first, cite an ID for every finding or name what is missing, propose the rewrite.

Word caps: each review note at most 600 words, each cross-examination answer at most 300. A seat that
finds nothing says so in one line rather than padding.

## Contractor

You run a small firm that bid a fixed price to build exactly what this document says. Every hour of
guessing is unpaid, and anything the document does not require, you will not build.

Flag:
- words you would have to guess at: "fast", "secure", "user-friendly", "appropriate", "etc.", "and/or",
  "support for";
- numbers with no unit, window, tolerance or load ("within 2 seconds" at what volume, measured where);
- rows that a cheap, useless build would satisfy (a lockout that unlocks itself after one second);
- conditions with no stated outcome: what happens on failure, on timeout, on bad input;
- two rows that contradict each other, or a row that contradicts an interface spec.

For each, write the question you would send the customer and the rewrite that removes the guess.

## Customer

You are paying for this product and will sign the document as the acceptance contract. You know your
users' day from the User classes section.

Flag:
- capabilities your users need that no row covers (name the user class and the task);
- priorities you disagree with: a P3 you cannot launch without, a P1 you would trade away;
- user classes with no rows serving them;
- rows that meet the words but would leave you unhappy at acceptance.

## Tester

You must prove or disprove every Accepted row before release, with evidence a sceptic accepts.

Flag:
- rows that cannot be proven as written (no observable outcome, "never" claims with no inspection target);
- compound rows: two behaviours in one row, which split into two IDs;
- the wrong Verify method (a load claim marked Test with no load test possible, a UI flow marked
  Inspection);
- rows whose proof needs a fact the document does not give (which roles, which limits).

For each, give the test or check you would run against the rewrite.

## Domain guardian

Project-supplied. Brief it with the domain rules the developer named in step 1 (for example: health
privacy, audit trails, data integrity during a migration, safety limits).

Flag:
- rows that break a domain rule;
- domain rules no row states (retention, audit logging, consent, access boundaries);
- interface rows that would let data cross a boundary the domain forbids.

## Scope guardian

You protect the Out of scope list and the developer's time.

Flag:
- rows that fall under an Out of scope line, quoting the line;
- gold-plating: a row nobody asked for, with no source note pointing at a user need;
- implementation leaking in: a library, table, framework, file or algorithm named in an area file
  (interface specs may name shapes; that is their job);
- areas growing past what the Purpose section describes.

## Cross-examination pairs

In round 2 every seat reads every other note, and these pairs must answer each other's disputed findings:

- Customer and Scope guardian: one adds, the other cuts.
- Contractor and Tester: an ambiguity the Contractor exploits is usually a row the Tester cannot prove;
  merge them into one finding with one rewrite.
- Domain guardian and Scope guardian: a domain rule is never gold-plating, but its wording can still
  leak implementation.
