# homepage/approved — the prototype, read against thelab.co

This file exists for one job: **letting a developer compare this prototype with the live
site's token system and see exactly where the two agree and where they do not.** Read it
as the map; the four files beside it hold the detail.

## Where this sits

`homepage/approved` is the homepage prototype, and the one to read. `homepage/v3/a` is
the same page before any tokenising — the "before" for a comparison. `expertise/` and
`work/` are placeholders for the other pages; neither has a build in it yet.

## Where each thing is written down

| File | What it answers |
|---|---|
| `thelab-tokens.css` | The tokens themselves, copied from www.thelab.co on 2026-10-15. **Names are identical to production — do not rename.** Proposed additions are marked `REDESIGN` inline. |
| `NEW-TOKENS.md` | Every token this redesign ADDS or CHANGES, and what each one would do to the live site — checked across all 21 pages in its sitemap. |
| `TOKENS-REFERENCE.md` | What each token actually resolves to at mobile / tablet / desktop. A token's name is its DESKTOP value: `--spacer-80` is not 80 on a phone. |
| `HANDOFF.md` (this file) | Which token each element uses, and where the prototype deliberately departs from the system. |
| `README.md` | The WebGL work — the three GPU passes, `config.js`, the URL flags. Nothing to do with tokens. |

## The token contract

Three kinds of value appear in this build, and a developer needs to tell them apart:

1. **Production tokens.** Same name, same value as the live site. These should port
   straight across. Everything in `thelab-tokens.css` without a `REDESIGN` marker.
2. **Proposed tokens.** New or changed by this redesign, not on the live site yet. Marked
   `REDESIGN` in the token file and argued for in `NEW-TOKENS.md` — `--font-p-14`,
   `--font-tag`, `--font-h-80`, the flattened button steps, and the rest. **These need a
   decision before they ship**, which is the main thing this prototype is asking for.
3. **Prototype-only values.** Not tokens at all and not proposed as any: the layout
   positions in design units, and a handful of named constants that exist to make a
   browser behave (`--exp-guard`, `--cover-h`). They are listed under *Not tokenised* and
   *Browser workarounds* below. **Do not port these as design decisions.**

## What actually loads

`index.html` links **one** stylesheet before its inline `<style>`:

- `thelab-tokens.css` — the live site's tokens, stepped at 1023 and 767.

`thelab-type-fluid.css` and `thelab-space-fluid.css` sit in the folder **unlinked, on
purpose**. They are the fluid proposal from `NEW-TOKENS.md`: linking them turns this into
the fluid build, which is archived at `_archive/2026-10-16/v3-c`. Leave them alone unless
you mean to make that switch. As shipped there is **no `clamp()` and no `vw` anywhere** —
every token takes its stepped value and switches at 1023 and 767, exactly as the live
site does.

Beausite and Recife load from thelab.co's CDN, so the real faces need a connection;
without one the page falls back to `--font`.

## How a change happens

1. Edit inside `homepage/approved` only. `homepage/v3/a` is a frozen reference copy —
   the build from before any tokenising, which is the "before" in any comparison. The
   earlier options (`v1`, `v2`, `_archive`) are kept locally and are not in this repo;
   see `.gitignore`.
2. There is no build step. Open `index.html`, or serve the folder.
3. Commit to `main`. This repo has no branches and never has; every commit goes straight
   to `main`.
4. GitHub Pages serves it within a minute or two at
   **https://sfujita-thelab.github.io/thelab-2026/homepage/approved/** — which is what to open on a
   phone, since several of the differences below only exist in WebKit.
5. A value that belongs to the design system changes in `thelab-tokens.css` and gets a
   line in `NEW-TOKENS.md`. A value that exists only to place something on the artboard
   stays in the inline `<style>`. Keeping that line clean is the whole point of the file.

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
| `.logo span` | — | **left alone**, pending the real logo SVG. Its `font-family` is pinned to this build's Helvetica Neue stack, because `--font` became Beausite for the page and was pulling the wordmark with it. |

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
| **Footer** legal cluster gap | `--spacer-16` | 12 · 16 |
| **Footer** legal nav gap | `--spacer-16` | 12 · 16 |
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
Some token pairs collapse to one value on a phone — `32 & 40 → 24` and `56 & 64 → 32`
among them. One lands inside a single block, where it is visible:

1. **Footer office card** — city → address (`--spacer-12`) and address → phone
   (`--spacer-8`) are both **8** on mobile, where desktop has 12 and 8.
   *(A second collision used to be listed here — the legal links' gap against the
   socials' — on the basis that `--spacer-16` is 8 on a phone. It is 12. Measured at 390:
   the links sit on 12 and the socials on 8, so the two never collided.)*

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
- `.cover`, `.ticker` — `top`, and `.cover`'s `margin-left: -1432.5u` (`-2292u` stacked)
- `.pf__band` — `--pf-mark-y: 186.5u`; `.pf__mark` — `--pf-mark`, a flat **240px**
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

## Where this build departs from the live system

Three kinds of departure, and only the first is a design decision.

