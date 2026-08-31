# Clean-room rules

The point is a spec that lets someone rebuild the function without copying the implementation.

**Capture exactly:** structure, behaviour, states, option lists, validation rules, data shapes, network
contracts, keyboard behaviour, accessibility semantics. These are facts about what the thing does.

**Describe by intent, do not copy:** colour, typography, spacing, shadows, exact dimensions. Write
"primary action colour, high contrast against the surface" rather than a hex value, and "roughly three
steps of a spacing scale" rather than pixel counts. The rebuild should land on the reader's own design
system rather than a clone of this one.

**Do not read stylesheets or source maps, and do not extract computed style values.** Where a style
value is genuinely load-bearing, such as a colour that carries meaning, describe its role and note that
the exact value is a design decision for the rebuild.

**Verbatim copy is the one judgement call.** Exact strings make a rebuild's copy match rather than
approximate, and this skill defaults to capturing them. But user-facing text is the most clearly
authored part of an interface. If the goal is reimplementing something the user does not own, ask
whether copy should be captured verbatim or described by function, and record the answer in metadata.
That is the user's call, and if the stakes are real it is one for their lawyer rather than for you.

