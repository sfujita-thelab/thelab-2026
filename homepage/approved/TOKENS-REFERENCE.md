# thelab token reference: what each token is at every screen size

The token name is the **desktop** size. On smaller screens most tokens shrink, so
`--spacer-80` is **not** 80px on a phone. Use this table to see the actual value.

Screen sizes:
- **Mobile**: up to 767px wide. Static values, same on the live site and in the prototype.
- **Tablet**: 768–1023px wide.
  - *Live site*: a fixed tablet value.
  - *Prototype (fluid files)*: grows smoothly from the mobile value at 768 to the desktop value at 1440. The "@1024" column shows one sample point.
- **Desktop**: 1024px and wider. Fluid files reach this value at 1440 and stay there.

Source: live www.thelab.co (pulled 2026-10-15) + redesign changes marked ★ (see NEW-TOKENS.md).

---

## Spacing: `--spacer-*`

| Token | Mobile ≤767 | Tablet (live) | Tablet @1024 (fluid) | Desktop |
|---|---|---|---|---|
| `--spacer-4` | 4 | 4 | 4 | 4 |
| `--spacer-8` | 8 | 8 | 8 | 8 |
| `--spacer-12` | **8** | 12 | 9.5 | 12 |
| `--spacer-16` | **8** | 16 | 11 | 16 |
| `--spacer-24` | 16 | 24 | 19 | 24 |
| `--spacer-32` | **24** | 32 | 27 | 32 |
| `--spacer-40` | **24** | 40 | 30 | 40 |
| `--spacer-56` | **32** | 48 | 41 | 56 |
| `--spacer-64` | **32** | 56 | 44 | 64 |
| `--spacer-80` | 40 | 72 | 55 | 80 |
| `--spacer-104` | 48 | 88 | 69 | 104 |
| `--spacer-120` | 56 | 104 | 80 | 120 |
| `--spacer-152` | 64 | 120 | 97.5 | 152 |
| `--spacer-200` | 80 | 152 | 126 | 200 |
| `--spacer-248` | 104 | 200 | 159 | 248 |
| `--spacer-320` | 152 | 248 | 216 | 320 |
| `--spacer-400` | 200 | 320 | 276 | 400 |

**Watch out on mobile:**
- These pairs become the **same size** on a phone, so a difference you designed on desktop disappears:
  `12` & `16` → both 8 · `32` & `40` → both 24 · `56` & `64` → both 32
- Big spacers shrink a lot: `--spacer-120` is 120 on desktop but **56** on mobile (less than half).
- If you need a specific mobile size, pick by the **Mobile** column. Example: 56px on mobile → `--spacer-120`.

---

## Type: `--font-*`

All Beausite 400; `-i` versions are Recife italic at the same sizes.

| Token | Mobile ≤767 | Tablet (live) | Tablet @1024 (fluid) | Desktop | Line height |
|---|---|---|---|---|---|
| `--font-h-128` | 64 | 88 | 88 | 128 | 100% (mobile 110%) |
| `--font-h-104` | 56 | 80 | 74 | 104 | 100% (mobile 110%) |
| `--font-h-80` ★ new | 48 | 64 | 60 | 80 | 110% |
| `--font-h-64` ★ no 80 at ≥1920 | 40 | 56 | 49 | 64 | 110% |
| `--font-h-56` ★ new | 40 | 48 | 41 | 56 | 110% |
| ~~`--font-h-48`~~ ★ removed | — | — | — | — | use `--font-h-56` or `--font-h-40` |
| `--font-h-40` | 32 | 40 | 35 | 40 | 110% |
| `--font-h-32` | 24 | 32 | 27 | 32 | 110% |
| `--font-h-24` | 20 | 24 | 21.5 | 24 | 110% |
| `--font-p-24` | 20 | 24 | 21.5 | 24 | 170% (mobile 150%) |
| `--font-p-20` | 18 | 20 | 18.8 | 20 | 150% |
| `--font-p-18` | 16 | 18 | 16.8 | 18 | 150% |
| `--font-p-16` | 14 | 16 | 14.8 | 16 | 150% |
| `--font-p-14` ★ new | 14 | 14 | 14 | 14 | 150% |
| `--font-button-1` ★ down one step | 14 | 16 | 14.8 | 16 | 120% |
| `--font-button-2` ★ down one step | 12 | 14 | 12.8 | 14 | 120% |
| `--font-eyebrow` ★ 12 → 16 | 14 | 16 | 14.8 | 16 | 120% |
| `--font-tag` ★ new | 12 | 12 | 12 | 12 | 120% |

Line height in the fluid files uses the desktop value at all sizes above mobile.

---

## Layout grid

| Token | Mobile ≤767 | Tablet 768–1023 | Desktop |
|---|---|---|---|
| `--container-margin` (page side margin) | 16 | 48 | 64 |
| `--grid-column-count` | 4 | 12 | 12 |
| `--grid-gap` (column gutter) | 16 | 16 | 24 |
| `--header-height` | ≈55 | 76 | 76 |

The prototype uses its own side margin, `--m`, stepping **40 · 32 · 20** on the same
1023 / 767 boundaries. Decided 2026-10-16: keep it, and propose it as a change to
`--container-margin`. See "Page side margin" in NEW-TOKENS.md.

---

## Colors (same at every size)

| Token | Hex | | Token | Hex |
|---|---|---|---|---|
| `--black` | #222222 | | `--cream` | #F0ECE7 |
| `--dark-gray` | #555555 | | `--tan` | #E4DFD9 |
| `--cool-gray` | #616975 | | `--teal` | #289581 |
| `--mid-gray` | #CED8E1 | | `--blue` | #0587C1 |
| `--silver` | #D1D4D7 | | `--red` | #EA521A |
| `--light-gray` | #F4F4F4 | | `--white` | #FFFFFF |
