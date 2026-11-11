# thelab 2026 — handoff v2: Expertise, Work, and homepage tweaks

## Overview

### Project

thelab.co redesign. v1 handed off the homepage
([`homepage/approved/HANDOFF.md`](https://github.com/sfujita-thelab/thelab-2026/blob/main/homepage/approved/HANDOFF.md)).
v2 adds the **Expertise** and **Work** pages, and brings all three together in one folder.

### Stage

Working prototype, for alignment and dev scoping. Not production code.

### Scope

**Main: Expertise and Work.** Their hero, sections, filter bar, grid, FAQ and footer.

**Small: homepage tweaks** since v1. See *Homepage tweaks*.

**What changed**

- **One site folder (2026-11-11).** The approved homepage, Expertise and Work now live together in `approved/`.
- **One copy of each shared file.** The tokens and the shared scripts sit once in `approved/shared/`, and every page loads them from there.
- **One set of classes.** Expertise and Work use the homepage's class names for the parts they share: topbar, menu, section header, CTA, pill, footer. Where they differ on purpose, the difference is listed below.

**What's next**

- Case Study and Careers still link to the old folders (`homepage/approved/`, `expertise/v2/`, `work/v1/`). Those addresses keep working; repoint them to `approved/` when it becomes the main version.
- `app.js` and `config.js` are still one per page. They now differ only where the pages do (see *Per-page files*). Merging them is the next step.

---

## Links & references

| What | Where |
|---|---|
| **Live prototype** | Home: https://sfujita-thelab.github.io/thelab-2026/approved/ <br>Expertise: https://sfujita-thelab.github.io/thelab-2026/approved/expertise/ <br>Work: https://sfujita-thelab.github.io/thelab-2026/approved/work/ |
| **Repo** | https://github.com/sfujita-thelab/thelab-2026 |
| **v1 handoff** | [`homepage/approved/HANDOFF.md`](https://github.com/sfujita-thelab/thelab-2026/blob/main/homepage/approved/HANDOFF.md). Everything in it still holds unless this document says otherwise. |
| **Token source** | `www.thelab.co` → `/static/99afb794/dist/index.css`, as v1 |
| **Webfonts** | Beausite (4 faces) + Recife italic, loaded at runtime from the same CDN path, as v1 |

| File | What it holds |
|---|---|
| [`index.html`](https://github.com/sfujita-thelab/thelab-2026/blob/main/approved/index.html) | The homepage. Markup plus its whole stylesheet, inline. |
| [`expertise/index.html`](https://github.com/sfujita-thelab/thelab-2026/blob/main/approved/expertise/index.html) | The Expertise page, the same way. |
| [`work/index.html`](https://github.com/sfujita-thelab/thelab-2026/blob/main/approved/work/index.html) | The Work page, the same way. Its filter and grid script is inline at the foot. |
| [`shared/`](https://github.com/sfujita-thelab/thelab-2026/tree/main/approved/shared) | **One copy for every page:** `thelab-tokens.css`, `shaders.js`, `footer.js`, `footer-glow.js`, `contact.js`, `halo.js`, `hero-glow.js`. |
| [`NEW-TOKENS.md`](https://github.com/sfujita-thelab/thelab-2026/blob/main/approved/NEW-TOKENS.md) | Token changes against the live site, with impact. Adds `--placeholder-gray` (2026-11-11). |
| [`TOKENS-REFERENCE.md`](https://github.com/sfujita-thelab/thelab-2026/blob/main/approved/TOKENS-REFERENCE.md) | What each token resolves to per breakpoint. |
| [`README.md`](https://github.com/sfujita-thelab/thelab-2026/blob/main/approved/README.md) | The WebGL work, `config.js`, URL flags. Its file list predates `shared/`. |
| `config.js` · `app.js` | One per page: `approved/`, `approved/expertise/`, `approved/work/`. See *Per-page files*. |
| `expertise/expertise-page.js` | The travelling figure, the subnav. |
| `expertise/expertise-sections.js` | Scroll reveals, case-study frames, the accordion, the cursor. |
| `expertise/page-glow.js` | The orange glow behind the hero figure. |

---

## Summary

- Same token file as v1, now **one file** at `shared/thelab-tokens.css` instead of a copy per page. One token added: `--placeholder-gray`.
- **Expertise and Work share the homepage's classes.** Where Expertise needed a different pill, it became a modifier (`.pill--glass`), not a second `.pill`.
- **Raw values became tokens** wherever the palette has one (see *Tokens across all pages*).
- **Unused styles removed** from Expertise and Work: rules copied over from other pages that nothing on them used.
- **Animation:** the same two kinds as v1. Each page's intro is the homepage's, timed to its own hero. Scroll reveals use the homepage's thresholds and sequences.
- **Breakpoints:** the live site's, as v1.

---

## Homepage tweaks

Changes to the homepage since v1. Everything else is as v1 describes it.

| What | Before | Now | Date |
|---|---|---|---|
| Featured Work card, client name | `--font-p-16`, normal case | **`--font-eyebrow`, UPPERCASE**, as the Work grid's client. 16 · 14. `--spacer-16` under it unchanged | 2026-11-11 |
| Expertise glow strength (`EXPERTISE.alpha`) | 0.80 | **1.00**, as the Expertise page's hero. One value for both now | 2026-11-11 |
| Topbar on a reload part-way down | stayed over the page until the first scroll | **starts hidden**, as Expertise and Work | 2026-11-11 |
| Hero type, `INTRO.text` | 1610ms (v1 table) | **1300ms**, as the circles land at 1290. The change predates v1's handoff, but its table still read 1610 | 2026-11-04 |
| Card picture placeholder | `#e8e8e8` | `var(--placeholder-gray)`, same colour | 2026-11-11 |
| Tablet card-tag ground | `#f4f4f4` | `var(--light-gray)`, same colour | 2026-11-11 |
| Card-tag outline, cursor shadow, hero graphic outline | true black at an alpha | **`--black` (#222)** at the same alpha. Reverses v1's "true black by design" note; the difference is barely visible | 2026-11-11 |
| File locations | everything in `homepage/approved/` | shared files in `approved/shared/` | 2026-11-11 |

---

## Token changes

Unchanged from v1. The token file's redesign changes (`--font-h-64`, `--font-h-48` removed, `--font-eyebrow`, `--font-button-1`, `--font-button-2`, `--spacer-200` mobile) apply to all three pages. See v1, *Token changes*.

---

## New tokens

v1's new tokens (`--font-h-80`, `--font-h-56`, `--font-p-14`, `--font-tag`) are unchanged. One is added:

| Token | Value | Where it's used |
|---|---|---|
| `--placeholder-gray` (+ `-base`: `232 232 232`) | `#E8E8E8`, flat | The frame behind a card's picture or film while it loads: homepage `.card__img`, Work `.wk__media`. Before this the homepage typed `#e8e8e8` and Work `#e4e4e4`; both now take the homepage's value. **Added 2026-11-11.** Not on the live site. |

Values read from `shared/thelab-tokens.css` and confirmed against computed style in the browser.

---

## Tokens across all pages

**One token file, one copy (2026-11-11).** v1 kept an identical copy of `thelab-tokens.css` in each page's folder. In `approved/` there is one, loaded by every page:

| Page | Loads |
|---|---|
| Homepage `approved/` | `shared/thelab-tokens.css` |
| Expertise `approved/expertise/` | `../shared/thelab-tokens.css` |
| Work `approved/work/` | `../shared/thelab-tokens.css` |

Edit it in `shared/` only. The same goes for the other shared files. Case studies and Careers still load their own copies until they move into `approved/`.

**Cache tags.** Pages load shared files with a `?v=` tag. Every shared file is on `?v=20261111` on all three pages. After editing a shared file, change its tag on **every** page, or a browser can keep the old copy. During this round that is how a new token first rendered as transparent.

**Values in the page styles are tokens.** v1's list of raw values that stayed on purpose is now shorter:

| Raw value | Where | Why it stays |
|---|---|---|
| `#000` | Inside `mask-image` gradients | A mask's colour is only its opacity; it never shows. |
| `#e7e7e7` | Expertise pills below desktop (`.pill--glass`) | `#222` at 6% over the `#f4f4f4` page, flattened so the grid line does not show through. `--light-gray` would disappear on that page. |
| Green ramp, e.g. `rgb(44 148 124 / .8)` | Work hero dome | A painted gradient built around `--teal`; its steps are not tokens. |
| `999px` · `9999px` · `20px` radius | Pills; the subnav's open state | No radius token in the palette. The subnav was kept as is. |
| `font-size: 10–12px`, greys | `#tweak` panel (homepage) | Design-tuning panel; not part of the site. |

Gone from v1's list: true-black shadows and outlines (now `--black`), `#e4e4e4` and `#e8e8e8` (now `--placeholder-gray`), and `#3d3f42` / `#0b0b0b` (their rules were unused and are removed).

`--cream-base` is no longer redefined inside Expertise's light slides. They use their own `--slide-ground`, so the global token holds everywhere.

---

## Per-page files

`app.js` and `config.js` are one per page. Expertise and Work have **identical** `config.js` files. Against the homepage they differ only here:

| Setting | Homepage | Expertise | Work | Why |
|---|---|---|---|---|
| `INTRO.text` (hero type) | 1300ms | 1000ms | 480ms | Each waits for its own hero: the homepage for its circles, Expertise for its figure opening at 2×, Work has no figure |
| `centreHero()` in `app.js` | yes | — | — | Keeps the homepage hero centred while a desktop window is dragged |
| `HALO` (Proof field / FAQ field) | teal | blue | — (unused) | The Expertise FAQ is blue |

Everything else was brought in line with the homepage on 2026-11-11, including values the subpages never read.

---

## Responsive notes

**The breakpoints are thelab.co's: 767 and 1023**, as v1. The page side margin `--m` is still the prototype's 40 · 32 · 20 (v1, decided 2026-10-16).

| | ≥1024 | 768–1023 | ≤767 |
|---|---|---|---|
| **Expertise figure** | travels from the hero and holds one place while the four areas pass, changing form for each | no journey: the hero figure scrolls away with the hero; each area draws its own | as tablet |
| **Expertise subnav** | fixed pill at the foot: the four areas over the hero, then the current area and a + | closed pill: the current area and a +; opens on tap, or on hover with a mouse | as tablet |
| **Expertise slides** | picture a fixed 720 tall; the case card sits over its bottom-right, the grid's last column | picture 16:9 under the header; case info under it | picture 4:3 |
| **Work filter bar** | all seven items, under the hero copy (not fixed) | closed pill: "Filter by Industry" or the chosen one, and a +; opens over the cards | as tablet |
| **Work grid** | two-up, `--spacer-24` apart | two-up | one column, `--spacer-56` between rows |
| **Footer** | as homepage | as homepage, offices `--spacer-16` below the CTA | as homepage, offices `--spacer-16` (8 on a phone) |

The footer is the homepage's on all three pages. Measured in the browser at 1440, 900 and 390, every footer element matches.

---

## Components

Shared with the homepage, **same classes, same rules**: topbar, nav link, menu, CTA pill, section header (`.sec-head`), footer (`.pf`), grid lines, grain, "View case study" cursor.

**`.sec-head__body` (aligned 2026-11-11).** As on the homepage, the shared rule sets only the width (80%). Each section sets its own type and the gap under it. On Expertise those sections are the slides and the FAQ: `--font-p-18`, `--spacer-24` below.

| Component | Page | Variants | States / behaviour |
|---|---|---|---|
| **Page header** (`.page-head`) | both | Expertise with figure · Work with dome | eyebrow-less; headline `--font-h-64` (the homepage hero's `--font-h-80` is the one exception, on purpose), body |
| **Hero figure** | Expertise | — | the homepage's four loops; opens with the grid; travels and changes form on scroll (desktop) |
| **Hero glow** | Expertise | — | the homepage Expertise glow (`EXPERTISE` in `config.js`, peak 1.00); leans toward the pointer; drifts when left alone |
| **Hero dome** | Work | — | a teal gradient dome behind the header |
| **Subnav / filter bar** (`.xsub`) | both | fixed (Expertise) · in flow (Work) · open · closed | its width and height glide between states; on hover with a mouse, in at once, out after 120ms |
| **Area slide** (`.slide`) | Expertise | ink · light · white | header with pills, then the featured case study |
| **Glass pill** (`.pill .pill--glass`) | Expertise | on picture · on light | the homepage `.pill` plus a modifier: no outline, `--font-p-14`, `--spacer-4` / `--spacer-12`, frosted ground. Below desktop it is solid `#e7e7e7` |
| **Case card** (`.project`) | Expertise | — | client, title, dark CTA; over the picture on desktop, under it below |
| **Accordion** (`.acc`) | Expertise FAQ | five items | closed · open (+ turns to −, answer slides down) |
| **Work card** (`.wk`) | Work | picture · film | 16:9 picture, client (`--font-eyebrow`, UPPERCASE), title (`--font-h-24`); films play only on screen |

**Two card systems, on purpose.** The homepage's Featured Work card (`.card`: square picture, staggered, outline tags) and the Work grid card (`.wk`: 16:9, two-up, no tags) stay different. Since 2026-11-11 they share the client name's style.

---

## Interactions & animation

**Live prototype:** Expertise https://sfujita-thelab.github.io/thelab-2026/approved/expertise/ · Work https://sfujita-thelab.github.io/thelab-2026/approved/work/

### Intro animation

The homepage's sequence (v1) on each page: grid lines wipe down from 380ms, 70ms apart; the topbar slides down at 380ms. Only the hero type's moment differs:

| Page | Hero type rises | Then |
|---|---|---|
| Expertise | 1000ms | figure opens from 380ms at 2× the homepage's speed: 70ms hold, 88ms apart, 280ms each; glow lights once it has opened |
| Work | 480ms | filter bar comes in with the hero copy; the card grid fades in 300ms after it, once, over .9s `cubic-bezier(.22,.61,.36,1)` |

### Scroll animations

The homepage's watcher and rules (v1): entering plays, only a bottom exit re-arms, 0.12 of hysteresis; images play once per load.

| Section | Enters at | Sequence |
|---|---|---|
| Expertise slide header | 0.78 vh | eyebrow 0 · headline 95 · body 235ms, then pills from 335ms, 60ms apart |
| Expertise case study | — | frame opens; picture drifts with the scroll |
| Expertise FAQ header | 0.78 vh | as a slide header |
| Work grid | — | no scroll animation; the filter only shows and hides cards |

### Expertise figure and state

`expertise-sections.js` publishes where the page is: 0 for the hero, 1–4 for the areas, 5 for the FAQ. Each section hands over as its top crosses 65% of the screen, over 40% of it. The figure (`expertise-page.js`) is drawn from that number, so it plays back on the way up.

### Topbar on scroll

As v1: hides on scroll down past 120px, returns on scroll up. **New on all three pages:** a reload part-way down starts with it hidden.

### Reduced motion

As v1: `prefers-reduced-motion: reduce` and `?intro=0` skip the intro. Expertise's glow holds still. Work's grid shows at once.

---

## Appendix — browser workarounds

All of v1's still apply on the homepage, and on the subpages wherever they share the part (footer glow, address detection).

| Where | What | Why |
|---|---|---|
| Shared files | `?v=` cache tag on every `<script>` and `<link>` | Without a new tag, browsers kept an old `thelab-tokens.css` after `--placeholder-gray` was added, and the placeholder rendered transparent. |
| Expertise, ≤1023 | `.sec-head:not(.sec-head--center) .sec-head__body { width: auto; }` | Below desktop, a left header's body runs the header's full width. Keep it even though no centred header exists on the page: it is what sets that width. |
| Expertise slides | `--slide-ground` instead of redefining `--cream-base` | Redefining a global token inside a component quietly changed it for everything inside. |
