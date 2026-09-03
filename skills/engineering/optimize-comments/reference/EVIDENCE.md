# What the research says

Read this once, to calibrate what to expect before a pass. It is not needed during one.

## The mix you will find

Pascarella and Bacchelli hand-classified 2,000 Java files across Apache Spark, Eclipse CDT, Google
Guava, Apache Hadoop, Google Guice and Vaadin, sorting every comment into 6 top and 16 inner categories.

- **59% of comment lines** fell into categories that say nothing about the readability or maintainability
  of the code they sit next to: licenses, ownership, commented-out code, IDE directives, auto-generated
  stubs, noise.
- **Rationale, the *why*, was the rarest explanatory category.** Comments restating what the code does
  outnumbered it by roughly 21 to 1 by block count, 5,346 to 256.
- Comment-to-code ratios in those projects ran from **31% to 56%**.

So the volume is real, and the part everyone says comments are for is nearly absent. This is why the pass
both cuts and adds, and why a deletion-only pass leaves the gap exactly where it was.

## Why stale comments are the ones nobody touched

Fluri et al. found that when a comment changes at all, **97% of the time it changes in the same commit as
the code**, and in six of eight systems the figure was above 90%.

The failure is therefore rarely someone editing code and forgetting the comment beside it. It is a
comment nobody has opened in years while the code moved. That is what makes comment age versus code age
the highest-yield search in the pass, rather than reading a file top to bottom.

The same work found that newly added code barely gets commented, which is why the file someone has just
edited hard is where the missing *why* will be.

## Why a contradiction outranks a tidy-up

Work on code-comment inconsistency reports that an inconsistent change is about **1.5 times more likely
to lead to a bug-introducing commit** than a consistent one, and that the effect is strongest right after
the inconsistency appears and fades over time.

A contradiction between a comment and its code is therefore the valuable output of the pass, not a
cosmetic defect. It also means resolving one by rewriting the comment to agree with the code destroys the
evidence: the comment may be the surviving record of the intent, and the code may be the bug.

## The two positions on whether comments should exist at all

Robert Martin holds that a comment is a failure to express something in code, and that a perfect language
would need none. John Ousterhout disagrees, and the disagreement is worth knowing because it marks the
boundary this skill draws.

Ousterhout names two things code cannot carry. An interface, meaning everything a caller needs in order
to use something without reading its body, since if a caller must read the implementation there is no
abstraction. And design rationale, meaning why this approach rather than the obvious one.

Both agree on the part that matters here: a comment at the same level of abstraction as the code will
restate it. A useful comment moves down for precision or up for intuition, and if it uses the same words
as the code, it is at the same level.

## Sources

- Pascarella and Bacchelli, "Classifying code comments in Java open-source software systems", MSR 2017.
- Fluri, Wursch and Gall, "Do Code and Comments Co-Evolve? On the Relation between Source Code and
  Comment Changes".
- Recent work on code-comment inconsistency and bug introduction, including
  [arxiv.org/abs/2409.10781](https://arxiv.org/abs/2409.10781).
- Ousterhout, *A Philosophy of Software Design*, and the recorded discussion with Robert Martin at
  [github.com/johnousterhout/aposd-vs-clean-code](https://github.com/johnousterhout/aposd-vs-clean-code).
