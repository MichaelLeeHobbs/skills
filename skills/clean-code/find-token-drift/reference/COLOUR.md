# Value parsing and colour maths

Part of the tool spec. [ALGORITHM.md](ALGORITHM.md) says when each rule here runs; [CONTRACT.md](CONTRACT.md)
wins any disagreement. Every step uses exact integer or rational arithmetic, so every runtime produces the
same bytes. The tables at the end are data: copy them, never recompute them.

## Conventions

- **Rational** means an exact fraction. Parse decimal text into one: `"0.3"` is 3/10, never a float.
- **floor(x)** rounds toward minus infinity, also for negatives. **trunc(x)** rounds toward zero.
  **rhu(x)** (round half up) is `floor(x + 1/2)`. Integer division in many runtimes truncates: check
  negatives.
- **Number text**: an optional `+` or `-`, then digits with an optional `.` and optional more digits, or a
  `.` followed by digits. No exponent. `1.` is a number; `1e2` is not.
- **ASCII whitespace** is space, tab, LF, CR and form feed. **Trim** removes it from both ends. **Split on
  whitespace** splits on runs of it and drops empty pieces. **Lower** maps only `A` to `Z`.
- **clamp(x, lo, hi)** limits x to the range.

## Colours

Trim, then lower the text. A colour is either an **sRGB colour** (8-bit `r`, `g`, `b` and 8-bit alpha `A`)
or an **OKLab colour** (integers `L`, `a`, `b` at scale 10^20 and 8-bit alpha `A`). Anything not matched
below is unparsed.

**Alpha text** (absent means 255): `none` is 0; a number followed by `%` is that number / 100; a bare number
is itself. Then `A = rhu(clamp(v, 0, 1) * 255)`. So `0.3` gives 77 and `30%` gives 77.

Forms:

1. `#` and 3, 4, 6 or 8 hex digits. 3 and 4 digits double each digit. The 7th and 8th digits are alpha.
2. `transparent`: sRGB 0, 0, 0 with alpha 0.
3. A name in the named-colour table: that sRGB colour with alpha 255.
4. A function: a name (`rgb`, `rgba`, `hsl`, `hsla`, `oklab`, `oklch`), `(`, inner text, `)` ending the
   text. The inner text must contain no `(` or `)`. Split the inner text into channel texts and alpha text:
   - If it contains a `,`: it must contain no `/`; split on `,`; trim each part; every part must be
     non-empty with no whitespace inside; 3 parts are channels, 4 parts are channels then alpha.
   - Otherwise: if it contains `/`, there must be exactly one; the text after it, trimmed, is the alpha
     text and must be non-empty with no whitespace inside; the text before it is the channels. Split the
     channels on whitespace: there must be exactly 3.
   - `rgb` and `rgba` are the same function, as are `hsl` and `hsla`.

**rgb**: each channel is `none` (0), a number followed by `%` (times 255 / 100), or a number. Then
`rhu(clamp(v, 0, 255))`.

**hsl**: hue is `none` (0), a number, or a number followed by `deg`. Saturation and lightness are each `none`
(0), a number, or a number followed by `%`; both forms mean percent: `s = clamp(v / 100, 0, 1)`, same for
`l`. Reduce the hue: `h = h - 360 * floor(h / 360)`. With `m = s * min(l, 1 - l)` and, for n in 0, 8, 4,
`k = (n + h / 30) - 12 * floor((n + h / 30) / 12)` and `f(n) = l - m * max(-1, min(k - 3, 9 - k, 1))`, the
channels are `r = rhu(f(0) * 255)`, `g = rhu(f(8) * 255)`, `b = rhu(f(4) * 255)`, all in rationals.

**oklab** and **oklch**, lightness: `none` (0), a number followed by `%` (divided by 100), or a number. Then
`L = floor(clamp(v, 0, 1) * 10^20)`.

**oklab**, `a` and `b`: `none` (0), a number followed by `%` (times 0.4 / 100), or a number. Then
`trunc(v * 10^20)`.

