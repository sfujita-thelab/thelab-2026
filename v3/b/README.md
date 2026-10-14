> ### This is option B, carrying FOOTER OPTION B
>
> It replaced the original option B folder, which is parked alongside as
> `../b-footer-a/` — the same page carrying **footer option A** (the squeeze). That
> footer is also still live in `../a/` and `../c/`, so deleting the parked copy loses
> nothing.
>
> What footer option B is, against footer option A:
>
> * **no squeeze.** The ball-through-the-boundary entrance and the parallax shear are
>   both gone; the dark block just scrolls up. `footer.js` keeps only the mark, the
>   grid lines and the nav inversion.
> * **a rewriting headline.** "Build your" is fixed; the line under it cycles
>   through eight kinds of work using the decode effect from `typing.mov`.
>   See `footer-type.js`.
> * **a blink.** The nine-dot mark pulses once, in step with each headline change.
> * **an atmospheric gradient** rising off the bottom edge, cycling the page's orange /
>   blue / green families and leaning slowly toward the cursor. See `footer-glow.js`.
> * **a new layout**, measured off `new-footer.png`: headline left, mark centred, CTA
>   right, full city names at 20u over 13/16 addresses.

---

# thelab hero — living gradient + optical circle

A full-viewport interactive prototype: a very slowly morphing mesh gradient behind a
large translucent optical circle, with blur, refraction and an eclipse-style corona
where the two overlap.

Built to match `hero.png`, with `gradient.png` and `eclipse.png` as treatment references.

---

## Running it

**Easiest:** double-click `index.html`. It works straight from the file system —
no build step, no dependencies, no server.

**If you prefer a local server** (needed only if you later add image assets):

```
cd ~/Projects/work/internal/thelab-2026
python3 -m http.server 8777
```

then open <http://localhost:8777>.

Needs WebGL2 — Chrome, Safari 15+, or Firefox. A message appears if it's unavailable.

---

## Tuning it

**Press `T`** to open the tuning panel. Drag the sliders and watch it change live.
When you like what you see, hit **Copy config** and paste the result into `config.js`
to make it permanent. **Reset** puts everything back.

While tuning the motion, raise **time scale** (under *Motion*) to around 10 so you can
see a whole morph cycle in a few seconds, then set it back to 1.

Everything is also editable directly in `config.js` — it is the only file you need to
touch, and every value is commented.

### URL flags

Handy for grabbing a specific frame or sharing a particular look:

| flag | does |
|---|---|
| `?clean=1` | hides the on-screen hint |
| `?freeze=40` | pins the animation at 40 seconds in — the same frame every reload |
| `?ptr=0.66,0.56` | parks the pointer lens at that spot (fractions of the viewport) |
| `?set=corona.intensity:1.4,blob.scale:1.2` | temporarily override any config value |

The `?ptr=` flag is the only way to see the cursor smear in a still, since it needs a
pointer position.

Combine them with `&`, e.g.
`index.html?clean=1&freeze=40&set=corona.intensity:0.9`

---

## How it's built

Three GPU passes per frame, no libraries:

1. **Gradient** — the mesh gradient is drawn into an offscreen texture. Each colour
   pole is a soft gaussian lump; the colour at any point is the *weighted average* of
   the pole colours, which is what makes them melt together instead of stacking. The
   same weights summed give a metaball field that becomes the organic silhouette. The
   sample point is domain-warped by two octaves of simplex noise, so the outline is
   irregular and slowly kneads itself.

2. **Blur** — a separable gaussian, run a few times at quarter resolution with a
   growing step, producing a very wide, very smooth diffused copy cheaply.

3. **Composite** — the optical circle. Computes a signed distance to the circle, then:
   refracts the sample position (rim-weighted, like thick glass, plus the pointer
   lens), cross-fades sharp→diffused strictly inside the circle, lays the translucent
   veil over it, adds the corona, draws the hairline, multiplies the grid on top, and
   dithers.

The gradient is stored **premultiplied** so that blurring it doesn't drag colour in
from the empty areas, and so the corona can read the blob's own energy at the rim.

### The gradient: why it flows

The silhouette and the colour field are **computed separately**, each with its own
domain warp and its own set of pole positions:

- the **silhouette** poles barely drift, on a long cycle, so the outline stays calm
- the **colour** poles run sustained elliptical orbits on incommensurate periods

That decoupling is what makes colour regions swirl *inside* a stable shape, which is
the melted, advected quality in the distrategy reference. Before this, both derived
from the same positions, so colour only moved when the whole blob slid — which read
as static.

The orbits are ellipses, not noise. A noise-driven random walk wanders and settles;
measured over 21s the old build decayed from 1.7%/s to 0.1%/s and effectively stopped.
Ellipses sustain indefinitely.

Per-pole positions, radii and colours are computed on the CPU each frame and uploaded
as uniforms. They're constant across the screen, so evaluating them per pixel (which
the first version did, at 12 noise calls per pixel) was pure waste.

