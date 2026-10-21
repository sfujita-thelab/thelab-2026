# thelab 2026 — homepage

## Overview

### Project

thelab.co homepage redesign.

### Stage

Working prototype, for alignment and dev scoping. Not production code.

### Scope

Homepage only: hero, Featured Work, Expertise, Proof, and footer.

**What changed** — the front-end visual framework: the vertical grid lines, the site
margins, and the measure everything is placed on. Most design-principle tokens (colour,
typography, and the rest) stay the same; the type tokens that do move are listed under
*Token changes*.

**What's next**

- Upcoming Expertise pages will use the new framework.
- Existing pages — Case Study, Careers — will need updating to match.

---

## Links & references

| What | Where |
|---|---|
| **Live prototype** | https://sfujita-thelab.github.io/thelab-2026/homepage/approved/ |
| **Repo** | https://github.com/sfujita-thelab/thelab-2026 |
| **Token source** | `www.thelab.co` → `/static/cbcaee7b/dist/index.css`, pulled 2026-10-15 and copied verbatim into `thelab-tokens.css` |
| **Webfonts** | Beausite (4 faces) + Recife italic, loaded at runtime from the same CDN path |

| File | What it holds |
|---|---|
| [`index.html`](https://github.com/sfujita-thelab/thelab-2026/blob/main/homepage/approved/index.html) | The page. Markup plus the whole stylesheet, inline. |
| [`thelab-tokens.css`](https://github.com/sfujita-thelab/thelab-2026/blob/main/homepage/approved/thelab-tokens.css) | The tokens. Names identical to production. Proposals marked `REDESIGN` inline. |
| [`NEW-TOKENS.md`](https://github.com/sfujita-thelab/thelab-2026/blob/main/homepage/approved/NEW-TOKENS.md) | Token impact on the live site, checked across all 21 pages in its sitemap. |
| [`TOKENS-REFERENCE.md`](https://github.com/sfujita-thelab/thelab-2026/blob/main/homepage/approved/TOKENS-REFERENCE.md) | What each token resolves to per breakpoint. |
| [`README.md`](https://github.com/sfujita-thelab/thelab-2026/blob/main/homepage/approved/README.md) | The WebGL work — GPU passes, `config.js`, URL flags. |
| [`config.js`](https://github.com/sfujita-thelab/thelab-2026/blob/main/homepage/approved/config.js) | Every tunable value for the gradients and the grid. |
| [`app.js`](https://github.com/sfujita-thelab/thelab-2026/blob/main/homepage/approved/app.js) | Layout, the page grid, the intro timeline (`INTRO`), the topbar. |
| [`assets/`](https://github.com/sfujita-thelab/thelab-2026/tree/main/homepage/approved/assets) | Logos, card stills and video, the grain texture. |

The remaining `*.js` files are one per section — `hero-type`, `featuredwork`,
`expertise`, `proof`, `footer` and the glow/halo painters. `README.md` covers them.

The webfont path contains a build hash (`cbcaee7b`) that changes when thelab.co
redeploys. When it does, the faces 404 and the page falls back to `--font`.

---

## Summary

- Built on thelab.co's token names. Nothing is renamed.
- Among the tokens, only type changes. Colour and spacing are production's.
- Animation is of two kinds: the intro animation on load, and scroll animations per
  section, which replay on scroll-back.
- Breakpoints are the live site's.

---

## Token changes

Existing production tokens this redesign changes or removes. Old values are as recorded
in the token file's `REDESIGN` notes.

| Token | Old | New | Reason | What it affects |
|---|---|---|---|---|
| `--font-h-64` (+ `-i`) | 64 · 56 · 40, plus 80 at ≥1920 | 64 · 56 · 40, no `-xl` step | 80 moves to `--font-h-80` | Nothing below 1920. At ≥1920, drops 80→64 on the live site: `RichText largeHeadings` h1–h3, homepage `paragraphSlideBody`, `CaseStudies nextStudyBlock`, `services_body`, `JobList_heading`, legal page h1, contact dialog h2. Here: `.stat__num`. |
| `--font-h-48` (+ `-i`) | 48 · 48 · 40 | removed | Section headlines move to `--font-h-56` | Live uses remap to `--font-h-40`: pull quotes (`Quotes_quote`), the italic stat suffix (`StatsBlock`), the `RichText` h1 fallback and h4–h6, two unused utility classes. Decided 2026-10-15. |
| `--font-eyebrow` | flat 12 | 16 · 14 | Becomes the section eyebrow's token | `.featuredwork .sec-head__eyebrow`, `.expertise .sec-head__eyebrow`. Its old flat 12 becomes `--font-tag`. |
| `--font-button-1` | 18 · 16 | 16 · 14 | Down one step | `.nav a`, `.navtoggle`, `.cta`, `.pf__cta` |
| `--font-button-2` | 16 · 14 | 14 · 12 | Down one step | `.cs-cursor span` |

Everything else in `thelab-tokens.css` matches production, including all spacing and
colour tokens.

---

## New tokens

| Token | Value (desktop · tablet · mobile) | Where it's used |
|---|---|---|
| `--font-h-80` (+ `-i`) | 80 · 64 · 48 | `h1`, the hero headline. One use. |
| `--font-h-56` (+ `-i`) | 56 · 48 · 40 | Three section headlines only: `.featuredwork .sec-head__title`, `.expertise .sec-head__title`, `.proof .sec-head__title` |
| `--font-p-14` | flat 14 | `.pf__legal`, `.menu__foot p` |
| `--font-tag` | flat 12 | `.pill`, the card tags. The flat 12 `--font-eyebrow` used to be. |

Values read from `thelab-tokens.css` and confirmed against computed style in the browser.

---

## Responsive notes

**The breakpoints are thelab.co's: 767 and 1023.** Tokens and layout both step at each.

| Width | Tier | Tokens |
|---|---|---|
| **≤767** | Mobile | `-sm` values |
| **768–1023** | Tablet | `-md` values |
| **≥1024** | Desktop | `-lg` values |

`config.js` (`grid.mobileAt: 1023`) has to agree with the stylesheet, or the grid changes
column count at a different width than the CSS does.

**Spacing is tokenised.** Every gap, pad and margin between elements is a `--spacer-*`
token — 16 distinct tokens, 105 references — and `--inset` is one too.

**The page's side margin is not a token.** `--m` steps 40 · 32 · 20 on the same
1023 / 767 boundaries, where production's `--container-margin` is 64 · 48 · 16. Decided
2026-10-16: keep the prototype's margin, and propose it as a change to
`--container-margin`.

A line of body copy runs about 760px at a 900px viewport.

---

## Components

**Carried over from thelab.co unchanged:** the bar's arrangement (wordmark left, Menu
right), the nav's underline-on-hover, zero letter-spacing.

**Changed here:** the nav, buttons and card tags move onto different type tokens (see
*Token changes*); the topbar gains an entrance and a scroll behaviour; every section
animates in on scroll.

Anything that animates in has a hidden state before its reveal. That state is shared and
is not repeated per row below; the mechanism is under *Interactions*.

| Component | Variants | States / behaviour |
|---|---|---|
| **Topbar** | over light · over dark (inverts on the footer band) | at rest, transparent over the hero · hidden on scroll down · returning on scroll up · with a ground once over content |
| **Nav link** | — | rest · hover, underline wipes in from the left |
| **Menu** (≤1023) | — | closed · open, covers the page and locks its scroll |
| **CTA pill** | on light · on dark | rest · hover, the label rolls over |
| **Section header** | left-aligned (Work, Proof) · centred (Expertise) | eyebrow, headline, body and CTA reveal in sequence |
| **Work card** | three, staggered down the grid | image or looping video · client, title, tags · hover shows the "View case study" cursor over the image |
| **Card tag** | — | static |
| **Logo ticker** | — | scrolls continuously |
| **Expertise area** | four | loop graphic opens, then title and description |
| **Stat** | two rows of two | number, suffix, caption; the number counts up when its row arrives |

**Mobile menu** — thelab.co's panel, updated. Measured against it at 375:

| | Live | Here |
|---|---|---|
| Panel background | `#f0ece7` | `#f4f4f4` |
| Row labels | thelab.co's | this site's four |
| Row height | 84 | 74–75 |
| Row label size | 32 | 24, on `--font-h-32`, which is 24 at ≤767 |
| Arrow at the row's right | yes | none |

Unchanged: the full-bleed 1px `rgba(34,34,34,.2)` hairline between rows only, and the
foot links at 14. The trigger is on `--font-button-1`, so it reads 14 here where it was
16 before that token came down a step.

`#tweak`, the palette panel on `T`, is prototype tooling.

---

## Interactions & animation

**Live prototype:** https://sfujita-thelab.github.io/thelab-2026/homepage/approved/

### Intro animation — runs on every load, including reload

| At | What | Duration · easing |
|---|---|---|
| 380ms | Grid lines wipe down, 70ms apart | .70s `cubic-bezier(.62,.02,.34,1)` |
| 380ms | Mark turns in and fades up, with the grid | opacity .98s `cubic-bezier(.62,.02,.34,1)` · transform .9s |
| 380ms | Topbar slides down, resting ~930ms | .55s `cubic-bezier(.22,.61,.36,1)` |
| 480ms | Hero gradient fades up | 1100ms smoothstep |
| 1290ms | Lines reach resting weight; circle fill begins | 520ms |
| 1410ms | Halo | 820ms |
| 1610ms | Hero type — both headline lines, body and CTA together | .82s `cubic-bezier(.16,1,.3,1)` transform · .5s ease opacity |
| 2710ms | `hp:intro-done` fires | — |

Timing is in `INTRO` in `app.js`. The topbar's beat is `INTRO.navStart`.

### Rolling hero headline

Starts on `hp:intro-done`. Hold is 2133ms + 63ms per character + up to 333ms random.
Hand-over is 890ms, split 120ms delay + 770ms travel in the stylesheet.

### Scroll animations

Each re-arms when it leaves through the bottom and plays again on the way back. An
element that has left through the top keeps its finished state.

| Section | Enters at | Sequence |
|---|---|---|
| Work header | 0.78 vh (+0.12 hysteresis) | eyebrow 0 · headline 95 · body 235 · CTA 335ms |
| Work cards | 0.86 vh | 110ms per card; frame opens +60ms over .95s `cubic-bezier(.62,.02,.28,1)`; copy +420ms then 110ms steps |
| Ticker | 0.92 vh | single |
| Expertise | — | eyebrow 0 · headline 110 · body 330 · CTA 760ms. Four loops: 140ms hold, 175ms apart, 560ms each, 1225ms end to end; each loop's copy at 50% of its own progress |
| Proof | head 0.80, rows 0.84 (exit 0.94 / 0.98) | headline 0 · body 180 · CTA 280ms. Row 2 follows row 1 by 260ms, 110ms per stat within a row; numbers count up over 1150ms, eased `1-(1-p)³` |

**Cold start.** The first pass after load ignores the entry threshold and reveals
anything on screen.

### Expertise glow

The orange mass under the four loops. It lights once the loops have finished opening,
and behaves differently by width. `expertise-halo.js`.

| | ≥768 | ≤767 |
|---|---|---|
| Position | follows the pointer: 62% of the way across, 42% up and down, clamped to ±400 / ±129 design units of the figure's centre | pinned on the figure's centre; the pointer is ignored (on a phone it is a finger dragging the page) |
| Lag | 0.045 per frame | — |
| Radius | 380 design units | 581 (1.53×) · about 145px at 375 |

### Topbar on scroll

Hides on scroll down past 120px, returns on scroll up. 8px of travel before a direction
change counts. No fade in either direction. Leaves on .4s `cubic-bezier(.5,0,.78,.25)`,
returns on .55s `cubic-bezier(.22,.61,.36,1)`.

### Arming never animates

Every armed state declares `transition: none`. A transition is chosen from the end state
of a change, so adding the class lands instantly, and removing it reads the base rule and
keeps its full duration.

### Reduced motion

`prefers-reduced-motion: reduce` and `?intro=0` skip the intro. The page renders
finished, the topbar is present, and the rolling headline still starts.

---

## Appendix — browser workarounds

Each was bisected in the browser that showed it. A different stack may not need them.

| Where | What | Why |
|---|---|---|
| `.expertise` | No `overflow` at all; `--cover-h` sizes the dome to the gradient it has to finish | Safari has no `overflow-clip-margin`, and its `overflow: clip` painted a black band across Proof. Measured at twelve widths from 320 to 2560: scroll height is identical with and without the clip. |
| `.expertise` | `--exp-guard` + negative `margin-top` and matching `padding-top` | Room for the dome's overhang. `expertise.js` reads that padding back in — five of its measurements are against the section's old top edge. |
| `.hero-glow`, `.pf__glow` | `transform: translateZ(0)` | WebKit rasterises a `position: fixed` element clipped to the viewport before filtering, so `blur(44px)` sampled transparency along the bottom edge. Its own compositing layer fixed it; 400px of bleed did not. |
| `.proof` | `z-index: 3` | With `z-index: auto` it opened no stacking context, so `#halogl` landed in the root one and interleaved with the page's fixed layers. |
| `<head>` | `format-detection` meta + `a[x-apple-data-detectors]` | WebKit wraps the office addresses and phone numbers in its own underlined, system-blue anchors. The numbers are already `tel:` links. |
