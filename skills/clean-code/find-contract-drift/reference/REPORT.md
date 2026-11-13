# The report

Keep it under 150 lines and save it in the catalog folder as `report.md`. Everything else goes in the
appendix. Take every number from tool output, never from memory or a worker's summary: coverage from the
`verify --check coverage` summary; shapes, exclusions, groups, cells, causes, evidence and spend from
`tally`; reuse from `reuse`. Canary rows never enter `tally`, groups or decisions.

## Header

```
Contract drift audit: <repo>  commit <hash>  <date>
Catalog: <folder in the repo>   Work folder: <path outside the repo>
Routed: <situation -> tool, one per line, or none>
Coverage: <coverage> over <files> files (<adjusted> adjusted: <reasons>)   PASS | FAIL
Shapes: <total> (<by side>; <by origin>)   Excluded: <total> (<by reason>)   Unparsed: <languages> | none
Groups: <total>; judged <n>, reused <n>, cut by cap <n>
Cells: <BREAKING> breaking, <DISAGREE> disagree, <UNRESOLVED> unresolved, <LATENT> latent, <LOOSE> loose
Unresolved causes: <cause: cells, the fix> (one per line) | none
Evidence: <CONFIRMED> confirmed, <REFUTED> refuted, <BLOCKED> blocked (sample <n>, documented-default <n>)
Spend: $<total> of $<cap> cap (measured | estimated from tokens)
Canaries: <n> of 7 as expected   PASS | FAIL
Network off during proof: yes | no
Since last run: <reused> verdicts reused, <reopened> accepts reopened | first run
```

If any line says FAIL, or a check in SKILL.md failed, say first, above the header, that the run failed
and which check.

Each unresolved cause gets its fix in words: `config:naming@*: 214 cells; state the serializer naming
policy`, `lang-nullability: 90 cells; adopt a null-marking annotation or annotate the fields`.

## Decision list

One numbered item per drift family the team must settle, not per cell:

```
1. Role enum. Server sends ADMIN, USER, AUDITOR; 3 client copies accept ADMIN, USER (UserDto parses a
   list, so one AUDITOR blanks the screen). Default: add AUDITOR to the client copies and import one
   shared enum.
2. createdAt wire name. Server writes created_at (snake naming at application.yml:14); 2 client copies
   read createdAt. Default: read created_at, or add a key-transform interceptor once.
```

A default follows the anchor (the producer) unless the evidence shows the producer is the copy that is
wrong.

## Top findings

Up to 10, in the rank order from [JUDGE.md](JUDGE.md):

```
G3  GET /users response   anchor s/user/UserResponse.kt:12   3 consumers
  field       UserResponse (server)   UserDto (client)       UserSchema (client)   cell
  role        ADMIN|USER|AUDITOR      'ADMIN'|'USER'         z.enum([ADMIN,USER])  ENUM_VALUES BREAKING  CONFIRMED run
  created_at  date-iso, required      createdAt?: string     createdAt: string     WIRE_NAME BREAKING    BLOCKED sample
  email       String? (nullable)      email: string          z.string()            NULLABILITY BREAKING  CONFIRMED run
  if fixed onto the anchor: UserDto must accept AUDITOR and null email; 14 files import UserDto.
```

"If fixed" lines come from REAL cells only. A cell whose evidence is BLOCKED says so in the row.

## Findings 11 to 40

One line each:

```
G14  POST /orders request  2 members  PRESENCE BREAKING on note (client may omit, server validates)  diffed
```

## Prevention drafts

Drafts for the user to apply. The skill edits nothing.

- **Import the anchor**: for each hand-written shadow of a generated type, the import line that replaces
  it.
- **One shared definition** per drifted family: where it should live (the shared package, or the
  generated client), and the files that would import it.
- **Catalog lines** for the repo's agent context file, one per shared shape: name, location, and one
  line saying not to redeclare it.
- **The cause**, if the repo's agent context file or contributing guide tells contributors to declare
  types locally: quote that line and draft the replacement.

## Appendix (catalog folder, not the report)

- Every group's `gdiff`, cells, renames and verdicts (`verdicts.jsonl`).
- LATENT and LOOSE counts per group.
- Reopened accepts, with the hash that changed.
- The config rows used (`configs.jsonl`).
