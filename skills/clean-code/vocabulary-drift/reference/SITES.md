# Sites: what the inventory holds

## What a site is

One declaration or one string, on one surface, at one place. The `id` is `path:line:col` of its first
character. `text` is the declared name or the string as written. References and uses are not sites:
counting every use multiplies the inventory by 5 to 20 and adds no new names. The report counts
references by search, only for the names in its decision list.

| Surface | A site is | Examples |
|---|---|---|
| `code` | a declared function, variable, constant, parameter or method name | `loadExamStudies`, `exam_id` as a Python parameter |
| `type` | a declared type, class, interface, enum or record name, or a field or property name declared in one | `Study`, `studyDate` in `interface Study` |
| `schema` | a table, column, view, ORM model or migration-declared name | `studies`, `order_id` |
| `route` | a route path string or a path parameter | `/api/exams/:accession` |
| `ui` | a user-visible string: an i18n value in the source-language locale, or a literal rendered as text | `"Exam date"` |
| `doc` | a heading or a paragraph line in a document (README, docs folder, decision records) | `## Ordering a study` |

Comments are not sites. Locale files other than the source language are not read (their text tokenizes
into fragments). Tests, stories, fixtures, generated code, vendored code and build output are bucketed
`excluded-<reason>` and produce no sites.

**Context.** Label every site with the top-level app or package folder it sits in (`apps/scheduling`
gives `scheduling`); files at the root get `root`. If the user names a different split, use it and say so
in the header. Contexts spread samples and rank findings; they never hide one.

## Buckets

Write one `tracked` record per file version control tracks at the commit (with no version control,
every file in the snapshot), and one `file` record putting it in a bucket: `source`, `schema`, `locale`,
`doc`, or `excluded-<reason>`. The coverage check fails on a file in no bucket or in two.

## The second count

For each file and each surface it has sites on, write a `count` record from a method independent of the
extraction. If you extracted with a parser, count with a line pattern. If you extracted with a pattern,
count with the parser, or with a different pattern that cannot share the first one's blind spots. A
count made by the same method as the extraction is not a count: leave that surface without `count`
records, and the check reports it `unmeasured` and fails.

Starting patterns (adjust per language and list each in the report):
- `code`, TypeScript or JavaScript: lines matching `^\s*(export\s+)?(default\s+)?(async\s+)?function\b`
  or `^\s*(export\s+)?(const|let|var)\s+[A-Za-z_$][\w$]*`. Python: `^\s*(async\s+)?def\s+\w+` or
  `^\s*[A-Za-z_]\w*\s*=`.
- `type`: `^\s*(export\s+)?(interface|type|class|enum)\s+\w+` plus one per field line inside them.
- `schema`: `CREATE TABLE`, `ADD COLUMN`, and each column line of a table body; one per field of an ORM
  model.
- `route`: lines with a router call (`get(`, `post(`, `path(`, `@Get(`) holding a string literal.
- `ui`: one per key line of the source-language locale file; one per text literal between markup tags.
- `doc`: lines starting with `#`, and each non-empty line outside code fences.

Allow a parser surplus (the check counts `min(sites, pattern)`), and expect pattern noise from code
inside comments. The bar is 98% per surface and file extension; a file whose count is above zero and that
produced no sites fails on its own.

## Seeds from a find-reinvention catalog

Look for the catalog folder find-reinvention uses (a `reinvention/` folder in the folder your agent keeps
project configuration in, or `.reinvention/` at the root). Its files are JSON Lines, one object per
line:
- `domains.jsonl`: `id`, `name`, `def`. Each is a candidate concept seed. These name the *data a
  function takes* ("timestamp", "study identifier"), not the domain's entities, so most are `not-domain`
  here; keep the entity ones.
- `mapping.jsonl`: `value` (a phrase describing a function input) and `domain`. Values that share a
  domain are a candidate name pair: tokenize them and offer the pair to the mapping step.

They seed the concept list and suggest pairs. They never decide a verdict or a canonical name. For each
file, count its non-empty lines and the records you parsed, and give `tally` one `seed` record. A file
present but not read in full fails the run.

## Canaries

Build the three canaries in SKILL.md "Check" from the repo's own highest-ranked concept. Write one file
per surface you plant on, under a plausible path in the work folder that mirrors a real folder
(`<work>/canary/apps/viewer/imaging-case.ts`), with the content written the way the repo writes that
surface. Their `path` is the mirrored path (`apps/viewer/imaging-case.ts`) and their context is
labelled from it like any site. Put the homonym canary in a folder no real site uses for that name
(`apps/scheduling/slots/`), so a sense rule can tell it apart. Add canary sites to the site set
yourself: they get no `tracked`, `file` or `count` records and stay out of the coverage check.
