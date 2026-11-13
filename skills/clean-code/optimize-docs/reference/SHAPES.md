# What the verdicts look like in a real repository

Read this when a section's verdict is not obvious. The verdict list and the routing table live in the
skill body; these are the shapes that decide between them.

## The paraphrase of one function

A "how it works" section walking a single function statement by statement. It reads like understanding,
it carries nothing a reader could not get from the function, and it is wrong the moment the function
changes.

Verdict: the code says it. If the function is genuinely hard to follow, the repair belongs in the
function.

## The hand-typed API reference

Parameter tables, return types and option lists, maintained by hand beside a source that already declares
all of them.

Verdict: generatable. Generate it, or delete it and link. One exception survives: a behaviour the
signature cannot express, a unit, a range, an ordering guarantee. That sentence stays and the table
around it goes.

## The second quickstart

A launch tutorial, a getting-started page, and install steps in the README. Three copies of one
procedure, at most one of them right.

Verdict: keep the canonical procedure and replace redundant copies with links after checking that no unique prerequisites or steps disappear. Execute only the commands step 2 permits. If execution is prohibited or unavailable, preserve the procedure and mark those claims unchecked; lack of execution does not establish that a copy is wrong.

## The aspiration

Documentation of a design nobody built, or built halfway. An interface with no implementation, a flag
nothing reads.

Verdict: it contradicts the code, and the discriminator is whether anyone still intends to build it. If
yes it is a plan, and a plan belongs in the issue tracker with a date on it. If no, delete it.

## The architecture doc describing the previous architecture

The refactor landed and the diagram did not move. Tell it apart from a decision record, which is allowed
to describe a past state because it is dated and says what got chosen instead.

Verdict: it contradicts the code. The migration narrative goes. If a rejected alternative is buried in
it, that part becomes a dated record and nothing else does.

## The FAQ nobody asked

Questions the author imagined. A real one is traceable to a person: an issue, a support thread, the same
question in three code reviews.

Verdict: unverifiable, unless an answer carries a checkable claim or defines a domain word, and a domain
word belongs in the glossary rather than here.

## The fact spread across many files

Which implementations are registered and where. What is allowed to depend on what. A list whose whole
value is that it is exhaustive. Every line of it is recoverable from the code, and recovering it means
opening every file it covers, so a reader assumes instead and assumes wrong.

Verdict: keep, against the usual rule, because the cost of recovery is the point rather than the
possibility of it. Then make it pay its way: name the files, state the count, so the sentence fails a
check when the set changes. An exhaustive claim that nothing counts is the one most likely to be quietly
false, because the day somebody adds the eighth member is the day it stops being true and nothing says so.

## The hand-maintained changelog

Verdict: never delete it. It is history, and it is the one doc whose age is not a defect.

## The glossary defining the obvious

A glossary earns its place on words that mean something specific here and something else everywhere else.
Entries defining general terms are noise, and they make the load-bearing entries look optional.

Verdict: delete the general entries and keep the local ones.

## The empty heading

A stub from a template, a "TODO: document this", a heading with one sentence of throat-clearing under it.

Verdict: unverifiable. Delete it. An empty heading is a promise nobody made, and it makes the document
look incomplete rather than short.

## The doc that is only right because nobody uses that path

A procedure for a deployment target, a platform, or an option that no longer gets exercised. Nothing
contradicts it, because nothing touches it.

Verdict: ask whether the path is still supported. For a supported path, perform the checks step 2 permits and report any prohibited or unavailable checks as unchecked while preserving the procedure. For an unsupported path, report the obsolete code alongside the doc; changing code still requires the scope from step 1.
