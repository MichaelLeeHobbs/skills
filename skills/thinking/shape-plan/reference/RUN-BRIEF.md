# The run brief

The run brief is the contract between the planning skills (`shape-plan`, and `open-card` for one small
ticket) and `run-plan`. It lives in the **description** of the epic or single ticket, never in a comment,
because comments go stale. `run-plan` refuses a ticket whose brief is missing a heading.

Write it so that a fresh session with no memory of the planning can build the work from the brief and the
files it names. Keep it under about 1,500 words. A long design goes in a linked doc or a ticket comment
that the brief points to. On a public tracker, name repositories by URL, never a local path.

## Template

```markdown
## Run brief

**Goal:** two or three sentences on the outcome, in the user's terms.

**Repos:** app (`<path or URL>`, base `main`); integrations (`<path or URL>`, base `master`).

**Design:** where the full design lives (a ticket comment, a doc path, a decision record).

### Decided, don't reopen
- One line per decision the user made, in their terms.

### Out of scope
- What this plan will not build, and the ticket that holds it, if there is one.

### Conventions
- The conventions sheet in short: for each area, the owning skill or doc and the pattern to copy. For
  example: "UI: the UI skill and the grid skill, copy `pages/qc/QcGrid.tsx`."

### Slices
| Wave | Ticket | Repo | Owns (files/areas) | Skills | Needs |
| --- | --- | --- | --- | --- | --- |
| 1 | KEY-1 Order desk scope | app | `src/orders/routes/*` | route skill, test skill | none |
| 1 | KEY-2 Order contract | app | `packages/contracts/order/*` | route skill | none |
| 2 | KEY-3 Intake and storage | app | `src/orders/intake/*`, migration | ... | KEY-2 |

Each child ticket holds its own acceptance criteria. Slices in the same wave must not own the same files.

### Sign-off
- **Screen:** its name, the slices that build it, and the first wave after which it can be used end to
  end. One line per screen. "None: no screen" when the plan has none.
- The tasks the user will do by hand to accept it, one per line, with click counts where they matter.

### Verify
- The single test run (which suites), typecheck and lint of the touched packages, and any live check (a
  probe, a log query) that runs after deploy.

### Stop and ask
- The product or irreversible calls the build must bring back to the user rather than decide alone.
```

## Rules

- **The heading starts `## Run brief`.** Together with the `plan-ready` label, it is what lets
  `run-plan` accept a ticket. A project may add a version after it (`## Run brief (v2)`); `run-plan`
  accepts any.
- **For an epic, every child in the slices table exists,** has the epic as parent, and carries `blocks`
  links that match the `Needs` column.
- **For a single ticket, the slices table has one row: the ticket itself,** wave 1, `Needs` none, and the
  ticket holds its own acceptance criteria. **Design** can point at its own description.
- **The epic stays open until every child is closed.** Only `run-plan` closes it, after its last child.
- **When the plan changes during a run,** `run-plan` updates the brief in place and adds a dated line
  under a `### Changes during the run` heading, so the brief stays true.
