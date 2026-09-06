---
name: optimize-docs
description: >-
  Audit the prose documentation in a repository and make it smaller: delete what the code already says,
  fix what the code contradicts, and move a real decision into a dated record. Grades every claim it can
  against the repository instead of grading prose by how it reads. Use for "clean up the docs", "our docs
  are out of date", "too much documentation", "the README is wrong", "prune the docs", "these docs
  drifted", or before handing a repository to someone new. NOT for code comments, which is
  optimize-comments, and NOT for files that instruct an agent, which is optimize-agent-instructions.
---

# Optimize docs

Every record can go out of date. That is not the test, and using it as one deletes correct documentation:
a decision record ages too, and you keep it because it carries a date.

Two questions sort a doc instead. **Can a reader recover this fact from the code?** If yes, the code is
the home and the doc is a second copy free to disagree with it. **When the code moves under this fact,
does anything break?** A path in a doc breaks a link check. A behaviour written in prose breaks nothing,
and nobody finds out.

This pass is usually a subtraction. It ends with fewer words than it started, and the survivors are the
words something checked. Not always: a tree whose defect is wrongness rather than bulk can finish larger,
because stating a contradiction correctly costs more words than the false sentence it replaces. What goes
up either way is the share of what remains that something checked.

## Step 1: scope it, and find what you may not delete

**Ask, and wait.** Each answer changes what you are allowed to touch.

1. **Which tree.** A directory, a docs site, one file.
2. **Is anything here published or contractual?** A hosted docs site, customer-facing API reference, a
   compliance artifact, a runbook someone gets paged into. These get correctness verdicts only. Never
   delete one.
3. **May you change code**, or docs only? Moving a fact into a test, or a rename, is a code change and
   needs the tests to prove it.
4. **Is there a decision record already**, in any shape, and does the project want one? Step 5 depends
   on the answer.

If you cannot ask, take the conservative branch and say so in the report: correctness only, no deletions.

**Never delete** licence and notice files, `CONTRIBUTING`, `CODE_OF_CONDUCT`, `SECURITY`, issue and
pull-request templates, anything a site generator or a build consumes, or the changelog.

**Hand off instead of doing it here.** Code comments go to `optimize-comments`. Any file that instructs
an agent goes to `optimize-agent-instructions`. Those have different readers and different rules.

## Step 2: extract every checkable claim, then check it

Do this before you form an opinion about any sentence. Prose gets graded on how it reads, which is why
documentation reviews find nothing. Make the repository grade it instead. Mine every doc in scope for
claims a machine can settle:

- file and directory paths
- commands, and every flag they are given
- symbol, endpoint and route names
- environment variables, configuration keys, ports
- version numbers and dependency names
- links, internal and external

Check each one against the repository, and run the read-only commands. A command nobody has run since it
was written is the most common false statement in a README; a flag renamed two releases ago is the
second. [reference/CLAIMS.md](reference/CLAIMS.md) gives the check for each kind and the way each check
passes while the claim stays false.

**Never run a command that writes, deploys, publishes, migrates or sends**, even when a doc says to. Mark
it unchecked. **If you cannot run commands at all**, check paths, symbols and links by reading and report
every command claim as unchecked with that reason. An unrun check is never a pass.

Record four counts for step 6: claims found, checked, failed, and unable to check with the reason.

Then the split that drives the rest of the pass. **A section holding no checkable claim is a section
nothing can verify.** That is not a deletion by itself. It is where the weight sits, and it enters step 3
carrying the burden of proof.

## Step 3: give every section a verdict

Every section in scope gets exactly one verdict, written down before you change anything, and the list
accounts for all of them including the ones you keep. Judge by heading-level section rather than by file:
a useful file usually holds three good paragraphs and a page of restatement.

- **The code says it.** Recoverable by reading the code or running `--help`. Delete. If it is only hard
  to recover because the code is badly named or badly split, say so, and put the repair in the code.
  **Recoverable is not the same as cheap.** A fact spread thin across many files is recoverable only by
  reading all of them, so the reader guesses instead and guesses wrong. Keep those, and make each one
  carry a claim a check can hold. [reference/SHAPES.md](reference/SHAPES.md) has the shape.
