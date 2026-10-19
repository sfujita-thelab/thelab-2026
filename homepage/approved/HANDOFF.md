# homepage/approved — read against thelab.co

The homepage prototype. This file answers two questions and nothing else:
**what it takes from the live site**, and **what it changes**.

No build step — open `index.html`, or serve the folder.

| File | What it holds |
|---|---|
| `thelab-tokens.css` | The tokens. Names are identical to production — do not rename. |
| `NEW-TOKENS.md` | Every token this redesign adds or changes, what each would do to the live site across all 21 pages, and **the decisions still open**. |
| `TOKENS-REFERENCE.md` | What each token resolves to at mobile / tablet / desktop. A token's name is its desktop value: `--spacer-80` is not 80 on a phone. |
| `README.md` | The WebGL work — the GPU passes, `config.js`, the URL flags. |

---

## 1. What it takes from the live site

| What | Where it comes from | Watch out for |
|---|---|---|
| **Design tokens** | `thelab-tokens.css`, copied verbatim from `/static/cbcaee7b/dist/index.css`, pulled **2026-10-15** | Names match production exactly. Anything marked `REDESIGN` inline is *proposed*, not live. |
| **Webfonts** | Beausite (4 faces) and Recife italic, loaded over the network from `https://www.thelab.co/static/cbcaee7b/dist/*.woff2` | The `cbcaee7b` folder changes when the site redeploys. When it does, the faces 404 and the page silently falls back to `--font`. Offline does the same. |
| **Breakpoints** | `md ≤1023` and `sm ≤767`, the live site's own | `config.js` (`grid.mobileAt`) has to agree with the stylesheet or the grid changes column count at a different width than the CSS. |
| **Letter-spacing** | Zero everywhere, as thelab.co sets it | Verified: the only `letter-spacing` left in the file is the tweak panel's own UI. |
| **Mobile menu open state** | Measured off thelab.co at 375, not eyeballed | |
| **Topbar arrangement** | Wordmark left, Menu right, as thelab.co | |
| **Logo lockup** | `assets/logo-thelab.svg`, inlined in the markup | Inline on purpose: the bar inverts over the footer's dark band by setting `color`, which only reaches the drawing if the drawing is in the document. |

**What it does not take:** every layout position. Those are design units off the 1440
artboard (`--u = width / 1440`), not tokens, and are not candidates to become tokens.

---

## 2. What's changed

### Added

**Tokens** — all marked `REDESIGN` in `thelab-tokens.css`, argued in `NEW-TOKENS.md`.

| Token | Desktop · Tablet · Mobile | What for |
|---|---|---|
| `--font-h-80` (+ `-i`) | 80 · 64 · 48 | New top headline step, for the hero |
| `--font-h-56` (+ `-i`) | 56 · 56 · 32 | New section headline step |
| `--font-p-14` | flat 14 | Smallest body step, same at every width |
| `--font-tag` | flat 12 | The card tags — this is the flat 12 that `--font-eyebrow` used to be |

**Page**

- **Four gradient fields.** Hero and footer share one palette (`PAGEGLOW`, 2D canvas);
  Work and Proof are WebGL (`FEATUREDWORK`, `HALO`); Expertise is a `<radialGradient>`
  in the loops' svg whose stops are written from `EXPERTISE`.
- **The hero's optical circle and mark entrance**, and the **rolling headline** that
  cycles the keyword.
- **Scroll-triggered entrances** on Work, Expertise and Proof, with the Proof stats
  counting up. They replay when you scroll away and come back.
- **The topbar slides in** with the first grid line, at `INTRO.navStart` in `app.js` —
  the one number to retune if it should arrive later.
- **"View case study" cursor** (`.cs-cursor`) over the card images.
- **The tweak panel** (`T`) — prototype tooling, the palettes only. Not for production.

### Edited

- **Headers moved into flow.** Featured Work's header, Expertise's CTA and the footer's
  lower two rows used hand-tuned absolute `top` values with the copy's line count baked
  in, so any type change broke them. They are `--spacer-*` margins now. **This is the
  behaviour to port** — it is the one departure here that is a design decision.
