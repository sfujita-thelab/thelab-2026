# thelab 2026 — homepage

## Project

| | |
|---|---|
| **Project** | thelab.co homepage redesign |
| **Stage** | Working prototype, for alignment and dev scoping. Not production code. |

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

| | |
|---|---|
| **Live prototype** | https://sfujita-thelab.github.io/thelab-2026/homepage/approved/ |
| **Repo** | https://github.com/sfujita-thelab/thelab-2026 |
| **Token source** | `www.thelab.co` → `/static/cbcaee7b/dist/index.css`, pulled 2026-10-15 and copied verbatim into `thelab-tokens.css` |
| **Webfonts** | Beausite (4 faces) + Recife italic, loaded at runtime from the same CDN path |

**Files in this folder**

| File | What it holds |
|---|---|
| `thelab-tokens.css` | The tokens. Names identical to production — do not rename. Proposals marked `REDESIGN` inline. |
| `NEW-TOKENS.md` | Token impact on the live site, checked across all 21 pages in its sitemap. |
| `TOKENS-REFERENCE.md` | What each token resolves to per breakpoint. |
| `README.md` | The WebGL work — GPU passes, `config.js`, URL flags. |

⚠️ The webfont path contains a build hash (`cbcaee7b`) that changes when thelab.co
redeploys. When it does, the faces 404 and the page silently falls back to `--font`.

---

## Summary

- The homepage, rebuilt on thelab.co's own token names so the prototype and the live
  site can be compared directly.
- The front-end visual framework is new — the grid, the margins, and the measure the
  page is placed on.
- Among the tokens, only type moves. Colour and spacing are production's, untouched.
- **Animation** comes in two kinds: the **intro animation** on load, and the **scroll
  animations** that bring each section in as you reach it, and replay on scroll-back.
- Responsive behaviour follows the live site's breakpoints.

---

## Token changes

Existing production tokens whose value this redesign changes or removes. Old values are
as recorded in the token file's own `REDESIGN` notes.

| Token | Old | New | Reason | What it affects |
|---|---|---|---|---|
| `--font-h-64` (+ `-i`) | 64 · 56 · 40, **plus 80 at ≥1920** | 64 · 56 · 40, no `-xl` step | 80 now lives in its own `--font-h-80`, so one token means one size | **Nothing below 1920.** At ≥1920 these drop 80→64 on the live site: `RichText largeHeadings` h1–h3, homepage `paragraphSlideBody`, `CaseStudies nextStudyBlock`, `services_body`, `JobList_heading`, legal page h1, contact dialog h2. Here: `.stat__num`. |
| `--font-h-48` (+ `-i`) | 48 · 48 · 40 | **removed** | Prototype section headlines moved to `--font-h-56`; the scale had two steps doing one job | Live uses remap to `--font-h-40`: pull quotes (`Quotes_quote`), the italic stat suffix (`StatsBlock`), the `RichText` h1 fallback and h4–h6, and two unused utility classes. Decided 2026-10-15. |
| `--font-eyebrow` | flat 12 | 16 · 14 | At 12 the section label was too quiet against a 56 headline | `.featuredwork .sec-head__eyebrow`, `.expertise .sec-head__eyebrow`. Its old flat 12 did not disappear — it became `--font-tag`. |
| `--font-button-1` | 18 · 16 | 16 · 14 | Both button steps come down one, so the scale is not top-heavy | `.nav a`, `.navtoggle`, `.cta`, `.pf__cta` |
| `--font-button-2` | 16 · 14 | 14 · 12 | As above | `.cs-cursor span` |

Everything else in `thelab-tokens.css` matches production exactly, including all spacing
and colour tokens.

---

## New tokens

| Token | Value (desktop · tablet · mobile) | Where it's used |
|---|---|---|
| `--font-h-80` (+ `-i`) | 80 · 64 · 48 | `h1` — the hero headline. One use. |
| `--font-h-56` (+ `-i`) | 56 · 48 · 40 | The three section headlines, and nothing else: `.featuredwork .sec-head__title`, `.expertise .sec-head__title`, `.proof .sec-head__title` |
| `--font-p-14` | flat 14 | `.pf__legal`, `.menu__foot p` |
| `--font-tag` | flat 12 | `.pill` — the card tags. This is the flat 12 `--font-eyebrow` used to be. |