- **Generatable.** A hand-typed API reference. Generate it from the source, or delete it and link.
- **It contradicts the code.** A claim from step 2 failed.
- **Unverifiable.** No checkable claim, and no decision inside it.
- **A decision.** It says what was rejected and why. Route it to step 5.
- **Navigation.** It says where things live. Keep it under the rule in step 4.
- **Domain language.** It says what a word means here. Keep it. Nothing in the code defines this.
- **Human procedure.** Install, deploy, on-call. Keep it only once you have executed it.
- **Keep.** Say in one clause what it gives a reader that the code does not.

Where a doc holds a true fact in the wrong place, this says where it goes. The homes differ in one way:
whether the record breaks loudly when the code moves under it.

| The fact | Where it belongs | When the code changes under it |
|---|---|---|
| What a function or a flag does | the code, or a generated reference | cannot go stale, or regenerates |
| A behaviour that must keep holding | a test named for the behaviour | the test fails, loudly |
| Why this design and not the obvious one | a dated decision record | dated, so a reader knows to check |
| What a word means in this domain | a glossary | rarely moves, and moves visibly |
| Where a thing lives | a map naming files only | a link or path check fails |
| How a human runs this | a procedure whose commands you ran | the command fails when someone runs it |
| A finished migration, a removed option | nowhere. The history holds it | n/a |

**Prefer the record that executes.** A test outranks a decision record, which outranks a doc paragraph.
Never write one fact into all three. The copies drift, and someone files the drift as a defect later.

**When a doc and the code disagree, do not assume the doc is wrong.** It may be the only surviving record
of the intent, which makes the code the defect. You cannot tell which from the file, so report both
readings and never quietly rewrite the doc to match the code.

**Check:** every section carries a verdict, with none left unjudged.

## Step 4: hold the map to pointers

A navigation layer is the one kind of doc that pays back the tokens it costs, under one rule. **It names
files and says what lives there. It does not say what the code does.** "The retry policy lives in
`client/retry.ts`" fails a path check when somebody moves the file. "The client retries three times with
backoff" becomes false in silence. Cut every verb about runtime behaviour out of the map, and keep the
map shorter than a listing of the tree it describes.

## Step 5: build no new home for what failed the test

This is how a pruning pass ends up adding documentation: half the findings route into a decision record
that did not exist, the directory gets created to hold them, and the prose lands there instead of
leaving.

- Create a decision-record directory only when you have at least one decision with an alternative someone
  could genuinely propose again, and the project said yes in step 1.
- **If the project already keeps one, use the shape it has.** A single append-only register file is as
  valid as a directory of records, and one may carry a convention for where an entry goes and how two
  people appending at once resolve a conflict. Follow it: restructuring a decision log is not this pass.
- A record carries a date and is not edited afterwards. A later decision supersedes it with a new record.
- **The history is the archive.** Deleted prose is recoverable from version control. Do not paste it into
  a file on the way out.

## Step 6: report

Show the diff, the verdict counts from step 3, and the documentation word count before and after. **The
word count is context, not the score.** Report it and do not optimise it. A pass that shrinks a tree by
deleting correct prose has made it worse, and the number cannot tell the difference.

List these separately rather than folding them into a total:

- every claim that failed, with both readings
- every section kept that carries no checkable claim, and the one clause justifying each
- every fact you moved, and where it went
- every check you could not run, and the reason

Then give the number that predicts the next pass: the share of the claims you checked that were already
wrong. Say it out loud. Documentation drifts because nothing fails when it does.

**Offer this once, and write it only if asked.** The claims from step 2 are a check somebody could run on
every build: link checking, path existence, and the read-only commands executed for real. It is the only
thing here that stops the regrowth, and it adds a file, which is why it is an offer rather than a step.

## It is working if

Every section got a verdict, each defensible on its own rather than as a total. Every deletion is a fact
you can point at in the code or a fact a named test holds. Nothing you deleted was the only record of a
decision, and nothing you shortened sat under an unresolved contradiction.

The measure is not how many files you deleted. It is that the share of surviving prose carrying a
checkable claim went up. Deleting three whole files while leaving the unverifiable paragraphs inside the
survivors moves the problem rather than fixing it.

**A tree that needs no changes passes this too**, on the same evidence as any other run: claim extraction
covering every doc, a verdict on every section, and a checked count you can show. Never manufacture an
edit to justify the pass. A wrong deletion costs a fact nobody can recover.