**oklch**, chroma `ch`, an unscaled rational: `none` (0), a number followed by `%` (times 0.4 / 100), or a
number; a negative chroma is 0. Hue: `none` (0), a number, or a number followed by `deg`. With `(cos, sin)`
from the hue rule below (scale 10^30), `a = trunc(ch * cos / 10^10)` and `b = trunc(ch * sin / 10^10)`,
computed in rationals, giving scale 10^20.

**Hue rule** (cos and sin at scale 10^30). Let `PI = 3141592653589793238462643383279` (pi at 10^30, floored)
and `S = 10^30`.
1. Reduce: `H = H - 360 * floor(H / 360)`, in rationals. Let `q = floor(H / 90)` and `r = H - 90 * q`.
2. If `r <= 45`: `x = floor(r * PI / 180)`, `cos = C(x)`, `sin = Sn(x)`. Otherwise
   `x = floor((90 - r) * PI / 180)`, `cos = Sn(x)`, `sin = C(x)`.
3. Rotate q times: each rotation replaces `(cos, sin)` with `(-sin, cos)`.

`C(x)`: `t = S`, `total = S`; for k from 1 to 12: `t = floor(t * x * x / (S * S * (2k - 1) * 2k))`, then
subtract t from total when k is odd and add it when k is even. `Sn(x)`: the same with `t = x`,
`total = x` and the divisor `S * S * 2k * (2k + 1)`. Every t is non-negative, so floor and trunc agree.

### Canonical text (the colour's key)

- sRGB: `#` and `r`, `g`, `b` as two lowercase hex digits each, then alpha as two more when `A != 255`.
- OKLab: `oklab(L a b)`, or `oklab(L a b / A)` when `A != 255`, with each number in plain decimal (a leading
  `-` when negative). For example `oklab(70000000000000000000 -9396926207859083840 -3420201433256687330)`.

### sRGB to OKLab

Let `lin(v)` be the linearisation table entry for v (scale 10^12).
1. `lms_i = sum over j of M1[i][j] * lin(channel_j)`, with channels in the order r, g, b (scale 10^22).
2. `p_i = icbrt(lms_i * 10^8)`, the floor integer cube root: the largest integer whose cube is at most the
   argument (scale 10^10).
3. `(L, a, b)_i = sum over j of M2[i][j] * p_j` (scale 10^20).

No division happens, so the only rounding is the cube root's floor.

### OKLab to linear (for luminance only)

1. `p_i = sum over j of M2I[i][j] * (L, a, b)_j` (scale 10^30).
2. `c_i = p_i^3` (scale 10^90).
3. `rgb_i = floor((sum over j of M1I[i][j] * c_j) / 10^88)`, then `clamp(rgb_i, 0, 10^12)` (scale 10^12).

### Derived values

- **Luminance** `Y = 2126 * R + 7152 * G + 722 * B` (scale 10^16), where R, G, B are `lin()` of the sRGB
  channels, or the OKLab-to-linear result for an OKLab colour. Alpha is ignored.
- **Distance** in milli units: `milli(p, q) = floor(isqrt(dL^2 + da^2 + db^2) / 10^17)`, where isqrt is the
  floor integer square root and dL, da, db are the OKLab differences. Every threshold compares this
  printed integer, never the exact distance.
- **Neutral**: with `c2 = a^2 + b^2`, `m = min(L, 10^20 - L)` and `X = max(4 * 10^17, floor(m / 4))`, the
  colour is neutral when `c2 <= X^2` and `c2 <= (5 * 10^18)^2`. A pale tint (`#fef2f2`) is not neutral;
  Tailwind's gray and slate families are.
- **Contrast** of luminances y1, y2: `hi = max`, `lo = min`. It is at least T/10 (T is 45 or 30) when
  `(hi + 5 * 10^14) * 10 >= T * (lo + 5 * 10^14)`. Printed as `floor((hi + 5 * 10^14) * 100 / (lo + 5 * 10^14))`
  written as `<n div 100>.<n mod 100, two digits>`, for example `4.54`.

### Matrices (scale 10^10)

