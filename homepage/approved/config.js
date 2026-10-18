/* ============================================================================
   CONFIG — every tunable value lives here.
   Edit numbers, save, reload the page. Or press  T  in the browser to open
   the live tweak panel and drag sliders, then hit "Copy config" to paste the
   result back into this file.

   COORDINATE SPACE ("p-space") used by the blob + circle:
     x = 0 is the horizontal centre of the screen
     y = 0 is the vertical centre, y is POSITIVE DOWNWARD
     1.0 unit = the full viewport HEIGHT
   So the screen spans y from -0.5 to +0.5, and x from -aspect/2 to +aspect/2.
   ========================================================================= */

const CONFIG = {

  /* ---------------------------------------------------------------- canvas */
  bg: '#f4f4f4',                  // page + hero background

  render: {
    dprMax:      2,               // cap for retina. 1 = cheapest, 2 = crisp
    gradScale:   0.55,            // gradient buffer res (x canvas). It's soft, so <1 is free quality
    blurScale:   0.25,            // blur buffer res. Lower = softer + faster
    dither:      1.4,             // anti-banding noise, in 1/255 units. 0 = off
    timeScale:   1.0              // PREVIEW ONLY: set to 10 to fast-forward the morph
  },

  /* ------------------------------------------------------------ background grid */
  grid: {
    columns:    4,                // 4 columns -> 5 vertical lines
    /* 2 columns -> 3 lines: the two margins and the centre. Five lines on a 375 screen
       put a line every 84px, which is closer to a texture than a structure and leaves
       the outer two sitting in the margins. Below this width the page drops to the
       three that mean something. */
    columnsMobile: 2,
    /* 1023, the live site's tablet boundary -- NOT 767. The layout is drawn in design
       units (--u = width/1440) so every box shrinks proportionally, while the type
       tokens clamp toward a mobile floor that is a much higher fraction of their
       desktop size: at 768 the artboard is 53% of itself but --font-p-18 is still 89%
       of 18, so body copy occupies 30 design units where the layout budgeted 18. The
       stacked layout has no fixed unit measure for type to outgrow, so it is the right
       layout for that whole band. Must match the stylesheet or the grid changes column
       count at a different width than the CSS. */
    mobileAt:      1023,
    /* The GRID's own breakpoint, deliberately not mobileAt. The layout stacks at 1023,
       but the five vertical lines hold all the way down to 768 -- a tablet is wide
       enough for four columns even though it is too narrow for the two-column
       compositions. Below this the page drops to three lines: the two margins and the
       centre. */
    columnsMobileAt: 767,
    /* THE SIDE MARGIN, STATIC PER BREAKPOINT. It was a vw clamp --
       clamp(20, 2.78vw, 72) -- so the margin grew with the window: 40 at the 1440
       artboard but 61 at 1920 and 25 at 900. Everything on the page is measured from
       it (--col is (width - 2m) / columns), so the whole grid drifted with the
       viewport while the type, which is tokenised and steps, did not.

       Three numbers now, on the same 1023 / 767 boundaries the type tokens use. */
    marginDesktop: 40,            // 1024 and up
    marginTablet:  32,            // 768 - 1023
    marginMobile:  20,            // 767 and below
    /* 0.130, which IS "15% of #222" — just written as the black multiply this draws
       with. Painting rgba(34,34,34,.15) in multiply gives C * (1 - .15 * (1 - 34/255))
       = C * 0.870, and a black multiply at 0.130 gives C * 0.870 as well: the same
       pixels. It is kept in this form because ONE number has to feed both the CSS grid
       and the hero shader, and the shader multiplies toward black. The expertise wires
       and the hero circle's rim are set to the same 0.870. */
    alpha:      0.130,            // was 0.095, measured from hero.png
    widthPx:    1                 // line width in CSS px
  },

  /* ------------------------------------------------------------- centre circle */
  circle: {
    /* OFF. The hero's centre object is the logo mark now -- .hero__mark in the DOM,
       nine dots at the circle's own diameter -- so the whole optical construction
       below is switched off in app.js rather than deleted: refraction, blur-inside,
       veil, traced rim, corona, rim smear and both cursor lenses, every one of which
       was gated to this circle's SDF. The living gradient and the grid are untouched
       and still run behind the mark. Set this true to bring the glass back. */
    enabled:     false,

    centerX:     0.50,            // 0..1 of viewport width
    centerY:     0.50,            // 0..1 of viewport height
    radiusScale: 1.00,            // multiplier on "one grid column" (hero = exactly 1.0)
    maxRadiusVH: 0,               // 0 = OFF, and off is correct. This capped the
                                  // radius against viewport height, but a column and
                                  // 0.42vh agree only at 16:9 -- anywhere wider the
                                  // cap won and pulled the circle off the grid lines.
                                  // Raise it only to keep the circle in frame on an
                                  // extreme letterbox viewport, knowing that it drops
                                  // grid alignment the moment it engages.

    blurMix:     1.00,            // 0 = no blur inside, 1 = fully diffused (the hero look)
    veilAlpha:   0.50,            // how much the translucent veil washes out what's behind
    veilColor:   null,            // the veil tint. null = follow `bg` above, so the
                                  // circle fills with the universal background colour
                                  // and stays matched to it if that ever changes.
                                  // Set a hex string here to break the link.

    /* 0.667, not 1. The rim and the grid lines were already set to the same
       DARKNESS -- strokeMul 0.870 against grid.alpha 0.130, which is the same 13%
       multiply -- and it still read bolder, because they are not the same WIDTH.
       A grid line is one crisp CSS pixel. The rim is `1 - smoothstep(0, sw*1.5,
       |d|)` either side of the edge, which integrates to 1.5 pixels of ink for the
       same peak value; measured off a render, the rim came to 49 levels of total
       darkening against the grid line's 34, a ratio of 1.44 against the 1.5 the
       falloff predicts. Dividing the alpha by that 1.5 matches the two by area,
       which is what the eye is comparing, and keeps the soft rim a curve needs --
       a hard one-pixel edge on a circle would crawl with aliasing. */
    strokeAlpha: 0.667,           // the hairline rim. 0 = invisible
    strokeMul:   0.870,           // how much the hairline darkens what's under it.
                                  // 0.870 = the universal hairline: see grid.alpha
    strokeDrawMul: null,          // how dark the hairline is WHILE the intro traces it.
                                  // null = follow strokeMul, i.e. trace at the resting
                                  // grey and never darken. Was 0.80, which made the
                                  // circle arrive heavier than it ends up -- matching
                                  // the grid lines, which did the same thing. Set a
                                  // number here to bring the darker trace back.
    strokePx:    1.0              // hairline width in CSS px
  },

  /* ----------------------------------------------------------- lens refraction */
  /* The idle glass-ball distortion: nothing at the centre, strongest at the rim. */
  refraction: {
    strength: 0.038,              // how far the rim drags the image. It was 0, which is
                                  // why the circle sat on the gradient rather than in
                                  // it -- nothing about the rim read as glass. 0.030
                                  // was the old tuned value; this is a little past it.
    falloff:  3.0                 // higher = the bend stays hugged to the very rim
  },

  /* -------------------------------------------------------------- eclipse glow */
  /* Light leaking around the circle edge — ONLY where the blob is actually there. */
  corona: {
    intensity:   0.05,            // master brightness of the glow. It was 0. With the
                                  // refraction above this is the other half of the
                                  // circle reading as an optic: light leaks around the
                                  // rim, but only where the blob is actually behind it,
                                  // so it appears as the mass passes under. 0.18 was
                                  // the old tuned value.
    spread:      0.018,           // width of the tight inner corona (p-space)
    outerScale:  1.5,             // the wide bloom is this many x wider
    outerWeight: 0.50,            // how much of the wide bloom to mix in
    bias:        0.003,           // >0 pushes the glow outward, <0 pulls it inward
    saturation:  1.00,            // 1.35 before. Over-saturating a coral pushes it to
                                  // orange-yellow at the rim, which is the other half of
                                  // the yellow shift. 1 keeps the glow the blob's own hue.
    gamma:       1.60             // higher = glow confined to the hottest parts only
  },

  /* ------------------------------------------------------------------- pointer */
  pointer: {
    /* the small lens that rides with the cursor */
    radiusVH:  0.30,              // size of the travelling lens (fraction of vp height)
    strength:  0.044,             // 0.028 before. Local warp amount
    blurBoost: -0.45,             // negative SHARPENS under the cursor. Positive diffuses.
    lift:      0.004,             // 0.030, then 0.012. This is the yellow: brightening a
                                  // warm colour in sRGB raises green toward red and the
                                  // highlight drifts to yellow. The interaction point
                                  // now stays coral because it barely brightens at all.
    ease:      0.055,             // cursor follow smoothing. Lower = laggier / more fluid
    fade:      0.045,             // how fast it settles back when the pointer leaves

    /* A cursor that has STOPPED is not the same as a cursor that has LEFT. The mass
       stays with a moving pointer, but once the pointer has been still for idleAfter it
       lets go and drifts back onto its own wander -- so a page left alone keeps moving
       instead of parking wherever the cursor happened to come to rest.
       Taking hold again is quicker than letting go: catching the pointer should read as
       a response, drifting off it should not read as a snap. These govern the gradient
       FOLLOW only. The lens under the cursor is a lens and stays where the cursor is. */
    idleAfter:   1200,            // ms of a still cursor before the mass starts letting go
    idleRelease: 0.010,           // per frame, so about 3s to come fully free
    idleGrab:    0.060,           // per frame, so about half a second to take hold again

    /* the whole gradient drifting toward the cursor — parallax with mass */
    /* These three are tuned together for ROUNDNESS AT EVERY CURSOR POSITION, which is
       what they were measured against: the mass's aspect ratio (major/minor axis of the
       lit field) with the pointer parked in each corner, against 1.175 at rest.

                                  top-L  top-R  bot-L  bot-R
         0.34 / 2.35 / 0.80       1.582  1.604  1.771  1.873
         0.24 / 1.00 / 0.10       1.106  1.132  1.435  1.367   <- this
         0.22 / 0.85 / 0.10          --  1.143     --  1.336   diminishing, costs more reach

       TWO different things were breaking the circle and only one of them was the
       stretch. Top corners: the stretch smeared the mass into a diagonal wedge, and
       dropping it to 0.10 fixes that outright. Bottom corners: the mass simply TRAVELLED
       off the frame -- at gradFollowY 2.35 the measured field fell to 60k lit pixels
       against 90k at rest, so what was left on screen was a corner crescent, and no
       amount of de-stretching touched it (0.80 -> 0.00 moved bottom-right only
       1.873 -> 1.767). Shortening the travel is what fixes those; at 1.00 the same
       corner holds 82k.

       The bottom pair stay a little above rest because the hero is full-height and the
       mass sits low in it, so pulling it down takes part of it past the fold. That is
       framing, not shape. */
    /* gradFollow scales BOTH axes and gradFollowY multiplies the vertical on top, so
       the pair is really "how far it travels sideways" and "how much of that it also
       travels down". Raising the first while lowering the second buys horizontal reach
       at a FIXED vertical travel -- 0.58 * 0.41 = 0.238, the same 0.24 that fixed the
       bottom corners -- and measurement says it costs nothing in roundness:

                            left-most centroid x      aspect top-L / bot-L
         0.24 / 1.00              682 / 671               1.11 / 1.43
         0.38 / 0.63              602 / 596               1.11 / 1.41
         0.48 / 0.50              544 / 544               1.10 / 1.39
         0.58 / 0.41              487 / 492               1.10 / 1.36   <- this
         0.70 / 0.34              420 / 427               1.09 / 1.35

       The mass is not leaving the frame on the way out either: the lit field holds
       ~105k pixels at top-left across every row, against 90k at rest. */
    gradFollow:     0.58,         // 0.24 before. How far the mesh leans toward the pointer
    gradFollowY:    0.41,         // 1.00 before. Lowered in step with the line above so
                                  // the VERTICAL travel is unchanged -- that travel is
                                  // what threw the mass off the bottom of the frame, and
                                  // it is the one number here that must not grow.
    gradFollowEase: 0.075,        // ~0.5s to settle. Lower = heavier / more lag
    gradStretch:    0.10          // 0.80 before. How much the mass elongates TOWARD the
                                  // cursor. Kept off zero so there is still a hint of
                                  // reaching rather than a flat slide; it scales with how
                                  // far the pointer is from the halo, so it is gone at
                                  // rest. The shader divides the along-cursor axis by
                                  // (1 + amt), so 0.80 was stretching the field by up to
                                  // 1.9x -- which is the wedge, not a lean.
  },

  /* ------------------------------------------------------------ pointer lens */
  /* A real optical distortion, not an overlay. The gradient underneath is
     physically displaced around the pointer and the blur follows it, so it reads
     as pressing on a soft lens. Everything here is deliberately gentler than
     touch_effect.mov: less push, slower response, much wider falloff.          */
  lens: {
    radius:    0.46,              // BIG and soft — roughly the circle's own radius,
                                  // so there is no perceptible edge to the effect
    strength:  0.078,             // how far the gradient is displaced (p-space)
    pull:     -0.30,              // <0 pushes outward (bulge), >0 pulls in (pinch)
    blur:      0.42,              // how much the blur follows the displacement
    lift:      0.005,             // 0.020 before. This is the lens over the CENTRE CIRCLE,
                                  // and brightening a warm colour in sRGB walks it toward
                                  // yellow -- so the interaction point went yellow exactly
                                  // where it should have stayed coral. Nearly off now; the
                                  // colour there comes from the redder poles instead.
    ease:      0.022,             // SLOW. ~2s to settle. This is what stops it
                                  // feeling mapped one-to-one to the cursor
    fade:      0.020,             // how slowly it returns to rest when you leave
    edgeFeather: 0.16             // how softly the effect dies across the circle rim
  },

  /* ----------------------------------------------------------- cursor smear */
  /* The SDFLensBlur treatment: light from the circle's rim is dragged along the
     line toward the cursor, so it wraps the contour like a wing. Driven by
     pointer POSITION, not motion — it stays lit while the cursor is still.     */
  smear: {
    /* The smear is ADDITIVE, so pushing it hard does not just brighten - it clips
       the red channel, and with red pinned at 1.0 only green can keep rising, which
       drags the hue toward yellow. Measured against the warm pole under the circle
       (#ff8a4e, hue 24.9): at the old 0.70/1.25 the lit rim reached hue 49.5, a
       plainly yellow highlight sitting on an orange gradient. At 0.38/1.00 it reads
       33.7 - still a clear glow, +0.107 of brightness, but close enough to the
       underlying hue to belong to it. Raise intensity and the yellow comes back. */
    intensity: 0,                 // master brightness. 0 = off -- it is off. The
                                  // shader early-outs on this, so none of the
                                  // settings below are evaluated while it is 0.
                                  // 0.38 was the tuned value if you want it back.
    radius:    0.42,              // how close the cursor must be for it to light up
    reach:     0.85,              // 1.0 = smear all the way to the cursor
    rimWidth:  0.135,             // how tightly the smear hugs the circle's edge
    taps:      10,                // samples along the smear. More = smoother, costs more
    saturation: 1.00              // >1 = the smear is more vivid than the gradient
  },

  /* ------------------------------------------------------------------ the blob */
  blob: {
    /* OFF. The hero's field is the footer's atmospheric gradient now -- three slow
       masses rising off the bottom edge, drawn to a canvas by hero-glow.js -- and this
       WebGL mesh gradient, the orange aura the hero opened with, is what it replaced.
       app.js holds uHaloFade at 0 when this is false, which is the one uniform the
       gradient's whole contribution is scaled by, so the composite resolves to the flat
       background and nothing below here has to change. Set it true to bring it back. */
    enabled:  false,

    scale:    0.667,              // 0.58 + 15%. Overall size of the whole mesh gradient.
                                  // The chain before that: 0.64, then /1.086 when
                                  // shapeRound went up, then 0.59, then 0.58 to keep the
                                  // mass concentrated rather than spread across the frame.
    offsetX: -0.26,               // nudge the whole blob (p-space). Negative here
                                  // re-centres the wander so it sweeps both halves of
                                  // the composition rather than only the right.
    offsetY:  0.04,               // resting a touch higher, so upward travel reads

    /* How washed-out the palette is. 0 = full gradient.png richness,
       ~0.20 = the flatter, paler look of hero.png. This is the one dial that
       trades between the two references.                                       */
    paletteWash: 0.200,           // set from the tweak panel. Richer than the 0.330
                                  // that was chosen to keep the peak off the clipping
                                  // ceiling -- below ~0.145 the field's brightest point
                                  // clips its RED channel at 255 and the hue flattens
                                  // exactly where the colour should be truest.
                                  // 0.355, 0.215, 0.110. At 0.110 the peak clipped at
                                  // 255 where the reference tops out at 242; this is the
                                  // small amount of wash that lands it there.
                                  // Washing is what made this MUDDY:
                                  // it mixes every pole toward the grey background, and
                                  // a heavily-washed vermillion is exactly a muddy
                                  // orange. The poles below are now the reference's own
                                  // coral at the reference's own saturation, so there is
                                  // very little left to wash -- the pale area around the
                                  // circle comes from the veil and the falloff instead.
                                  // THE paleness dial, and it is doing all the work
                                  // here. Each pole is mixed this far toward `bg`
                                  // before anything is drawn, so the palette above
                                  // is untouched while the field reads pale.
                                  // 0.51 is measured, not guessed: it is the wash
                                  // at which the DEEPEST pole lands on L 0.709,
                                  // which is the darkest pixel anywhere in
                                  // hero.png. Lower = hotter, higher = paler still.

    /* ---- where the whole blob wanders to over time ------------------------
       Four incommensurate periods per axis, so the path never retraces itself and
       never reads as a simple left-to-right slide. The blob stays large enough to
       overflow the viewport wherever it goes, so it is always cropped by the edges. */
    wanderX:  0.42,               // 0.72 before: less wander, so the mass stays the
                                  // concentrated shape the reference draws
                                  // horizontal range (p-space). 0 = anchored
    wanderY:  0.30,               // vertical range. 0.26 before -- a little more float
                                  // up and down, since this is now what you watch while
                                  // the cursor is idle rather than a background drift.
    /* HALVED, and that is what makes the idle state read as floating. The RANGE was
       never the problem: measured at rest the mass already covers x 447..1009 and
       y 389..614, which is the whole hero. The problem was the rate. Distance moved in
       any 5-second window, across 400 starting phases:

                            median    min    max
         83/53  71/47         63px    1px   151px     <- could sit nearly still
         41/29  37/23        141px   12px   279px     <- this
         31/21  27/17        194px    7px   351px     reads as drifting, not floating

       (Those three rows were sampled once a second. At 0.05s resolution the minima are
       0.9px, 4.9px and 5.7px -- the shape of the finding is the same, but the floor is
       lower than a coarse sweep suggests, so quote these rather than those.)

       The MINIMUM is the tell: on the original set the mass moved under a pixel in five
       seconds at a turning point, so pausing the cursor at the wrong moment left it
       apparently parked under the circle. Five-odd pixels is still slow, but it is the
       bottom of a curve the mass passes through, not a place it rests.

       The current values are the middle row divided by 1.10 -- another 10% faster. They
       were the primes 41/29/37/23 and are now decimals, which costs nothing: what the
       periods have to be is INCOMMENSURATE, so the four sines never line up and the path
       never retraces. Primes were one easy way to guarantee that; irrational-looking
       decimals are a better one. Scale all four by the same factor to change the speed.

       Note the RATE is exactly 10% higher, but the distance covered in a fixed 5s window
       only rises about 6.5% at the median -- near a turning point the sine's displacement
       is sub-linear in rate, so the two numbers do not match and should not be expected
       to. 5s travel: median 138.8 -> 147.8px, min 4.9 -> 5.7, max 280.6 -> 305.5. */
    wanderPx1: 37.27, wanderPx2: 26.36,   // seconds
    wanderPy1: 33.64, wanderPy2: 20.91,

    /* ---- silhouette: deliberately calm, so the outline stays stable -------- */
    shapeRound: 0.995,            // 0.85, then 0.95. hp_modules.png draws the hero mass
                                  // as very nearly a disc, so the poles stack hard.
                                  // pulls the silhouette poles toward their shared
                                  // centre, so the outline is rounder and softer.
                                  // 0 = the original lumpier layout, 1 = a circle.
                                  // Was 0.55. Stacking the poles also makes the
                                  // summed field saturate further out, so the blob
                                  // grows 8.6% -- `scale` below is pulled back to
                                  // match, or this would read as bigger as well as
                                  // rounder.

    shapeWarpAmp:   0.006,        // 0.060, then 0.032. Rounding the LAYOUT is only half of
                                  // it -- the warp is what dents the finished outline, so
                                  // it comes down with shapeRound going up.
                                  // how much the outline is pushed out of round.
                                  // Was 0.105 -- shapeRound rounds the LAYOUT of
                                  // the poles, this is the noise that dents the
                                  // result, so both have to come down together
    shapeWarpFreq:  0.55,         // size of the wobbles. Careful: amp * freq above
                                  // ~0.4 makes the warp fold over itself, which
                                  // shows up as straight creases in the gradient.
    shapeWarpSpeed: 0.0403,        // ~28s
    shapeDrift:     0.045,        // how far the outline's poles wander
    shapePeriodMul: 2.4,          // outline cycles this many x slower than the colour

    /* ---- colour field: this is what actually flows ------------------------ */
    /* The colour poles orbit on their own, independently of the silhouette, so
       colour regions swirl INSIDE a stable outline. That decoupling is what
       gives distrategy its melted, advected quality.                          */
    colorWarpAmp:   0.20,
    colorWarpFreq:  0.48,
    colorWarpSpeed: 0.0414,
    orbitAmp:       0.20,         // how far each colour pole travels
    orbitPeriod:    45,           // SECONDS for one orbit. Higher = slower
    colorSpread:    1.45,         // pushes the colour poles apart about their shared
                                  // centre. THIS is what keeps the zones distinct.
                                  // Separation gives distinct colour with smooth wide
                                  // transitions; tight falloff gives distinct colour
                                  // with hard angular edges. Prefer this dial.
    colorFalloff:   1.60,         // gaussian tightness of the colour poles. Raising it
                                  // sharpens colour boundaries - use colorSpread first.

    /* ---- breathing: each pole on its own schedule, so the colour balance
            of the whole composition shifts over time ----------------------- */
    radiusBreath:       0.11,
    radiusBreathPeriod: 42,       // seconds
    brightBreath:       0.10,
    satBreath:          0.14,
    breathPeriod:       34,       // seconds

    /* ---- silhouette edge. No hard boundary anywhere:
            coverage = 1 - exp(-(field * edgeGain) ^ edgeShape)                 */
    edgeGain:  1.53,              // higher = the blob covers more, denser overall
    edgeShape: 1.38,              // higher = the outer tail fades away faster
    falloff:   1.05               // gaussian tightness of the SILHOUETTE poles
  },

  /* --------------------------------------------------------- the colour poles */
  /* hero.png's own tones. Measured against the reference this lands at a hue
     spread of ~11.5 deg (hero.png is 11.4) with saturation 0.15-0.79 (hero 0.15-0.71).
     Positions are in p-space (see header).                                     */
  poles: [
    /* A hot field, narrow in range: a deep red-orange at the top of the frame,
       four identical vermillions through the body, and a single salmon at the
       bottom right. Only poles 0 and 5 differ from the vermillion, so those two
       are what carry the colour variation the orbits and breathing act on.

       These values are deliberate and are NOT the ones in hero.png -- the
       reference has no vermillion in it. The paleness comes from paletteWash
       instead, which washes these colours toward the background without
       altering them. */
    /* A LADDER AROUND THE BASE, #ea521a. Every pole is that one colour at a
       different lightness -- one shade below it, the base itself on the two poles
       that carry the mass, then tints of it at 28 / 52 / 74% toward white. No second
       hue anywhere, so the tonal variation is the base getting lighter rather than
       the palette drifting somewhere else.

       Tints, not washes: mixing toward WHITE keeps the hue and drops the saturation
       in step, which is what reads as the same colour in a lighter tone. Mixing
       toward the grey background -- which is what paletteWash does -- is what used to
       make this muddy, so the wash is nearly off and this ladder does the work. */
    /* ONE COLOUR. gradient-orange.png is the gradient isolated, and measured across
       its whole mass it barely varies at all: saturation p10 0.87 to p90 0.90 -- a
       spread of 0.02 -- and value 0.91 to 0.96. Its centre is #eb501b, which is the
       base. The only thing that moves is HUE, and only on one side: the right and
       lower-right sit at 6.6-8.2 against 15.5 everywhere else, a 9 degree lean toward
       red.

       So the ladder is gone. Every pole is the base, and the three on the right carry
       that lean -- which also puts the redder colour exactly where the centre circle
       is, so the cursor's interaction point there reads coral rather than orange.
       Overall intensity is the WASH's job now, not the palette's: washing lowers every
       pole equally and so costs no uniformity, where a ladder of tints was variation
       by construction. */
    { x:  0.52, y:  0.18, r: 0.32, color: '#ea4e1a' },   // right: a hair of the red lean
    { x:  0.28, y:  0.13, r: 0.30, color: '#eb501b' },   // THE BASE, the swatch's centre
    { x:  0.52, y: -0.02, r: 0.28, color: '#eb501b' },   // THE BASE, upper
    { x:  0.18, y:  0.44, r: 0.28, color: '#eb501b' },   // THE BASE
    { x:  0.04, y:  0.55, r: 0.26, color: '#e7521d' },   // the swatch's bottom, hue 15.7
    { x:  0.50, y:  0.60, r: 0.29, color: '#f5381a' }    // lower-right: hue 8.2
  ],

  /* --------------------------------------------------------------------- blur */
  blur: {
    radiusPx:   60,               // effective blur radius in CSS px at 1440 wide
    iterations: 3                 // more = smoother + wider, costs a little
  }
};

