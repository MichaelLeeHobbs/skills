# Canaries

Six planted nodes whose correct result is known. Inject them into the live page on the first collected
screen of every theme. Never write them to a file in the repo.

## What to inject

Append one container to the end of `<body>`, after the theme is applied. Set the two theme values for the
theme being rendered: `PAGE` and `CARD` are `#ffffff` and `rgba(255, 255, 255, 0.9)` in a light theme,
`#111827` and `rgba(31, 41, 55, 0.9)` in a dark one (for a theme that is neither, use the values of the
theme it is closest to by root luminance).

```html
<div id="tp-canaries" style="position:relative;z-index:2147483647;background:PAGE;padding:16px;
     --tp-canary-text:#6b7280;--tp-canary-card:CARD">
  <div style="background:var(--tp-canary-card);padding:8px">
    <p data-tp="token" style="color:var(--tp-canary-text);font-size:16px">canary token</p>
  </div>
  <p data-tp="literal" style="color:#333333;font-size:16px">canary literal</p>
  <div style="opacity:0.4;background:transparent">
    <p data-tp="opacity" style="color:#111827;background:#ffffff;font-size:16px">canary opacity</p>
  </div>
  <p data-tp="gradient" style="color:#000000;background-color:#ffffff;
     background-image:linear-gradient(#ffffff,#ffffff);font-size:16px">canary gradient</p>
  <p data-tp="hidden" style="position:absolute;width:1px;height:1px;overflow:hidden;
     clip:rect(0 0 0 0);color:#eeeeee">canary hidden</p>
  <p data-tp="large" style="color:#949494;background:#ffffff;font-size:18.6667px;font-weight:700">canary large</p>
</div>
```

The collector writes rows inside `#tp-canaries` to a separate canary file, with `id`
`canary-<data-tp>-<theme>` and `key` `canary|<data-tp>`, and leaves them out of the main rows. Canary rows
never enter the main `measure`, `parity` or `cluster` runs, the report's counts or the catalog.

## Expected results

| Canary | Light theme | Dark theme | If it misbehaves, suspect |
|---|---|---|---|
| token | `PASS`, `fg_src` `--tp-canary-text@#tp-canaries` | `FAIL`, same `fg_src` | alpha compositing, token attribution, or the theme switch |
| literal | `PASS` | `FAIL`; parity side `fg` | literal sources or the cross-theme `key` |
| opacity | `FAIL` | `FAIL` | the `layers` walk dropping elements with opacity below 1 |
| gradient | `UNDECIDED` | `UNDECIDED` | the undecided flags |
| hidden | `SKIPPED` | `SKIPPED` | the `skip` rules |
| large | `PASS` | `PASS` | `size` or `weight` (a negative: it must not fail) |

Write one `expect` record per canary and theme (12 for two themes), with `fg_src` set only for the token
canary, and one `expect_fixed` with key `canary|literal` and side `fg`. Run `measure` on the canary file,
`parity` on its pairs, then `verify --check canaries` on the pairs, the `fixed` records and the
expectations.

## The proof canary

In step 4, treat the token canary as one more target: run `candidates` for target
`--tp-canary-text@#tp-canaries`, side `fg`, in the dark theme, with candidate `#9ca3af`. It must show
`fixed` 1 and `regressed` 0. Then inject `#tp-canaries{--tp-canary-text:#9ca3af}`, re-collect the canary
container in the dark theme with ids suffixed `-proof`, and expect `canary-token-dark-proof` to be `PASS`.
If it is not, the proof step itself is broken and every PROVEN in the report is void.

## When injection fails

A page can refuse the injected container (a content security policy that blocks inline styles, a
framework that re-renders `<body>` and removes it). Then the canary rows are missing, `verify --check
canaries` reports them `missing`, and the run fails. Do not skip the canaries to get past this: say in the
report which screen refused them and try the next screen in the inventory as the canary screen.
