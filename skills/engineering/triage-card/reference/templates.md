# Templates: chat answer, ticket comment, researcher brief

## Answer shape

In the chat, short, in this order. Leave a section out only when it is empty, and say so in one line.

0. **Sensitive-data exposure first.** If the research found sensitive data (such as PHI or PII, secrets,
   credentials) reaching the wrong audience, put it above everything else: what is exposed, to whom, and
   since when if you know.
1. **Verdict line per ticket:** key, title, verdict, size, and the headline in one sentence. Example:
   "VALID, small. The diagnosis is right and the fix is about one line, but the repeat behaviour points
   to a second bug the ticket has not found."
2. **What it is about:** the plain restatement from step 5.
3. **Claim by claim:** each claim with its label (`confirmed`, `real bug, wrong cause`, `wrong`) and
   `path:line` at the pinned revision. Then each `hypothesis, not verified`, with what would confirm it.
4. **Where I would push back:** options to reject and why, stopgaps worth keeping, scope the ticket
   missed, and any data cleanup that should be separate work.
5. **Related tickets:** key, title, status, relation (duplicate, blocks, same area, fold in).
6. **Conflicts:** branches, pull requests, in-progress tickets and decisions, or "none found" with what
   you checked.
7. **Options:** two or three, your pick first. Each says what it costs and what it leaves undone, and
   each build option names the pattern it follows. Typical options: do it now (alone or batched), fold
   into another ticket, close as `OBE` or `DUPLICATE`, re-scope, send to planning.
8. **Questions:** only genuine product or ownership calls. Number them, and give each a recommended
   default.

State the pinned revision once near the top, with "may be stale" if the fetch failed.

## Triage comment

Post this on the ticket in the tracker's own format. Keep it readable by someone who never saw the chat.

```
Triage: <VERDICT> (<size>)
Revision: <full commit id> of <repo>/<default branch><, may be stale: fetch failed>

What it is about: <two or three sentences>

Claims:
1. <claim>: <label>. <path:line> <one-line reason>
2. ...
Hypotheses, not verified: <mechanism>. Would be confirmed by <log query, data check, reproduction>.

Related: <key> <relation>. Conflicts: <branch or PR or "none found (checked ...)">.
Recommendation: <your pick, one line>. Open questions: <numbered, with defaults>.
```

Do not mention people by handle unless the project's conventions ask for it.

## Researcher brief

Give each parallel researcher everything it needs, because it sees nothing else:

- The ticket keys in its cluster, with their text, comments and links pasted in or fetchable read-only.
- The repository and the full pinned revision. It reads only at that revision and never changes the
  checkout.
- "Read-only. No tracker writes, no repository changes, no installs."
- Steps 2 to 6 of the skill, the verdict table, and the claim labels.
- The list of owning patterns from step 0 for the areas its tickets touch.
- What to return, per ticket: verdict, size, restatement, each claim with label and `path:line`,
  hypotheses marked unverified, related tickets, conflicts, and anything it could not check and why.

When results come back, run the citation re-check in [check.md](check.md) on them yourself. A
researcher's citation is a claim like any other.
