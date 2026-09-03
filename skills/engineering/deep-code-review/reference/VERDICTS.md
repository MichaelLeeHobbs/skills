# Verifying findings before they reach the report

This is the lead's job between the reviewers returning and the report being written. Reviewers
over-report by design, because a reviewer that filters hard misses things. Filtering is this pass.

## The closed vocabulary

Give every finding you check exactly one verdict. The list is closed on purpose. Pick one, do not invent
a softer word.

- **CONFIRMED.** You read the anchor lines and the claim holds. Mark it verified in the report.
- **DOWNGRADED.** Real but less severe. Restate at the correct severity and say why.
- **REFUTED.** You checked and it is wrong. Drop it, but record it if a reviewer argued it forcefully, so
  the next reviewer does not raise it again.
- **BLOCKED.** You could not check it. Say so, name what would settle it, and keep it in the report at
  its claimed severity, flagged unverified.

## The anti-laundering rule

BLOCKED ranks *better* than a soft CONFIRMED.

Never write CONFIRMED for something you pattern-matched, inferred from a name, or "checked" by re-reading
the reviewer's own prose. That disguises an unverified claim as a verified one, and a CRITICAL the user
trusts because it says verified is worse than one honestly marked unverified. If you are tempted to write
CONFIRMED without having opened the file, the verdict is BLOCKED.

## Before dropping a finding, name why it is a false positive

The recurring shapes:

- **Preference wearing a bug's clothes.** A style or architecture choice, or "this should be extracted",
  with no defect behind it. Reviewers are told not to send these and some arrive anyway. If a slice is
  nothing but these, the diagnosis is "this area is clean". Say that rather than passing a list of
  cosmetics through.
- **Hypothetical versus actual.** The failure needs an input the system cannot produce. Ask what actually
  calls this. Careful here: a defect unreachable only because of what happens to call it today is latent,
  not false, and it keeps its severity.
- **Missing context.** The guard exists one layer up and the reviewer did not look. Check the caller
  before dropping *or* keeping.
- **Already settled.** It repeats a trade-off the project accepted deliberately. Cite where, and drop it.

Do not apply this filter to security and correctness findings by default. Be readier to keep a plausible
injection or data-leak finding flagged uncertain than to drop it for tidiness. The filter exists to kill
noise, not to shrink the report.

## Check the classes, not only the severities

A reviewer that filed a latent defect as a note made the exact mistake the class rubric exists to
prevent, and it is the most common grading error. The tell is a finding whose reasoning contains "nothing
uses this yet" or "harmless today". Those are facts about the callers, not about the defect, and the
callers change.

Promote it, and say in the verification note that you did. A reader who sees a promotion learns more
about your judgement than one who sees a clean list.
