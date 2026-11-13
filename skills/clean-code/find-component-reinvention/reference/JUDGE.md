# Judging groups from source

## Two verdict axes

**Same widget job?** The judge reads source and gives each member one of:

- **SAME**: shows the same thing and looks and behaves the same in every state of the class's table.
- **VARIANT**: shows the same thing, and differs in at least one state (colour, size, spacing, text,
  truncation, a state it cannot show, a different empty or error presentation). A superset is a VARIANT
  with a note saying which member does more.
- **DIFFERENT**: does another job, whatever its name, vocabulary or class.

**Shown by rendering it?** After step 6, the tool sets each member's evidence:

- **CONFIRMED**: in every comparable state, the members that rendered alike are exactly the ones the judge
  predicted alike.
- **REFUTED**: in at least one state they are not. Report the rendered result; the judge was wrong.
- **BLOCKED**: no comparable state was rendered. Keep the prediction, marked predicted.

**Never launder a verdict.** A VARIANT nobody rendered is BLOCKED, never CONFIRMED. Only the tool's
`evidence` records set CONFIRMED or REFUTED; no model compares its own prediction with a sheet.

## Calibrate before judging

1. Build a calibration set from real components only, never the canaries: two or three pairs from the
   largest groups whose answer you settle by reading both sources yourself, and two pairs that share a
   class but not the job (a status badge and an unread-count badge; an empty state and an error state
   filed in one class).
2. Judge the set twice, each time with a fresh judge that sees only the brief and the set.
3. If any verdict or predicted look differs between the two runs, or from the known answer, rewrite the
   brief and judge the set twice again.
4. When both runs agree with the known answers, freeze the brief for the rest of the run.

## Splitting oversize classes

`group` flags a class with more members than the cap (12). With the most capable model, split it into
parts by what members display and how they are built, reading the rows; never by name alone. Record each
part as a `part` record, add one cross-part group holding each part's anchor, and run
`verify --check groups`; it must pass. When the cross-part group finds SAME or VARIANT between two parts'
anchors, judge the SAME and VARIANT members of each of those parts against the other part's anchor too.

## Anchors, residuals, wrappers and the canonical copy

- **Anchor**: the most typical member, preferring the most complete one (it can show every state).
  Members are judged against it, and it is named in every verdict line.
- **Residual**: members judged DIFFERENT form a new group and are judged again the same way, in the next
  batch.
- **Wrapper**: a member whose `relation` is `wrapper` and whose `wraps` is another member, or the library
  component, is reuse. Judge it, but count it as a consumer of what it wraps, never as a copy. Several
  wrappers of one third-party component are "N configurations of one library component".
- **Reference member**: when the group's class matches a component the design system exports and that
  component is not already a row (an installed package), add it to the group as a reference member. It
  is always rendered and does not count toward the member cap.
- **Canonical** (what the report recommends keeping), first that applies: the design-system component;
  an existing shared component in a shared folder; the member with the most importers; the one that can
  show the most states. Importer count never outranks the design-system component. In a repo with more
  than one framework, pick a canonical per framework and never recommend merging across frameworks.

## Predicted looks

For each state in the class's table, the judge gives every member a look label: members it predicts to
render alike in that state share a label. These become `predict` records for `diff`. A member whose cell
is predicted `unreachable` gets no label for that state.

## Judge brief

Give each judge call one group (or about ten small groups batched in one call) and this brief:

> You are given the full source of several components, shuffled, their manifest rows, the components and
> style files they import, and the widget class's state table. Rows can be wrong; trust the source. The
> first component is the anchor. For every other component, give one verdict, SAME, VARIANT or DIFFERENT,
> against the anchor, with the line numbers that decide it. Then, for each state in the table, give every
> component a look label: the same label for components that would render alike in that state, `-` for a
> component no props can bring to that state. Say in one line per differing state what differs (colour,
> size, text, truncation, missing state). Do not guess from names. Reply as JSON lines: one `verdict`
> line per member with `group`, `member`, `anchor`, `verdict`, `lines`, then one `look` line per member
> and state with `member`, `state`, `look`, `why`.

Do not tell the judge which members are canaries or that canaries exist.