**Colour breathing is per pole**, each on its own period, so the *balance* of the
composition shifts over time rather than everything brightening together. Hue is never
touched — only brightness and saturation — so it cannot drift out of the warm family.

### The three optical effects are separate, on purpose

- **Blur inside the circle** — sampled from the diffused texture, masked precisely to
  the circle's edge.
- **Corona at the overlapping edge** — a ring function of the distance field, coloured
  by sampling the diffused gradient *at the rim*, and gated by that sample's coverage.
  This is why the glow appears only on the arc where the blob is actually behind the
  circle, inherits its colour, and fades to nothing on the clear side — rather than
  being a uniform ring.
- **Pointer refraction** — a travelling soft lens that displaces the sampled position
  and locally modulates blur. It is zero directly under the cursor and at its outer
  edge, peaking in between, so it pushes the gradient around rather than dragging it.
  The cursor position is eased, so the circle never feels glued to the mouse.
- **Cursor smear** — the SDFLensBlur treatment. Light living near the circle's rim is
  gathered along the line from each pixel toward the cursor, so it stretches into a
  wing that wraps the contour. Gated by *rim* proximity rather than by the cursor
  alone, which is why it hugs the edge instead of being a round blob. Measured off the
  reference: it is driven purely by pointer **position** — exactly as bright when the
  cursor is still as when it races — so it does not decay when you stop moving.
- **Gradient follow** — the whole mesh leans toward the pointer (~0.5s to settle) and
  **elongates along that direction**. Vertical follow is multiplied by `gradFollowY`
  (~2.3x): the halo's resting mass sits low in the frame, so without extra vertical
  range it could never reach the top half to meet a cursor up there. The stretch splits the sample position into
  components along and across the pointer direction and eases only the along component,
  so the halo reaches toward the cursor without skewing. The amount scales with how far
  the pointer is, so it is absent at rest.
- **The pointer lens** — the main hover effect. A genuine displacement of the gradient
  underneath, not an overlay: the sampled position is physically pushed around the
  pointer and the blur follows it, so the whole thing moves as one optical event. The
  profile is `t*(1-t^2)^2` — zero at the centre, zero at the outer edge, smooth
  throughout — which means no ring, no ripple, and no shape that betrays where the
  cursor is. It is gated to the circle but feathered across the rim, and eased on its
  own much slower spring (~2s) so it trails rather than tracks. The circle itself never
  moves; only what is seen through it does.

### Motion

**The blob wanders the whole composition.** Two incommensurate sines per axis (83/53s
horizontal, 71/47s vertical — all four prime, so the path never realigns) carry it across the viewport on a path that never retraces
and never reads as a simple slide — measured, it sweeps roughly 0.25 to 0.79 of the
viewport width. `blob.offsetX` is negative to re-centre that sweep so it visits both
halves rather than only the right. It stays large enough to overflow the edges wherever
it goes. Note the headline sits over the gradient when it swings left; lower
`blob.wanderX` if you would rather keep it clear.

Periods are deliberately incommensurate, so the composition never settles into a
visible loop: colour orbits ~45s, silhouette ~2.4x slower again, expansion ~42s,
colour breathing ~34s, shape warp ~25s.

A note on speed vs size, since they interact: `orbitPeriod` and friends set the
*temporal* rate — how long a cycle takes. How far a feature travels *on screen* per
second also depends on `blob.scale`, because the poles orbit in the blob's own space.
Shrinking the blob therefore reduces on-screen travel even at an unchanged period. If
you want the motion to read faster, shorten the periods; if you want it to cover more
ground, raise `orbitAmp`.

Measured against the references (block-matching on the rendered frames, so it's
palette-independent):

| | feature travel |
|---|---|
| Your Majesty | 3.93 %/s |
| this prototype | ~1.6 %/s |
| distrategy | 1.36 %/s |

Worth knowing if you tune this: the first version's gradient *already* moved at a
comparable speed. What made it look static was the narrow palette — sliding one orange
over a near-identical orange reads as nothing. Widening the colour range is what makes
motion legible, far more than raising the speed. If it ever looks dead, reach for
`paletteWash` and `colorFalloff` before `orbitPeriod`.

### Performance

The gradient runs at 55% of canvas resolution and the blur at 25%, both of which are
free quality-wise because the content is entirely low-frequency. Device pixel ratio is
capped at 2. The composite is the only full-resolution pass. Resize is debounced.

The **cursor smear is the most expensive thing here** — it costs `smear.taps` extra
texture reads per pixel (default 10) and only runs while the pointer is on screen. If
you ever need to claw back frames, lower `taps` first; 6 still looks fine. Setting
`smear.intensity` to 0 skips the loop entirely.

---

## Layout rules (measured from `hero.png`)

- Background `#f4f4f4`; grid lines are a 9.5% black **multiply**, so they stay visible
  over the orange.
- 4 columns, side margin 2.78% of viewport width (40px at 1440) — 5 lines total.
- The circle's radius is **exactly one grid column**, capped at 42% of viewport height.
  At 16:9 those two rules coincide almost exactly, which is why the circle is one
  column wide on a normal desktop window and only gets capped on shorter ones.