/* ============================================================================
   FEATUREDWORK SECTION — the cool gradient.
   Same machinery as the hero, but its foundational POSITION never moves: there
   is no wander and no cursor follow. All the life comes from inside it.
   ========================================================================= */
const FEATUREDWORK = {
  dprMax:  1,                   // the section canvas is huge and entirely soft;
                                // retina backing buys nothing and costs a lot
  /* NOTE p-space here is normalised to the SECTION height (~1880px), not the
     viewport, so radii that suit the hero read far larger in this section.
     These are sized so the gradient's soft leading edge arrives around y=850
     and it overflows the bottom and both sides, exactly as in work.png.       */
  /* NOTE shapeRound stacks all six poles on one point, so the summed field
     saturates far past the nominal radius - the scale compensates for that.
     scale is a fraction of the CANVAS HEIGHT, so it has to be re-derived whenever
     the canvas height changes or the blob changes size in absolute pixels:
     0.34 on the old 2200u canvas = 0.239 on the 3130u one. */
  scale:   0.239,
  offsetX: 0.00,   // from the tweak panel
  /* offsetY is in canvas-height units: the canvas is the 1880u section plus the
     420u overhang = 2300u tall, so 1 unit of offsetY is 2300 design px and
     0.0435 moves the blob 100px. Larger values push it DOWN (p-space is y-down).
     The canvas is the 1680u section plus the 1450u overhang = 3130u, so one unit of
     offsetY is 3130 design px. 0.012 puts the blob's centre 1604px below the canvas
     top — the same place on the page it has been through every change to the section
     height and the overhang. Both of those resize the canvas, so both require this
     number to be re-derived if the gradient is to stay put. */
  /* -0.040, not 0.012. Measured row-for-row against hp_modules.png: the reference's
     blue reaches noticeably further UP into the section -- saturation 0.39 at section
     y1300 and 0.51 at its bottom edge, where this sat at 0.19 and 0.29. The mass was
     simply too low. One unit here is the canvas height, 2904 design px, so this lifts
     it 151. */
  offsetY: 0.008,   // from the tweak panel

  colorSpread:  1.00,   // NB this scales with the poles' own spread, so pushing it
                        // past ~1.2 at this blob scale throws most of the tones
                        // outside the visible dome and it collapses to one hue           // keeps the six tones reading as distinct zones
  /* 1.25, down from 2.10. Higher is TIGHTER -- each pole holds its own zone and the
     field reads as several blues meeting. Lower lets them average into one another, so
     the ladder becomes a ramp. This is the single biggest lever on how clean it looks. */
  colorFalloff: 1.25,
  falloff:      1.15,
  edgeGain:     2.00,
  edgeShape:    2.30,          // tighter shoulder = a readable curved boundary
  /* 0 -- no wash at all. Set from the tweak panel, and it supersedes the 0.185 this
     was measured to against hp_modules.png: the poles below changed at the same time,
     so the field no longer needs pulling back toward the background. */
  paletteWash:  0,

  shapeWarpAmp: 0.045, shapeWarpFreq: 0.50, shapeWarpSpeed: 0.020,
  shapeDrift:   0.030, shapePeriodMul: 2.2,

  /* Pulls the silhouette poles toward their shared centre so the mass is a big
     soft disc. That is what gives the top edge a rounded, radial shape instead of
     a flat horizontal boundary — we are seeing the crown of a much larger mass
     sitting below the viewport. */
  shapeRound: 0.96,            // all but a perfect disc, so the apex is pronounced

  /* The mass below the crown. Without this the gradient is literally a disc: its
     sides and bottom are visible, and the canvas edge cuts its bottom into a
     straight line — which is the seam the cover transition used to expose. Below
     floorAt the field is solid across the full width, so the crown arcs over a
     blue that simply continues down to the bottom of the canvas. In p-space:
     floorAt 0.27 is around page y 2800, the ramp spans roughly 2500 to 3100. */
  floorAt:   -0.300,   // from the tweak panel
  floorSoft: 0.505,            // 0 disables the floor (the hero and halo blobs)

  /* internal life only — regions drift, swell and breathe in place */
  /* 0.08, down from 0.26. This is the warp that bends the colour regions against each
     other; at 0.26 it is what put visible mottling through the ramp. Low, not zero --
     the field would go dead flat and stop reading as a living gradient at all. */
  colorWarpAmp: 0.08, colorWarpFreq: 0.46, colorWarpSpeed: 0.024,
  orbitAmp:     0.15,           // small: regions stir, the blob does not travel
  orbitPeriod:  78,

  radiusBreath: 0.10,           // expand / contract areas of colour -- halved, see below
  radiusBreathPeriod: 62,
  brightBreath: 0.05,
  satBreath:    0.06,
  breathPeriod: 56,

  /* Each pole's hue drifts a few degrees on its own slow cycle. Because the
     phases differ, it is the RELATIONSHIP between the tones that evolves, not
     the whole field sliding one way — which is what makes it read as the blues
     shifting among themselves rather than the gradient changing colour.
     Keep it single-digit: past ~8 degrees the cool end starts leaving blue. */
  /* 0. The poles are one hue now, so letting each drift its own few degrees was the
     one thing guaranteed to break that -- it is the mechanism that made the blues read
     as shifting among themselves rather than as a single colour. */
  hueBreath:       0.0,         // degrees either side of the pole's own hue
  hueBreathPeriod: 74,

  /* ---- scroll-driven expansion ------------------------------------------
     Starts low in the section, matching work.png, then swells upward and outward
     to fill the viewport. Deliberately short: expandPx is the scroll distance the
     whole transition takes, far quicker than the reference clip.               */
  /* All three are 0 on purpose: the gradient holds ONE size for the whole
     section. Scroll changes nothing about its geometry — the only thing that
     moves it is its own internal life and the cursor. Raising expandScale
     brings the old swell-on-scroll behaviour back. */
  expandPx:     620,           // still the scroll distance the hook spans
  expandScale:  0.00,          // no size growth
  expandRise:   0.00,          // no travel
  expandGain:   0.00,          // no coverage growth either - growing coverage
                               // reads as the blob getting bigger, which is
                               // exactly what we are removing

  /* ---- cursor interaction --------------------------------------------------
     A local response in the colour field, not a moving blob: the regions bend
     toward the pointer, deepen in tone, spread a little and tighten in softness.
     Large radius + heavy easing so there is never a cursor-shaped edge.        */
  curRadius: 0.62,              // BIG, in p-space. No visible falloff edge
  curWarp:   0.085,             // how far the colour regions bend toward it
  curSat:    0.62,              // local richness. Was 0.30 - doubled, so the tone
                                // under the pointer deepens visibly rather than
                                // only just registering.
  curHue:   -14.0,              // degrees of temperature shift under the pointer.
                                // Negative runs the tone cooler / more cyan-blue;
                                // positive pushes it toward indigo. Was -6.0, which
                                // the original note called "deliberately tiny". -14
                                // is a tone move you can actually see and still sits
                                // inside the sampled blue -> cyan -> aqua family.
                                // Past about -25 it starts leaving the palette.
  curSpread: 0.22,              // local spread of coverage
  curBlur:   0.45,              // >0 tightens the softness, <0 loosens it
  curEase:   0.045,             // slight lag following the pointer
  curFade:   0.060,             // how fast the response arrives and decays. Was
                                // 0.030, a ~0.55s settle, which read as laggy more
                                // than calm. Doubling halves that. This is the
                                // onset speed, NOT pointer tracking - curEase above
                                // still carries the positional lag, untouched.

  /* the softness itself breathes */
  blurPx: 86, blurIterations: 3,
  blurBreath: 0.34, blurBreathPeriod: 84,

  /* Blue / cyan, no aqua. The three pale poles each had more green in them than
     blue-cyan needs, and summed they pulled the whole field toward emerald --
     which is the one hue HP modules.png does not have in this band. Each has had
     green taken out and blue added; the two azures and the petrol were already
     clean and are untouched. */
  /* A LADDER AROUND THE BASE, #0587c1 -- the same construction as the hero's. One
     shade below it, the base on the two poles that carry the mass, then tints of it
     toward white. The old palette ran down to #003d5c, a near-black petrol, and that
     one pole was what dragged the lower band to mud; the deepest here is a shade of
     the base, not a different colour. */
  poles: [
    /* FOUR light poles to two base ones. In hp_modules.png the saturated blue is only
       in the centre-bottom (#518dbf, sat 0.58) and the corners and edges are PALE blue
       (#c2eaf5, sat 0.21, value 0.96) -- filled, but light. A ladder weighted the other
       way, plus a shade below the base, is what made this dark: measured, the bottom
       left corner came out #1e5669 at value 0.41 against the reference's 0.96. */
    /* EXACT TINTS OF THE BASE, mixed toward white at 38% and 62%. They were #56bdf0 and
       #84c4e1, which sat 1.4 and 0.2 degrees off it -- close, but arrived at separately.
       Derived from #0587c1 they cannot drift from it when the base is retuned. */
    { x: -0.66, y: -0.34, r: 0.34, color: '#64b5d9' },   // base, 38% toward white
    { x: -0.08, y: -0.22, r: 0.33, color: '#a0d1e7' },   // base, 62% toward white
    { x:  0.52, y: -0.06, r: 0.32, color: '#0587c1' },   // from the tweak panel, now THE BASE
    { x: -0.44, y:  0.18, r: 0.33, color: '#0587c1' },   // THE BASE
    { x:  0.16, y:  0.34, r: 0.33, color: '#0587c1' },   // THE BASE, centre-low
    { x:  0.70, y:  0.30, r: 0.31, color: '#0587c1' }   // THE BASE
  ]
};


