---
name: github-issues
description: >-
  The GitHub layer for the shared tracker verbs: maps the ticket verbs (search, read, file, edit,
  comment, label, unlabel, assign, claim, release, link, nest, start, close, reopen, tie) and the change
  verbs (search-changes, read-change, open-change, merge-change) onto the gh command-line tool, with
  labels (not GitHub Projects) carrying status so it works in any repository with no setup beyond three
  labels. Use when a skill such as open-card, triage-card, shape-plan, run-plan, find-work, merge-my-prs
  or where-we-stand does a ticket or pull request step on GitHub. NOT for reviewing a pull request's
  code, Actions, or GitHub Projects boards.
---

# GitHub Issues layer

This skill turns each [tracker verb](../../engineering/tracker-verbs/SKILL.md) (installed alone? read
`skills/engineering/tracker-verbs/SKILL.md` in github.com/MichaelLeeHobbs/skills) into `gh` commands. The
verbs, their "done when" checks and the claim rules live there; this file only says how to do them on
GitHub. A project's own issue conventions win over this file, but not over the rules for every write.

## Before the first write

- **Where:** the commands below act on the current checkout's repository. When the issue is in another
  one, or you are outside a checkout, add `--repo` with the issue's repository to every `gh issue` and `gh
  label` call, and with the pull request's to every `gh pr` call. Write the issue's owner and name for
  `{owner}/{repo}` in every `gh api` path. When two sides are in different repositories, write
  `<owner>/<name>#<n>` for every `#<n>` below, and the issue's URL where a flag takes an issue.
- **Version:** run `gh issue edit --help`. If it lists `--parent` and `--add-blocked-by`, use the native
  sub-issue and dependency commands below. If not, `gh` is too old: use the fallback lines, and say so
  in the report.
