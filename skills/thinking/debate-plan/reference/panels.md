# Panels

Who sits on each panel, how to brief them, and how long they may write.

## Casting

A persona is useful only if it would object to something the others accept. Give each one a day, a volume
and a stake. "A user" objects to nothing. Someone clearing 200 items before shift change objects to every
extra click.

### Builders (3 to 4)

Pick from the problem. Typical seats:

- **The maintainer.** A senior developer in the project's own stack who will build it and live with it.
  Wants the smallest change that fits the code that exists.
- **The designer**, when there is a screen. Designs for the kind of screen this is: a dense console used
  all day is not a marketing page.
- **The operator or data owner.** The person paged when it breaks, or the one who owns the database and
  its growth.
- **The skeptic or minimalist**, always. Argues what not to build, and what the smallest version that
  still meets the stated need looks like.
- **The contrarian**, only when the user asks. Proposes a shape nobody else would.

### Users (2 to 3, whenever there is a screen)

Cast real users of this product from the brief, never generic ones. These archetypes find different
problems; fill each with this product's people:

- **The expert at volume.** Does the core task hundreds of times a day and counts clicks.
- **The tired operator under pressure.** Interrupted, rushed, working at the worst hour, and will click
  the wrong thing if the screen allows it.
- **The one whose mistake lands on someone else.** A wrong action here harms a third party, so every
  irreversible step needs to be obvious.
- **The admin answering "why can't X see Y?"** Needs the screen to explain access, not just enforce it.
- **The occasional visitor.** Comes once a week for one answer and has forgotten the layout.

For example, in a clinical app: a specialist reading 150 cases a shift; a technician at 3 a.m. with a
distressed patient and a doctor waiting; a quality clerk clearing 200 holds a day, where a wrong merge
puts records in another patient's file; an admin asked why a doctor cannot see a study; a referring
doctor who wants the result now.

### Guardians

- **Architecture fit and conventions**, always. Checks each part against the conventions sheet and the
  owning skill or doc. Reuse over a second way of doing the same thing.
- **Performance and logic at real volume**, always. Works the sums at the scale in the brief: rows,
  requests, fan-out, time per batch. A design that takes hours for a routine batch is a finding.
- **Safety and access**, when sensitive data or permissions are involved. Looks for any path outside the
  user's scope and any way to escalate privileges, including through exports, links and logs.
- **Data steward**, when data leaves the system. What is disclosed, to whom, under what approval, and
  what record of it is kept.

## Brief template

Every panel member gets the same skeleton:

1. Who you are, what your day looks like, what you fight for (two or three sentences).
2. Read-only: change nothing, file nothing.
3. Read the shared brief first, then the rows of the conventions sheet named for your part, then the
   files named in the brief.
4. Design within the conventions. If you think one should be broken, propose it openly with the reason.
5. Your task for this round (opening, rebuttal, review), and what to return.
6. Write your full output as a separate note. Return a summary within your word cap.

Add any host notes the user's environment needs, such as which tools are missing on the machine and where
scratch files go. Panel members do not inherit your context, so anything you know and they need goes in
the brief.

## What each round returns

- **Opening (builder):** what is wrong today with file citations; the design through one real example;
  an ASCII mockup per state for a screen; the data behind each part and its cost; must, should, won't.
- **Rebuttal (builder):** for each other opening, at least one concrete failure scenario checked in the
  code ("when a user with no team opens this, the query on line 40 returns every row"); ideas adopted;
  points conceded; the revised design.
- **Review (user or guardian):** findings from their seat, each tied to a part of the draft, ranked; one
  line on what they would cut.

## Word caps

| Output | Screen or small feature | Whole system |
| --- | --- | --- |
| Builder opening | 450 | 900 to 1400 |
| Builder rebuttal | 350 | 700 |
| User review | 300 | 300 |
| Guardian review | 450 | 700 |
| Chair's merged draft | 900 | 2000 |

The cap applies to the returned summary. A member who needs more says so in one line and names what was
cut, rather than overflowing.
