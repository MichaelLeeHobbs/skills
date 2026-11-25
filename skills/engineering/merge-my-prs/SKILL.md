---
name: merge-my-prs
description: >-
  Go through the user's own open pull requests in one project, one at a time: "merge my PRs", "go
  through my PRs in the app repo", "merge or skip my PRs". Lists them, orders them by dependency, shows
  each one's risk and asks Merge, Skip or Fix, merging only on the user's answer for that pull request.
  Works on any code host and tracker through the shared tracker and change verbs. NOT for reviewing
  someone else's pull request (that is code review) or for writing code.
---

# Merge my pull requests

The user names a project. You go through **their own** open pull requests there, one at a time. For each
you show its risk and ask **Merge**, **Skip** or, when it cannot merge as is, **Fix**.

**You only read and merge.** No code edits, branch switches or commits. The checkout may be shared with
other work, so leave the working tree alone (fetching is fine). Steps use the shared
[tracker verbs](../tracker-verbs/SKILL.md) and its change verbs (installed alone? read
`skills/engineering/tracker-verbs/SKILL.md` in github.com/MichaelLeeHobbs/skills).

## 0. Find the project

Resolve the user's words to a checkout on this machine; if more than one fits, or none, ask once. Take the
repository from its remote and the base from the remote's default branch. If this session is not in that
checkout and your agent can start a session there, start one with this skill and stop here.

## 1. Build the queue

- `search-changes` for open pull requests the user authored in this repository. Other people's are never
  in the queue.
- **Dependencies:** B depends on A when B's target branch is A's source branch (stacked), B's branch
  carries A's commits that the base lacks, or B's description says so ("merge after A").
- **Order:** a pull request after those it depends on; otherwise oldest first.
- **Pre-merge checks:** read every description for steps due before merging (a read-only production check,
  a sign-off, a migration that must go first). Commands that read production are for the user to run.
- **Show the queue** in one message: one line per pull request (number, title, its ticket's key and title,
  what it depends on, whether it conflicts), then a **Before we start** list of pre-merge checks with
  their exact commands, which the user can run while you start on the others.

## 2. For each pull request, in order

`read-change` it fresh when you reach it: an earlier merge can change conflicts and targets. If it is
stacked on one that has not merged, review only its own commits.

Ask in one self-contained question: what it does in plain words; its ticket; its checks and how old they
are; whether it conflicts or how far behind it is; approvals; a **risk rating** (Low, Medium, High) with
reasons (what could break in production, migrations, infrastructure or config, auth, shared packages,
sensitive-data paths, lockfile drift beyond its own packages, user-visible behaviour, test coverage); its
pre-merge checks and their state; and any sign-off the merge stands for ("Merge counts as your sign-off
on the new role"). If it depends on one the user skipped, open with that and say what would ride along.

Offer **Merge** and **Skip** always, and **Fix** when it cannot merge as is (conflicts, red checks, a
failed or unrun pre-merge check, a needed rebase). Put your pick first. Recommend Skip or Fix for High
risk, red checks, conflicts, a failed or unrun pre-merge check, or a skipped dependency.

- **Merge:** `merge-change` it, which reads it again first. Then move on.
- **Skip:** record it with the reason, and move on.
- **Fix:** if your agent can start a separate session, start one in its own working copy with the pull
  request, branch, what is wrong and what done looks like (up to date with the base, conflicts resolved,
  checks passing, pushed to the same branch, a one-line report). Otherwise record what is wrong for the
  user. Move on without waiting.

An answer covers only that pull request. A check result the user reports is recorded against its pull
requests; one already passed over is offered again at the end.

## 3. At the end

1. **Fixed ones:** once a fix reports, `read-change` it yourself and offer it the same way.
2. **Summary:** merged, skipped (with reasons), being fixed, blocked by a skipped dependency. One line each.
3. **Tickets:** for each ticket a merged pull request belongs to, ask once whether to move it, and `close`
   or move it only on yes, as far as the project's rules allow. Recommend leaving it when it still has
   open pull requests or work.
4. **Deploy heads-up:** from the merged descriptions, what the user must do around the deploy (secrets,
   migrations, flags), each with its pull request and command.

## Check

Before the summary: every pull request in the queue has an outcome (merged, skipped, being fixed, blocked);
every one reported merged shows merged in a `read-change` made after the merge, and nothing merged without
the user's answer for it. Run the [tracker verbs check](../tracker-verbs/SKILL.md#check) for ticket writes.