- **Seven styles had no mobile size** and were inheriting a design-unit desktop value, so
  they rendered at 3–5px on a phone. All on tokens now — `.proof__body` 4.7→16,
  `.pf__city` 5.2→18, `.pf__addr`/`.pf__tel`/`.pf__legal` 3.6→14, `.cs-cursor span`
  3.0→12, `.stat__suffix` 16.7→40.
- **The Work gradient was retuned** — `config.js`, under `FEATUREDWORK`. The hue did not
  move; the field was zoned and stirred, and that is what changed. `colorFalloff`
  2.10→1.25 is the biggest single lever; the light poles are now exact tints of
  `#0587c1` rather than two separately chosen blues.
- **Arming a reveal is instant.** Every armed state declares `transition: none`, so the
  hidden state can only ever animate on the way *in*. Without it the type played its
  entrance backwards on reload.
- **Homepage copy** — the approved deck: Work's headline, Expertise's and Proof's bodies,
  and all four Proof stats. ⚠️ The second stat is **not signed off** — the deck has it as
  `XX %`, so the old 74 is still in the markup behind a comment saying so.

### Removed

**Tokens**

| Token | Note |
|---|---|
| `--font-h-48` (+ `-i`) | Prototype headlines moved to `--font-h-56`. Existing live uses were remapped to `--font-h-40` — the affected components are listed in `NEW-TOKENS.md`. |
| `--font-h-64-xl` / `-i-xl` | The ≥1920px jump to 80. Nothing changes below 1920; above it those headlines drop 80→64. 80 lives in `--font-h-80` now. |

**Page**

- **All tracking.** Headlines carried −0.012em to −0.035em and the uppercase labels
  carried positive tracking. Both are gone; thelab.co sets none. `text-transform:
  uppercase` stays on the eyebrows, pills, nav and CTA labels.
- **Three dead rules** — `.pf__body` and `.pf__offices`, left from the five-column footer
  that `.pf__locations` replaced, and `.hero__head`, left from the hand-built lockup
  before the mark and wordmark became one SVG. None was in the markup.
  *(`.hero__dot` looks dead and is not — `hero-type.js` creates it at runtime.)*
- **Most of the tweak panel.** It was 18 groups and ~128 sliders across colour, shape,
  flow, cursor, wander, pointer lens, smear, eclipse, circle and blur. Nothing is lost:
  every value is still named and commented in `config.js`, and editing it there does what
  dragging its slider did.

---

## Browser workarounds — port the behaviour, not the numbers

These exist because an engine misbehaves. They carry no design intent, and a build on a
different stack may not need them — but it will need whatever gets the same result. Each
was bisected in the browser that showed it.

| Where | What | Why |
|---|---|---|
| `.expertise` | **No `overflow` at all**; `--cover-h` sizes the dome to the gradient it has to finish rather than to a full circle | Safari has no `overflow-clip-margin`, and its `overflow: clip` painted a black band across Proof wherever the clipped layer reached. Measured at twelve widths from 320 to 2560: scroll height is identical with the clip and without it. |
| `.expertise` | `--exp-guard` plus a negative `margin-top` and matching `padding-top` | Room for the dome's overhang inside the section's own box. `expertise.js` reads that padding back in — five of its measurements are against the section's old top edge. |
| `.hero-glow`, `.pf__glow` | `transform: translateZ(0)` | WebKit rasterises a `position: fixed` element clipped to the viewport *before* filtering, so `blur(44px)` sampled transparency along the bottom edge and the hero's orange washed out. Its own compositing layer fixed it; 400px of bleed did not. |
| `.proof` | `z-index: 3` | With `z-index: auto` it opened no stacking context, so `#halogl` and its copy landed in the root one and interleaved with the page's fixed layers. |
| `.hero` (≤1023) | `height: 100svh` | `inset: 0` made its box the *visual* viewport, which grows when a phone hides its bottom bar — the bottom-anchored copy and the ring jumped mid-scroll. |
| `app.js` | `viewH()` and `requestLayout()` | Everything geometric reads the *layout* viewport, and a height-only resize no longer triggers a relayout. |
| `<head>` | `format-detection` meta + `a[x-apple-data-detectors]` | WebKit finds the office addresses and phone numbers and wraps each in its own underlined, system-blue anchor. The numbers are already our `tel:` links. |