/* ============================================================================
   EXPERTISE GLOW — the warm radial behind the four loops.

   NOT a WebGL field like the other three. It is a plain <radialGradient> in the
   loops' svg, and until now its eleven stops were hand-written in index.html with
   no way to reach them: the one coloured thing on the page with no entry in the
   tweak panel, which is why the panel's three groups never added up to the four
   fields you can see.

   FOUR COLOURS AND A PEAK OPACITY, which is exactly what those eleven stops carry
   between them -- the colour steps four times on the way out while the opacity
   falls away continuously. The ramp's SHAPE is kept as a table of ratios in
   expertise-halo.js, so `alpha` scales the whole thing without flattening it.

   These are the hero's own oranges, and that is not a coincidence -- they were
   copied from it by hand. Copied, though, not linked: changing the hero's palette
   has never moved these, and still does not. If the two should track each other
   that is a wiring job, not a value to set here.
   ========================================================================= */
const EXPERTISE = {
  core:  '#f5381a',   // the centre, hottest and most red
  warm:  '#f0421a',   // one step out
  mid:   '#eb501b',   // the body of the glow -- three stops share it
  tail:  '#e7521d',   // the long fade, six stops to transparent
  alpha: 0.494        // peak opacity at the centre; the ramp scales off this
};


/* ============================================================================
   PROOF FIELD — the green/aqua mass behind the Proof section.
   It used to be the Expertise halo, hidden at rest and revealed by the cursor.
   HP modules.png has no gradient in Expertise and a green one here, so the canvas
   moved and the numbers below moved with it: it is VISIBLE at rest now, sits
   low-left where the reference puts it, and is scaled for the Proof section's
   height rather than Expertise's. Same living-gradient machinery as the Hero and
   Work gradients, so all three behave alike.
   ========================================================================= */