Values read from `thelab-tokens.css` and confirmed against what the browser computes.

---

## Components

**Carried over from thelab.co unchanged:** the bar's arrangement (wordmark left, Menu
right), the nav's underline-on-hover, the mobile menu's open state — measured off
thelab.co at 375 rather than designed fresh — and zero letter-spacing.

**Rebuilt here:** the nav, buttons and card tags move onto different type tokens (see
*Token changes*), the topbar gains an entrance and a scroll behaviour it did not have,
and every section animates in on scroll.

One state is shared and is not repeated below: anything that animates in has a **hidden
state before its reveal**. How that works is one rule, in *Interactions*.

| Component | Variants | States / behaviour |
|---|---|---|
| **Topbar** | over light · over dark (inverts on the footer band) | at rest, transparent over the hero · hidden, scrolling down · returning, scrolling up · with a ground once it is over content |
| **Nav link** | — | rest · hover, underline wipes in from the left |
| **Menu** (≤1023) | — | closed · open, covers the page and locks its scroll |
| **CTA pill** | on light · on dark | rest · hover, the label rolls over |
| **Section header** | left-aligned (Work, Proof) · centred (Expertise) | eyebrow, headline, body and CTA reveal in sequence |
| **Work card** | three, staggered down the grid | image or a looping video · client, title and tags · hover shows the "View case study" cursor over the image |
| **Card tag** | — | static |
| **Logo ticker** | — | scrolls continuously |
| **Expertise area** | four | a loop graphic opens, then the title and description arrive |
| **Stat** | two rows of two | number, suffix and caption; the number counts up when the row arrives |

`#tweak`, the palette panel on `T`, is prototype tooling. It is not part of the system
and should not be carried across.

---

## Interactions & animation

**Live prototype:** https://sfujita-thelab.github.io/thelab-2026/homepage/approved/

### Intro animation — runs on every load, including reload

| At | What | Duration · easing |
|---|---|---|
| 380ms | Grid lines wipe down, 70ms apart | .70s `cubic-bezier(.62,.02,.34,1)` |
| 380ms | Mark turns in and fades up, with the grid | opacity .98s `cubic-bezier(.62,.02,.34,1)` · transform .9s |
| 380ms | **Topbar slides down**, resting ~930ms | .55s `cubic-bezier(.22,.61,.36,1)` |
| 480ms | Hero gradient fades up — a beat after the lines, so they are not lost | 1100ms smoothstep |
| 1290ms | Lines reach resting weight; circle fill begins | 520ms |
| 1410ms | Halo | 820ms |
| **1610ms** | Hero type — both headline lines, body and CTA **together**, not cascaded | .82s `cubic-bezier(.16,1,.3,1)` transform · .5s ease opacity |
| 2710ms | `hp:intro-done` fires | — |

Timing lives in `INTRO` in `app.js`. `INTRO.navStart` is the topbar's one number.

### Rolling hero headline

Starts only on `hp:intro-done`, so the first swap cannot begin while the word is still
arriving. Hold is **2133ms + 63ms per character + up to 333ms random**; the hand-over is
**890ms** (230ms delay + 660ms travel) and is pinned to the stylesheet — changing it in
the JS alone commits the swap before the words have finished moving.

### Scroll animations — all reversible

Each re-arms when it leaves through the bottom and plays again on the way back. An
element that has left through the **top** keeps its finished state.

| Section | Enters at | Sequence |
|---|---|---|
| Work header | 0.78 vh (+0.12 hysteresis) | eyebrow 0 · headline 95 · body 235 · CTA 335ms |
| Work cards | 0.86 vh | 110ms per card; frame opens +60ms over .95s `cubic-bezier(.62,.02,.28,1)`; copy +420ms then 110ms steps |
| Ticker | 0.92 vh | single |
| Expertise | — | eyebrow 0 · headline 110 · body 330 · CTA 760ms. The four loops: 140ms hold, 175ms apart, 560ms each, 1225ms end to end; each loop's copy appears at 50% of its own progress |
| Proof | head 0.80, rows 0.84 (exit 0.94 / 0.98) | headline 0 · body 180 · CTA 280ms. Row 2 follows row 1 by 260ms, 110ms per stat within a row; numbers count up over **1150ms**, eased `1-(1-p)³` so they decelerate onto the value |