---

## Hero type

The logo, nav, headline, body copy and CTA are DOM text, not canvas — so they stay
crisp and selectable. `app.js` writes the grid maths (`--m`, `--col`) into CSS custom
properties, so the type sits on the same columns the shader draws.

Two things worth knowing if you move any of it:

**Text is aligned by ink, boxes by box.** hero.png positions the headline by its
cap-top and baseline, but CSS can only align the *line box*, and how much slack a line
box carries depends entirely on the font's ascent metrics. So `app.js` measures the
resolved font (a zero-height inline-block on `vertical-align:baseline` sits exactly on
the baseline) and positions the headline from that. Swap `--font` for the real brand
face and the headline will still land on the grid.

**The headline is `white-space: nowrap`.** Its line breaks are explicit `<br>`s. Left to
wrap, a flex context can shrink it below its content width and silently add a line,
which moves everything. Below 860px it stacks and wraps normally.

Measured against hero.png at 1440x810, everything lands within a few pixels; the
headline is ~16px narrower because Helvetica Neue is a slightly narrower face than the
original.

## Work section

Everything in `.work` is laid out in **design units**: `--u` is 1px on work.png's
1440-wide artboard, written by `app.js` from the real viewport width, so every
measurement in the CSS is the number taken straight off the reference. The cards are
each exactly one grid column (340 units) square, with their text bottom-aligned to the
image and placed in the next column — which is how work.png is built.

`assets/` holds the three card images and eight client logos, extracted from work.png.
The logos were cut out by estimating the local background with a max-filter and
deriving alpha from the contrast, so they sit cleanly over the live gradient instead of
carrying a baked-in background.

## Work cards — Tula hover, SKS still

**Tula plays on hover.** `card-tula.mp4` is laid over the still inside the same
`.card__img`, at the same size and `object-fit`, and only its opacity changes. The card,
the image container and the grid cannot move as a result — nothing about the box depends
on which layer is showing. Measured under hover: the card stays 680x340 and the image
container 340x340, and the video's rect is exactly the container's.

The video sits INSIDE `.card__img`, so the reveal's `clip-path` and the container's
`overflow: hidden` apply to it exactly as they do to the still. It carries the same
`scale(1.035)` hover as the still, because for the 350ms both are on screen they have to
be the same size or the crossfade reads as a jump.

`muted` is not decoration — it is what makes `play()` legal without a user gesture, and a
hover is not one. `play()` returns a promise that rejects if the element is paused again
before it resolves, which a quick pass across the card does every time, so the rejection is
swallowed. The rewind on exit is deferred by the length of the crossfade: resetting on the
spot is visible, because the video is still fading out and you watch it snap to frame 0 on
the way. Coming back before the timer fires cancels it, so a hesitant pointer resumes
rather than restarting.

**The source was 75MB.** `Tula ads.mp4` is 1920x1080, 30s at 20Mbps. The container is
square, so `object-fit: cover` would have thrown away 44% of every frame at render time.
It is pre-cropped to the centre 1080 square instead and scaled to 720, H.264 CRF 25, audio
stripped, `+faststart`: **1.9MB**, visually indistinguishable at this size. The video is a
scrolling wall of ad creatives rather than a composed subject, so the centre crop loses
nothing. The original is untouched on the Desktop.

**SKS** is `sks.png` at 1020x1020, dropped in as `card-sks.png`. Container, position and
the reveal animation are untouched — it is a straight swap of the file the card already
pointed at. Note it is a 3x asset where the other two cards are 340x340 1x, so it will
look sharper than its neighbours on a retina screen.

## Scroll animations reset downward only

Every scroll-triggered reveal on the page — Work's header, cards and ticker, the Expertise
copy and circles, Proof's stats — re-arms **only when its element leaves through the bottom
of the viewport**. Something that has framed out through the top keeps its finished state.

This is a deliberate asymmetry, not an oversight. Scrolling back up past something the
reader has already watched arrive and seeing it silently re-arm, then replay on the way
down again, reads as a glitch. What should re-arm is everything still *below* the fold,
which has not been seen yet. So the exit test is `r.top > vh * exitAt` and nothing else;
the `r.bottom < -60` half that used to sit beside it is gone from all four watchers.

Verified by scrolling down to 5200 and back: Work's cards and the Expertise headline stay
shown the whole way back up, while Proof and the expertise area labels re-arm as each drops
below the fold again.

## Grain

The `NOIZE(tm) TEXTURE` layer from the Figma file (`iX2sTllrdDIUwZkynSnJXf`, node
`280:196`), carried over at the blend mode, opacity and scale it has there:
**hard-light, 35%**, one source pixel covering 0.744 design units. That scale is not a
guess — the sheet is 3171x4096 shown object-cover inside a 2360x3049 frame, so
3171 -> 2360 is 0.7446, and the 600px tile is therefore sized to 446 design units.