```
M1  = [[ 4122214708,   5363325363,    514459929],
       [ 2119034982,   6806995451,   1073969566],
       [  883024619,   2817188376,   6299787005]]
M2  = [[ 2104542553,   7936177850,    -40720468],
       [19779984951, -24285922050,   4505937099],
       [  259040371,   7827717662,  -8086757660]]
M2I = [[10000000000,   3963377774,   2158037573],
       [10000000000,  -1055613458,   -638541728],
       [10000000000,   -894841775, -12914855480]]
M1I = [[40767416621, -33077115913,   2309699292],
       [-12684380046, 26097574011,  -3413193965],
       [  -41960863,  -7034186147,  17076147010]]
```

## Sizes (spacing, radius, font size)

Trim and lower. Read an optional sign (`+` or `-`), then the longest run of digits and `.` as the number
text, then the rest as the unit. The number text must be a valid number. An empty unit is allowed only when
the number is 0 (it then means px).

- `px`: `mag = rhu(n * 100)`, unit px.
- `rem`: `mag = rhu(n * root * 100)`, unit px, where root is `--root-px`.
- `em`, `%`, `vw`, `vh`, `vmin`, `vmax`, `ch`, `ex`: `mag = rhu(n * 100)`, that unit.
- Anything else is unparsed (`calc()`, `auto`, `pt`, a unitless non-zero number).

mag is the magnitude in hundredths, rounded on the absolute value, so `-1.005px` gives 101 and a minus sign.
Then the class and key:

- mag 0: class `zero`, key `0px`, sign positive (whatever the unit).
- unit not px: class `relative`, key `<sign><h><unit>`.
- category radius and mag >= 99900: class `full`, key `full`.
- mag <= 200: class `hairline`; otherwise `normal`. Key `<sign><h>px`.

`<sign>` is `-` for a negative value and nothing otherwise. `<h>` prints hundredths: `mag div 100`, then, if
`mag mod 100` is not 0, a `.` and its two digits with trailing zeros dropped (`1350` is `13.5`, `1305` is
`13.05`).

## Shadows

Split the text on commas outside parentheses into layers. In each layer, split the trimmed text on
whitespace outside parentheses into words. For each word in order:
- `inset` (any case): the layer is inset; a second `inset` makes the shadow unparsed.
- a word that parses as a size (category shadow) of class other than `relative`: the next length. A
  `relative` size makes the shadow unparsed.
- otherwise a colour; a second colour, or a word that is neither, makes the shadow unparsed.

A layer needs exactly one colour and 2 to 4 lengths; missing blur and spread are `0`. Each length's signed
value is `sign * mag`. Key: layers joined by `, `; each layer is `inset ` when inset, then the four length
keys separated by spaces, a space, and the colour key. `0 1px 2px rgba(0,0,0,.12)` gives
`0px 1px 2px 0px #0000001f`.

## z-index

Trim. An optional `+` or `-` then one or more digits; anything else is unparsed. The key is the integer in
plain decimal (`007` is `7`, `+3` is `3`, `-0` is `0`).

## Linearisation table

`lin(v)`: the sRGB transfer function `((v / 255 + 0.055) / 1.055)^2.4` (or `v / 255 / 12.92` at or below
0.04045), times 10^12, rounded half up, computed once at high precision.

