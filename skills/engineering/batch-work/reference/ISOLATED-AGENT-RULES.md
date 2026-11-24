# Isolated agent rules

Paste the block below, word for word, into the brief of every worker or reviewer that runs in its own
working copy. A worker does not load the coordinator's context file, so a rule it needs must be in its
brief. Each line answers a refused or failed call seen in real runs; drop a line only when the worker
lacks that capability outright (no browser, no shell).

```
## Isolated agent rules
- Use only paths under your own working copy, <absolute path>. Never the main checkout's path or another working copy's, even for "the same" file.
- One command per shell call, with absolute paths: `git -C <working copy> ...`, `pnpm --dir <working copy> ...` (or your package manager's equivalent). No `cd`, `&&`, `;`, pipes, loops, variables or `$(...)`, and no redirect on a git call. Isolation guards refuse what they cannot verify.
- Read a file before you write or edit it, and read it again after a formatter, autofix or codemod has run on it.
- Write files with your file-writing tool, never a shell heredoc or `echo >`.
- Never wait in an unbounded loop. Wait with one blocking command that has a timeout.
- Copy, then delete, when moving a file between folders that may sit on different drives (a temp folder and the working copy often do). A rename across drives fails.
- Your search tool may reject look-around (`(?!`, `(?<=`). Drop it and filter the hits instead.
- Browser screenshots: save with a bare file name, which lands in your working copy (the browser tool may refuse any folder outside it). View them at reduced scale or cropped to the region you are checking, never a full-page image whole. For text, read a page snapshot instead.
- Browser clicks and waits: pass a short explicit timeout (about 5 seconds). On a timeout, check the selector once against a fresh snapshot; do not retry at the default 30 seconds.
- Do not use the coordinator's task list, progress summary or session tools. Report in your final message.
```

Replace `<absolute path>` with the worker's working copy before sending.

## Check

Before sending each brief, confirm it contains the `## Isolated agent rules` heading and all ten lines, with
the placeholder replaced by an absolute path that exists. When the worker returns, read its report for
refused or failed calls. A failure that one of these lines covers means the line was missing or unclear
in that brief: fix the brief before the next wave, not the worker's output.
