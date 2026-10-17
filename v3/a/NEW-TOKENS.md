# Token changes proposed by the redesign

Everything here differs from the live site (www.thelab.co). All other tokens in
`thelab-tokens.css` match production exactly.

Breakpoints: desktop = default · tablet ≤1023px · mobile ≤767px.
All headline tokens are Beausite 400, line height 110%, with a matching Recife italic `-i` version.

## Type

| Change | Token | Desktop | Tablet | Mobile | Notes |
|---|---|---|---|---|---|
| **Add** | `--font-h-80` (+ `--font-h-80-i`) | 80 | 64 | 48 | New top headline step for the hero. |
| **Add** | `--font-h-56` (+ `--font-h-56-i`) | 56 | 56 | 32 | New section headline step. |
| **Change** | `--font-h-64` (+ `--font-h-64-i`) | 64 | 56 | 40 | Removed the ≥1920px step that bumped it to 80. `--font-h-64-xl` / `--font-h-64-i-xl` are deleted; 80 now lives in `--font-h-80`. |
| **Remove** | `--font-h-48` (+ `--font-h-48-i`) | ~~48~~ | ~~48~~ | ~~40~~ | Prototype headlines move to `--font-h-56`. Existing live uses move to `--font-h-40` (see impact below). |

## Impact on the live site (checked 2026-10-15, all 21 pages in sitemap.xml)

### Removing `--font-h-48` / `--font-h-48-i`

Text you can actually see at 48px today (all Recife italic):

| Component (CSS) | What it is | Pages |
|---|---|---|
| `Quotes_quote` | Pull quotes in case studies | /case-studies/devacurl/, /case-studies/kachava/ |
| `StatsBlock_stat > div > span` | The italic suffix next to stat numbers ("%", "+", "studios", "avg years") | /services/, /case-studies/ and most case studies (tsi-marketing, emtek, fritolay, yamazaki, qdoba, devacurl, kentucky-legend, tula) |

Also referenced in code but overridden or unused on current pages. These still need remapping so nothing breaks later:

- `RichText richText :where(h1)` (+ `i`): fallback h1 style; every current page overrides it with a larger style
- `RichText largeHeadings :where(h4, h5, h6)` (+ `i`): CMS rich text h4–h6
- `typography fontHeader48` / `fontHeader48i`: utility classes, not found on any page

**Decided (2026-10-15):** move all of these to `--font-h-40` / `--font-h-40-i` (40 desktop · 40 tablet · 32 mobile).
Change from today: 48 → 40 on desktop and tablet; mobile stays 32 for the italic, and goes 40 → 32 for the regular h-48.
Screenshots of the quote and stat suffix at 40px are in `token-impact/`.

### Changing `--font-h-64` (no 80px step at ≥1920)

Nothing changes below 1920px wide. On screens 1920px+, these drop from 80px to 64px:

| Component (CSS) | What it is | Pages |
|---|---|---|
| `RichText largeHeadings :where(h1,h2,h3)` (+ `i`) | Main section headlines | Home, /contact-us/, /careers/, /services/, /case-studies/ and all case studies |
| `homepage paragraphSlideBody > p` (+ `i`) | Homepage scrolling statement | Home |
| `CaseStudies nextStudyBlock` | "Next case study" name | All case studies |
| `services_body p` (+ `a`) | Services statements | /services/ |
| `JobList_heading` | "Job Openings" | /careers/ |
| `legal legalRichText :where(h1)` | Legal page titles | /privacy-policy/, /modern-slavery-statement/, /whistleblower-policy/ |
| `ContactUsForm_dialog h2` (+ `i`) | Contact form popup title | Site-wide popup |
| `typography fontHeader64` / `fontHeader64i` | Utility classes | Not found on current pages |

**Decision needed:** is 64px on big screens OK for all of these, or should some move to `--font-h-80`?

## Fluid type (proposal): `thelab-type-fluid.css`

Same token names, new values, for type only (spacing stays stepped).

- **Mobile (≤767px): no change.** Static sizes, exactly the live `-sm` values.
- **768px and up: fluid.** Each unsuffixed type token (`--font-h-64`, `--font-p-18`, …) is a `clamp()` that scales
  smoothly from its mobile size at 768px to its desktop (`-lg`) size at 1440px, then stays at the desktop size.
  It starts at the mobile size, so there is no jump at the 767/768 switch.

| Token | 375 (static) | 767 (static) | 768 | 1024 | 1440+ |
|---|---|---|---|---|---|
| `--font-h-80` | 48 | 48 | 48 | 60 | 80 |
| `--font-h-64` | 40 | 40 | 40 | 49 | 64 |
| `--font-h-56` | 32 | 32 | 32 | 41 | 56 |
| `--font-h-24` | 20 | 20 | 20 | 21.5 | 24 |
| `--font-p-18` | 16 | 16 | 16 | 17 | 18 |
| `--font-eyebrow` | 12 | 12 | 12 | 12 | 12 |