- **Who can read it:** `gh repo view <owner>/<name> --json visibility --jq .visibility`, for the
  repository of every issue the write touches or names (and for `tie`, the pull request's). On `PUBLIC`,
  follow the public tracker rule in the
  [rules for every write](../../engineering/tracker-verbs/SKILL.md#rules-for-every-write). If the command
  fails, a repository you write to counts as public and one you only name counts as private.
  Editing leaves the old text in the edit history until someone deletes that revision on the web page.
- **Labels:** `gh` fails when a label to add or remove does not exist. Before adding one, run
  `gh api "repos/{owner}/{repo}/labels/<name>" --jq '[.name, .description] | @tsv'`, with `%20` for a space
  in the name. Only `HTTP 404` means it is missing: create it then, without `--force`, which overwrites a
  label that exists. The description shows whether a status label already means something else there.
  Remove a label only if `read` shows it on the issue. The three status labels:

```
gh label create triaged --color c5def5 --description "Judged; the verdict is on the issue"
gh label create plan-ready --color 0e8a16 --description "Holds a run brief a fresh session can build from"
gh label create in-progress --color fbca04 --description "Being built"
```

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

`gh issue list` returns 30 open issues unless told otherwise, so every search sets `--limit` and `--state`.
A list as long as its limit, or of exactly 1000 (the most `--search` returns), is cut off: raise the limit,
or at 1000 narrow the words or dates. The claim search is the exception, a fixed backstop.

When one side is private, the private keys rule in the tracker verbs decides, and these are the private-side
forms. `link` and `nest`: the comment or body line on the private issue only. `tie` to a public pull
request: a comment on the private issue with the pull request's URL, then `close done` by hand after the
merge. A public issue that duplicates a private one has none: ask whether to close it `not-planned` with a
reason that does not mention the private issue.

| Verb | Command | Read back |
| --- | --- | --- |
| `search` text | `gh issue list --state open --search "<words>" --json number,title,state,labels,assignees --limit 100`, then the same with `--state closed --search "<words> closed:>=<date six months ago>"` | The output is the result |
| `search` label or assignee | `gh issue list --state open --label <a> --json number,title,state,labels,assignees --limit 200` (or `--assignee <login>`, or both), then the same with `--state closed --search "closed:>=<date six months ago>"` | The output is the result |
| `search` claim | See [claim and release](#claim-and-release) | The output is the result |
| `read` | `gh issue view <n> --json number,title,body,state,stateReason,labels,assignees,comments,parent,subIssues,blockedBy,blocking,url` (old `gh`: drop `parent`, `subIssues`, `blockedBy`, `blocking`) | Nothing to check |
| `file` | `gh issue create --title "<title>" --body-file <file> --assignee @me --label <a>,<b>`, plus `--parent <n>` for a child (old `gh`: file it, then use the `nest` fallback). It prints the new issue's URL; the number is its last segment | `read` the new number |
| `edit` | `gh issue edit <n> --title "<title>" --body-file <file>` | `read`: `title`, `body` |
| `comment` | `gh issue comment <n> --body-file <file>` | `read`: the last of `comments` |
| `label` | `gh issue edit <n> --add-label <a>,<b>` (keeps the others) | `read`: `labels` |
| `unlabel` | `gh issue edit <n> --remove-label <a>,<b>`, only for labels `read` shows on it | `read`: `labels` |
| `assign` | `gh issue edit <n> --remove-assignee <old login> --add-assignee <login>` | `read`: `assignees` |
| `link relates` | `gh issue comment <n> --body "Related: #<m>"` and `gh issue comment <m> --body "Related: #<n>"` (another repository: `<owner>/<name>#<m>`). `read` returns comments but not GitHub's cross-reference events, so the link is the pair of comments | `read` both: each holds its `Related:` comment |
| `link blocks` | `gh issue edit <blocked> --add-blocked-by <blocker>`. Fallback: `edit` the blocked issue's body to start with `Blocked by #<blocker>` | `read <blocked>`: `blockedBy`, or the body line |
| `nest` | `gh issue edit <child> --parent <parent>`. Fallback: a `Parent: #<parent>` line in the child's body and a `- [ ] #<child>` line in the parent's | `read <child>`: `parent`, or both lines |
| `start` | `gh issue edit <n> --add-label in-progress`. It does not claim | `read`: `labels` |
| `close done` | Prefer `tie`; once its pull request merges, `unlabel in-progress` and `release`. By hand: `gh issue close <n> --reason completed --comment "<reason>"`, then `unlabel in-progress` | `read`: `state` CLOSED, `stateReason` COMPLETED |
| `close not-planned` | `gh issue close <n> --reason "not planned" --comment "<reason>"` | `stateReason` NOT_PLANNED |
| `close duplicate-of` | `gh issue close <n> --duplicate-of <m> --comment "<reason>"`. Old `gh`: `--reason "not planned" --comment "Duplicate of #<m>"` | `stateReason` DUPLICATE (old `gh`: NOT_PLANNED and the comment) |
| `reopen` | `gh issue reopen <n> --comment "<reason>"` | `read`: `state` OPEN |
| `tie` | A line `Fixes #<n>` in the pull request body, one line per issue (`Fixes #1, #2` closes only #1). Work that only touches the issue gets `Part of #<n>` instead, which links without closing. The merge closes the issue but leaves its labels: `unlabel in-progress` after it | `gh pr view <pr> --json closingIssuesReferences` lists `<n>` with the issue's `repository` |

## Change verbs

Pull requests, on the same repository rules as above. `gh pr list` also defaults to 30 open ones, so set
`--state` and `--limit`.

| Verb | Command | Read back |
| --- | --- | --- |
| `search-changes` | `gh pr list --state open --author @me --json number,title,headRefName,baseRefName,isDraft,createdAt,url --limit 100` (or `--search`, `--base`, `--head`) | The output is the result |
| `read-change` | `gh pr view <n> --json number,title,body,state,isDraft,author,headRefName,headRefOid,baseRefName,mergeable,mergeStateStatus,reviewDecision,statusCheckRollup,closingIssuesReferences,commits,url`, and `gh pr diff <n>`. `mergeable` CONFLICTING means it conflicts; UNKNOWN means GitHub has not computed it yet, so read again, never read it as no conflict. How far behind: `gh api repos/{owner}/{repo}/compare/<baseRefName>...<headRefOid> --jq .behind_by`. Each check in `statusCheckRollup` has its own status, result and completion time | Nothing to check |
| `open-change` | `gh pr create --base <base> --head <branch> --title "<title>" --body-file <file>` | `read-change`: `state` OPEN, `body` |
| `merge-change` | `gh repo view --json mergeCommitAllowed,squashMergeAllowed,rebaseMergeAllowed` for the allowed ways (the project's rules pick among them), then `gh pr merge <n> --merge` (or `--squash`, `--rebase`) `--match-head-commit <headRefOid from the read>`. Only when `isDraft` is false and every check has completed: with checks still running, `gh pr merge` arms auto-merge instead, and on a merge-queue base it queues. Never `--admin`, and `--auto` only when the user asks for it | `read-change`: `state` MERGED; `gh pr view <n> --json mergeCommit`, then `git fetch` and `git merge-base --is-ancestor <oid> origin/<default branch>`. Not MERGED: `gh pr merge <n> --disable-auto` and report it |

A stacked pull request (its base is another pull request's head branch) is retargeted to the merged
one's base only when that head branch is deleted; until then it still points at the old branch, and
merging it lands nowhere useful. Before `merge-change`, if `baseRefName` is not the default branch, check
whether that branch's pull request merged (`gh pr list --state merged --head <baseRefName> --json
number`). If it did, do not merge: retarget first with `gh pr edit <n> --base <default branch>` (a Fix,
with the user's yes), then read it again.

## Claim and release

**Claim:**

1. `read` the issue. Someone other than the user in `assignees`: stop and ask. A comment holding another
   session's marker: follow the claim rules in the tracker verbs.
2. Unless the claim is `mark-only`: `gh issue edit <n> --add-assignee @me` (or the user's login when
   `gh` runs as someone else).
3. `gh issue comment <n> --body-file <file>`, the file holding one visible line and the marker:

```
Claimed by agent session <session id>.
<!-- claude-session: <session id> -->
```

Use the id, never the session's title: a title can name private work.

**Release** edits the marker away, which keeps the history and stops `search` from finding the claim:

1. Find the comment's id: `gh api --paginate repos/{owner}/{repo}/issues/<n>/comments --jq '.[] | select(.body | contains("claude-session: <id> -->")) | .id'`.
2. `gh api -X PATCH repos/{owner}/{repo}/issues/comments/<comment id> -f body="Released by agent session <session id>."`

The assignee stays. Clearing a finished session's stale claim is the same two steps with its id.

**Search for a session's claims** as a backstop only: it covers the first 100 comments of each of the 200
most recently updated issues, open or closed, and misses a claim posted later. So first `read` every issue
the session knows it claimed; `read` returns every comment.

```
gh issue list --state all --search "sort:updated-desc" --limit 200 --json number,title,state,comments --jq '.[] | select(any(.comments[]; .body | contains("claude-session: <id> -->"))) | .number'
```

## Refusals

`gh` exits non-zero with the reason: `HTTP 403` or `404`, `Could not resolve to an issue`, or a locked
issue. Do not retry the same call. Follow the refused-write rule in the tracker verbs, and quote the
error in the report.

## Check

After each write, run its read-back from the table and compare with what you meant. Then run the
[tracker verbs check](../../engineering/tracker-verbs/SKILL.md#check). A non-zero exit from any `gh`
write is a failure even if a later read looks right: report it with the command and the error.
