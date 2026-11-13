# Tool contract

The skill's one deterministic tool. Unlike find-reinvention's, it reads source text and measures distance,
because token drift is lexical and numeric: a model must never count values or compute a colour
difference. It never decides intent, never edits a file and never reads anything but standard input.
Build it from [ALGORITHM.md](ALGORITHM.md) and [COLOUR.md](COLOUR.md) in whatever runtime the machine has,
then run every fixture in [fixtures/](fixtures/). Any failing fixture stops the run.

**Prerequisite:** arbitrary-precision integers (JS `BigInt`, Python `int`, Java `BigInteger`, Go
`math/big`). Colour maths reaches about 10^100.

## Invocation

```
<tool> inspect [--root-px N]
<tool> sweep
<tool> cluster [--root-px N]
<tool> measure [--root-px N]
<tool> diff
<tool> verify --check occ
<tool> verify --check coverage [--max-ignored-basis-points N]
<tool> verify --check canaries
```

Input is JSON Lines on standard input; output is JSON Lines on standard output. Nothing on standard error
needs reading. Options are `--name value` pairs in any order. Every value except `--check`'s is one or more
ASCII digits read as a decimal integer. Defaults: `--root-px 16`, `--max-ignored-basis-points 1000`. Usage
errors: no subcommand or an unknown one; `verify` without `--check`, or a check name not listed; an option
not listed for that invocation, repeated, or missing its value; a value that is not digits or is above
9007199254740991; `--root-px 0`; any argument not starting with `--` where an option name is expected.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Input valid and no problem found (always 0 for valid `inspect`, `sweep`, `cluster` and `diff` input) |
| 1 | Input valid, and a check found a problem, or `measure` rejected a plan record |
| 2 | Usage error or malformed input. Output is exactly one error record |

## Input lines

As find-reinvention's contract: split on LF, ignore the empty string after a final LF, remove one trailing
CR per line, no BOM stripping (a line starting with one is `bad_json`), each line valid UTF-8 holding one
JSON object with a string field `t`. Empty standard input is zero lines. `NaN` and `Infinity` are not JSON;
when an object repeats a key, the last one counts. Fields not listed are ignored. Line numbers count from 1.
Records may come in any order: a reference is checked against every record in the input.

Field types: `str` (a string, possibly empty), `name` (a non-empty string), `int` (a JSON number whose
value is a whole number from 0 to 9007199254740991; `1.0` counts), and a closed list (a string from the
list; anything else is `bad_field`). `cat` is the closed list `colour`, `spacing`, `radius`, `font-size`,
`shadow`, `z-index`, `other`. `kind` is `literal` or `ref`.

## Output format

As find-reinvention's: one compact JSON object per line, LF after each, keys in exactly the order shown
here, strings escaped as `JSON.stringify` does (lowercase `\u00XX` for other control characters, every
other character as itself), integers in plain decimal, booleans as `true`/`false`. Integers that can exceed
9007199254740991 (OKLab components, luminance) are printed as JSON strings. A share is a basis-point
string: `floor(num * 10000 / den)` printed as `<bp div 10000>.<bp mod 10000, four digits>`, and `"0.0000"`
when den is 0. Objects with computed keys (`by_status`) list keys in byte order.

## Error record

`{"t":"error","line":3,"reason":"bad_json"}`. `line` is 0 for a usage error. Reasons: `usage`, `bad_json`,
`not_object`, `unknown_type` (`t` missing, not a string, or not accepted by this invocation),
`missing_field`, `bad_field`, `duplicate`, `unknown_path` (an `occ` or `token` path with no `src` record),
`unknown_token` (a ref chain or a `surface` names a token that does not exist), `cycle` (a ref chain
revisits a token).

## Record types

Shared input records:

```
{"t":"src","path":name,"text":str}
{"t":"occ","path":name,"start":int,"len":int,"line":int,"raw":name,"prop":name,"cat":cat,"kind":kind,"value":name}
{"t":"token","name":name,"mode":name,"cat":cat,"path":name,"start":int,"len":int,"raw":name,"kind":kind,"value":name}
{"t":"ignore","path":name,"start":int,"len":int,"reason":"comment"|"non-style"}
{"t":"surface","token":name}
{"t":"scope","name":name,"prefix":str}
```