- Sizes use `rem + vw`, so text still scales with browser zoom.
- Tablet (`-md`) values are no longer used by the unsuffixed tokens; tablet sizes fall in between. E.g. `--font-h-56` is ~41px at 1024 instead of 56.
- Line height uses the desktop value at every width (only differs today for h-128, h-104 and p-24).
- `-lg / -md / -sm` tokens are kept, so nothing that references them directly breaks.
- **Dev rollout:** load the file after the main tokens. It's a single file to add or remove.

## Fluid spacing (proposal): `thelab-space-fluid.css`

Same rule as fluid type, applied to the `--spacer-*` tokens: static live mobile values up to 767px, then
smooth from the mobile value at 768px to the desktop value at 1440px. Names are unchanged (`--spacer-80` = 80px at 1440).
Keeps spacing in step with fluid type, so gaps don't jump while text scales smoothly.

## Added: `--font-tag`  (in these prototypes, 2026-10-16)

| Change | Token | Desktop | Tablet | Mobile | Notes |
|---|---|---|---|---|---|
| **Add** | `--font-tag` | 12 | 12 | 12 | Flat. The value `--font-eyebrow` used to carry. |
| **Change** | `--font-eyebrow` | 12 → **16** | 12 → **16** | 12 → **14** | Now the section eyebrow's own token. |

**Where they are used:** `--font-eyebrow` is the small uppercase label above each
section headline (`.sec-head__eyebrow`), which previously borrowed `--font-button-2`.
`--font-tag` is the outlined labels inside a work card (`.pill`).

**Why the split:** the two were one token at a flat 12 while only the pills used it.
Pointing the section eyebrows at it meant choosing a size for both, and they do not want
the same one — a 12 label reads as a caption under a 56 headline, and a 16 tag crowds a
card. Two names, one each.

## Added: `--font-p-14`  (in these prototypes, 2026-10-16)

| Change | Token | Desktop | Tablet | Mobile | Notes |
|---|---|---|---|---|---|
| **Add** | `--font-p-14` | 14 | 14 | 14 | Smallest body step. Flat, like `--font-eyebrow`. |

**Where it is needed:** the footer's legal row (`.pf__legal` and its links), at a flat 14.
The office lines used it briefly and are back on `--font-p-16`, so the legal row is now
its only consumer — which sharpens the question below about whether one component earns a
step in the scale.

**Why the existing tokens do not work:** no unsuffixed token is 14 at desktop. The body
steps are 16, 18, 20 and 24, the buttons are 16 and 18, and `--font-eyebrow` is 12. 14
exists only as the MOBILE step of `--font-p-16` and `--font-button-2`, reachable as
`--font-p-16-sm` / `--font-button-2-sm` — but the brief for this prototype is one
unsuffixed token per text style, so a `-sm` variant is not an option in components.

**Done.** It is in `thelab-tokens.css` now, following the file's own pattern — a `-lg`
and a `-sm` step (both 14), an unsuffixed alias, and entries in the ≤1023 and ≤767
blocks so it behaves like every other token even though the value never changes.
Line height 150%, matching the other body tokens.

`thelab-type-fluid.css` deliberately does NOT name it, so the fluid build leaves it alone
and it stays a flat 14 above 767 as well — which is the point of the token.

Measured at 375, 1024 and 1440 in both the fluid and stepped builds: **14 / 14 / 14**.

Still worth a decision for production: the footer is the only place on the page that asks
for 14, so this is a one-component token. Accepting 16 there instead would avoid adding a
step to the scale.

## Open: page side margin

The prototype's side margin is 40px at 1440 and scales with the window. The shader circle and grid lines are built on it.
The live site uses `--container-margin`: 64 desktop · 48 tablet · 16 mobile.
Decision needed: adopt the live margin (graphics re-fit to it), or keep 40px and propose it as a redesign change.

**Decided (2026-10-16): keep 40px. Proposed as a redesign change to `--container-margin`.**

`--m` stays as app.js computes it — `clamp(20, 2.78vw, 72)`, which is 40 at 1440 — and `--container-margin`
is loaded but unused. Reasons, and what each option does to the graphics:

- **Keeping 40.** The grid, the shader's own grid and the circle all derive from `--m` and
  `--col = (width - 2m) / columns`, so they stay self-consistent and keep scaling smoothly with the
  window. Every position written against the 1440 artboard (cards at 720, headers at 380 and 1060,
  stats at 722, the footer's office columns) keeps landing on its grid line. Nothing to re-fit.
- **Switching to 64/48/16.** The circle and grid would stay internally consistent — the maths is
  relative, the centre is `m + 2*col = width/2` for any margin — but two things break around them.
  (1) At 1440 the lines move to 64 / 392 / 720 / 1048 / 1376, so every artboard position above is off
  its line by up to 12px and all of them need re-deriving, along with the 680-wide header boxes.
  (2) The live margin is STEPPED where the prototype's is fluid, so the grid would stop scaling with
  the window and the circle's radius would jump at 1024 and 768 instead of growing through them.

It is a geometry re-fit rather than a token swap, so it wants its own pass — doing it inside this one
would mean every before/after screenshot carried two causes at once.

<!-- Add further proposals below: name · value · where it's used · why existing tokens don't work -->
