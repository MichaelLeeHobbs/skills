---
name: where-we-stand
description: >-
  Check in on a session's work after time away and report what is really true: "/where-we-stand",
  "status?", "where are we?", "are we done?", "can we archive this?", "everything is merged and deployed,
  update the tickets and give me a status". Rebuilds what the session committed to, verifies each item
  against live state (pull requests, the base branch, pipelines, deploys, tickets, other sessions it
  started), finds steps only the user can do (secrets, settings, permissions, migrations, manual deploys),
  tidies what is safe, and reports in a few lines. NOT for starting new work, and it never merges, deploys
  or pushes anything the user has not already approved.
---

# Where we stand

The user runs many sessions across many projects and comes back to this one cold, sometimes days later.
They may say "everything is merged and deployed". **Treat that as a claim to check, not a fact.** They
may be thinking of another session, a pull request may still be open, a pipeline may have failed, or a
deploy may never have run. Your own earlier messages are claims too: the world may have moved since you
wrote them.

The job: find out what is really true, finish the safe housekeeping, and tell the user in seconds what is
left, especially anything only they can do.

Ticket steps use the shared [tracker verbs](../../engineering/tracker-verbs/SKILL.md) (installed alone?
read `skills/engineering/tracker-verbs/SKILL.md` in github.com/MichaelLeeHobbs/skills). Find your tracker
layer there before the first ticket write.

## 1. Rebuild what this session owns

Before checking anything, list what this session committed to, from the conversation (and its summary,
if it was compacted):

- the original ask, and any side work it took on;
- tickets it filed, claimed or worked (also `search` for tickets carrying this session's claim);
- pull requests, branches and working copies, in every repository it touched;
- other sessions or background agents it started, if your agent can start them; test stacks; anything it
  published;
- every promise it made ("I'll merge when green", "verify after deploy", "follow-up ticket").

## 2. Check each item against live state

Use primary sources, never memory. Use the project's own tools where it has them (a pipeline wait
script, a release skill's verify step).

| Item | Check |
| --- | --- |
| Pull request | State (open, merged, declined), and whether its merge commit is on the base branch (for git: `git fetch`, then `git log origin/<base> --grep "<pull request number>"`) |
| Pipeline | The base branch's pipeline for that merge commit passed |
| Deploy | It reached the environment: the release pipeline, the running image or version, a health probe, or the project's verify step. "Merged" is not "deployed" |
| Ticket | `read` it. Its state matches reality (merged work is not left in progress, open work is not closed), and this session's claim is released |
| Other session | Running or finished, open pull request or not, and what its last report said. Check its result, not just its report |
| Promised check | Run it now if it can run now (an HTTP probe, a log query, a read-only database check) |

## 3. Find what only the user can do

Read the pull request descriptions, diffs, ticket comments and this session's own heads-up lines for
manual steps, and check each one where you can:

- **Secrets and environment variables:** a new key in config schemas, example env files, infrastructure
  or task definitions. Check it exists with a read-only describe call on the secret store, without
  reading its value.
- **App settings, feature flags, permissions and roles** someone must set in the running app.
- **Migrations or data fixes** that run by hand.
- **Manual deploys:** a stack, an integration engine's channels, a release only the user starts.
- **Third-party setup:** a webhook, an API key issued to another system, DNS, a vendor ticket.

If you cannot check one, it goes under **Needs you** with exactly what to do and where. Never guess
"probably done".

## 4. Tidy what is safe

Asking for this check means "update the tickets and wind down finished work as needed". It does not
authorize merging, deploying or pushing anything the user has not already approved.

- Move tickets to the state the evidence supports, with `start`, `close` and `release`, following the
  project's ticket rules. `read` each one back.
- If your agent can start sessions, wind down the ones this session started that are finished: idle,
  nothing uncommitted, no open pull request, their work verified. Never one that is running or waiting on
  the user.
- Remove this session's leftover working copies, test stacks, background jobs and temporary branches
  whose work is merged.
- Leftover work: do it now if it can be done now (a check that runs minutes after a deploy is part of
  this task). Otherwise `file` at most one follow-up ticket with a checklist, assigned to the user and
  `link`ed to the ticket it came from.

## 5. Report briefly

No wall of text. The whole reply fits on one screen, about 15 lines, in this order:

1. **One verdict line.** "All done and deployed; safe to archive." or "Not done: pull request 651 is
   merged but not deployed, and one thing needs you." When the user's claim was wrong, say so plainly in
   this line.
2. **Done:** one or two lines, in the ticket's terms.
3. **Needs you:** one line each, the action and exactly where or how (a command that runs pasted as is, a
   settings path, a link). Leave the heading out if there is nothing.
4. **Couldn't verify:** one line each, with why. Leave it out if there is nothing.
5. **Tidied:** one line listing the tickets moved and sessions wound down.
6. **State:** exactly one of `Done, safe to archive` (nothing open, running or uncommitted, no claim
   held), `Waiting on you` (what), `Waiting on something else` (what, and what happens when it finishes),
   or `In progress` (what is next).

Leave out how you checked things, unless the user asks.

## Check

Before sending, go through the report line by line. Every "done", "merged", "deployed" or "released"
must point to a check made in this run (step 2 or 3), not to memory or an earlier message. A line without
one moves to **Couldn't verify**. Run the [tracker verbs check](../../engineering/tracker-verbs/SKILL.md#check)
for the ticket writes. `Done, safe to archive` is a failure if a `search` for this session's claim still
returns a ticket.
