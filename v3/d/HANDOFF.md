# v3/c — tokenised against thelab.co

`v3/c` is `v3/b` with every font and spacing value tied to thelab's tokens.
`v3/b` is untouched and is the "before".

Load order in `index.html`, before the inline `<style>`:

1. `thelab-tokens.css` — the live site's tokens, stepped at 1023 / 767
2. `thelab-type-fluid.css` — overrides the **type** tokens with `clamp()` above 767
3. `thelab-space-fluid.css` — overrides the **spacer** tokens the same way

All three are variable-only. Beausite and Recife load from thelab.co's CDN, so the
real faces need a connection; without one the page falls back to `--font`.

**Breakpoint is 1023px**, in the stylesheet and in `config.js` (`grid.mobileAt`). Those two
have to agree or the grid switches column count at a different width than the CSS.

It is 1023 and not 767 for a measurable reason. The layout is drawn in design units
(`--u = width / 1440`) so every box shrinks *proportionally* — at 768 the artboard is 53%
of its 1440 size. The type tokens do not: they clamp toward a mobile floor that is a much
higher fraction of their desktop value. Measured as how much of the layout's own grid each
token occupies:

| width | `--u` | `--font-h-56` | `--font-p-18` | `--font-button-2` |
|---|---|---|---|---|
| 1440 | 1.000 | 56.0u | 18.0u | 16.0u |
| 1200 | 0.833 | 56.9u | 20.7u | 18.3u |
| 1024 | 0.711 | 57.9u | 23.6u | 20.8u |
| 900 | 0.625 | 58.7u | 26.2u | 23.0u |
| 768 | 0.533 | 60.0u | **30.0u** | **26.3u** |

1440 is the tuned row; anything above it is type outgrowing its box. Headlines behave
because `--font-h-56`'s floor is 32/56 = 57%, close to the layout's own 53%. Body copy does
not: `--font-p-18`'s floor is 16/18 = **89%**, so at 768 it occupies 30 design units where
the layout budgeted 18. `--font-eyebrow` would be the extreme at 12/12 = 100%.

So 768–1023 uses the stacked layout, which has no fixed unit measure for type to outgrow.
**Known trade-off:** the stacked layout runs a single full-width column, so the body measure
at 900–1023 is long (~760px at 900). A purpose-built tablet layout would constrain it.

See `TOKENS-REFERENCE.md` for what every token resolves to, and `NEW-TOKENS.md` for the
redesign's token changes plus the fluid type and spacing proposals.

---

## Type, by section

Values are **mobile · desktop 1440**; between 768 and 1440 each one scales smoothly.