**Cold start.** The first pass after load ignores the entry threshold and reveals
anything on screen at all. Without it, reloading at a position that put a row inside the
hysteresis band left it armed and invisible until the reader happened to scroll.

### Topbar on scroll

Hides on scroll down past 120px, returns on scroll up. 8px of travel before a direction
change counts, so trackpad noise cannot strobe it. **No fade in either direction** — the
movement is the whole gesture. The curves are deliberately asymmetric: it leaves on an
ease-in (.4s `cubic-bezier(.5,0,.78,.25)`), because going away should not ask for
attention, and returns on an ease-out (.55s `cubic-bezier(.22,.61,.36,1)`), because
coming back is a response to something the reader just did.

### The rule behind all of it

**Arming never animates.** Every armed state declares `transition: none`, so the hidden
state lands instantly and only the reveal has a transition. A transition is chosen from
the *end* state of a change, so removing the class still reads the base rule and keeps
its full duration. Without this the type played its entrance backwards on reload.

### Reduced motion

`prefers-reduced-motion: reduce` and `?intro=0` both skip the intro entirely — the page
renders finished, the topbar is simply present, and the rolling headline still starts.

---

## Responsive notes

**The breakpoints are thelab.co's — this redesign does not move them.** 767 and 1023 do
different jobs and are deliberately not the same number: **tokens** switch their values
at 767, the **layout** stacks at 1023. So 768–1023 gets the stacked layout with
desktop-range type.

| Width | What changes |
|---|---|
| **≤767** | Token `-sm` values apply throughout — headlines, body copy and buttons each drop a step. |
| **≤1023** | Layout stacks to a single column; section headers go full width. `.hero` uses `height: 100svh`, so it does not jump when a phone hides its bottom bar. |
| **≥1024** | Desktop layout: the grid, the placed cards, the two-column Proof block. |

`config.js` (`grid.mobileAt: 1023`) has to agree with the stylesheet, or the grid changes
column count at a different width than the CSS does.

**Spacing is tokenised throughout.** Every gap, pad and margin between elements is a
`--spacer-*` token — 16 of them across the page — and the page inset is one too. What is
*not* on a token is the page's own side margin, held at a flat 40px: production has a
`--container-margin` (64 desktop · 48 tablet · 16 mobile) that it could be mapped to
instead. **That is an open decision.**

**Known trade-off.** The stacked layout runs one full-width column, so the body measure
at 900–1023 is long — about 760px at 900. A purpose-built tablet layout would constrain
it.

---

## Appendix — browser workarounds

*Outside the outline above; kept because it is the detail most likely to cost someone a
day. Port the behaviour, not the numbers — each was bisected in the browser that showed
it, and a different stack may not need them.*

| Where | What | Why |
|---|---|---|
| `.expertise` | **No `overflow` at all**; `--cover-h` sizes the dome to the gradient it has to finish | Safari has no `overflow-clip-margin`, and its `overflow: clip` painted a black band across Proof. Measured at twelve widths from 320 to 2560: scroll height is identical with and without the clip. |
| `.expertise` | `--exp-guard` + negative `margin-top` and matching `padding-top` | Room for the dome's overhang. `expertise.js` reads that padding back in — five of its measurements are against the section's old top edge. |
| `.hero-glow`, `.pf__glow` | `transform: translateZ(0)` | WebKit rasterises a `position: fixed` element clipped to the viewport *before* filtering, so `blur(44px)` sampled transparency along the bottom edge and the orange washed out. Its own compositing layer fixed it; 400px of bleed did not. |
| `.proof` | `z-index: 3` | With `z-index: auto` it opened no stacking context, so `#halogl` landed in the root one and interleaved with the page's fixed layers. |
| `<head>` | `format-detection` meta + `a[x-apple-data-detectors]` | WebKit wraps the office addresses and phone numbers in its own underlined, system-blue anchors. The numbers are already our `tel:` links. |
