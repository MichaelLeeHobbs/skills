# Measuring bundle and install cost

Bundle cost is what a user downloads: generated JavaScript and CSS attributed to a package in the app's
own production build. Measure it; never quote a size from memory, a registry or a website.

## Which apps

After step 3, list each shipped app whose runtime holds a family. For each, give the user its production
build command and an expected time (from a previous build log, or say unknown). The user approves the
list. Running a build runs the repo's own build configuration code; that is why each app needs approval.

## Building

1. Build from the user's checkout with the dependencies already installed. Never install, never edit a
   build config file, never pass a flag that writes outside the work folder except the build cache the
   bundler always writes.
2. Switch source maps on and send output to the work folder with flags or environment variables only:

| Bundler | Source maps | Output folder |
|---|---|---|
| Vite | `vite build --sourcemap` | `--outDir <work>/<app>` |
| Rollup | `rollup -c --sourcemap` | `--dir <work>/<app>` when the config has one output |
| webpack | `webpack --mode production --devtool source-map` | `--output-path <work>/<app>` |
| esbuild | `--sourcemap` (or `--metafile`, whose `bytesInOutput` per input may replace source maps) | `--outdir <work>/<app>` |
| Next.js, other frameworks | only if the framework has a documented flag or variable for browser source maps | if it cannot write outside the repo, ask the user before writing its usual git-ignored output folder |

   If source maps cannot be switched on without editing config, the app is `not measured: source maps
   need a config change`. If the build fails, it is `not measured: build failed` with the first error
   line.

## Records for `bytes`

For every JavaScript and CSS output file with a source map, write one `chunk` record: `sources` and
`mappings` from its map, `lines` as each output line's length in UTF-16 code units (the string length in
JavaScript), `initial` true when the HTML entry or the bundler's manifest loads it at start-up. An output
file with no map still counts toward the app's total: write it as a `chunk` with `sources` `[]`,
`mappings` `""` and its `lines`. Write a `rename` record for every alias folder name.

Run `bytes`. An app below the 95% floor is `not measured: attribution <coverage>`. Webpack and Rollup
module statistics measure modules before minification and merge concatenated modules; never report them
as bundle cost.

## Savings

For each REAL family, write a drop set per app: the candidate loser plus every package `families`
attached to it. Run `pins` with that app's graph and its `size` records from `bytes`.

- `gross`: the closure's attributed units, initial and lazy, are the saving, labelled gross because the
  keeper may grow when it takes over the calls.
- `pinned`: the saving is 0. Name the pinning packages; the drop needs them replaced too.
- `absent`: the package does not ship in this app.

Units are UTF-16 code units of minified output, equal to bytes for ASCII output. Never split a compressed
size per package; report compressed totals only for whole apps.

Two resolved versions of one package show as `copies` above 1: report them with their units as a side
finding.

## Backends and anything not bundled

Nothing is downloaded, so report install cost and say so. Measure each installed package folder's size on
disk and write it as a `size` record with `initial` set to those bytes and `lazy` 0, then run `pins` with
the backend's graph. Report the closure's sum and package count, labelled `install cost, not bundle
cost`. A serverless function that is bundled is
measured like a front end.