**The tile.** The source sheet is 14.7MB, which is not shippable. `assets/grain.png` is a
600px square cut from the middle of it, re-encoded as 8-bit greyscale (210KB). This is a
faithful substitution rather than an approximation, and that was checked rather than
assumed: the texture is statistically identical at nine points across the full sheet
(mean 136.7-136.8, sd 4.4-5.0, range 121-152) and the tile measures the same (mean 136.7,
sd 4.53, range 123-152). It is structureless noise, so there is nothing for tiling to
break, and the alpha channel was constant 255, so dropping it costs nothing.

**It reads over the gradients, not over the flat background, and that is correct.**
Hard-light with a source near mid-grey has very little room to move a near-white
backdrop: against `#f4f4f4` the derivative is `2*(1-0.957) = 0.086`, so the 35% layer can
only shift it by a fraction of a level, whereas against a mid-tone the same layer swings
several levels. Measured on our page, texture sd over flat background is **0.11**. Measured
on Figma's own render of the reference frame: **0.18** over the flat background against
**0.51-0.55** over the orange gradient. Same behaviour, so this is the treatment working,
not a bug. If it needs to be more present on the flat areas, `--grain-a` on `:root` is the
one number to change - but raising it is a deliberate departure from the Figma values.

**Layering.** `z-index: 1`, and deliberately the **last element in the body**. The
Expertise cover is also at `z-index: 1` but far earlier in the document, so document order
is what puts the grain above it. The result is the intended ladder:

| layer | z |
|---|---|
| page background | -1 |
| gradient canvases (hero, work, expertise) | 0 |
| expertise cover | 1 |
| **grain** | **1**, later in the DOM |
| vertical grid | 2 |
| circle graphics, cards, content | 2-4 |
| hero text, nav, cursor | 4-8 |

It is `position: fixed`: the grain belongs to the surface the page is printed on, not to
the content moving over it.

**The cool gradient** reuses the hero's gradient and blur shaders with a flat composite
(no circle, no corona) and a blue palette matched to gradient-blue.png. Its canvas is
**transparent** — it draws only the gradient and the grid, never a background. That
matters: the canvas spans the whole section, so if it painted the background it would
cover the hero as the section scrolls up over it. Its position is
fixed on purpose: there is no wander and no cursor follow, and **no scroll-driven size
change** — `expandScale`, `expandRise` and `expandGain` are all 0, so the blob holds one
size and one coverage from the moment it appears. (Note that growing *coverage* also
reads as the blob getting bigger, which is why `expandGain` is 0 too, not just
`expandScale`.)

All of its life comes from inside — colour poles orbiting in place, regions swelling and
contracting, per-pole brightness and saturation breathing, a blur radius that breathes on
its own 53s cycle, and **per-pole hue drift**: each pole's hue swings `hueBreath` degrees
either side of its own, on its own period and phase. Because the phases differ it is the
relationship *between* the blues that evolves rather than the whole field sliding one
way, which is what makes it read as the tones shifting among themselves. Keep `hueBreath`
in single digits — past about 8 degrees the cool end starts walking out of blue.

The **cursor** does not move the blob. It deepens the tone locally (`curSat`) and shifts
the temperature a few degrees (`curHue`, negative = cooler/more cyan, positive = toward
indigo) over a deliberately large, soft radius so there is never a cursor-shaped edge.
Measured envelope: at rest the poles span 188-219 degrees, hue drift at its extremes
takes that to 184-223, and the cursor at -6 degrees to 183-214 — blue throughout.

**The grid draws itself once.** The per-line stagger and the colour transition belong to
the hero intro and to nothing else; afterwards it is a static layer for the rest of the
page. `gridLocked` in `app.js` is what guarantees that, and it is not belt-and-braces:
`layout()` re-runs on every resize and calls `buildGrid()`, which would otherwise re-arm
`transitionDelay` on every line each time. Once locked, `buildGrid` only repositions. The
`.settled` rule also restates the resting colour rather than leaving it to `.toned`, so a
rebuild cannot replay the colour fade either. Verified by firing a resize after the intro:
classes stay `drawn toned settled`, `transitionDelay` stays empty, computed `transition`
stays `none`.

**Tuning the palette is not direct.** Because the colour field is a *normalised
weighted average*, the hue range on screen is always much narrower than the hue range
of the poles you feed it, and the blur narrows it again. Measured: poles spanning
186-214 degrees landed on screen as 193-203. So to hit gradient-blue.png's measured
195-208 band, the poles are deliberately spread wider than that, 188-219, with the
pale icy blue and the turquoise highlight anchoring the low end and the saturated blue
pulling the top. Changing one pole to "add more blue" will mostly just shift the
average; move the span, not the middle.

**Position.** `offsetY` is in canvas-height units, and the canvas is the section plus its
520u overhang = 2200u, so one unit of `offsetY` is 2200 design px and 0.0455 moves it 100px.
Larger values push it **down** (p-space is y-down).

