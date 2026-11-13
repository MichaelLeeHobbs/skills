# Judging candidates

## Verdicts

A claim covers one candidate. Its `names` are terms (lemmas from `terms`), its `cites` are site IDs from
that candidate's own sample.

- **SYNONYM**: two or more names for one concept. Same identity: the same record, key or value is
  passed, stored or shown under each name. Names two or more.
- **DISTINCT**: names that look alike but are different concepts. Requires a `relation`: `parent-of`
  (an order produces studies), `child-of`, `attribute-of` (an accession number identifies an order; it
  is not another name for it), or `peer` (patient and research subject in different contexts). Names two
  or more. "Keep both" is a correct and common answer.
- **HOMONYM**: one name used for two or more concepts. Requires sense rules: one `sense` record per
  meaning, each a path prefix and the concept it means there, in priority order, the last with prefix
  `""` as the catch-all. The tool counts every site of the name under each rule.
- **GENERIC**: the name carries no domain meaning at these sites (`order` as sort order, `subject` as an
  email subject). The term should map to `not-domain`.

`verify --check evidence` computes each claim's **strength**: `structural` when a cited site is on the
`type` or `schema` surface, else `usage`. Only a structural SYNONYM may carry a rename default; a usage
SYNONYM goes to the decision list marked unconfirmed.

**Never launder a verdict.** A SYNONYM needs a cited site where the identity is visible: a field typed
as the other concept, a column holding the other's key, a value passed straight from one name to the
other with no lookup. A lookup (`fetchStudy(exam.studyId)`) shows two things are related, which is
DISTINCT or nothing. Two shapes with the same fields are not identity. If the snippets cannot settle it,
the verdict is DISTINCT `peer` with the note "unsettled", never SYNONYM.

## Calibrate before judging

1. Build a calibration set from real candidates only, never the canaries: one settled example per
   verdict class (SYNONYM, DISTINCT, HOMONYM, GENERIC) whose answer you fix by reading the snippets
   yourself. Prefer a DISTINCT parent and child pair that shares fields: it is the case the judge gets
   wrong.
2. Judge the set twice, each time with a fresh judge that sees only the brief and the set.
3. If any verdict differs between the two runs, or from the settled answer, the brief is unclear.
   Rewrite it and judge the set twice again.
4. When both runs agree with the settled answers, freeze the brief for the rest of the run. A changed
   brief means calibrating again.

A class with no settled real example is left out of calibration and named in the header.

## Judge brief

Give each judge call three to five candidates and this brief:

> You are given numbered snippets, each a site ID and seven lines of source, for one or more candidates,
> and the concept list with each concept's definition and distinguishing test. For each candidate,
> return one JSON line: `id` and `candidate` (both the candidate ID), `verdict` (SYNONYM, DISTINCT, HOMONYM or GENERIC), `names`,
> `cites` (site IDs from that candidate's snippets only), `relation` (DISTINCT only, else ""), and for a
> HOMONYM one `sense` line per meaning with `claim`, `term`, `concept`, `prefix`, catch-all last. Decide
> from the code, not the names. Two things with shared fields are not the same thing. A lookup from one
> to the other makes them related, not the same. Cite the lines that decide it.

Do not tell the judge which candidates are canaries or how the candidate was proposed.

## Canonical names

Per concept, and per sense of a homonym, the first that applies:
1. A domain standard name the repo already cites at a site (a FHIR resource, a DICOM attribute).
2. The `schema` name, or the public `route` name if there is no schema site.
3. The name with the most `type` sites.
4. The name with the most sites.

When the schema name is not the name most sites use, do not pick: make it a decision showing the rename
count for each direction. Give each concept a separate `ui_label`, the word users see; when it differs
from the code name, that is a decision for the user, never a rename default.

## Rename counts

For each decision, count the sites to rename per surface from the real `terms` run, then search for
references to each declared name and count those, labelled "by search". Mark `schema` and `route` sites
"alias, do not rename": they cross persisted or public boundaries, and renaming them is its own
migration.
