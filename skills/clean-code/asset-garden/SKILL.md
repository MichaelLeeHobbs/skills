---
name: asset-garden
disable-model-invocation: true
description: >-
  Use for "clean up our assets", "find unused images", "which icons are duplicates", "same SVG under
  different names", "unused fonts", "oversized images", "we have three icon sets", "audit the public
  folder", "re-run the asset audit". Weeds a project's static assets: byte-identical and
  same-drawing SVGs and images under different names, unused images and fonts, oversized files, and one
  meaning drawn by several icon families. Proves each finding before reporting it and keeps a small
  catalog in the repo for re-runs. Expensive and user-invoked. NOT for unused code (find-dead-code),
  unused CSS rules (find-dead-css), choosing between installed icon packages (find-dependency-overlap),
  colours inside SVGs (find-token-drift), duplicate icon wrapper components (find-component-reinvention),
  or deleting anything.
---

# Asset garden

Find the asset files a project carries twice, never uses, or ships too large, and the meanings it draws
with more than one icon family. A name match or a similar hash proposes a finding; only a key, a
measurement or a build decides it.

**What it writes.** In the target repo, only its catalog folder ([reference/CATALOG.md](reference/CATALOG.md)).
It deletes, edits and commits nothing. Builds, trials and canaries run on a snapshot in a work folder
outside the repo.

## Prerequisites

Stop before any cost and say which is missing:
- You can run commands and write files, and the machine has a runtime to build the tool in.
- Two independent ways to list files: the version-control listing and a filesystem walk (with no
  version control, two different walk methods).

## Where code and data go

Asset text and source snippets go only to the model provider you already use. Never send an image to an
online service. The snapshot holds tracked files only and never files named like secrets (`.env*`,
`.npmrc`, `*.pem`, `*.key`, credential files). Images in folders the user names as private (uploads,
avatars, customers, screenshots) get hashes and sizes only: never viewed, never sent. Logs and CMS
exports are reduced on the machine to `path, hits, last seen` with query strings removed; raw lines go
nowhere. The catalog holds repo-relative paths, hashes, vocabulary labels, counts and dates only.

## Roles

You coordinate and hold the tool's counts, never the rows. Scripts you write extract and measure; the
tool joins and checks; a model reads only what needs judgement (string-built reference sites, stem audit
hits, icon meanings, image comparisons). A cheaper model can label icons; the strongest model you have
decides image comparisons. Start workers in waves no larger than your agent's limit on concurrent work.

## 0. Build and prove the tool

Implement [reference/ALGORITHM.md](reference/ALGORITHM.md) to satisfy
[reference/CONTRACT.md](reference/CONTRACT.md) in a folder outside the repo. Run every fixture in
`reference/fixtures/`. **If any fixture fails, stop and report which.** Never edit a fixture. A tool built
on an earlier run may be reused only after every fixture passes again.

## 1. Ask once, snapshot, inventory

Send one message with a default for each, then work without further approvals:
1. Evidence you can supply: access logs, CMS export, known external uses (default none).
2. Private image folders to hash but never view (default: any folder named uploads, avatars, users,
   customers, screenshots, fixtures).
3. Passes to run: removal build (default no), request recording from the project's own end-to-end suite
   or local preview (default no), raster near duplicates, size, icon families (default yes).
4. The intended primary icon family (default none: the report shows the status-quo family).

Record the commit and snapshot the tracked files into the work folder. List asset files both ways and run
`verify --check inventory`; it must pass. Give every file of a vendored icon library the library's name
as its `unit`, so `refs` reports it as one line. If the catalog holds a keep list or labels, load them.

## 2. Canaries and budget

Plant the canaries for the passes in scope (Check) in the snapshot with the prefix
`asset-garden-canary-`, and write one `expect_*` record per canary (CONTRACT.md). Estimate model cost from the real counts (icons in use, near pairs, loose
groups), show it with a cap of 1.25 times the estimate, and stop cleanly at the cap.

## 3. Measure

Per asset: sha256, bytes, kind. Per raster: pixel size and a 64-bit perceptual hash from one decoder,
named with its version, never cached across runs. Per SVG: `svgnorm`. Optional: a lossless optimiser
already installed. [reference/PROOF.md](reference/PROOF.md) has the measurement rules.

## 4. References

Write an extraction script, never a model reading every file. Follow
[reference/REFERENCES.md](reference/REFERENCES.md) for the sources per stack, roots, aliases, patterns,
logs and recordings. Run `refs`; fix every `bad_pattern` and re-run. Run `verify --check refcov`; it must
pass. Then audit the candidates' stems and run `verify --check audit`. A `gap` means the extraction
missed a reference class: fix the script and repeat this step.

## 5. Duplicates and size

Run `dupes` and `size`. Tiers: byte-identical, same drawing (strict key), same shape with different
paint or size (loose key), looks similar (raster near pair). Only the first two are identical.

## 6. Icon families

For icons in use, collect use sites, label meanings from a frozen vocabulary, run
`verify --check labels` (it must pass), then `meanings`. PROOF.md has the use-site rules and the labelling
brief.

## 7. Prove

Give every finding CONFIRMED, REFUTED or BLOCKED as PROOF.md defines them. Never launder: a finding
nobody measured, built or compared in this run is BLOCKED, never CONFIRMED.

## 8. Report and catalog

Run `verify --check canaries` on the canary expectations plus the `refs`, `dupes` and label output. Write
the report as [reference/REPORT.md](reference/REPORT.md) lays out, update the catalog, confirm no canary
remains in the real tree, delete the work folder and give its path. Hand back the report path, header
and decision list.

## Check

Plant these, copied from real project files (SVG only, or synthetic rasters, never a user image):
1. A byte copy of a real icon under a new name: must form a bytes group with it.
2. The same icon reformatted (reindented, attributes reordered, a comment and editor metadata added,
   numbers padded with zeros): must form a strict group with it.
3. The same icon with one coordinate moved by 2 units: must stay apart from it on every tier.
4. A new file nothing references: must be `unreferenced`.
5. A file referenced only through the project's import alias (with no alias, a root-relative URL): must
   be `referenced`.
6. A file reached only through a string-built path the extraction turns into a pattern: must be
   `pattern`.
7. A file in a served folder with no reference: must be `served`.
8. A PNG referenced only from an SVG in a served folder: must be `referenced`.
9. Raster pass in scope: a half-size JPEG re-encode of a photographic image of at least 200 by 200 pixels
   must pair with it; a mirrored copy must stay apart from it.
10. Icon pass in scope: a hand-made icon in a button labelled Close must be labelled `close`.

**The run fails**, and the report says so above its header, when any of these happens:
- a fixture fails, or `verify --check inventory`, `refcov`, `audit`, `labels` or `canaries` fails;
- a pass the user put in scope could not run (a declined pass makes no claim and plants no canary);
- a canary was found in the real tree after the run, a secret-named file entered the snapshot, or the
  catalog scan in CATALOG.md found a match;
- the label sample check failed twice in a row on one batch.

A run that could not perform one of these checks has failed it.

## Fallbacks

- **No parallel work:** run the same steps in order. The work folder is the progress record; a step is
  done when its tool check passes, so a stopped run resumes from the first step without passing output.
- **No image viewing:** loose groups and near pairs are confirmed only by a pixel comparison; with
  neither, they are BLOCKED and counted by class. Icon labels use names and usage context only, and the
  report says so.
- **No raster decoder:** if the raster pass is in scope, the run fails at step 3; ask the user to
  decline the pass or install a decoder themselves.
