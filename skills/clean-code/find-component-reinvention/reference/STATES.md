# States and frames

A **state** is what a user sees, defined once per widget class with one shared payload. Every member of a
group is rendered in the same states with the same payload, through its own adapter (RENDER.md). The
tables below are the defaults. Before writing any adapter, write the table for every class in the cut
that is not listed here (at most five states, each with its payload), and freeze all tables for the run.

## Payload rules

- Invent every value. Never copy seed data, fixtures, recorded responses, logs or anything from a real
  record. People are `Ada Example` and `Sam Sample`; addresses, e-mails and IDs follow the same pattern.
- The fake current user has a fixed fake name, one ordinary role and no token.
- Dates are fixed instants, never "now": `2026-03-10T14:30:00Z` and `2026-03-12T09:00:00Z`.
- A member that fetches its own data gets the state's payload as the response to the request it makes.
  The payload belongs to the state, never to the member.

## Default tables

| Class | States (payload in brackets) |
|---|---|
| `badge` | `positive` [a success value from the member's own status list, label "Active"], `warning` [label "Pending"], `negative` [label "Failed"], `neutral` [label "Draft"], `long` [label "Awaiting external review"] |
| `empty-state` | `default` [no items, no custom text], `with-action` [no items, one action "Create"], `long` [no items, a 160-character message] |
| `error-state`, `alert` | `default` [message "Something went wrong"], `with-detail` [message plus a 120-character detail], `with-action` [message plus one action "Retry"] |
| `confirm-dialog`, `modal` | `default` [open, title "Delete report?", body one sentence, confirm and cancel], `destructive` [as default, confirm marked destructive], `long` [open, body of three paragraphs] |
| `table`, `list` | `empty` [zero rows], `loading` [request pending, no data], `rows` [three rows, columns name, status, date], `long-cell` [three rows, one name of 120 characters], `error` [request failed] |
| `date-picker` | `empty` [no value], `value` [`2026-03-10`], `invalid` [text "31/02/2026"], `disabled` [value set, disabled] |
| `text-field`, `select`, `search` | `empty`, `value` [a short value], `invalid` [a value plus the message "Required"], `disabled` |
| `button`, `link` | `default` [label "Save"], `disabled`, `long` [label "Save and continue to the next step"] |
| `loading` | `default` |
| `stat-tile`, `card` | `default` [title "Open orders", value 1234], `empty` [title, no value], `long` [a 90-character title] |

For a member that cannot express a state with any props, the cell is `unreachable`: a finding for the
report, never BLOCKED. A badge whose status list has no neutral value is `unreachable` in `neutral`.

## Frames

Capture a fixed frame per class, never the component's own box, so a size difference shows as a
difference. Place the member at the top left with 16 px padding on an opaque background of one fixed
colour.

| Frame | Size | Classes |
|---|---|---|
| inline | 320 x 96 | `badge`, `avatar`, `button`, `link`, `icon` |
| block | 640 x 400 | `card`, `stat-tile`, `empty-state`, `error-state`, `alert`, `loading`, `form-field`, `text-field`, `select`, `choice`, `search`, `file-upload`, `pagination`, `breadcrumb`, `stepper`, `tabs`, `accordion`, `date-picker` closed |
| wide | 1024 x 600 | `table`, `list`, `chart` |
| viewport | 1280 x 800 | `modal`, `confirm-dialog`, `drawer`, `toast`, `popover`, `menu`, `tooltip`, `date-picker` open |