| v | lin(v) |
|---|---|
| 0 | 0 |
| 1 | 303526984 |
| 2 | 607053967 |
| 3 | 910580951 |
| 4 | 1214107934 |
| 5 | 1517634918 |
| 6 | 1821161901 |
| 7 | 2124688885 |
| 8 | 2428215868 |
| 9 | 2731742852 |
| 10 | 3035269835 |
| 11 | 3346535764 |
| 12 | 3676507324 |
| 13 | 4024717018 |
| 14 | 4391442037 |
| 15 | 4776953481 |
| 16 | 5181516702 |
| 17 | 5605391624 |
| 18 | 6048833023 |
| 19 | 6512090793 |
| 20 | 6995410187 |
| 21 | 7499032043 |
| 22 | 8023192985 |
| 23 | 8568125618 |
| 24 | 9134058702 |
| 25 | 9721217320 |
| 26 | 10329823030 |
| 27 | 10960094006 |
| 28 | 11612245180 |
| 29 | 12286488357 |
| 30 | 12983032342 |
| 31 | 13702083047 |
| 32 | 14443843596 |
| 33 | 15208514423 |
| 34 | 15996293366 |
| 35 | 16807375753 |
| 36 | 17641954488 |
| 37 | 18500220128 |
| 38 | 19382360957 |
| 39 | 20288563057 |
| 40 | 21219010376 |
| 41 | 22173884793 |
| 42 | 23153366178 |
| 43 | 24157632449 |
| 44 | 25186859627 |
| 45 | 26241221895 |
| 46 | 27320891639 |
| 47 | 28426039504 |
| 48 | 29556834438 |
| 49 | 30713443733 |
| 50 | 31896033073 |
| 51 | 33104766571 |
| 52 | 34339806809 |
| 53 | 35601314875 |
| 54 | 36889450401 |
| 55 | 38204371595 |
| 56 | 39546235277 |
| 57 | 40915196907 |
| 58 | 42311410621 |
| 59 | 43735029257 |
| 60 | 45186204386 |
| 61 | 46665086337 |
| 62 | 48171824227 |
| 63 | 49706565984 |
| 64 | 51269458374 |
| 65 | 52860647023 |
| 66 | 54480276442 |
| 67 | 56128490050 |
| 68 | 57805430191 |
| 69 | 59511238163 |
| 70 | 61246054232 |
| 71 | 63010017653 |
| 72 | 64803266693 |
| 73 | 66625938644 |
| 74 | 68478169844 |
| 75 | 70360095697 |
| 76 | 72271850682 |
| 77 | 74213568380 |
| 78 | 76185381481 |
| 79 | 78187421805 |
| 80 | 80219820314 |
| 81 | 82282707130 |
| 82 | 84376211544 |
| 83 | 86500462037 |
| 84 | 88655586286 |
| 85 | 90841711183 |
| 86 | 93058962847 |
| 87 | 95307466631 |
| 88 | 97587347142 |
| 89 | 99898728247 |
| 90 | 102241733088 |
| 91 | 104616484091 |
| 92 | 107023102978 |
| 93 | 109461710778 |
| 94 | 111932427837 |
| 95 | 114435373827 |
| 96 | 116970667759 |
| 97 | 119538427988 |
| 98 | 122138772230 |
| 99 | 124771817561 |
| 100 | 127437680436 |
| 101 | 130136476690 |
| 102 | 132868321554 |
| 103 | 135633329655 |
| 104 | 138431615032 |
| 105 | 141263291140 |
| 106 | 144128470858 |
| 107 | 147027266498 |
| 108 | 149959789811 |
| 109 | 152926151996 |
| 110 | 155926463708 |
| 111 | 158960835061 |
| 112 | 162029375639 |
| 113 | 165132194502 |
| 114 | 168269400190 |
| 115 | 171441100733 |
| 116 | 174647403656 |
| 117 | 177888415984 |
| 118 | 181164244250 |
| 119 | 184474994500 |
| 120 | 187820772301 |
| 121 | 191201682741 |
| 122 | 194617830442 |
| 123 | 198069319560 |
| 124 | 201556253794 |
| 125 | 205078736390 |
| 126 | 208636870145 |
| 127 | 212230757414 |
| 128 | 215860500114 |
| 129 | 219526199729 |
| 130 | 223227957317 |
| 131 | 226965873510 |
| 132 | 230740048524 |
| 133 | 234550582161 |
| 134 | 238397573812 |
| 135 | 242281122466 |
| 136 | 246201326708 |
| 137 | 250158284730 |
| 138 | 254152094331 |
| 139 | 258182852922 |
| 140 | 262250657530 |
| 141 | 266355604803 |
| 142 | 270497791013 |
| 143 | 274677312060 |
| 144 | 278894263477 |
| 145 | 283148740430 |
| 146 | 287440837727 |
| 147 | 291770649818 |
| 148 | 296138270798 |
| 149 | 300543794416 |
| 150 | 304987314070 |
| 151 | 309468922818 |
| 152 | 313988713376 |
| 153 | 318546778125 |
| 154 | 323143209113 |
| 155 | 327778098057 |
| 156 | 332451536346 |
| 157 | 337163615048 |
| 158 | 341914424909 |
| 159 | 346704056355 |
| 160 | 351532599500 |
| 161 | 356400144146 |
| 162 | 361306779784 |
| 163 | 366252595599 |
| 164 | 371237680474 |
| 165 | 376262122991 |
| 166 | 381326011433 |
| 167 | 386429433787 |
| 168 | 391572477750 |
| 169 | 396755230726 |
| 170 | 401977779832 |
| 171 | 407240211902 |
| 172 | 412542613484 |
| 173 | 417885070848 |
| 174 | 423267669986 |
| 175 | 428690496614 |
| 176 | 434153636175 |
| 177 | 439657173841 |
| 178 | 445201194516 |
| 179 | 450785782838 |
| 180 | 456411023180 |
| 181 | 462076999654 |
| 182 | 467783796112 |
| 183 | 473531496148 |
| 184 | 479320183101 |
| 185 | 485149940056 |
| 186 | 491020849848 |
| 187 | 496932995061 |
| 188 | 502886458033 |
| 189 | 508881320855 |
| 190 | 514917665377 |
| 191 | 520995573204 |
| 192 | 527115125706 |
| 193 | 533276404011 |
| 194 | 539479489012 |
| 195 | 545724461370 |
| 196 | 552011401512 |
| 197 | 558340389634 |
| 198 | 564711505705 |
| 199 | 571124829465 |
| 200 | 577580440430 |
| 201 | 584078417891 |
| 202 | 590618840919 |
| 203 | 597201788364 |
| 204 | 603827338855 |
| 205 | 610495570808 |
| 206 | 617206562420 |
| 207 | 623960391675 |
| 208 | 630757136346 |
| 209 | 637596873994 |
| 210 | 644479681971 |
| 211 | 651405637420 |
| 212 | 658374817279 |
| 213 | 665387298282 |
| 214 | 672443156958 |
| 215 | 679542469633 |
| 216 | 686685312435 |
| 217 | 693871761292 |
| 218 | 701101891933 |
| 219 | 708375779892 |
| 220 | 715693500506 |
| 221 | 723055128922 |
| 222 | 730460740090 |
| 223 | 737910408773 |
| 224 | 745404209540 |
| 225 | 752942216776 |
| 226 | 760524504675 |
| 227 | 768151147248 |
| 228 | 775822218317 |
| 229 | 783537791526 |
| 230 | 791297940333 |
| 231 | 799102738014 |
| 232 | 806952257669 |
| 233 | 814846572216 |
| 234 | 822785754396 |
| 235 | 830769876775 |
| 236 | 838799011741 |
| 237 | 846873231510 |
| 238 | 854992608124 |
| 239 | 863157213454 |
| 240 | 871367119199 |
| 241 | 879622396888 |
| 242 | 887923117882 |
| 243 | 896269353374 |
| 244 | 904661174391 |
| 245 | 913098651793 |
| 246 | 921581856277 |
| 247 | 930110858375 |
| 248 | 938685728458 |
| 249 | 947306536733 |
| 250 | 955973353249 |
| 251 | 964686247894 |
| 252 | 973445290398 |
| 253 | 982250550333 |
| 254 | 991102097114 |
| 255 | 1000000000000 |

