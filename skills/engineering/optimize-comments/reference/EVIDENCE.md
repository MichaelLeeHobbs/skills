# Evidence for comment decisions

Read this when deciding whether an explanation earns its space. Judge individual comments from their contents and consumers; repository-wide comment counts cannot settle their value.

## Count the reading a comment saves

A reader can recover a simple assignment or loop from nearby code. Repeating it increases the text they must process without reducing uncertainty.

A short explanation can save a search through callers, a specification, or a dependency's issue history. Keep it when it states a consequential fact accurately and is placed where the reader needs it. Do not repeat a long external explanation when a short reason and a precise reference suffice.

Comment word counts describe the edit but do not prove improvement. A smaller result can lose essential information; a larger result can prevent a costly misunderstanding. Judge each added or retained sentence by the interpretation or action it changes.

## Tests enforce behavior; explanations preserve reasons

A regression test shows which behavior is expected and detects some departures from it. It may not explain the external constraint that requires the expectation. Without that reason, a future editor may consider both the implementation and test mistaken.

Keep a short local explanation when it prevents that error. Delete prose that only repeats obvious mechanics. A test, comment, and decision record can serve different readers without each repeating the whole story.

Check the actual assertion before treating a behavior as covered. An observed measurement can instead depend on a workload, environment, or external system; preserve the conditions needed to interpret it and report missing evidence or coverage honestly.

## Caller documentation has a different reading context

A caller may read a declaration or editor hover without opening the body. Units, accepted ranges, side effects, and ordering guarantees can belong there even when the caller is inside the same package. Export visibility alone does not determine whether the explanation is useful.

A reader editing the implementation already has its mechanics in view. Inline comments should supply the constraint, reason, or brief orientation that changes how they interpret those mechanics. Do not force a factual explanation into an imperative when stating the fact is shorter and clearer.

## Age and aggregate statistics do not prove a comment is wrong

A comment older than nearby code is a candidate for verification, not evidence of a contradiction. It may still state a stable requirement. Compare the claim with the implementation and available requirements before editing it.

The fraction of comment edits that accompany code edits does not tell you how often code edits omit needed comment updates. Those are different conditional probabilities. Do not use one to dismiss the other failure mode.

Likewise, a survey grouping licenses or tool directives with non-explanatory comments does not establish that those comments are removable. They have consumers other than the person reading the algorithm. Verify their role before changing them.

## A useful check can fail

Before deleting or shortening a comment, name what information would disappear and where the reader can recover anything still needed. Check directives with their consuming tools when an authorized change affects them. Preserve unresolved explanations and record unavailable evidence.

A pass with no changes can meet every check. A pass that reduces words while deleting an unexplained compatibility constraint cannot.