**This couples to the canvas height**, which is the one real trap here. The canvas is
sized off `.work__inner` *plus the overhang*, so changing either moves the gradient on the
page even though `offsetY` has not changed. It has been re-derived twice for exactly that
reason — 0.198 when the section was 1880u, 0.264 after it was trimmed to 1680u, 0.229
after the overhang grew to 520u — and all three put the blob's centre at the same 1604px
below the canvas top, i.e. the same place on the page. Change the section height or the
overhang, re-derive this.

**The mass below the crown.** `floorAt` / `floorSoft` are what make the Work gradient a
continuous field rather than a floating shape, and they matter more than they look.

The poles alone produce a literal **disc**. Measured across the old canvas's bottom edge,
coverage ran `0.00 0.00 0.02 0.12 0.37 0.53 0.45 0.19 0.04 0.00 0.00` from left to right —
solid in the middle, gone at the sides, and sliced flat by the canvas edge. That straight
blue-to-background line is the "section seam" the cover transition kept exposing, and no
amount of moving the cover or the canvas fixes it, because there was simply nothing
underneath. The README had claimed this was "the crown of a much larger mass sitting below
the viewport" for a long time before the mass actually existed.

Below `floorAt` the coverage saturates to 1 across the full width, so the crown arcs over a
field that continues downward. Measured after: full-width 1.00 from page y 3000 all the way
to the canvas bottom at 4030, with the crown still open at the sides above 2600 where it
should be. `floorSoft <= 0` disables it, which is how the hero and halo blobs — which
genuinely are discs — opt out without needing to know the uniform exists.

`shapeRound` pulls the silhouette poles toward their shared centre so the mass is a big
soft disc — that is what gives the top edge a rounded, radial shape rather than a flat
horizontal boundary. It should read as the crown of a much larger mass sitting below the
viewport.

**Scroll expansion** (`scroll_gradient.mov`): as you scroll deeper the gradient swells
upward and outward until it fills the viewport, driven by scroll position and eased so
there is no jump. `expandPx` is the scroll distance the whole transition takes — set to
460px, far shorter than the reference clip, which took about two seconds of scrolling.
`expandScale`, `expandRise` and `expandGain` control how far it grows, climbs and
saturates. Its internal animation keeps running throughout.

One gotcha if you tune it: p-space there is normalised to the **section** height
(~1880px), not the viewport, so radii that look right on the hero read far larger in
this section.

**Triggering**: each group waits for its *own* area to be properly in view — the
headline, each card, and the ticker all have their own watcher — rather than firing the
whole section off the moment its top edge appears. Each watcher uses an
IntersectionObserver, a per-frame fallback, and a slow interval safety net, because no
single one of those proved reliable. Two traps worth knowing: `.work__header` has
absolutely-positioned children so its own box is zero height and can never satisfy an
intersection test (watch the `h2` instead), and rAF callbacks run *before* paint, so
pumping on the very first frame undoes the armed state before it is ever drawn.

**Card frame-in** (`card_animation.mov`): the frame opens outward from its own centre
via `clip-path: inset()` while the picture inside stays put, so it constructs rather
than scales. The clipped start state is set inline from JS, because the class-based rule
did not resolve reliably.

**The reveal** uses a masked line treatment, per `text_animation.mov`: each line sits in
an `overflow: hidden` box and slides up into it with opacity, so the type emerges into
place rather than drifting in. The headline reveals line by line, then body, then CTA,
then the cards, then the ticker. Note the forced reflow in `work.js` after arming — if
the hidden state is added and removed inside one tick the browser never paints it and
the transition is skipped entirely.

It is also progressive-enhancement safe. The content is not hidden in CSS;
`work.js` adds a `.pre` class on load and removes it in sequence, so if a trigger ever
fails the section is simply visible rather than stuck invisible.

**The case-study cursor** is the hero's circle at cursor scale — a translucent optical
disc with the same backdrop treatment. It follows on its own eased spring rather than
being pinned to the pointer, appears only over cards, survives moving between cards, and
scales away on exit. The hero's circle contracts as you scroll so it reads as collapsing
into it.

## Page-load intro

One continuous move, with the later stages deliberately overlapping so it does not read
as a stepped presentation. Timings live in `INTRO` at the top of the intro block in
`app.js`:

| | starts | what |
|---|---|---|
| grid draws | 380ms | a beat after load, then each line draws down over 700ms, staggered 70ms — **dark**, at the same weight the circle is traced |
| circle + grid tone | 1290ms | the moment the last line lands: the rim starts tracing clockwise **and** the lines lighten to their resting grey, together |
| circle lightens | 1970ms | as the trace completes, `uCircleFill` takes the stroke from dark to subtle and brings in veil, blur, refraction and corona |
| halo | 2090ms | fades up; self-animation and cursor reactivity begin with it |
| text | 2290ms | three headline lines, body, CTA — 90ms apart |

Fully readable at about 3.3s. The grid is deliberately slow enough to watch being
built; everything after it overlaps.

