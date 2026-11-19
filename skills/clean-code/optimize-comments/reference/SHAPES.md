# How the verdicts land

Read this when a comment's verdict is not obvious. Each case names the verdict and why.

## Narration

`// Increment the retry count` above `retryCount++`: Delete. So is `// Loop over the users`, `// Return
the result`, and every comment that says in English what the next line says in code. These are the
comments most likely to go stale, because nothing forces anyone to update them.

## Doc comments that repeat the signature

```ts
/**
 * Gets the user.
 * @param id - The user id.
 * @returns A promise of the user.
 */
async function getUser(id: UserId): Promise<User>
```

Delete the whole block. The summary repeats the name, the tags repeat the types. An agent reads the
signature anyway.

```ts
/** Throws NotFound when the user was hard-deleted; soft-deleted users resolve with `deletedAt` set. */
async function getUser(id: UserId): Promise<User>
```

Keep: a caller rule the types miss. It is also a fact about the contract, not a description of the
body, so it does not drift when the body changes.

## Class and file summaries

`/** Service for managing orders. */` above `class OrderService`: Delete. A file header that lists what
the file contains: Delete. A header that says "this module must not import from `ui/`; it runs in the
worker": Keep, a rule the code cannot state.

## Units and ranges

"`timeout` is in seconds; the upstream API expects milliseconds": Keep, a caller rule. Better still, if
code changes are allowed, rename to `timeoutSeconds` and delete the comment. A name cannot drift.

## A deliberate oddity

```js
// Rhino reuses const bindings across loop iterations; use let.
```

Keep: an agent would "modernize" this to `const` and reintroduce the bug. If a test pins it and its
name says why (`keeps let in loops: Rhino reuses const bindings`), Move to test and delete the comment.

## Behaviour a test pins

`// Retries must run in order` with a test named `retries run in order`: Move to test only if the reason
is there too. Order alone is not the reason. If the reason is "the payment gateway rejects
out-of-order idempotency keys", either the test's name or assertion message says that, or the comment
stays as one line.

## Tool directives

`// eslint-disable-next-line no-await-in-loop -- gateway rate-limits parallel calls`: Keep, a fixed
exception with its reason. A directive with no reason: Keep the directive; add the reason only if you
found evidence for it. A directive that suppresses nothing any more is a code change: remove it only
when the linter, run without it, confirms nothing new fires.

## Commented-out code

Delete, always. Version control has it. If it shows an approach that fails for a reason someone would
retry, write that reason as one line and delete the code.

## History notes

"Migrated from v1 in 2023", "Renamed from fooBar", "Added for the Q3 launch": Delete. History lives in
version control. "Do not switch to the streaming parser: it drops trailing records (issue 412)": Keep.
That is a rejected alternative an agent could propose again, with a pointer.

## Section banners

`// ===== Helpers =====`: Delete. A short label grouping rows in a long data table or rules table:
Keep, if it is the only way to find a group.

## An excuse for a shortcut

```js
// Quick fix: wait for the list to render before scrolling. Fine for now.
setTimeout(scrollToSelected, 100);
```

Excuse. The comment does not state a fact that forces the timer; it argues the timer is acceptable.
Leave it, and report the finding: the scroll should run after the render it depends on, so the fix is
to find that hook or event, or to file an issue. Deleting the comment would leave the timer looking
intended, and the next agent would copy it.

Compare `// Vendor rejects a second call within 1s (API docs, rate limits)` above a one-second delay:
Keep, an outside fact. The test is whether the comment names a constraint outside the code, or only
asks the reader to accept the code. "Works around the race", "good enough", "for now" and "hack, but"
with no named cause are excuses.

## Long explanations

A paragraph explaining a design decision: Shorten to one line and a pointer to the decision record or
issue that holds the rest. If no such record exists, keep the shortest version that states the
constraint, and list it in the report as a candidate for a decision record.

## Looks like a keep, is not

- "This is important": says nothing an agent can act on. Delete.
- "Be careful when changing this": names no rule. Delete, unless you can find the rule and write that
  instead.
- "See the function below": the agent can see it. Delete.
- "Note: returns null if not found", when the return type is `User | null`: the type says it. Delete.