### 1. In flow, where the reference positions absolutely
Featured Work's header, Expertise's CTA and the footer's lower two rows are laid out in
flow with spacer margins rather than pinned to hand-tuned `top` values. Each was pinned to
a number with the copy's line count baked into it, so any type change broke it — tokenising
the body copy took Featured Work's from three lines to four and left its CTA 2px under the
body instead of 24. The gaps are `--spacer-*` margins now, matching the other headers.
**This is the behaviour to port.**

### 2. Browser workarounds — port the behaviour, not the numbers
These exist because an engine misbehaves. They carry no design intent, and a real build on
a different stack may not need them at all — but it will need whatever it takes to get the
same result. Each was bisected in the browser that showed it, not guessed.

| Where | What | Why |
|---|---|---|
| `.expertise` | **No `overflow` at all**, and `--cover-h` sizes the dome to the gradient it has to finish rather than to a full circle | Safari has no `overflow-clip-margin`, and its `overflow: clip` painted a black band across Proof wherever the clipped layer reached. Sizing the cover to its job removed the overflow the clip existed for: measured at twelve widths from 320 to 2560, the document's scroll height is identical with the clip and without it |
| `.expertise` | `--exp-guard` plus a negative `margin-top` and matching `padding-top` | Gives the dome's overhang room inside the section's own box, so Safari's tighter clip does not cut the arc flat. `expertise.js` reads that padding back in — five of its measurements are taken against the section's old top edge |
| `.hero-glow`, `.pf__glow` | `transform: translateZ(0)` | WebKit rasterises a `position: fixed` element clipped to the viewport **before** filtering, so `blur(44px)` sampled transparency along the bottom edge and the hero's orange washed out. 400px of bleed and `blur(24px)` both failed; its own compositing layer fixed it. The footer's is precautionary — same blur past the same kind of boundary, different clip |
| `.proof` | `z-index: 3` | With `z-index: auto` it opened no stacking context, so `#halogl` and its own copy landed in the root one and interleaved with the page's fixed layers |
| `.hero` (≤1023) | `height: 100svh` | `inset: 0` made its box the *visual* viewport, which grows when a phone hides its bottom bar — so the bottom-anchored copy and the ring jumped mid-scroll |
| `app.js` | `viewH()` and `requestLayout()` | Everything geometric reads the *layout* viewport, which a disappearing chrome bar does not move, and a height-only resize no longer triggers a relayout. Measured: a 10% height change costs 0 relayouts, 40% costs 1 |
| `<head>` | `format-detection` meta + `a[x-apple-data-detectors]` | WebKit finds the office addresses and phone numbers and wraps each in its own underlined, system-blue anchor. The numbers are our `tel:` links, so turning the detector off costs nothing |

### 3. Values that only exist to place artwork
See *Layout positions* above. Design units off the 1440 artboard, not candidates for
tokens.

## Open items — decisions this prototype is asking for

These are for the design system, not bugs. Each needs a yes or no before the tokens ship.

1. **Every `REDESIGN` token in `thelab-tokens.css`.** `--font-p-14`, `--font-tag`,
   `--font-h-80`, the removal of `--font-h-48`, the flattened button steps, `--font-h-64`
   losing its 1920 jump. `NEW-TOKENS.md` has the argument for each and what it would do
   to the live site, checked across all 21 pages in its sitemap. **This is the main ask.**
2. **Stepped or fluid.** As shipped it is stepped, like the live site. The fluid
   alternative is two unlinked files in this folder and a table in `NEW-TOKENS.md`.
3. **The hero headline crosses the centre grid line below ~1430px.** `--font-h-80` plus
   the removed tracking grew the longest keyword from 545 to 672px of ink: over by 44 at
   768, 27 at 1024, 15 at 1200, clear by 1px at 1440. Options are `--font-h-64`, letting
   the keyword wrap, or shortening the word.
4. **`.stat__num` and `.stat__suffix` are the same size** (both `--font-h-64`). The
   reference had 72 and 64. A smaller suffix needs its own token.
5. **Three headlines gained a line** from Beausite's wider setting with no tracking:
   Featured Work's body 3→4, Expertise's headline 3→4, the footer's 1→2. Only the first
   broke anything.
6. **The page side margin.** `--m` and `--inset` are held at a flat 40 rather than taken
   from `--container-margin`. See *Open: page side margin* in `NEW-TOKENS.md`.
7. **The mobile collision above** — city→address and address→phone both land on 8.
8. **The tablet measure is long.** 768–1023 uses the stacked single-column layout, so the
   body runs about 760px at 900. A purpose-built tablet layout would constrain it, or the
   text columns could be defined in tokens rather than design units so boxes and type
   share one curve.

## Fixed on the way

Seven styles had no mobile size at all and were inheriting a design-unit desktop value, so
they rendered at 3–5px on a phone. All are on tokens now: `.proof__body` 4.7→16,
`.pf__city` 5.2→18, `.pf__addr`/`.pf__tel`/`.pf__legal` 3.6→14, `.cs-cursor span` 3.0→12,
`.stat__suffix` 16.7→40.

Three dead rules were removed — `.pf__body` and `.pf__offices`, left over from the
five-column footer that `.pf__locations` replaced, and `.hero__head`, left over from the
hand-built lockup before the mark and the wordmark became one SVG. None of the three is
in the markup. `.hero__dot` looks dead and is not: `hero-type.js` creates it at runtime.
