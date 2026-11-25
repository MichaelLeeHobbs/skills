---
name: tracker-verbs
description: >-
  The shared list of issue-tracker verbs (search, read, file, edit, comment, label, claim, release, link,
  nest, start, close, reopen, tie) that other skills write their ticket steps in, and what a tracker layer must
  provide for each. Read it when a skill says to do a step "with the tracker verbs", or when writing a
  layer that maps the verbs onto a tracker (GitHub Issues, Jira, Linear, a project's own board). NOT a
  task on its own: it files and changes nothing until another skill asks.
---

# Tracker verbs

Skills in this repo never name a tracker. A step that touches tickets uses one of the verbs below, and a
tracker layer turns each verb into real commands. The same method then works on GitHub Issues, Jira or
anything else, and only the layer changes.

## Find your layer

Use the first that exists:

1. **The project's own rules.** A project skill or doc that maps these verbs, or states its ticket
   conventions (board, fields, labels, how tickets close), wins over the layers below. The
   [rules for every write](#rules-for-every-write) still apply.
2. **An installed layer skill** for the tracker the project uses, such as `github-issues` for GitHub.
3. **No layer.** Do each verb by hand with the tracker's own command-line tool or API, meeting the
   "Done when" column. Before the first write, tell the user in one line per verb how you mapped it.

Never skip a verb because no layer covers it. A step that cannot be done is reported as not done.

## Words

- **Ticket:** an issue, card or work item. Its **key** is its id (`#42`, `PROJ-42`).
- **The user:** the person you work for. "Assign to the user" means them unless they named someone.
- **Session id:** whatever id your agent gives the current run. An agent with no such id makes a short
  random one at the start of the task and uses it for the whole task.

## The verbs

| Verb | Does | Done when (read back) |
| --- | --- | --- |
| `search <query>` | Find tickets by text, label, state, assignee or session claim, over open and recently closed tickets | You hold the list with each key, title, state and labels |
| `read <key>` | Get one ticket: body, comments, labels, state, assignee, links, parent and children | Nothing to check; it writes nothing |
| `file` | Create a ticket with title, body, assignee, labels and an optional parent | `read` shows every field as written |
| `edit <key>` | Replace the title or body | `read` shows the new text |
| `comment <key>` | Add a comment | The comment shows in `read` |
| `label <key> <labels>` | Add labels and keep the existing ones; create a label the tracker lacks first | `read` shows the old labels plus the new |
| `unlabel <key> <labels>` | Remove labels and keep the rest | `read` shows the rest, without those |
| `claim <key>` | Assign the ticket to the user and mark it as worked by this session (see [claims](#claims)) | `read` shows the assignee and this session's mark |
| `release <key>` | Remove this session's mark; the assignee stays | `read` shows no mark for this session |
| `link <key> <type> <other>` | Relate two tickets: `relates` or `blocks`. A duplicate is not a link: use `close <key> duplicate-of <other>` | The link shows from both tickets, or the layer's fallback text is on the ticket. One of them private: from the private one only |
| `nest <parent> <child>` | Make one ticket a child (sub-ticket) of another | `read <child>` shows the parent |
| `start <key>` | Mark the ticket in progress. It does not claim: a session that builds the ticket runs `claim` itself | `read` shows it in progress |
| `close <key> <outcome>` | End the ticket as `done`, `not-planned` or `duplicate-of <other>`, with a one-line reason | `read` shows it closed with that outcome |
| `reopen <key>` | Reopen a closed ticket, with a one-line reason | `read` shows it open |
| `tie <key> <change>` | Put the ticket's key into a change (branch, commit or pull request) so merging the change closes or links the ticket | The change shows the key, and the ticket shows the change once the tracker sees it |

## Status labels

These names mean the same thing on every tracker, so a skill can ask for one without knowing the board:

- `triaged`: someone judged the ticket and the verdict is on it.
- `plan-ready`: the description holds a build brief that a fresh session can build from, alone.
- `in-progress`: being built. A layer whose tracker has a native in-progress state uses that for `start`
  instead and says so.

Never change a label that exists. If one of these already means something else there, ask the user before
using it.

Done is closed. A layer may map `close done` to its tracker's review state when the project's rules say
finished work waits there; the layer says so.

## Claims

A claim says who is working a ticket now, so two sessions do not build the same thing.

- **Claim to work, not to file.** Triaging or building a ticket claims it. Filing one does not.
- **Before claiming, `read` it.** Assigned to someone other than the user: stop and ask. Marked by
  another session: if you can tell that session is still running, stop and name it; if it has finished,
  remove its mark and say so; if you cannot tell, ask the user.
- **Release when this session is done with it:** closed, handed to another session, folded into another
  ticket, or left in a review state. At the end of a task, `read` every ticket this session claimed to
  confirm its mark is gone, then `search` for this session's mark as a backstop for any you forgot.

## Rules for every write

- Write only to tickets in the task's set. A neighbour you only read gets no writes.
- **Public trackers.** Before the first write, find out who can read each tracker the write touches or
  names, and for `tie` the repository the change goes to. One you would write to counts as public when you
  cannot tell, here and in every skill that says "public tracker". On a public one, keep these out of every
  title, body, comment, branch name and commit message you write for the ticket: internal hostnames and
  network addresses, account and resource ids, paths on someone's machine, customer names and data, log lines or
  query results holding any of those, session titles, and anything from a private repository or tracker
  (names, paths, code, ticket keys). State the conclusion instead ("one caller in a week of network logs").
  Search the text for these before each write, because an edit does not remove what was published. If the
  ticket makes no sense without a detail, show it to the user and ask first; a general go-ahead to file
  does not cover it.
- **Private keys stay private.** A verb that would put a private ticket's key on a public ticket or change
  (`link`, `nest`, `close duplicate-of`, `tie`) is written and read back on the private side only, whatever
  its "Done when" says. A ticket you only name counts as private when you cannot tell. If the verb has no
  private-side form, ask the user.
- `read` back after each write and compare with what you meant. A write you cannot read back is a
  failure, not a success.
- A refused write (no permission, archived, locked) is not retried as is. Put the note on a ticket you
  can write to that is no more public than the refused one, name the refused key in it, and tell the user.
  If there is none, only tell the user.
- Keep a write's error visible. Never send its output somewhere it can vanish, or a failure reads as a
  success.

## Writing a layer

A layer is a skill or project doc that gives, for each verb: the exact command, how to read it back, how
a refusal looks, a fallback where the tracker lacks the feature, and the private-side form if the verb has
one. It also says how to tell who can read the tracker, where the status labels live, how a missing label
gets created without duplicating it or changing one that exists, and what `close done` means on that
tracker. `github-issues` is the worked example.

## Check

Before reporting, list every tracker write this task made with its read-back result. Any write whose
read-back does not match, or that was never read back, goes in the report as a failure with the key and
the verb. A task that made writes and cannot show this list has not passed. On a public tracker, search
each read-back for the details the public tracker rule lists. One that got through without the user's yes
is a failure: report it first, with how that tracker removes old revisions.