The circle is traced in the shader, not with an SVG dash offset: `atan(cp.x, -cp.y)` is
zero at the top and increases clockwise, so normalising it to 0–1 gives the fraction
drawn and the stroke is gated on it. The stroke is drawn darker than its resting value
and eases back to the hairline as the optical treatment arrives, otherwise the trace is
too faint to read.

The hero text uses the same masked line reveal as the Work section, so the language is
consistent across the site. `prefers-reduced-motion` skips the whole sequence.

## Background and grid

Both are **page-level elements, not section elements**, and neither ever fades:

- `.page-bg` — one fixed `#f4f4f4` layer behind everything.
- `.page-grid` — one fixed layer of vertical lines, built by `app.js` from the same
  margin and column maths the sections use, with `mix-blend-mode: multiply` so it
  darkens the gradients exactly as a shader-drawn line would.

Neither shader draws the grid any more. That was the point: the hero canvas fades out
during the scroll transition, so a grid drawn inside it faded with it.

This is why `main` deliberately has **no `z-index`** — its children must share the root
stacking context, otherwise `.page-grid` (which sits between the gradient canvases and
the content) could not blend with the hero canvas outside it. Paint order is:
page-bg → hero canvas → work canvas → grid → content.

## Expertise section

Laid out in the same design units off `work-expertise.png`: headline cap 62, body 236,
CTA 330, the four expertise area circles at cy 768 with r 340 (one grid column) centred on
x 210/550/890/1230 — so each circle is centred in a grid column and adjacent circles
meet at each other's centres.

**The cover** (`cover_transition.mov`) is one `#f4f4f4` circle whose centre is pinned;
only its radius grows with scroll. That is what makes it read as a single surface
swelling up over the Work gradient rather than a panel sliding in, and it keeps the
curved edge visible the whole way. It reaches well up into the Work section, and the
Work canvas is deliberately 420u taller than its own section so the gradient never ends
in a hard horizontal line — the arc is what cuts it off.

**The Work section is 1680u, not the 1880u of the artboard.** The last card bottoms out at
1155 and the ticker ends around 1334, so the artboard carried a 546u tail of nothing
before the Expertise header. 200u of that is trimmed, which tightens the hand-off into
Expertise without moving any Work content — all of it is positioned from the section's
top, so only the empty bottom goes. Measured: the gap from the ticker to the Expertise
header went from 608px to 402px.

**What starts it is the logo ticker**, not a scroll position: growth begins once the
ticker's top crosses `COVER_AT` (0.50 — the top half) of the viewport. `COVER_OFFSET` can
hold it back by a further N design units and is currently 0. Progress is then measured over
`COVER_PX`; neither knob changes the pace.

**The Expertise copy arrives like every other section**, on the same 0.78 / 0.90
viewport thresholds the Work header uses, with the same masked fade-in-up. It went through
a phase of being gated on the cover's geometry — waiting for the circle's edge to pass
above the headline — and that is gone. What keeps the content and the arc apart now is
**distance, not timing**: the content sits 200u lower in the section than the artboard puts
it, which is a fixed gap that holds in both scroll directions, where a gate only ever
worked on the way in. On the way back up the clearance between the headline and the arc at
the screen corners went from 31px to 231px, settling at 408px.

Moving the content down means `.exp__inner` is 1450u rather than 1250u, and **four things
have to move together**: the three content `top` values, the `.area` labels, `CY` in
`expertise.js`, and the SVG's `viewBox` height. The viewBox is the easy one to miss —
`preserveAspectRatio="none"` means a stale height silently stretches the circles into
ellipses rather than erroring.

**The circles run on their own band, not behind the copy.** They used to require
`stage.copy`, which was safe while the copy gate was geometric and stayed true across most
of the section. The moment the copy became an ordinary entrance, that coupling became a
bug: the copy switches off as soon as the headline leaves the top of the screen, and the
circles — 700u further down and only then arriving — were being reset at exactly the wrong
moment. Their band is now computed from the real `CY`/`R` geometry rather than from
`.areas`, whose box is the whole section and so is on screen almost always.

Verified in both directions:

| scrollY | copy | circle spread | labels | halo |
|---|---|---|---|---|
| 2400 | shown | 0% | — | — |
| 2800 | shown | 93% | — | — |
| 3100 | hidden | 100% | shown | on |
| 3100 (back up) | hidden | 100% | shown | on |
| 2400 (back up) | shown | 100% | shown | on |
| 2000 (back up) | hidden | 0% | — | — |

**The trigger is not just pacing — it is what keeps the shape an arc.** The circle's widest
point is its centre, which is pinned at page y 3326 and so crosses the bottom of the
viewport at a fixed scroll position (2426 at 1440x900). Above that centre the shape only
widens as it goes down, which is the upward arc; below it the sides close back in and it
reads as a disc floating in the blue. So the circle has to reach **full-bleed before its
centre arrives**. From the top half it is full-bleed at scrollY 2173, 253px ahead of the
centre. From the old top-third-plus-500u trigger it did not get there until 2823, and the
disc was visible for 397px of scroll. Push the trigger later than about scrollY 1977 and
the disc comes back. Keying off the element rather than a viewport fraction is the point
— the ticker is the last piece of Work content, so by construction all of Work and the
blue gradient have had their run before anything white starts moving, and it stays true if
the Work section is ever re-laid-out. `COVER_LEAD` survives only as the fallback for a page
with no ticker.

