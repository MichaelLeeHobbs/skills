# Attribute, choose and prove a fix

Work through the targets in order: the top 10 clusters from `cluster`, then every `fixed` record with a
non-empty `fails_in` that no cluster fix already covers, then the proof canary (CANARIES.md). Do this in
a fresh context with the most capable model available, the cluster list, the token table from step 1 and
read access to the source.

## 1. Attribute each side

For the cluster's fg target and bg target, find the token a fix should change and label how you know:

| Label | Evidence |
|---|---|
| `declared` | the row's source names the token and the scope (the collector read `var(--x)` from the winning rule) |
| `value` | the source was empty, and exactly one token in that theme resolves to the rendered colour |
| `ambiguous` | two or more tokens resolve to that colour; list them |
| `literal` | a colour literal in a component or style rule; name the file and line |
| `unattributed` | none of the above; say what you checked |

Then choose the **fix target**:
- Follow the alias chain and target the last token in it whose value is set inside a theme scope, never a
  shared primitive (`--gray-500`) that other tokens alias. Say how many tokens alias the primitive, so
  the reader sees why it was not the target.
- A component-scope override (`.card { --text-muted: ... }`) is its own target: the root token's fix does
  not reach inside it. A light-only override with no dark counterpart is a common cause.
- A literal's target is the rule that holds it. Its fix is a token that already exists for that role,
  not a new hex value.
- An `ambiguous` or `unattributed` side has no target. The cluster goes to the decision list with its
  candidates and is never PROVEN.
- A theme kept in a script object that you cannot override in the page: the fix is BLOCKED (reason
  `no injection`), with the predicted table from `candidates` kept and marked predicted.

Usually one side is enough. Prefer the text side; change the background only when the text token already
passes on every other surface it sits on and the background is the outlier.

## 2. Choose a value

List the palette's existing values for that role in the target's theme (the steps of the scale the token
already uses), nearest to the current value first. Run `candidates` with the target (its source as the
rows carry it, its theme and side) and those values over every node row of that theme. Pick the first
candidate with `still_failing` 0 and `regressed` 0. If none has both:

- the candidate with the fewest `regressed` that fixes the cluster goes to the decision list with its
  regressions named (the screens and the other side's token);
- if no existing value fixes it, say so, and give the need and the worst ratio so a designer can add a
  step.

`regressed` counts only nodes in this run's rows; screens outside the run can still regress, which is
what step 3 checks.

## 3. Prove it in place

For each chosen fix:

1. Pick the screens: every collected screen with a FAIL row in the cluster (up to 100, worst first), plus
   20 screens chosen with a recorded seed from the other screens whose rows use the target in that theme.
2. For each screen, load it once in the theme, collect as usual, then inject the override at its scope
   (for example `[data-theme=dark]{--text-muted:#9ca3af}`), collect again with ids suffixed `-fix<n>`,
   and remove the override. No reload is needed between fixes on one screen.
3. Run `measure` on the after rows. Compare by `key`:
   - every cluster row is `PASS` after, and no row that was `PASS` before is `FAIL` after: **PROVEN**;
   - the same, but the screens checked are fewer than the screens that use the target (step 1 capped or
     sampled them): **PARTIAL**, with "checked n of m screens using the token";
   - any cluster row still fails or any row regressed: **REFUTED**. Name the rows. A row predicted to
     change that did not change means the attribution was wrong: go back to step 1 for that cluster once,
     then leave it REFUTED.
4. **Combined check.** For each screen touched by two or more fixes, inject all of them together and
   collect once more. A regression that shows only together marks every fix involved REFUTED.

Write PROVEN only with the after rows in front of you. A fix nobody re-rendered is BLOCKED or predicted,
never PROVEN.

## 4. Fixed colours

A `fixed` record whose `fails_in` is empty is not a finding: a brand banner that passes in every theme is
fine. It goes in the appendix, and when its source is a literal, in the prevention drafts as a candidate
to tokenise. A fixed colour that fails is a target like any cluster.
