/* ============================================================================
   HERO — the atmospheric gradient

   THE FOOTER'S GRADIENT, ON A LIGHT FIELD. This file is footer-glow.js with two
   changes and nothing else: the compositing, and the alpha. Every number that makes
   the SHAPE of it -- three radial masses centred below the bottom edge so only their
   upper shoulders are in frame, each drifting on three unrelated sines, breathing on a
   fourth, stretching into tongues on a fifth, the deliberately non-harmonic clocks, the
   floor that fills the bottom corners -- is the footer's, untouched. Read that file for
   why any of them are what they are.

   THE COMPOSITING. The footer clears to transparent and draws with 'lighter' onto #222,
   so the masses ADD and read as light swelling off an edge. The hero is #f4f4f4, where
   adding light to a near-white field does nothing at all. So this paints the canvas
   WHITE and multiplies the masses into it, and the element itself multiplies onto the
   page: white becomes a no-op, every mass becomes a tint, and overlaps darken where the
   footer's overlaps brighten. The same gesture, inverted.

   THE ALPHA is the footer's 0.30 doubled.

   This file was briefly retuned into a travelling wave -- four phase-coupled masses on
   one shared clock, bigger and slower -- and that is deliberately gone: it is the
   footer's gradient that belongs here, not a variation on it. The wave is recoverable
   from this file's history if it is ever wanted back.

   It replaced the WebGL mesh gradient the hero opened with -- the orange aura. That is
   still in the codebase, behind blob.enabled in config.js.

   The colour walks on hero:phrase, which hero-type.js dispatches when the headline's
   keyword changes, exactly as the footer's walks on pf:phrase.
   ========================================================================= */
