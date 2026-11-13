# Measuring and proving findings

## Measurement rules

- **Hashes.** sha256 of the file bytes. Perceptual hashes come from one decoder and one algorithm for the
  whole run (a 64-bit difference hash is the default), written as 16 lowercase hex digits with the
  algorithm name in every `hash` record. Composite transparent pixels over white before hashing. Name the
  decoder and its version in the report. Never compare hashes from two decoders, two machines or two runs,
  and never store them in the catalog.
- **Renders.** When comparing two images by pixels, decode or render both with the same tool at the same
  size (for SVGs: 24 and 128 pixels wide), then compare every pixel. Identical pixels confirm; any
  difference goes to a look.
- **Optimiser trial.** Only with a lossless optimiser already installed. Run it on a copy in the work
  folder and feed the result as an `optimised` record. Never install one, and never use an online one.
- **Render boxes.** Only from a request recording that measured the largest box each image is drawn in.
  Without one, `size` prints `no_render` and the pixel rule cannot fire.

## Verdicts

Every finding gets exactly one:
- **CONFIRMED**: shown in this run by a key, a measurement or a build, as listed below.
- **REFUTED**: the proof contradicted the proposal (pixels differ, the build failed, the saving is under
  the threshold). Say what contradicted it.
- **BLOCKED**: not proven, with the reason and the one piece of evidence that would settle it.

| Finding | CONFIRMED by | Otherwise |
|---|---|---|
| Bytes group | equal sha256 | |
| Strict group | equal strict key | |
| Loose group, near pair | identical pixels, or a look by a model that can view images saying the drawings match | BLOCKED |
| Unused | the removal build, for candidates whose only possible reach is a static import | "static evidence only" |
| Served file unused | user-supplied logs or CMS export over a window the user names, with zero hits | BLOCKED; never a bare delete |
| Oversize | a measured lossless saving above the thresholds, or a measured render box | BLOCKED |

Sprite files (`sprite` true) never merge on the loose key: their symbol ids are referenced from outside.
A served file's URL is a contract: merging or retiring it needs a redirect.

## Removal build

Only when the user put it in scope, in the snapshot, with the project's own build command read from its
scripts. Turn install scripts and network access off where the platform allows, and say in the report
whether it did. Remove build caches first.

1. Build once unchanged. If it fails, the pass could not run and the run fails.
2. Remove every static-import-only candidate and build once. Green: all CONFIRMED.
3. Red: split the set in half and build each half, repeating on the red halves, at most 8 builds in all
   including the first. Candidates the cap leaves unresolved stay "static evidence only".

A green build proves nothing about served, pattern-matched or convention files, so they are never in
the set.

## Icon families

- **Use site:** one source file that uses one icon: an import of a vendored file, an import of an icon
  component from a package (the family is the package), a literal path, or a registry name resolved to
  its final file or component. Re-exports through a barrel file are followed to the final icon, never
  counted as uses. Tests, stories and convention files are not use sites.
- **Design:** the strict key of an icon file, or the package export name for a component. Size variants
  of one drawing (16, 20, 24) count as one design when their loose keys match.
- **Families:** a vendored folder, a package, or `custom` for hand-made files.
- **Labels:** one `label` per used icon with one or two meanings from a frozen vocabulary, or `other`.
  Start the vocabulary from the seed list below, add a meaning only after reviewing the `other` bucket
  once, then freeze it and save it in the catalog. Give the labelling worker, per icon: its name, its
  family, up to three usage contexts (accessible label, button text, tooltip text) and, if the worker can
  view images, a render. Labels already in the catalog for the same sha256 are reused.
- **Sample check:** per batch of up to 100 labels, check 20 (or all, if fewer), including every rare
  meaning, against the render or the context. Two or more wrong: relabel the batch and check again.
- **Default decision per meaning:** the primary family the user named; with none, the family with the
  most use sites, marked status quo, with each other family's site count as its migration size.

Seed vocabulary: add, alert, archive, arrow-down, arrow-left, arrow-right, arrow-up, attach, back,
bell, bookmark, calendar, camera, cart, chat, check, chevron-down, chevron-left, chevron-right,
chevron-up, clock, close, cloud, copy, delete, download, drag, edit, error, expand, collapse, external,
eye, eye-off, file, filter, flag, folder, heart, help, home, image, info, link, list, location, lock,
login, logout, mail, menu, minus, more, moon, pause, phone, play, plus, print, redo, refresh, save,
search, send, settings, share, sort, star, sun, tag, undo, unlock, upload, user, users, video, warning,
zoom-in, zoom-out.