const HALO = {
  dprMax: 1,
  /* Broad, not a glow. In the reference this mass covers most of the section's lower
     left and reaches more than half way across before it fades out -- it reads as the
     section's colour rather than as a light source in it. 0.62 against the 0.36 that
     read as "a small isolated glow". */
  scale:  0.74,
  /* LOCKED. Measured off hp_modules.png: the mass is centred low and off the left
     edge, so what the section shows is its upper-right quadrant fading to white
     toward the right. The cursor does not move this -- see followX/followY below. */
  offsetX: -0.90, offsetY: 0.34,

  colorSpread: 1.05, colorFalloff: 1.95,
  falloff: 1.05, edgeGain: 1.60, edgeShape: 2.10,
  paletteWash: 0.0,             // none at all. 0.180 measured out at saturation 0.16 and
                                // 0.045 at 0.21, against the reference's 0.30 -- this
                                // field is spread wide and blurred hard, and both of
                                // those already dilute it toward white, so there is no
                                // headroom left for a wash on top. The poles below are
                                // pitched ABOVE the reference's core for the same
                                // reason: what lands on 0.30 is the stack, not a pole.

  /* shapeRound 0.55 -> 0.85 and the warp roughly halved, to match the hero: the
     first rounds the pole LAYOUT, the second is the noise that dents the result.
     scale comes back 7.8% because stacking the poles saturates the field
     further out -- otherwise rounder would also mean bigger. */
  shapeWarpAmp: 0.07, shapeWarpFreq: 0.52, shapeWarpSpeed: 0.026,
  shapeDrift: 0.035, shapePeriodMul: 2.2, shapeRound: 0.85,

  colorWarpAmp: 0.22, colorWarpFreq: 0.48, colorWarpSpeed: 0.030,
  orbitAmp: 0.14, orbitPeriod: 62,

  radiusBreath: 0.16, radiusBreathPeriod: 54,
  brightBreath: 0.10, satBreath: 0.14, breathPeriod: 48,

  blurPx: 108, blurIterations: 3, blurBreath: 0.26, blurBreathPeriod: 70,   // 62 before: softer

  /* CURSOR: tone only. The mass does not move, lean or stretch -- all three are 0.
     What the pointer does instead is the shader's own local field response, the same
     one the Work gradient uses: a wide, edgeless region around the cursor whose
     colour balance shifts a little. curWarp is 0 too, so not even the colour regions
     bend; only their hue and richness move, and only within the mint/aqua the palette
     already holds. */
  followX: 0,        // was 0.66 -- the mass used to slide under the cursor
  followY: 0,        // was 0.30
  stretch: 0,        // was 0.30
  curRadius: 0.70,   // p-space, deliberately wide: no cursor-shaped edge anywhere
  curWarp:   0,      // no bending of the colour regions
  curSat:    0.22,   // a little more richness under the pointer
  curHue:   -7.0,    // degrees: a slight lean toward green, inside the aqua range
  curSpread: 0.10,   // a touch more coverage
  ease:    0.055,    // follow lag
  fade:    0.030,    // reveal / settle speed
  rest:    1.00,     // FULL. The field is the section's colour, so it is simply on and
                     // the cursor changes its tone, not its presence. It was 0.04 --
                     // because in Expertise it was a cursor reveal. Here it is simply
                     // the section's colour, so it is present without the pointer and
                     // the cursor only adds to it.

  /* A LADDER AROUND THE BASE, #289581 -- the same construction as the hero and work.
     The base is the darkest thing in this set at value 0.58, and this field is spread
     wide and blurred hard, so what the section actually shows is a long way up the
     ladder from it; the base is what the mass is MADE of rather than what any pixel
     reads as. */
  poles: [
    /* Weighted the OTHER way from Work's: the reference's teal is strongest right at
       the left edge (sat 0.46 at x=120) and gone by x=760, so the base carries three
       poles here and the tints stop well short of white. */
    { x:  0.02, y: -0.02, r: 0.30, color: '#b1fbec' },   // from the tweak panel
    { x: -0.26, y: -0.10, r: 0.31, color: '#289581' },   // THE BASE
    { x:  0.22, y: -0.14, r: 0.30, color: '#008f77' },   // from the tweak panel
    { x: -0.08, y:  0.18, r: 0.31, color: '#289581' },   // THE BASE (pole 3, unchanged)
    { x:  0.28, y:  0.14, r: 0.30, color: '#4ac4b0' },   // from the tweak panel
    { x: -0.22, y:  0.10, r: 0.29, color: '#197062' }   // from the tweak panel
  ]
};