(function () {
  'use strict';

  const cv = document.querySelector('.hero-glow');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  if (!ctx) return;

  /* The three families, as [core, light] -- READ FROM CONFIG now, where they used to
     be three hard-coded rgb triples here. Same values, same page palette: orange, then
     Work's #0587c1, then Proof's #289581. Moving them is what puts the hero in the
     tweak panel, which it never was -- the panel's old hero rows drove CONFIG.blob, and
     that is switched off.

     Parsed through a one-entry cache rather than on every read: colourAt runs per mass
     per frame, and re-parsing six hex strings at that rate for the same answer would be
     work for nothing. The key is the config values themselves, so a change in the panel
     is picked up on the next frame and nothing else ever re-parses. */
  const FALLBACK = [
    [[234,  82,  26], [255, 163, 133]],
    [[  5, 135, 193], [108, 204, 249]],
    [[ 40, 149, 129], [ 96, 240, 223]]
  ];
  const hex2rgb = h => {
    const v = parseInt(String(h).replace('#', ''), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  };
  let famKey = '', famCache = FALLBACK;
  function families() {
    const G = (typeof HEROGLOW !== 'undefined') ? HEROGLOW : null;
    if (!G || !G.families || G.families.length !== 3) return FALLBACK;
    const key = G.families.map(f => f.core + f.light).join('');
    if (key !== famKey) {
      famKey = key;
      famCache = G.families.map(f => [hex2rgb(f.core), hex2rgb(f.light)]);
    }
    return famCache;
  }
  const alpha = () => {
    const G = (typeof HEROGLOW !== 'undefined') ? HEROGLOW : null;
    return (G && typeof G.alpha === 'number') ? G.alpha : 0.60;
  };

  /* x/y are fractions of the canvas box; y >= 1 is at or below its bottom edge, which
     is where all three sit. r is a fraction of the canvas's WIDTH, so the masses keep
     their proportions when the window changes.

     The two outer masses are pinned to the bottom CORNERS -- x 0.02 and 0.98, y on the
     edge itself rather than below it -- so the glow reaches both bottom edges instead
     of pooling in the middle. Their drift is cut to 0.05 so they stay there. The middle
     mass is pushed further under (y 1.26) and made smaller: it is what joins the two
     corners across the bottom, not a third source, which is what leaves the darker arc
     between them that footer-gradient.jpg has.

     The DRIFT speeds are deliberately not multiples of one another -- 0.055 /
     0.041 / 0.047 -- so no two masses ever come back into the same relationship and
     the movement has no period. The colour is shared and stepped by the headline
     (see PER_FAM below); only the
     per-mass lag differs, and that is re-rolled on every hand-over -- see rollOrder. */
  const BLOBS = [
    /* The two corner masses barely follow the cursor -- pull 0.12 and 0.10. They are
       what fills the bottom corners, and at the 0.26 they used to carry, a pointer on
       one side dragged the far one inward by 0.18 of the width and that corner went
       dark. The middle mass does the responding now, at 0.30. */
    /* ax/ay are the DRIFT range and rb is how far the mass swells and shrinks. Both are
       up substantially: in the reference the lit area swings between 21% and 100% of
       the frame, so the masses are not merely sliding -- they breathe, and that is most
       of what reads as fluid. Each has its own drift and breath clock, and none of the
       periods divide into another, so the three never fall into step.

       el / elSpd / aSpd are the new ones: how far a mass stretches out of round, how
       fast that elongation breathes, and how fast its long axis turns. They are what
       the morning-routine reference is made of -- its colour does not drift as discs,
       it elongates into tapering tongues that sweep and curl, and the dark between
       them is the gap those shapes leave rather than the space between circles. aSpd
       is signed, so the three do not all rotate the same way.

       The radii are ~10% larger than they were for a disc. Stretching is area-
       preserving -- scale(e, 1/e) -- so a mass keeps its total light, but its narrow
       axis drops below visibility sooner and the measured fill fell from 0.36 to 0.29.
       This puts it back: same amount of colour, now in moving shapes.

       The rates are ~4s on the leading drift term and ~8s on the breath, and the
       composite of three unrelated sines is a good deal slower than either. They began
       at a 90 second period, which measured out at a coverage swing of 0.01 and a
       centroid travelling 0.0034 of the frame per second -- 61x slower than the
       reference, which is not slow animation, it is a still image. This is still well
       short of the reference's pace; the brief asks for slow, not for that. The radii came down at the same time: at 0.68 of the width the masses
       covered the frame whatever they did, so there was nothing for the movement to
       show against. */
    { x: 0.02, y: 1.00, r: 0.575, pull: 0.12, cOff: -0.020, dSpd: 1.620, dPh: 0.0, ax: 0.230, ay: 0.150, rb: 0.34, rSpd: 0.760, rPh: 0.0, el: 0.62, elSpd: 0.430, aSpd:  0.185, aPh: 0.0 },
    { x: 0.50, y: 1.26, r: 0.490, pull: 0.30, cOff:  0.000, dSpd: 1.210, dPh: 2.3, ax: 0.360, ay: 0.210, rb: 0.42, rSpd: 0.560, rPh: 2.9, el: 0.78, elSpd: 0.310, aSpd: -0.145, aPh: 2.1 },
    { x: 0.98, y: 0.99, r: 0.555, pull: 0.10, cOff:  0.022, dSpd: 1.390, dPh: 4.1, ax: 0.230, ay: 0.150, rb: 0.30, rSpd: 0.670, rPh: 5.2, el: 0.58, elSpd: 0.370, aSpd:  0.215, aPh: 4.4 }
  ];

  /* The colour steps with the headline rather than on a clock of its own: the family
     advances on every PER_FAM-th pf:phrase, and the hand-over takes XFADE seconds. */
  /* How far the masses are lifted toward the viewport's centre below 1024 -- see the
     note in the draw loop. 0 above it: desktop already arrives where it should. */
  const Y_LIFT_K = 0.355;
  const yLift = () => (window.innerWidth <= 1023 && RH
                         ? Math.max(0, 0.5 - Y_LIFT_K * (RW / RH))
                         : 0);

  const PER_FAM = 3;         // word changes per colour family
  const XFADE   = 2.6;       // seconds the hand-over takes

  /* cOff above was a lead/lag in STEPS of the 1/0.030 = 33.3s clock this replaced,
     i.e. about +/-0.73s. The clock is gone but the lead/lag is the thing that stops
     the three masses turning over in lockstep, so it is kept at the same number of
     SECONDS -- hence the old step length surviving here as a conversion. It is only
     the opening value now; see rollOrder below. */
  const OLD_STEP = 1 / 0.030;

  /* ---- which mass turns first, and how far behind the others follow -------------
     cOff was a FIXED lead per mass -- -0.020 / 0.000 / +0.022, which is -0.67 / 0 /
     +0.73 seconds -- and the three masses sit left, middle, right. A constant lead in
     that order means the right-hand mass always went first and the change always swept
     the same way across the hero. Three sources turning over is a lot of what the
     gradient has to look at, and doing it identically every time is the one thing that
     makes it read as a mechanism.

     So the order is RE-ROLLED on every hand-over: the three are shuffled, the first one
     starts at once and the other two trail by a jittered amount. Which corner goes
     first, and whether the other two arrive close together or strung out, is different
     every time.

     All lags, never leads. A positive lead means e = (t - famT0) + lead is already
     above zero on the hand-over's first frame, so that mass JUMPS straight to
     smooth(lead / XFADE) of the new colour -- 21% of the way, at the old +0.73. Lags
     start every mass at the colour it was already showing, so there is nothing to pop.

     The total spread is held near the old 1.4s so the hand-over still reads as one
     movement rather than three separate changes. */
  const LAG_MIN  = 0.18;     // seconds: the closest two masses may turn
  const LAG_STEP = 0.50;     // ... and the most that gets added on top, per mass
  function rollOrder() {
    const order = [0, 1, 2];
    for (let i = 2; i > 0; i--) {                 // Fisher-Yates, so all six orders are equally likely
      const j = (Math.random() * (i + 1)) | 0;
      const tmp = order[i]; order[i] = order[j]; order[j] = tmp;
    }
    let lag = 0;
    order.forEach((bi, n) => {
      if (n) lag += LAG_MIN + Math.random() * LAG_STEP;
      BLOBS[bi].lead = -lag;
    });
  }
  /* The opening values, from cOff, so the very first frames match what they always did.
     Nothing uses them: the first hand-over re-rolls before it starts. */
  BLOBS.forEach(b => { b.lead = b.cOff * OLD_STEP; });

  let fam   = 0;             // the family the current hand-over starts from
  let famT0 = Infinity;      // when it started, in seconds. Infinity = resting on `fam`
  let swaps = 0;             // pf:phrase events seen

  const SCALE = 0.16;        // render resolution, as a fraction of layout size
  const EASE  = 0.028;       // pointer lag per frame -- deliberately very slow
  /* "Vivider" is SATURATION, not luminance, and on 'lighter' those pull opposite
     ways: three masses now carry one family, so raising the alpha just stacks three
     copies of the same colour until the sum clips and the footer goes white. Measured
     at 0.62 it did exactly that.

     So the alpha stays near where it was -- 0.46 against 0.44 -- and the VIVIDNESS
     comes from the stops below, which hold the saturated core colour out to 0.50 of
     the radius instead of letting it wash toward nothing by 0.32. More colour over
     more of each mass, the same amount of light. */
  /* 0.30, down from 0.46. The brief is that the MOVEMENT should be more noticeable
     than the amount of colour -- so the fill comes down and the drift and breath go up.
     More of the dark field stays dark, and what you notice is the shapes moving
     through it rather than how much of it is lit. */
  /* 0.60 -- the footer's 0.30, doubled, and the ONE number here that is not the
     footer's. It can take it where the footer could not: on 'lighter' over #222 three
     masses carrying one family stack until the sum clips and the field goes white,
     which the note above measures. Multiplying into a white canvas has no such ceiling
     -- overlaps simply darken toward the colour -- and the mask keeps all of it in the
     bottom half of the viewport where there is no type to fight. */
  /* The peak alpha of a mass is live from config now -- see families() above. */

  /* ------------------------------------------------------------------ sizing */
  /* TWO BOXES, AND THEY ARE NOT THE SAME BOX ANY MORE.

     W/H are the BITMAP -- the element's whole rect, bleed and all, which is what has to
     be painted. RW/RH are the REFERENCE the drawing is solved against: the viewport plus
     BLEED_REF on every side, which is the box every constant in this file was tuned in.
     OX/OY place the reference inside the bitmap.

     They used to be one and the same, and that is what made the bleed untouchable. Every
     position here is a fraction of the box (`b.x * W`) and every radius a fraction of its
     width, and the notes below solve their constants against "the viewport plus 80 of
     bleed on every side, so its own centre IS the viewport's centre". Widening the bleed
     to give the blur more room therefore slid the whole field down and out of view --
     measured in Chrome, the bottom of the hero went 17 to 20 levels lighter.

     Split in two, the bleed is just padding again: the drawing lands in the same place at
     any bleed, and the CSS is free to give blur(44px) the ~132px of neighbourhood it
     actually samples. Which is the bug: at 80 the blur ran off its own content and mixed
     the gradient with transparency, and WebKit shows that where Blink hides it -- the
     hero's orange washed out over the bottom of the screen in desktop Safari, mobile
     Safari and iOS Chrome. Bisected in Safari: with the blur removed it fills to the
     corner, with the mask, the blend or either canvas removed it still fades.

     BLEED_REF IS A CONSTANT, NOT A READING. It is the geometry the numbers in this file
     were derived in, so it stays 80 whatever the stylesheet does. */
  const BLEED_REF = 80;

  let W = 0, H = 0;      // the bitmap
  let RW = 0, RH = 0;    // the reference box the drawing is solved in
  let OX = 0, OY = 0;    // where the reference sits inside the bitmap
  function resize() {
    /* The CANVAS's rect, not the footer's: it deliberately overhangs on three sides
       so the blur's edge falloff lands outside .pf's clip (see .pf__glow in the CSS),
       and the drawing space has to be the box actually being painted. */
    const r = cv.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width  * SCALE));
    H = Math.max(1, Math.round(r.height * SCALE));
    if (cv.width !== W)  cv.width  = W;
    if (cv.height !== H) cv.height = H;
    RW = Math.max(1, (window.innerWidth  + 2 * BLEED_REF) * SCALE);
    RH = Math.max(1, (window.innerHeight + 2 * BLEED_REF) * SCALE);
    OX = (W - RW) / 2;
    OY = (H - RH) / 2;
  }

  /* ----------------------------------------------------------------- pointer */
  /* Held in fractions of the canvas box. Starting at the centre-BOTTOM, where the
     masses live, means the first frame after a pointer appears is a nudge rather than
     a jump in from somewhere else. */
  let tx = 0.5, ty = 1.0;       // target
  let cx = 0.5, cy = 1.0;       // the lagged position actually used

  /* ---- the pointer's second, faster lag, for COLOUR only ------------------------
     The masses track the cursor at EASE 0.028, which is about four seconds to arrive.
     That slowness is deliberate -- it is what stops the field sliding about under the
     mouse -- but a colour change at that rate is not a reaction, it is a drift you
     never connect to anything you did. So the TONE gets a lag of its own, three and a
     half times faster, and the positions keep theirs.

     amp is the engagement. It is 0 until the pointer has actually moved and then eases
     up, so a page nobody has touched looks exactly as it did before any of this: the
     resting state is the designed one, and the reaction is something added on top. */
  let ccx = 0.5, ccy = 1.0;
  let amp = 0, ampT = 0;

  const EASE_C  = 0.10;         // colour's pointer lag per frame
  const TINT    = 0.34;         // family-steps a mass is pushed along, under the cursor
  const LIFT    = 0.38;         // how far toward its own LIGHT shade it is lifted
  const REACH_C = 1.9;          // falloff: 1 / the half-width of the reaction, in canvas fractions

  addEventListener('pointermove', ev => {
    const r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    tx = (ev.clientX - r.left) / r.width;
    ty = (ev.clientY - r.top)  / r.height;
    ampT = 1;
  }, { passive: true });

  /* -------------------------------------------------------------- the colour */
  const smooth = t => t * t * (3 - 2 * t);

  /* Where the walk has got to at time t, for a mass carrying `lead` seconds of
     lead (+) or lag (-). Rests on an integer between hand-overs, and crosses to the
     next one over XFADE when the headline moves it on. */
  function phaseAt(t, lead) {
    const e = (t - famT0) + lead;
    return fam + (e <= 0 ? 0 : e >= XFADE ? 1 : smooth(e / XFADE));
  }

  /* Every third word change moves the colour on. `fam` is re-read from the walk's
     own position rather than just incremented, so the first change starts from 0
     without a special case, and a change arriving mid-hand-over -- which the timings
     make very unlikely, the shortest gap between swaps being about 3.2s against a
     2.6s fade plus 0.73s of lag -- resolves to whichever family it is nearest
     instead of leaving the colour stranded between two. */
  addEventListener('hero:phrase', () => {
    if (++swaps % PER_FAM) return;
    const t = performance.now() / 1000;
    fam   = Math.round(phaseAt(t, 0));
    famT0 = t;
    /* BEFORE the fade, not during it: the leads decide where this hand-over starts, and
       re-rolling them mid-fade would teleport a mass that is already part way across.
       fam is read with lead 0, above, so the roll cannot disturb it either. */
    rollOrder();
  });

  /* Where blob b is in the orange -> blue -> green walk at time t, as a colour.

     tint and lift are the pointer's two handles on it, and they are deliberately
     different KINDS of change:

       tint  pushes this mass further along the walk -- a fraction of a family step, so
             the hue moves toward the next colour in the cycle. It is the same axis the
             headline already drives, which is why it never produces a colour that is
             not in the palette: at 0.34 the mass is a third of the way to the next
             family, no further.

       lift  blends toward the SAME walk position in the light shade. The hue is
             untouched; what changes is how high in the family it sits. This is the one
             that reads as the field brightening under the cursor rather than changing
             colour, and the two together are what "tone" means here.

     Both default to 0, so a call without them is exactly the old function. */
  function colourAt(b, t, shade, tint, lift) {
    const f  = ((phaseAt(t, b.lead) + (tint || 0)) % 3 + 3) % 3;
    const i  = Math.floor(f);
    const m  = f - i;
    const mix = sh => {
      const F = families();
      const a = F[i][sh], bb = F[(i + 1) % 3][sh];
      return [a[0] + (bb[0] - a[0]) * m,
              a[1] + (bb[1] - a[1]) * m,
              a[2] + (bb[2] - a[2]) * m];
    };
    const c = mix(shade);
    if (lift) { const l = mix(1); for (let k = 0; k < 3; k++) c[k] += (l[k] - c[k]) * lift; }
    return [Math.round(c[0]), Math.round(c[1]), Math.round(c[2])];
  }

  /* ------------------------------------------------------------------- frame */
  function draw(now) {
    const t = now / 1000;

    cx += (tx - cx) * EASE;
    cy += (ty - cy) * EASE;

    ccx += (tx - ccx) * EASE_C;
    ccy += (ty - ccy) * EASE_C;
    amp += (ampT - amp) * EASE_C;
    /* Clamped because pointermove is on the WINDOW: the cursor is reported wherever it
       is on the page, which is well outside 0..1 once it has left the hero. */
    const py = Math.min(1, Math.max(0, ccy));
    /* How strongly the pointer reaches a mass sitting at fraction bx. x only, for the
       reason the radius term gives below -- the masses all sit on or under the bottom
       edge, so a y distance is dominated by that and tells you almost nothing. The y
       term is a gentle overall gain instead: full down at the masses, 0.55 at the top
       of the hero, so moving up and down still does something. */
    const reach = bx => amp * Math.max(0, 1 - Math.abs(ccx - bx) * REACH_C) * (0.55 + 0.45 * py);

    /* WHITE, then multiply -- the inversion of the footer's clear-then-'lighter'.
       The element multiplies onto the page, so white is a no-op and only the masses
       tint; where two overlap they darken, which is what 'lighter' does for light on
       a dark field. Everything downstream of here is the footer's, untouched. */
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'multiply';

    for (const b of BLOBS) {
      /* THREE sines per axis at unrelated rates, not two. With two the path closes on
         itself often enough to read as a wobble; a third, much slower term keeps it
         wandering. The x and y terms share no frequency either, so the mass traces
         loops rather than sliding along a line. */
      const p  = t * b.dSpd + b.dPh;
      const dx = b.ax * (0.46 * Math.sin(p * 1.00)
                       + 0.31 * Math.sin(p * 0.43 + 1.7)
                       + 0.23 * Math.sin(p * 0.19 + 3.1));
      const dy = b.ay * (0.44 * Math.sin(p * 0.71 + 0.9)
                       + 0.33 * Math.sin(p * 0.31)
                       + 0.23 * Math.sin(p * 0.13 + 2.2));

      /* A fraction of the way toward the lagged pointer, different per mass, so
         the group opens out toward it instead of sliding with it. The vertical
         pull is halved again: the masses belong to the bottom edge, and letting the
         cursor lift them off it would break the rise. */
      /* LIFTED, in the stacked layout only. The three masses sit on or below the
         canvas's bottom edge and their radii are fractions of its WIDTH, so how far
         up the field reaches is set by the width while the thing it has to reach --
         the viewport's middle -- is set by the height. On a 1440 x 1000 window those
         agree and the field arrives just above centre; narrow the window and it falls
         away fast. Measured: the top of the field landed at 469 of 1000 at 1440 (the
         look this matches), 675 at 900 and 668 of 812 on a phone.

         The canvas is the viewport plus 80 of bleed on every side, so its own centre
         IS the viewport's centre and the target is simply 0.5. A mass at the bottom
         edge reaches 1 - K * W/H, which leaves 0.5 - K * W/H to make up -- the lift
         below. It is computed rather than tabulated because the shortfall depends on
         the window's PROPORTIONS, not on which breakpoint it falls in: two phones of
         the same width and different heights need different lifts. K is solved from the field
         itself: at 0.40 the top landed 44 short of centre at 768-1023 and 25 short at
         375, and the correction those imply agrees to three places -- 0.3585, 0.3533,
         0.3526 -- so 0.355. */
      const x = (b.x + dx + (cx - (b.x + dx)) * b.pull)        * RW + OX;
      const y = (b.y + dy + (cy - (b.y + dy)) * b.pull * 0.45 - yLift()) * RH + OY;

      /* The mass BREATHES -- its radius swells and shrinks on a clock of its own, far
         slower than its drift. This is the term that makes the field read as fluid
         rather than as three circles being moved around: the lit area grows and
         recedes, which is what the reference does.

         The cursor's contribution rides the same radius, so there is no separate
         "interactive" state to switch into -- the pointer simply adds a little to a
         number that is already moving. Distance is measured in x only, because y is
         dominated by the masses all sitting off the edge and would swamp the signal. */
      const q      = t * b.rSpd + b.rPh;
      const breath = 1 + b.rb * (0.62 * Math.sin(q) + 0.38 * Math.sin(q * 0.37 + 1.1));
      const near   = Math.max(0, 1 - Math.abs(cx - b.x) * 2.2);
      const r      = b.r * RW * breath * (1 + 0.12 * near);

      /* STRETCH. The mass is drawn as an ellipse whose long axis turns, not as a
         disc: scale the context and the same radial gradient comes out elongated,
         with its falloff stretched with it so there is still no edge anywhere. The
         elongation itself breathes on a third unrelated clock, so a mass is a tongue
         at one moment and nearly round at another. */
      const e   = 1 + b.el * (0.60 * Math.sin(t * b.elSpd + b.rPh)
                            + 0.40 * Math.sin(t * b.elSpd * 0.41 + 2.4));
      const ang = t * b.aSpd + b.aPh
                + 0.35 * Math.sin(t * b.aSpd * 0.6 + b.dPh);   // the axis wanders too

      const nearC = reach(b.x);
      const core  = colourAt(b, t, 0, nearC * TINT, nearC * LIFT);
      const light = colourAt(b, t, 1, nearC * TINT, 0);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.scale(e, 1 / e);          // area-preserving, so stretching does not also brighten
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0.00, 'rgba(' + light.join(',') + ',' + alpha().toFixed(3) + ')');
      g.addColorStop(0.20, 'rgba(' + core.join(',')  + ',' + (alpha() * 0.86).toFixed(3) + ')');
      g.addColorStop(0.50, 'rgba(' + core.join(',')  + ',' + (alpha() * 0.48).toFixed(3) + ')');
      g.addColorStop(0.80, 'rgba(' + core.join(',')  + ',' + (alpha() * 0.14).toFixed(3) + ')');
      g.addColorStop(1.00, 'rgba(' + core.join(',')  + ',0)');
      ctx.fillStyle = g;
      /* the fill has to cover the canvas in the TRANSFORMED space */
      const span = (W + H) * Math.max(e, 1 / e);
      ctx.fillRect(-span, -span, span * 2, span * 2);
      ctx.restore();
    }

    /* ---- the floor ----------------------------------------------------------
       The masses are centred below the bottom edge, so the bottom CORNERS sit past
       their falloff and stay dark however large the masses are: from (0.02, 1.00) the
       far corner is 0.98 away against a radius of 0.66. Widening them to reach would
       also push them up into the middle of the footer, which is the one place that has
       to stay dark.

       So the bottom edge gets its own term instead -- a linear wash in the current
       colour, full along the edge and gone by about half way up. It is flat left to
       right, so it fills the corners by construction rather than by any mass happening
       to reach them. */
    /* The floor reacts too, at a softer lift: it is a flat wash across the whole bottom
       edge, so the full 0.38 there reads as the page getting brighter rather than as the
       cursor doing something. The hue follows at full strength. */
    const fNear    = reach(BLOBS[1].x);
    const floorCol = colourAt(BLOBS[1], t, 0, fNear * TINT, fNear * LIFT * 0.6);
    const fl = ctx.createLinearGradient(0, OY + RH, 0, OY + RH * 0.72);
    fl.addColorStop(0.00, 'rgba(' + floorCol.join(',') + ',' + (alpha() * 0.52).toFixed(3) + ')');
    fl.addColorStop(0.42, 'rgba(' + floorCol.join(',') + ',' + (alpha() * 0.20).toFixed(3) + ')');
    fl.addColorStop(1.00, 'rgba(' + floorCol.join(',') + ',0)');
    ctx.fillStyle = fl;
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'source-over';
  }

  /* ------------------------------------------------------------------- drive */
  let raf = 0, running = false;
  function tick(now) { raf = 0; if (!running) return; draw(now); raf = requestAnimationFrame(tick); }

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  function start() {
    if (running) return;
    running = true;
    resize();
    if (reduced.matches) { draw(performance.now()); running = false; return; }  // one still frame
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  addEventListener('resize', () => { resize(); if (!running) draw(performance.now()); });

  /* Gated on .hero-space, NOT on the canvas -- the same trap hero-type.js has to avoid.
     The canvas is position:fixed and so intersects the viewport for the entire life of
     the page; an observer on it would never fire and this would go on drawing under the
     Work section and all the way down to the footer, where the footer's own glow is
     already running. .hero-space is the in-flow 100vh spacer the hero is pinned over,
     so it leaves the viewport exactly when the hero has been scrolled past. */
  const spacer = document.querySelector('.hero-space');
  if (spacer && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      es.forEach(e => e.isIntersecting ? start() : stop());
    }, { threshold: 0 });
    io.observe(spacer);
  } else {
    start();
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { resize(); if (!running) draw(performance.now()); });
  }
})();
