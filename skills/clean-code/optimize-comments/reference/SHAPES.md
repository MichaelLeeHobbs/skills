# What the verdicts look like in real code

Read this when a comment's disposition is ambiguous. Judge the information it supplies and the role it serves.

## Redundant narration

`// Increment the retry count` above `retryCount++` adds nothing. Delete it. A doc comment that repeats a declaration's name or `@param path the path` can lose that repetition, while retaining any actual caller contract and required documentation structure.

Do not use shared vocabulary as a shortcut: "`timeout` is in seconds; the upstream API expects milliseconds" repeats a name but adds a consequential unit boundary.

## A compatibility reason

"Rhino reuses const bindings across loop iterations" can prevent a well-intended rewrite from reintroducing a runtime bug. Keep the short reason when it applies to the supported runtime, even if a regression test already covers the behavior. Verify the runtime constraint before adding or retaining it as fact.

## Behavior already covered by a test

A test asserting retries occur in order does not explain why an external service requires that order. Keep the local constraint. Delete a comment merely walking through the retry loop when its mechanics are already clear.

Do not paste the test into the comment. State only the reason or contract the reader cannot readily recover from the nearby code.

## Tool directives

Preserve active directives such as `prettier-ignore`, formatter enable/disable markers, lint suppressions, compiler annotations in comments, and coverage controls. They affect tool behavior and are not disposable prose. A short explanation of why a suppression exists can also prevent a wrong edit.

If a directive seems obsolete, identify its consumer and the condition it suppresses. Remove it only when that change is in scope and the relevant tool confirms the intended behavior. Preserve an unknown directive and report the missing evidence.

## Stale history

Ask whether a reader could still make the mistake the history warns about. A completed migration, removed option, or old name can go when no supported path or live constraint depends on knowing it. Keep a rejected alternative someone could plausibly propose again.

Do not delete a comment solely because it predates the code. Check the claim. Preserve license-required attribution regardless of whether version history records the author.

## A reason longer than its code

A one-line workaround can need two sentences explaining a dependency defect and the condition for removing it. Keep both when each changes what a future editor can safely do. Put a lengthy design discussion in an existing decision record when appropriate, retaining the shortest local explanation or pointer the reader needs.

## Section banners

Delete banners that repeat structure already clear from names and indentation. Keep a short label that organizes a long literal or rules table and helps a reader locate the relevant group.

Extract a named constant only when code changes are authorized and the extraction improves the code. Do not split a coherent table solely to eliminate its headings.

## Commented-out code

Remove abandoned implementation when version history preserves it and it has no current explanatory role. A small example of a rejected approach may be useful if it demonstrates the precise error a future editor would otherwise repeat. Retain only enough to explain that constraint.