/* ============================================================================
   SCHEMA — drives the live tweak panel (press T). Purely cosmetic; deleting a
   row here just hides that slider, it does not change the default.
   ========================================================================= */
const SCHEMA = [
  /* The three gradients' paleness, together and first, because the only way to
     judge one is against the other two. Each is `paletteWash`: how far that
     gradient's poles are mixed toward `bg` before anything is drawn, so it reads
     as opacity while leaving the palette alone. Deliberately NOT repeated inside
     the per-gradient groups below -- two sliders bound to one value would fall
     out of step with each other the moment either was dragged. */
  /* THE PANEL IS THE PALETTES ONLY.

     Each halo used to carry four or five more groups -- colour, shape, flow, cursor, and
     on the hero also wander, pointer lens, cursor smear, eclipse glow, circle and
     blur/grid. That was 18 groups and about 128 sliders, every one of them a live handle
     on a gradient that is now tuned. What is left is the thing still worth reaching for:
     the six pole colours per halo and an opacity.

     Nothing is lost. The values those sliders drove are all still in the objects above,
     named and commented, and editing one there does exactly what dragging its slider
     did. This removes the UI, not the control -- and git has the rows if a round of
     retuning wants them back. */
  /* ALL FOUR FIELDS IN ONE PLACE, so their strengths can be set against each other
     rather than by scrolling between groups -- which is the only reason to duplicate
     rows that also live in their own palettes below.

     THE FOURTH IS NOT THE SAME KIND OF NUMBER, and that is worth knowing before
     dragging it. The three WebGL fields expose paletteWash, which does not change
     opacity at all: it mixes the poles toward the page background, so the field gets
     paler without becoming more transparent. Expertise exposes alpha, the real peak
     opacity of its svg gradient -- the glow genuinely thins out and what is behind it
     shows through. They are grouped because they are the same CONTROL to a designer,
     not because they are the same mechanism. */
  ['Opacity \u00b7 all four fields', [
    ['blob.paletteWash',      0,    0.85, 0.005, 'hero (wash)'],
    ['featuredwork.paletteWash',      0,    0.85, 0.005, 'work (wash)'],
    ['expertise.alpha',       0,    1,    0.002, 'expertise (alpha)'],
    ['halo.paletteWash',      0,    0.85, 0.005, 'proof (wash)']
  ]],
  ['Hero halo \u00b7 palette', [
    ['poles.0.color', 'color', 'vermillion core'],
    ['poles.1.color', 'color', 'vermillion'],
    ['poles.2.color', 'color', 'mid orange'],
    ['poles.3.color', 'color', 'warm orange'],
    ['poles.4.color', 'color', 'cream tail'],
    ['poles.5.color', 'color', 'luminous orange'],
    ['bg',            'color', 'page background'],
    ['blob.paletteWash',      0,    0.85, 0.005, 'opacity']
  ]],
  ['Work halo \u00b7 palette', [
    ['featuredwork.poles.0.color', 'color', 'pale icy blue'],
    ['featuredwork.poles.1.color', 'color', 'turquoise'],
    ['featuredwork.poles.2.color', 'color', 'cyan blue'],
    ['featuredwork.poles.3.color', 'color', 'sky blue'],
    ['featuredwork.poles.4.color', 'color', 'medium blue'],
    ['featuredwork.poles.5.color', 'color', 'rich blue'],
    ['featuredwork.paletteWash',      0,    0.85, 0.005, 'opacity']
  ]],
  /* PROOF, not Expertise. The object is still called HALO and still routes through
     `halo.`, because it began life as the Expertise halo -- but the canvas moved to
     Proof (see the PROOF FIELD note above) and the label did not follow it. The six
     wells below tint the green mass behind the stats.

     The Expertise section's own glow is NOT here and never was: it is the orange radial
     in the loops' svg, drawn by expertise-halo.js off the gradient stops in the markup,
     with no entry in this panel. */
  /* The fourth field, and the first time it has been reachable. Not a WebGL blob:
     four colours and a peak opacity, written into the loops' svg gradient by
     expertise-halo.js. See the EXPERTISE object for what the four are. */
  ['Expertise glow \u00b7 palette', [
    ['expertise.core',  'color', 'core'],
    ['expertise.warm',  'color', 'warm'],
    ['expertise.mid',   'color', 'mid'],
    ['expertise.tail',  'color', 'tail'],
    ['expertise.alpha',      0,  1,  0.002, 'opacity']
  ]],
  ['Proof halo \u00b7 palette', [
    ['halo.poles.0.color', 'color', 'highlight'],
    ['halo.poles.1.color', 'color', 'pale aqua'],
    ['halo.poles.2.color', 'color', 'mint'],
    ['halo.poles.3.color', 'color', 'cyan green'],
    ['halo.poles.4.color', 'color', 'light aqua'],
    ['halo.poles.5.color', 'color', 'soft teal'],
    ['halo.paletteWash',      0,    0.85, 0.005, 'opacity']
  ]],
];
