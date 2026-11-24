---
name: github-issues
description: >-
  The GitHub Issues layer for the shared tracker verbs: maps search, read, file, edit, comment, label,
  claim, release, link, nest, start, close and tie onto the gh command-line tool, with labels (not
  GitHub Projects) carrying status so it works in any repository with no setup beyond three labels. Use
  when a skill such as open-card, triage-card or where-we-stand does a ticket step and the project
  tracks work in GitHub Issues. NOT for pull request review, Actions, or GitHub Projects boards.
---

# GitHub Issues layer

This skill turns each [tracker verb](../../engineering/tracker-verbs/SKILL.md) (installed alone? read
`skills/engineering/tracker-verbs/SKILL.md` in github.com/MichaelLeeHobbs/skills) into `gh` commands. The
verbs, their "done when" checks and the claim rules live there; this file only says how to do them on
GitHub. A project's own issue conventions win over this file.

## Before the first write

- **Where:** run `gh` inside a checkout of the repository, or add `--repo <owner>/<name>` to every `gh
  issue` call. In `gh api` paths, `{owner}/{repo}` resolves from the checkout; outside one, write the
  owner and name.
- **Version:** run `gh issue edit --help`. If it lists `--parent` and `--add-blocked-by`, use the native
  sub-issue and dependency commands below. If not, `gh` is too old: use the fallback lines, and say so
  in the report.
- **Status labels,** created or refreshed in one go. `--force` makes this safe to repeat, because this
  layer owns these three labels' colour and description:

```
gh label create triaged --color c5def5 --description "Judged; the verdict is on the issue" --force
gh label create plan-ready --color 0e8a16 --description "Holds a run brief a fresh session can build from" --force
gh label create in-progress --color fbca04 --description "Being built" --force
```

- **Any other label** a write needs: `gh label list --search "<name>" --json name` and look for the exact
  name. Create it without `--force` only if it is missing, so a project's own colours survive.
  `gh issue create` and `gh issue edit` fail on a label that does not exist.

## The contract

| Tracker idea | On GitHub |
| --- | --- |
| Status | Labels `triaged`, `plan-ready`, `in-progress`; open or closed for done. No Projects board |
| Claim by the user | Assignee |
| Claim by a session | A comment holding the hidden marker `<!-- claude-session: <session id> -->` |
| Parent and child | Native sub-issues |
| Blocks | Native issue dependencies, or a `Blocked by #<n>` line at the top of the blocked issue's body |
| Done | `Fixes #<n>` in the pull request, closed on merge to the default branch |
| Review state | None: the open pull request that says `Fixes #<n>` is the review state |

Keep the marker text exactly as written: other sessions and other agents find claims by it.

## The verbs

Write bodies and comments to a scratch file and pass `--body-file`; shell quoting mangles markdown.

| Verb | Command | Read back |
| --- | --- | --- |
| `search` text | `gh issue list --state open --search "<words>" --json number,title,state,labels,assignees --limit 100`, then the same with `--state closed --search "<words> closed:>=<date six months ago>"` | The output is the result |
| `search` label | `gh issue list --label plan-ready --json number,title,labels` | The output is the result |
| `search` claim | See [claim and release](#claim-and-release) | The output is the result |
| `read` | `gh issue view <n> --json number,title,body,state,stateReason,labels,assignees,comments,parent,subIssues,blockedBy,blocking,url` (old `gh`: drop `parent`, `subIssues`, `blockedBy`, `blocking`) | Nothing to check |
| `file` | `gh issue create --title "<title>" --body-file <file> --assignee @me --label <a>,<b>`, plus `--parent <n>` for a child. It prints the new issue's URL; the number is its last segment | `read` the new number |
| `edit` | `gh issue edit <n> --title "<title>" --body-file <file>` | `read`: `title`, `body` |
| `comment` | `gh issue comment <n> --body-file <file>` | `read`: the last of `comments` |
| `label` | `gh issue edit <n> --add-label <a>,<b>` (keeps the others) | `read`: `labels` |
| `link relates` | `gh issue comment <n> --body "Related: #<m>"` (another repository: `<owner>/<name>#<m>`). GitHub shows the cross-reference on both issues | `read <n>`: the comment |
| `link blocks` | `gh issue edit <blocked> --add-blocked-by <blocker>`. Fallback: `edit` the blocked issue's body to start with `Blocked by #<blocker>` | `read <blocked>`: `blockedBy`, or the body line |
| `link duplicates` | `close <n> duplicate-of <m>` below | As for `close` |
| `nest` | `gh issue edit <child> --parent <parent>`. Fallback: a `Parent: #<parent>` line in the child's body and a `- [ ] #<child>` line in the parent's | `read <child>`: `parent`, or both lines |
| `start` | `claim` first, then `gh issue edit <n> --add-label in-progress` | `read`: `labels`, `assignees` |
| `close done` | Prefer `tie`. By hand: `gh issue close <n> --reason completed --comment "<reason>"`, then `gh issue edit <n> --remove-label in-progress` | `read`: `state` CLOSED, `stateReason` COMPLETED |
| `close not-planned` | `gh issue close <n> --reason "not planned" --comment "<reason>"` | `stateReason` NOT_PLANNED |
| `close duplicate-of` | `gh issue close <n> --duplicate-of <m> --comment "<reason>"` | `stateReason` DUPLICATE |
| `tie` | A line `Fixes #<n>` in the pull request body, one line per issue (`Fixes #1, #2` closes only #1). Work that only touches the issue gets `Part of #<n>` instead, which links without closing | `gh pr view <pr> --json closingIssuesReferences` lists `<n>` |

## Claim and release

**Claim:**

1. `read` the issue. Someone other than the user in `assignees`: stop and ask. A comment holding another
   session's marker: follow the claim rules in the tracker verbs.
2. `gh issue edit <n> --add-assignee @me` (or the user's login when `gh` runs as someone else).
3. `gh issue comment <n> --body-file <file>`, the file holding one visible line and the marker:

```
Claimed by agent session <session title or id>.
<!-- claude-session: <session id> -->
```

**Release** edits the marker away, which keeps the history and stops `search` from finding the claim:

1. Find the comment's id: `gh api --paginate repos/{owner}/{repo}/issues/<n>/comments --jq '.[] | select(.body | contains("claude-session: <id>")) | .id'`.
2. `gh api -X PATCH repos/{owner}/{repo}/issues/comments/<comment id> -f body="Released by agent session <session title or id>."`

The assignee stays. Clearing a finished session's stale claim is the same two steps with its id.

**Search for a session's claims** (the 200 most recently updated issues, open or closed):

```
gh issue list --state all --search "sort:updated-desc" --limit 200 --json number,title,state,comments --jq '.[] | select(any(.comments[]; .body | contains("claude-session: <id>"))) | .number'
```

## Refusals

`gh` exits non-zero with the reason: `HTTP 403` or `404`, `Could not resolve to an issue`, or a locked
issue. Do not retry the same call. Follow the refused-write rule in the tracker verbs, and quote the
error in the report.

## Check

After each write, run its read-back from the table and compare with what you meant. Then run the
[tracker verbs check](../../engineering/tracker-verbs/SKILL.md#check). A non-zero exit from any `gh`
write is a failure even if a later read looks right: report it with the command and the error.