**The circle also sits 500u lower than it used to.** `COVER_TOP` is -400, not -900, which
is what opens up the long blue moment: the gap between the ticker and the circle's resting
arc went from 288px to 788px. The CSS `.cover` top and `COVER_TOP` here are the same number
and have to stay in step — the JS uses it to work out where the arc is on screen.

**Nothing but the circle may ever end the blue.** The canvas bottom is a hard horizontal
edge, so it has to fall inside the band where the fully grown circle is wider than the
viewport — otherwise it shows as a seam before the circle can cover it. That band was
measured by sweeping the overhang against every scroll position: **1265u to 1635u works,
and nothing outside it does**. Too small and the edge is exposed for hundreds of pixels of
scroll while the circle is still growing (at the old 520u it was exposed for 650px); too
large and it falls outside the circle's reach entirely and is never covered at all. The
overhang is 1450u, the middle of that band, with ~185u of margin either side, and at the
tightest moment the circle is still 109px wider than the viewport on each side.

The overhang lives in two places — the `#workgl` CSS and `work.js`'s `resize()` — and they
must match. It also sets the canvas height, which both `WORK.scale` and `WORK.offsetY` are
fractions of, so both were re-derived to hold the blob at the same size and place: `scale`
0.34 -> 0.239, `offsetY` 0.229 -> 0.012, verified as a 1px drift and an unchanged 1158px
diameter.

Measured at 1440x900, scrolling through the transition:

| scrollY | circle top (viewport) | centre | width | |
|---|---|---|---|---|
| 1800 | 1211 | 1526 | 630 | below the fold |
| 2000 | 838 | 1326 | 977 | arc entering |
| 2200 | 367 | 1126 | 1517 | **full-bleed**, centre still below the fold |
| 2400 | -89 | 926 | 2029 | centre arriving, long since full-bleed |

The canvas bottom at page 4030 cannot be reached before the circle is full-bleed either, so
the only white shape that ever enters the blue is the circle's upper arc.

Stacking matters here: Work canvas 0 < cover 1 < page grid 2 < content 3. The grid has
to stay above the cover, because it is one continuous page-level system across the
transition.

**The circle graphic** (`line_graphic.mov`) starts with all four circles collapsed on the
centre line, so it reads as one circle. It grows there first, then spreads outward into
four — the inner pair leaving before the outer pair, so it reads as centre, two, four.

Each outline **draws itself outward from the middle of the composition**: the stroke is a
single dash centred on the circle's inner-facing point, opening in both directions as the
circle travels and closing on the far side as it arrives. The right-hand circles are
rotated 180° so their inner point lands on the SVG path start. Watch the dash gap — it
has to be longer than the circumference, or the pattern repeats and only half the circle
draws.

The animation is **scale and movement only** — no stroke drawing. The small circle is
held for 620ms so it registers, grows over 820ms (the visible small-to-large moment),
and only then do the four spread, quickly (560ms) so the composition resolves while it
is still centred in the viewport. `SMALL` is the starting radius as a fraction of the
final one.

The stroke is the **same weight the whole way through** — `REST_A`, matching the
`stroke` attribute baked into the markup, so there is no darker "drawing" state and no
flash between what the HTML paints and what JS takes over. Only hover changes it.

**Why the starting circle used to look dark.** Not the stroke colour: at `spread 0` all
four circles are set to the *same* cx, cy and r, so they are exactly coincident, and four
1px strokes at `.14` compose to `1-(1-.14)^4 = .45` — more than three times the intended
weight. `placeCircles` therefore draws only one of them while they are stacked and fades
the other three in over the first `SEPARATE` (0.18) of the spread, by which point every
adjacent pair is 61 design units apart and the fade is happening under fast motion. The
circle now starts at exactly one stroke at `REST_A`: the same light grey it ends on.

**The spread uses a cubic ease-out** (`1-(1-x)^3`), not the smoothstep the grow still
uses — it leaves the centre fast and settles long into place. Monotonic and bounded by
construction, so nothing in it can overshoot or bounce. Cubic rather than quartic on
purpose: quartic covers 94% of the distance in the first half of the duration and then
crawls 2 units through the last quarter, which reads as stopping early. Cubic is 88% at
the halfway mark — still clearly front-loaded — and keeps 8 units of travel in the final
quarter, enough for the settle to be seen.

Geometry is set straight on each circle as `cx`/`cy`/`r` rather than through a group
transform. Transforms on SVG groups proved unreliable here — the Y component silently
failed to apply — and animating `r` keeps the stroke a constant 1px as the circle grows.