`src.text` is a whole file; `start` and `len` are byte offsets into its UTF-8 encoding, `line` counts from
1. `occ.raw` is the exact source text at the span; `occ.value` is the value to parse (`"16px"` for a JS
`padding: 16`), or the token name for a `ref`. `prop` is the CSS property in kebab case; for a shorthand
that mixes categories (`border`, `background`, `font`, `outline`, `column-rule`, `text-decoration`) it is
the longhand the value sets. A `token` with kind `ref` has the referenced token's name in `value`.

**Property table.** These properties have a category; every other property is `other`:

- colour: `accent-color`, `background-color`, `border-block-color`, `border-block-end-color`,
  `border-block-start-color`, `border-bottom-color`, `border-color`, `border-inline-color`,
  `border-inline-end-color`, `border-inline-start-color`, `border-left-color`, `border-right-color`,
  `border-top-color`, `caret-color`, `color`, `column-rule-color`, `fill`, `flood-color`, `lighting-color`,
  `outline-color`, `stop-color`, `stroke`, `text-decoration-color`, `text-emphasis-color`
- spacing: `column-gap`, `gap`, `row-gap`, and `margin` and `padding` with each suffix: none, `-top`,
  `-right`, `-bottom`, `-left`, `-block`, `-block-start`, `-block-end`, `-inline`, `-inline-start`,
  `-inline-end`
- radius: `border-radius`, `border-top-left-radius`, `border-top-right-radius`,
  `border-bottom-left-radius`, `border-bottom-right-radius`, `border-start-start-radius`,
  `border-start-end-radius`, `border-end-start-radius`, `border-end-end-radius`
- font-size: `font-size`; shadow: `box-shadow`, `text-shadow`; z-index: `z-index`

### inspect

Input: `{"t":"colour","value":name}` and `{"t":"size","cat":"spacing"|"radius"|"font-size","value":name}`.
Output, one per input record in order (the long integers are shortened here):

```
{"t":"colour","value":"#abc","key":"#aabbcc","L":"7844...","a":"-113...","b":"-284...","alpha":255,"Y":"4844...","neutral":true}
{"t":"size","cat":"spacing","value":"1rem","key":"16px","class":"normal"}
```

An unparsed colour prints `key`, `L`, `a`, `b`, `Y` as `""`, `alpha` 0, `neutral` false. An unparsed size
prints `key` and `class` as `""`.

### sweep

Input: `src`. Output: one `hit` per literal, sorted by path (byte order) then start, then a summary.

```
{"t":"hit","path":"a.css","start":11,"len":4,"line":1,"kind":"colour","raw":"#fff"}
{"t":"summary","files":1,"hits":15,"colour":6,"length":9}
```

### verify --check occ

Input: `src`, `occ`, `token`. Output: one `problem` per failed check, then a summary. Exit 1 when any
problem exists or there are no `occ` and no `token` records.

```
{"t":"problem","line":3,"check":"raw","path":"app/x.tsx","start":33}
{"t":"summary","occ":7,"tokens":1,"problems":8}
```

`check` is `span`, `raw`, `line` or `category`.

### verify --check coverage

Input: `{"t":"hit","path":name,"start":int,"len":int,"line":int,"kind":"colour"|"length","raw":name}` (as
`sweep` prints it), `occ`, `token`, `ignore`. Output: one `gap` per unaccounted hit,
then a summary. Exit 1 unless `pass`.

```
{"t":"gap","path":"a.css","start":30,"len":4,"line":2,"raw":"12px"}
{"t":"summary","hits":5,"occ":4,"token":1,"ignored":0,"by_reason":{"comment":0,"non-style":0},"gaps":0,"coverage":"1.0000","ignored_share":"0.0000","pass":true}
```

### cluster

Input: `occ`, `token`, `surface`, `scope`. Output, in this order: `badtoken`, `tokenvalue`, `value`,
`tokenuse`, `unresolved`, `unparsed`, `scope`, `summary` records.

