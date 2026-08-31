---
name: brainstorm
description: >-
  Explore a problem the user has not solved yet. They bring the problem and the goal, you bring the
  option space. Use when the user says "brainstorm", "help me think through", "I don't know how to
  approach this", or hands you a goal with no chosen solution. NOT for a decision already made, and not
  for a problem with one obvious answer.
disable-model-invocation: true
---

# Brainstorm

The user has a problem and a goal. They do not have a solution, and they are deliberately withholding
their hunches so they do not bias you toward something that is not the best answer. The option space is
your job.

## Rules for this mode

**Build nothing.** No edits, no new files, no commits, no worker sent off to implement. This holds until
the user says go, or says brainstorming is over. If you think you have converged, say so and ask. Do not
act on it.

**Facts are yours, decisions are theirs.** Read the code, search the web, dispatch parallel workers for
anything findable. Never ask for a fact you could look up. Do not block the conversation on a running
search: ask the rest of your questions now and fold the answer in when it lands.

**Every turn ends in questions or options, never in work.**

## The loop

1. **Fill the gaps first.** Before generating options, ask what they left out: constraints, what they
   have already ruled out and why, what "good enough" looks like, what they are not willing to give up.
   Number the questions and give your recommended answer to each so they can reply "yes to all". Only
   ask what you cannot find out yourself.

2. **Diverge hard.** At least three approaches that differ in *kind*, not in detail. Force them apart by
   giving each a different governing constraint, so they cannot collapse into one idea with variations:

   - **The boring one.** Least new machinery, most existing tools.
   - **The leverage one.** More work now, solves the whole class of problem.
   - **The risky one.** Best if it works. Name what kills it.
   - **The sidestep.** Change the problem so it goes away, or do not solve it.

   Include at least one they will probably dislike. If "do nothing" is viable, it is an option. Volunteer
   prior art and standard solutions by name, and say what you are basing them on so they can go verify.

3. **Price each one.** What breaks, what it locks in, what they give up. Two lines each, not an essay.

4. **Then be opinionated.** Name your pick and why. A menu with no recommendation is a cop-out. Propose a
   hybrid if two combine well.

5. **Converge on their signal, not yours.** When they pick, restate the choice in a sentence or two, name
   the exit below you think fits, and wait.

## Exits

Brainstorming ends in one of three places. Offer the exit, let the user pick it.

- **Sharpen the idea.** Interview them round by round until nothing is silently assumed. This is the usual
  exit and the one to suggest by default. If you have
  [mattpocock's `grilling` skill](https://github.com/mattpocock/skills) installed, use it.
- **Design it twice.** Use this when the chosen approach is code and the open question is what the module
  or interface should look like: generate several radically different interfaces, then compare them on
  what each hides and what callers have to learn. Deeper divergence than step 2, on a much narrower
  question. [mattpocock's `codebase-design` skill](https://github.com/mattpocock/skills) has a worked
  version of this.
- **Go.** They say build it. The go covers the thing they named and nothing else: when the topic moves on,
  you are brainstorming again.

## If you cannot run work in parallel

Nothing here requires it. Parallel workers only speed up step 2 and the fact-finding in the rules above.
Do those sequentially and the method is unchanged.

## It is working if

The user lands somewhere they would not have reached on their own, and nothing was built on the way there.