**Hover** darkens only the circle whose centre the pointer is nearest, and only when it
is actually inside it, at the same weight the Hero circle uses while being drawn
(0.30 against a 0.14 resting grey). The transform is set as an SVG **attribute** and tweened in the rAF loop — CSS
transforms on SVG groups did not apply reliably here, and a CSS transition cannot
animate an attribute anyway.

**All reveals replay in both directions.** Watchers are reversible: entering the band
plays the reveal, leaving it restores the pre-animation state so it plays again next
time. Each has a band of hysteresis between its enter and exit thresholds so the
boundary does not flicker, and pending timers are cleared on reset so a half-played
sequence cannot leak into the next one. This applies to the Work header, cards and
ticker, and to all three Expertise stages.

**Staging** is the important part here. Each stage waits on something the viewer can
actually see, not on "the section has entered the viewport":

| stage | waits for |
|---|---|
| headline, body, CTA | the headline has entered the viewport, as in every section |
| circle graphic | the copy has landed *and* the graphic's own band is on screen |
| expertise area labels | the circles have substantially reached their positions |

Coverage is computed from the cover's actual apex position on screen, not from scroll
distance. Measured: at 26% coverage nothing fires; at 91% the copy and then the graphic
run; the labels hold back until the circles have spread.

The spread is staged too — the inner pair leaves first and the outer pair follows, so it
reads as centre, to two, to four rather than four circles sliding apart at once.

Gates are driven from the scroll event as well as the rAF loop. rAF alone is enough in a
real browser, but tying them to scroll keeps the stages correct if frames are dropped.

## Proof section

Design units off `proof.png`: headline cap 128, CTA 292, stat columns on the grid lines
at 720 and 1060, rows at 337 and 618 (a 281 pitch).

Stats reveal a **row at a time**, each number counting up with cubic easing so it
decelerates into its value rather than ticking like a slot machine, and always lands
exactly on the target. `tabular-nums` stops the width jittering as the digits change.
The `%` suffix is carried throughout. Like everything else, it replays: scrolling away
resets the rows and the numbers back to zero.

## Expertise halo

A third instance of the same gradient machinery (`halo.js`), in a transparent canvas
behind the circle outlines and labels (z-index 0 inside `.areas`, SVG at 1, labels at 2),
so the type and line work always stay crisp above it.

It is nearly invisible at rest (`HALO.rest` 0.04); the cursor reveals it, drags it with
lag and stretches the mass along the direction of travel — the same follow-and-stretch
language as the Hero halo, so the three gradients behave as one system.

Deliberately **small and light**, but with real colour in it: the tones sit at
0.12-0.60 saturation and 0.94-1.0 value, so the aqua / mint / cyan-green registers
clearly against the background without ever going dark or heavy. (It was previously
capped at 0.30 saturation and read as near-white.) Measured hue band 167-185 degrees,
unchanged by the saturation lift.

**It stays hidden through the circle animation.** `expertise.js` publishes
`EXP_CIRCLES_SETTLED` and the halo fades up from nothing over 520ms only once that is
true. The flag is deliberately stricter than `anim.done`, which fires at 88% of the spread
so the expertise area labels can start arriving under the tail of the movement — the halo
waits for the whole thing, verified as still false at 99% spread and true at 100%. While
it is false the gate holds the canvas at opacity 0, which also trips halo.js's
`vis > 0.01` guard, so the halo does no GPU work at all until it is wanted. Scrolling back
up clears the flag and it fades out the same way. `undefined` means expertise.js is not
running, which leaves the halo ungated.

It sits at the **back of the whole section** — above the grid, below the circles and
below every piece of text (grid 2, halo 3, content 4), so it passes under the header
copy as well as the circles. `followX` lets it travel to ±0.380 in p-space, essentially
under the outermost circles at ±0.408, while the measured extents (0.561 horizontal
against a 0.576 half-width, 0.445 vertical against 0.5) keep its whole soft edge on
screen at full pull.

## Files

| file | what it is |
|---|---|
| `index.html` | page shell and panel styling |
| `config.js` | **every tunable value**, plus the tuning panel's slider list |
| `shaders.js` | the three GLSL programs |
| `app.js` | WebGL setup, render loop, pointer handling |
| `work.js` | the Work section: cool gradient, reveal, case-study cursor, ticker |
| `expertise.js` | the cover transition, circle graphic and Expertise reveal |
| `halo.js` | the green/aqua cursor-reactive halo under the four circles |
| `proof.js` | Proof reveals, row staggering and the count-up |
| `assets/` | card images and client logos extracted from work.png |
| `tweak.js` | the `T` panel — pure convenience, safe to delete |

## Debug flags

`?nogl=1` skips both gradients, `?still=1` renders a single frame, `?top=1` collapses
the hero spacer and reveals the Work section immediately, `?anim=1` (with `top=1`) keeps
the real staggered reveal running so it can be caught mid-flight. `?intro=0` skips the
page-load intro and `?introAt=900` pins it to that moment for capture. All three exist for capturing
stills; none affect normal use.
