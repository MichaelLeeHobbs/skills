# Conventions: finding the one way, and writing it as keys

Every percentage needs a quoted rule. Never infer the convention from the most common family: that
makes the number circular.

## Where to read

At the recorded commit:
- your agent's context file at the repo root and every scoped one in the package;
- the project's skills, and the docs and examples they point to;
- the contributing guide and decision records;
- lint configuration: a restricted-import or restricted-syntax rule is a stated convention.

## Two readers, then freeze

Have two fresh readers extract conventions independently from the same files, with this brief:

> For each job listed, quote every sentence or rule that says how this codebase should do it, with its
> file and line. Do not summarise. Do not add rules that are not written. If nothing is written for a
> job, say "silent".

Compare the two lists. Resolve every difference by reading the cited line with the most capable model.
Then write the records and freeze them for the run.

## Records

One line per rule in `conventions.jsonl`:

```
{"id":"C1","job":"fetch","source":"AGENTS.md:42","quote":"Fetch server data with the hooks in src/api/hooks, which wrap apiClient.","date":"2025-06-03","status":"stated","allow":["query-hook:react-query>apiClient"],"deny":[],"scope":["/src/"]}
```

- `date`: when that line last changed, from version control.
- `status`: `stated` when the quote names a mechanism you can write as keys; `vague` when it does not
  ("keep data fetching consistent"). A vague rule gets counts and no percentage.
- A job with no record is silent.

## Writing keys

A key is `trigger:outer>terminal` with `*` for any segment, using the triggers in SCAN.md and the
markers in the sink table. Write keys only for what the quote says:

| Quote says | allow | deny |
|---|---|---|
| "use the hooks over apiClient" | `query-hook:react-query>apiClient` | |
| "never call axios directly" | `*:*>*` | `*:axios>*`, `*:*>axios` |
| "all logging goes through logger" | `*:logger>*` | |
| "no fetching in effects" (paired with an allow rule) | | `effect:*>*` |

`scope` limits the rule to paths (pattern dialect in ALGORITHM.md); empty means the whole package. A key
that names a marker the sink table lacks is a mistake in the record: fix it before the gate.

## What the tool decides

`census` evaluates every key; no model decides whether a site conforms. Its `withheld` field says why a
percentage is not shown:
- `stale`: no in-scope site matches any allow key. The rule describes code that is not there (a renamed
  module, a migration that never happened). This is a finding for the decision list, not a run failure.
- `not_applicable`: the scope holds no site of the job.
- `vague`, `unsampled`, `escapes`, `residual`, `range`: see ALGORITHM.md.

**Contradictions.** Two `stated` rules for one job whose scopes overlap and whose allow keys share no
family are a contradiction. Report both percentages side by side, with each rule's date, and put the
choice in the decision list with the newer rule as the default unless the code clearly follows the older
one.
