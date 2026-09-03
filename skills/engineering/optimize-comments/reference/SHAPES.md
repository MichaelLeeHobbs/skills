# What the verdicts look like in real code

Read this when a comment's verdict is not obvious, or when you hit a section banner. The verdict list
and the routing table live in the skill body; these are the shapes that decide between them.

## Carries nothing

- **Restating the code.** The comment's words are the code's words. `// increment i` over `i++`.
- **Restating the name.** A doc comment whose first line writes the declaration out in prose. Cut that
  line and keep what follows, if anything does.
- **Commented-out code.** Version control has it, and nobody deletes it because nobody knows whether it
  still matters.
- **Changelogs, bylines and dates.** The history holds these, accurately.
- **Formatter directives**, and banners that separate what indentation already separates. See the
  exception below.
- **Mandated empty documentation.** `@param path the path`, which repeats the signature.

## Stale history

The shape that survives every pass, because it reads like the why that makes the code make sense. A
comment about a state the code can no longer be in: a completed migration, a removed option, "this used
to return null", "restored from the pre-1.0 version".

**The discriminator: could a reader still make the mistake it warns about?**

- **Stays.** A rejected alternative, because someone will propose it again tomorrow.
- **Goes.** A note that something was removed goes with the thing.

Both halves turn up in the same file often enough to be worth the test. "RESTORED, not invented. The
pre-1.0.0 preset carried all four patterns" is dead, because that preset cannot come back. "What was
rejected, so nobody re-litigates it" is live, because the rejected design can be proposed again.

## The section banner exception

A banner inside a long literal or a rules table is not noise. It carries structure the code has no other
way to express, so deleting it leaves the block structureless.

Extract a named constant and let the name replace the banner. In a file built from one big list this is
the highest-value rename available, and it is the case where rule 1 and the delete verdict point in
opposite directions.
