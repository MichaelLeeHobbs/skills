# Run brief for one ticket

This is the one-ticket case of shape-plan's
[run brief](../../../thinking/shape-plan/reference/RUN-BRIEF.md) (installed alone?
`skills/thinking/shape-plan/reference/RUN-BRIEF.md` in github.com/MichaelLeeHobbs/skills), which holds
the rules `run-plan` checks.

Paste this into the ticket's description, below the body, and fill every heading. A heading with nothing
to say gets "None" and a reason, never deletion: the build session checks the headings are all there. On a
public tracker, name the repository by its URL, never a local path.

```markdown
## Run brief

**Goal:** the outcome in two sentences.

**Repos:** infra (`<path or URL>`, base `main`, checked at `<full commit id>`).

**Design:** this ticket's description.

### Decided, don't reopen
- What the evidence settled ("the only caller is the web proxy; no other source keeps port 80").

### Out of scope
- The neighbouring work this ticket won't do, and its ticket if one exists.

### Conventions
- The owning doc or skill and the pattern to copy, one line per area.

### Slices
| Wave | Ticket | Repo | Owns (files/areas) | Skills | Needs |
| --- | --- | --- | --- | --- | --- |
| 1 | THIS-TICKET (its own key and title) | infra | `stacks/file-server/*.ts` | that repo's skills | none |

### Sign-off
- None: no screen. (Or the screen and the hand checks the user will do to accept it.)

### Verify
- The tests, typecheck and lint for the touched package, an infrastructure diff or the like, and the live
  check after deploy.

### Stop and ask
- Anything irreversible or a product call: a production change outside the deploy, a data delete, a
  second caller found during the build.
```