Note the two breakpoints are deliberately different: the **token** values switch at 767
(that is the token files' own boundary), the **layout** switches at 1023. So 768–1023 gets
the stacked layout with tablet-range fluid type — which is the point, see above.

### Topbar
| Element | Token | Mobile · Desktop |
|---|---|---|
| `.nav a` | `--font-button-2` | 14 · 16 |
| `.logo span` | — | **left alone**, pending the real logo SVG. Its `font-family` is pinned to v3/b's Helvetica Neue stack, because `--font` became Beausite for the page and was pulling the wordmark with it. |

### Hero
| Element | Token | Mobile · Desktop |
|---|---|---|
| `h1` | `--font-h-80` | 48 · 80 |
| `.hero__aside p` | `--font-p-18` | 16 · 18 |
| `.cta` (all solid pills) | `--font-button-2` | 14 · 16 |

### Featured Work
| Element | Token | Mobile · Desktop |
|---|---|---|
| `.featuredwork__eyebrow` | `--font-button-2` | 14 · 16 |
| `.featuredwork h2` | `--font-h-56` | 32 · 56 |
| `.featuredwork .sec-head p` | `--font-p-18` | 16 · 18 |
| `.card__client` | `--font-p-18` | 16 · 18 |
| `.card__title` | `--font-h-24` | 20 · 24 |
| `.pill` | `--font-eyebrow` | 12 · 12 |
| `.cs-cursor span` | `--font-eyebrow` | 12 · 12 |

### Expertise
| Element | Token | Mobile · Desktop |
|---|---|---|
| `.exp__eyebrow` | `--font-button-2` | 14 · 16 |
| `.exp__head` | `--font-h-56` | 32 · 56 |
| `.exp__body` | `--font-p-18` | 16 · 18 |
| `.area` (4 titles) | `--font-h-32` | 24 · 32 |
| `.area__desc` | `--font-p-18` | 16 · 18 |

### Proof
| Element | Token | Mobile · Desktop |
|---|---|---|
| `.proof__head` | `--font-h-56` | 32 · 56 |
| `.proof__body` | `--font-p-18` | 16 · 18 |
| `.stat__num` | `--font-h-64` | 40 · 64 |
| `.stat__suffix` | `--font-h-64` | 40 · 64 |
| `.stat__sub` | `--font-p-18` | 16 · 18 |

### Footer
| Element | Token | Mobile · Desktop |
|---|---|---|
| `.pf__head` | `--font-h-40` | 32 · 40 |
| `.pf__cta` | `--font-button-2` | 14 · 16 |
| `.pf__city` | `--font-h-24` | 20 · 24 |
| `.pf__addr`, `.pf__tel` | `--font-p-16` | 14 · 16 |
| `.pf__legal` + its links | `--font-p-14` ★ new | 14 · 14 |

**Letter-spacing is zero everywhere**, per thelab.co. The headlines previously carried
−0.012em to −0.035em. `text-transform: uppercase` is kept on the eyebrows, pills, nav and
CTA labels; their positive tracking is not.

---

## Spacers, by section

Values are **mobile · desktop**.

| Where | Token | Mobile · Desktop |
|---|---|---|
| **Topbar** padding-block | `--spacer-24` | 16 · 24 |
| **Topbar** nav gap | `--spacer-32` | 24 · 32 |
| **Topbar** logo gap | `--spacer-12` | 8 · 12 |
| **Hero** body → CTA | `--spacer-24` | 16 · 24 |
| **Hero** headline → body *(mobile only)* | `--spacer-40` | 24 · — |
| **CTA** padding | `--spacer-8` / `--spacer-56` | 8 · 8 / 32 · 56 |
| **Work** eyebrow → headline | `--spacer-16` | 8 · 16 |
| **Work** headline → body | `--spacer-24` | 16 · 24 |
| **Work** body → CTA | `--spacer-24` | 16 · 24 |
| **Work** headline measure (padding-right) | `--spacer-40` | 24 · 40 |
| **Work** card client → title | `--spacer-16` | 8 · 16 |
| **Work** card title → pills | `--spacer-24` | 16 · 24 |
| **Work** pill gap | `--spacer-4` | 4 · 4 |
| **Work** pill padding | `--spacer-8` | 8 · 8 |
| **Work** ticker logo gap | `--spacer-80` | 40 · 80 |
| **Work** section padding *(mobile only)* | `--spacer-152` / `--spacer-80` | 64 / 40 |
| **Work** card → card *(mobile only)* | `--spacer-80` | 40 · — |
| **Work** image → text *(mobile only)* | `--spacer-24` | 16 · — |
| **Work** ticker top *(mobile only)* | `--spacer-120` | 56 · — |
| **Expertise** eyebrow → headline | `--spacer-16` | 8 · 16 |
| **Expertise** headline → body | `--spacer-24` | 16 · 24 |
| **Expertise** title → description | `--spacer-16` | 8 · 16 |
| **Expertise** section padding *(mobile only)* | `--spacer-200` / `--spacer-152` | 80 / 64 |
| **Expertise** list top *(mobile only)* | `--spacer-80` | 40 · — |
| **Expertise** item → item *(mobile only)* | `--spacer-40` | 24 · — |
| **Proof** headline → body | `--spacer-24` | 16 · 24 |
| **Proof** headline measure (padding-right) | `--spacer-40` | 24 · 40 |
| **Proof** number → suffix | `--spacer-8` | 8 · 8 |
| **Proof** number → caption | `--spacer-24` | 16 · 24 |
| **Proof** stats column gap | `--spacer-16` | 8 · 16 |
| **Proof** stats row gap | `--spacer-32` | 24 · 32 |
| **Proof** section padding *(mobile only)* | `--spacer-200` / `--spacer-80` | 80 / 40 |
| **Proof** stats top *(mobile only)* | `--spacer-56` | 32 · — |
| **Footer** pill padding | `--spacer-8` / `--spacer-56` | 8 · 8 / 32 · 56 |
| **Footer** city → address | `--spacer-12` | 8 · 12 |
| **Footer** address → phone | `--spacer-8` | 8 · 8 |
| **Footer** legal cluster gap | `--spacer-24` | 16 · 24 |
| **Footer** legal nav gap | `--spacer-16` | 8 · 16 |
| **Footer** socials gap | `--spacer-12` | 8 · 12 |
| **Footer** band padding *(mobile only)* | `--spacer-120` / `--spacer-80` | 56 / 40 |
| **Footer** mark margin *(mobile only)* | `--spacer-80` | 40 · — |
| **Footer** locations row gap *(mobile only)* | `--spacer-40` | 24 · — |
| **Footer** offices → legal | `--spacer-56` | 32 · 56 |
| **Footer** legal → page foot | `--spacer-40` | 24 · 40 |

### Snaps larger than 4px
- `.cta` / `.pf__cta` padding-inline **50 → 56** and **53 → 56**. Every pill is ~12px
  wider on desktop. If that is wrong, the fix is a `--spacer-48`, not a hand-set value.

### Mobile collisions
Three token pairs collapse to one value on a phone — `12 & 16 → 8`, `32 & 40 → 24`,
`56 & 64 → 32`. Two of them land in the same block:

1. **Footer office card** — city → address (`--spacer-12`) and address → phone
   (`--spacer-8`) are both **8** on mobile, where desktop has 12 and 8.
2. **Footer legal row** — the links' gap (`--spacer-16`) and the socials' gap
   (`--spacer-12`) are both **8**, side by side, where desktop has 16 and 12.

### Mobile-only ties
These exist on mobile alone, so they were picked by the mobile column, and two were
exact ties resolved by judgement:

- Hero headline → body: **28 → `--spacer-40` (24)**. 28 sits exactly between 24 and 32.
- Work section top: **72 → `--spacer-152` (64)**. Also between 64 and 80.
- Expertise section bottom: **60 → `--spacer-152` (64)**.
- Card → card: **44 → `--spacer-80` (40)**.
- Ticker logo gap on mobile went **54 → 40**, inherited from `--spacer-80`.

---

## Layout positions — deliberately NOT tokenised

Everything here is measured off the 1440 artboard, or is geometry rather than spacing.

**Absolute positions in design units**
- `.card--tula` / `.card--sks` / `.card--elliman` — `left` / `top`
- `.card__meta` — `left` / `right`
- `.featuredwork .sec-head` — `top: 52.4u` (the block's start; its internals are margins now)
- `.expertise .sec-head` — `left: 380u`, `top: 156.4u`, `width: 680u`
- `.area` — `top: 670.4u` and the per-item inline `left`
- `.proof .sec-head` — `top: 84u`, `width: 680u`
- `.proof__stats` — `left: 722u`, `top: 83.2u`, track width `320u`
- `.cover`, `.ticker` — `top`, and `.cover`'s `margin-left: -1146u`
- `.pf__band` — `--pf-mark-y: 186.5u`; `.pf__mark` — `--pf-mark: 240u`
- `.featuredwork__inner` / `.exp__inner` / `.proof__inner` — explicit heights
- `.cs-cursor` — `116u` box with `-58u` centring margins

**Not spacing at all**
- `inset: 0` on the glow canvases, grain, grid overlays
- `left: 50%` centring on `.pf__mark`, `transform: translateX(-50%)` on `.area`
- `h1`, `.featuredwork h2`, `.proof__head` — `margin-left: -0.012em` / `-0.015em`, optical
- `h1 .mask` and the headline masks — `.16em / .10em / .12em` clip padding with matching
  negative margins
- `.mask--cta` — the 2px/3px clip guard
- `.ticker__row img` — `height: 46px`
- `.nav a::after` — the 1px rule and its `-7u` offset
- All shader and WebGL maths in `config.js` / the `*.js` files
- `--m` (page side margin) and `--inset` — **kept at 40px**, see NEW-TOKENS.md

---

## Structural change this pass forced

**Featured Work's header is in flow now.** Its four pieces were each pinned to a hand-tuned
absolute top — 52.4 / 84 / 231.2 / 346.7 — with the copy's line count baked into every one.
Tokenising proved why that does not hold: `--font-p-18` in Beausite with no tracking takes
the body from three lines to four, which left the CTA **2px** under the body instead of 24.
The gaps are `--spacer-16` / `--spacer-24` / `--spacer-24` margins now, matching Expertise's
and Proof's headers, and four numbers left the list above.

**Expertise's CTA came back into its header**, as its last line, 24 above the button — it
was cut loose at `top: 951.2u` across the foot of the graphic. It is a child of
`.expertise .sec-head` now, `inline-block` so the header's own `text-align: center` places it. Its
`margin-top` is `calc(var(--spacer-24) - 2px)`: setting a margin-top replaces the `-2px`
cancellation `.mask--cta` normally does for its clip guard, and without it the button lands
at 26 where every other CTA lands at 24.

**The footer's two lower rows are in flow.** `.pf__locations` was pinned at `top: 387u` and
`.pf__legal` at `bottom: 37u`, numbers measured against a footer whose content happened to
end at 518u. An office card is 131 design units tall at 1440 and **207 at 1024**, so the row
grew straight through the legal line everywhere below about 1430 — by 59 at 1024 and 107 at
820 — and cleared it by a single pixel at 1440. `.pf__band` now has a real height (387u,
where the office row used to start) and the two rows follow it, with `--spacer-56` above the
legal line and `--spacer-40` below. `.pf` sizes itself; `min-height: 583u` stays as a floor.

The band's old `height: 0` was a deliberate guard against the ghost-button shape — an
in-flow box the size of the footer that answers the pointer where its children do not. That
guard is kept a better way: `.pf__band { pointer-events: none }` with
`.pf__band > * { pointer-events: auto }`. Verified by hit-testing nine points across the
footer CTA (all return `.pf__cta`) and a point over an office name.

Two mobile rules also had to drop a blanket `margin: 0` (`.exp__eyebrow, .exp__head,
.exp__body` and `.proof__head, .proof__body, .proof__cta`) — it was cancelling the spacer
margins and setting those blocks flush on a phone.

---

## Open items

1. **The hero headline crosses the centre grid line below ~1430px.** `--font-h-80` plus the
   removed tracking grew the longest keyword from 545 to 672px of ink. Over by 44 at 768,
   27 at 1024, 15 at 1200; clear by 1px at 1440. Options: `--font-h-64`, let the keyword
   line wrap, or shorten "e-comm platform."
2. **`.stat__num` and `.stat__suffix` are now the same size** (both `--font-h-64`). Desktop
   had 72 and 64. If the suffix should stay smaller it needs its own token.
3. **Three headlines gained a line** from Beausite's wider setting with no tracking: Featured
   Work's body 3→4, Expertise's headline 3→4, the footer headline 1→2. Only the first
   broke anything; the other two absorbed it.
4. The two mobile spacer collisions above.
5. **The tablet measure is long.** 768–1023 uses the stacked single-column layout, so the
   body runs about 760px at 900. Fixing it properly means a tablet layout that constrains
   the measure, or defining the text columns in tokens rather than design units so boxes
   and type share one curve.

## Fixed on the way

Seven styles had no mobile size at all and were inheriting a design-unit desktop value, so
they rendered at 3–5px on a phone. All are on tokens now: `.proof__body` 4.7→16,
`.pf__city` 5.2→18, `.pf__addr`/`.pf__tel`/`.pf__legal` 3.6→14, `.cs-cursor span` 3.0→12,
`.stat__suffix` 16.7→40.

Two dead rules were removed — `.pf__body` and `.pf__offices`, left over from the
five-column footer that `.pf__locations` replaced; neither class is in the markup.
