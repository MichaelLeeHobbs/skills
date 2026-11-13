# The report

Keep it under 150 lines and save it in the catalog folder as `report.md`. Take every number from tool
output, never from memory or a worker's summary. Canary paths never enter counts, groups or decisions.

## Header

```
Asset garden: <repo>  commit <hash>  <date>
Catalog: <folder> (ignored | tracked by version control)   Work folder: <path>, removed
Passes: removal build <yes|no>, recording <yes|no>, near duplicates <yes|no>, size <yes|no>, icons <yes|no>
Inventory: <n> assets, <units> vendored units   PASS | FAIL
References: refcov <coverage per kind>   audit <gaps> gaps   pattern share <share>   PASS | FAIL
Evidence: build <green/red/not run, network off yes|no>   recording <routes or not run>   logs <window or none>
Decoder: <name version> | none   Optimiser: <name version> | none   Images viewed: yes | no
Canaries: <passed> of <n>   PASS | FAIL
Findings: unused <confirmed> confirmed, <static> static only, <blocked> blocked | duplicates <bytes>/<strict>/<loose>/<pairs> | oversize <confirmed> | mixed meanings <n>
Since last run: <change> | first run
```

If any line says FAIL, say first, above the header, that the run failed and which check.

## Actions, in this order

1. **Fix now:** dangling references and `case_only` mismatches (they break on a case-sensitive server).
2. **Delete:** CONFIRMED unused bundled files, as one list.
3. **Supply evidence:** each BLOCKED class once, with its count and the one thing that clears it
   ("212 files under public/: supply 30 days of access logs"). Rows go to the appendix.
4. **Retire served URLs:** only with evidence, by redirect or 410, never a bare delete.
5. **Merge duplicates:** per group, the file to keep (the one with most references, else the shortest
   path) and every reference to update. Served and sprite duplicates keep their URL or ids.
6. **Shrink:** CONFIRMED savings with the measured bytes; the optimised copies are not kept.
7. **Icon families:** one table per mixed meaning: families, use sites, designs; then whole-package
   icon imports flagged, and owned-file gzip bytes per family labelled as such ("not measured" for
   bundle cost without the project's own analyser). Reconcile per app: counted plus `uncounted` sites.

## Decision list

Numbered, one per real choice, each with a default:

```
1. Primary icon family. lib-a (412 sites, 48 meanings) vs lib-b (61, 12) vs custom (35, 20).
   Default: the family you named | lib-a, status quo.
2. Font formats. TTF and WOFF copies beside WOFF2 for 4 faces, 1.1 MB. Default: drop them if the
   supported-browser list allows.
```

## Prevention drafts

Drafts for the user to apply; the skill edits nothing:
- A lint rule for the linter the repo already uses that flags imports from a non-primary icon source.
- A size budget for the bundler the repo already uses, set from this run's largest confirmed findings.
- Lines for the repo's agent context file: where icons come from and where new assets go.

## Appendix (`appendix.md` in the catalog folder, not the report)

Every finding row with its verdict, the blocked rows, the `refs` patterns and their matches, and the
label sample results.