## Named colours

Compare after lowering. Each maps to the sRGB colour shown, alpha 255.

| name | colour |
|---|---|
| aliceblue | #f0f8ff |
| antiquewhite | #faebd7 |
| aqua | #00ffff |
| aquamarine | #7fffd4 |
| azure | #f0ffff |
| beige | #f5f5dc |
| bisque | #ffe4c4 |
| black | #000000 |
| blanchedalmond | #ffebcd |
| blue | #0000ff |
| blueviolet | #8a2be2 |
| brown | #a52a2a |
| burlywood | #deb887 |
| cadetblue | #5f9ea0 |
| chartreuse | #7fff00 |
| chocolate | #d2691e |
| coral | #ff7f50 |
| cornflowerblue | #6495ed |
| cornsilk | #fff8dc |
| crimson | #dc143c |
| cyan | #00ffff |
| darkblue | #00008b |
| darkcyan | #008b8b |
| darkgoldenrod | #b8860b |
| darkgray | #a9a9a9 |
| darkgreen | #006400 |
| darkgrey | #a9a9a9 |
| darkkhaki | #bdb76b |
| darkmagenta | #8b008b |
| darkolivegreen | #556b2f |
| darkorange | #ff8c00 |
| darkorchid | #9932cc |
| darkred | #8b0000 |
| darksalmon | #e9967a |
| darkseagreen | #8fbc8f |
| darkslateblue | #483d8b |
| darkslategray | #2f4f4f |
| darkslategrey | #2f4f4f |
| darkturquoise | #00ced1 |
| darkviolet | #9400d3 |
| deeppink | #ff1493 |
| deepskyblue | #00bfff |
| dimgray | #696969 |
| dimgrey | #696969 |
| dodgerblue | #1e90ff |
| firebrick | #b22222 |
| floralwhite | #fffaf0 |
| forestgreen | #228b22 |
| fuchsia | #ff00ff |
| gainsboro | #dcdcdc |
| ghostwhite | #f8f8ff |
| gold | #ffd700 |
| goldenrod | #daa520 |
| gray | #808080 |
| green | #008000 |
| greenyellow | #adff2f |
| grey | #808080 |
| honeydew | #f0fff0 |
| hotpink | #ff69b4 |
| indianred | #cd5c5c |
| indigo | #4b0082 |
| ivory | #fffff0 |
| khaki | #f0e68c |
| lavender | #e6e6fa |
| lavenderblush | #fff0f5 |
| lawngreen | #7cfc00 |
| lemonchiffon | #fffacd |
| lightblue | #add8e6 |
| lightcoral | #f08080 |
| lightcyan | #e0ffff |
| lightgoldenrodyellow | #fafad2 |
| lightgray | #d3d3d3 |
| lightgreen | #90ee90 |
| lightgrey | #d3d3d3 |
| lightpink | #ffb6c1 |
| lightsalmon | #ffa07a |
| lightseagreen | #20b2aa |
| lightskyblue | #87cefa |
| lightslategray | #778899 |
| lightslategrey | #778899 |
| lightsteelblue | #b0c4de |
| lightyellow | #ffffe0 |
| lime | #00ff00 |
| limegreen | #32cd32 |
| linen | #faf0e6 |
| magenta | #ff00ff |
| maroon | #800000 |
| mediumaquamarine | #66cdaa |
| mediumblue | #0000cd |
| mediumorchid | #ba55d3 |
| mediumpurple | #9370db |
| mediumseagreen | #3cb371 |
| mediumslateblue | #7b68ee |
| mediumspringgreen | #00fa9a |
| mediumturquoise | #48d1cc |
| mediumvioletred | #c71585 |
| midnightblue | #191970 |
| mintcream | #f5fffa |
| mistyrose | #ffe4e1 |
| moccasin | #ffe4b5 |
| navajowhite | #ffdead |
| navy | #000080 |
| oldlace | #fdf5e6 |
| olive | #808000 |
| olivedrab | #6b8e23 |
| orange | #ffa500 |
| orangered | #ff4500 |
| orchid | #da70d6 |
| palegoldenrod | #eee8aa |
| palegreen | #98fb98 |
| paleturquoise | #afeeee |
| palevioletred | #db7093 |
| papayawhip | #ffefd5 |
| peachpuff | #ffdab9 |
| peru | #cd853f |
| pink | #ffc0cb |
| plum | #dda0dd |
| powderblue | #b0e0e6 |
| purple | #800080 |
| rebeccapurple | #663399 |
| red | #ff0000 |
| rosybrown | #bc8f8f |
| royalblue | #4169e1 |
| saddlebrown | #8b4513 |
| salmon | #fa8072 |
| sandybrown | #f4a460 |
| seagreen | #2e8b57 |
| seashell | #fff5ee |
| sienna | #a0522d |
| silver | #c0c0c0 |
| skyblue | #87ceeb |
| slateblue | #6a5acd |
| slategray | #708090 |
| slategrey | #708090 |
| snow | #fffafa |
| springgreen | #00ff7f |
| steelblue | #4682b4 |
| tan | #d2b48c |
| teal | #008080 |
| thistle | #d8bfd8 |
| tomato | #ff6347 |
| turquoise | #40e0d0 |
| violet | #ee82ee |
| wheat | #f5deb3 |
| white | #ffffff |
| whitesmoke | #f5f5f5 |
| yellow | #ffff00 |
| yellowgreen | #9acd32 |