```
{"t":"badtoken","name":"--bad","mode":"default","cat":"colour","value":"color-mix(in srgb, red, blue)"}
{"t":"tokenvalue","cat":"colour","value":"#7a7a7a","names":["--grey-500","--grey-500-alias"],"neutral":true}
{"t":"value","cat":"colour","value":"#747474","sample":"#747474","uses":2,"status":"snap","anchor":"--grey-500","leader":"","distance":20,"neutral":true,"sites":["a.css:3","a.css:4"]}
{"t":"tokenuse","token":"--grey-500","uses":1}
{"t":"unresolved","value":"--nope","uses":1,"sites":["a.css:14"]}
{"t":"unparsed","cat":"colour","value":"color-mix(in srgb, red 50%, blue)","uses":1,"sites":["src/b/y.css:9"]}
{"t":"scope","scope":"team-b","cat":"colour","uses":2,"drift_uses":2,"ref_uses":1}
{"t":"summary","cat":"colour","values":14,"uses":22,"token_values":4,"ref_uses":2,"unparsed_uses":0,"drift_values":12,"drift_uses":16,"matched_values":8,"matched_uses":13,"literal_share":"0.9166","by_status":{"cluster":2,"exact":2,"lone":1,"near":3,"snap":6}}
```

`status` is one of: colours `exact`, `snap`, `near`, `cluster`, `lone`; sizes `exact`, `near`, `cluster`,
`lone`, `zero`, `hairline`, `relative`, `full`; shadows `exact`, `near`, `cluster`, `lone`; z-index
`exact`, `local`, `token_plus_n`, `escalation`, `off_ladder`. `distance` is milli-dEOK for colours,
hundredths of a px for sizes and shadows, and the step above the anchor for `token_plus_n`.

### measure

Input: as `cluster`, plus
`{"t":"plan","cat":cat,"value":name,"action":"SNAP"|"NEW"|"KEEP"|"SPLIT","token":str,"intent":str,"cite":str}`.
Output: `reject` records, then `result` records, then one summary per category. Exit 1 when any reject.

```
{"t":"reject","line":6,"reason":"unknown_value"}
{"t":"result","cat":"colour","value":"#767676","action":"SNAP","token":"--grey-500","verdict":"REFUTED","shift":"imperceptible","distance":13,"contrast":"crossed","crossings":["#ffffff@default 4.54 4.29"]}
{"t":"summary","cat":"colour","before":7,"planned":7,"kept":1,"snapped":4,"visible":1,"refuted":1,"after":3}
```

Reject reasons: `unknown_value`, `duplicate`, `unknown_token`, `bad_intent`, `bad_cite`. `verdict` is
`CONFIRMED`, `VISIBLE`, `REFUTED`, or `NONE` for actions other than SNAP. `shift` is `imperceptible`,
`within-floor`, `visible`, or `""`. `contrast` is `kept`, `crossed`, `unmeasured`, `none`, or `""`.
`intent` for KEEP is one of `brand`, `hairline`, `local-layer`, `optical`, `palette`, `state`,
`third-party`.

### diff

Input: `{"t":"old","cat":cat,"value":name,"uses":int,"anchor":str}` (the saved catalog) and `value`
records as `cluster` prints them (only `cat`, `value`, `uses`, `anchor` are read). Output: `change`
records, then a summary.

```
{"t":"change","cat":"colour","value":"#888888","kind":"anchor","old_uses":2,"new_uses":2,"old_anchor":"","new_anchor":"--b"}
{"t":"summary","added":2,"removed":1,"anchor":1,"uses":1,"same":1}
```

### verify --check canaries

Input: `{"t":"expect","id":name,"rec":name,"cat":str,"value":name,"field":name,"want":str}` plus any other
records, accepted with any string `t` and treated as data (a missing or non-string `t` is still
`unknown_type`). Output: one `canary` per expect in input order, then a
summary. Exit 1 when any canary fails or there are none.

```
{"t":"canary","id":"c5","pass":true,"got":"REFUTED"}
{"t":"summary","canaries":4,"passed":4,"pass":true}
```
