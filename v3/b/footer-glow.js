/* ============================================================================
   FOOTER — the atmospheric gradient

   footer-gradient.jpg is a dark page with light swelling off an edge: two or three
   broad masses, additively lit, bleeding into each other, with the far side of the
   frame left flat black. Nothing in it has an edge. That is the whole brief, and it
   decides the technique. Here the lit edge is the footer's BOTTOM; option C runs the
   same gradient off its top instead.

   ------------------------------------------------------------------ how it is drawn
   Three radial masses, each one centred BELOW the footer's bottom edge, with a radius
   large enough that only their upper shoulders are inside the frame. You never see a
   circle because you never see the whole of one -- what reads is a rise. They are composited with 'lighter', so where two overlap the colours
   add the way light does rather than painting over one another.

   The canvas is rendered at 16% scale and blown up by CSS, with a blur on top.
   At that size a 1440-wide footer is ~230 pixels across, so a frame costs almost
   nothing and the upscale has already removed every hard edge before the blur is
   asked to do anything. The blur is there to finish the job, not to do it.

   Keeping the UPPER footer dark is NOT done here -- it is a mask in the CSS, so the
   rule that protects the headline's legibility sits next to the headline.

   ------------------------------------------------------------------- the colour
   ONE family at a time. The three masses share a single colour position, so the
   whole footer is orange, or blue, or green -- never a mix of all three. The only
   time two are on screen together is the handover, and even then it is brief.

   The colour is TIED TO THE HEADLINE, not to a clock of its own. footer-type.js
   dispatches pf:phrase on every word change and the family moves on every THIRD
   one, so "Build your campaign / platform / experience" is one colour and the next
   three words are the next. The two used to drift against each other -- the colour
   ran a 100-second loop while the line changed every four-odd seconds -- and the
   turn landed wherever it happened to land.

   Three swaps is roughly 13 seconds: a swap is a 2400ms hold plus 95ms a character
   plus up to 500ms of jitter, then the 820ms scroll. So a family now holds the
   footer for about that, against the 33 seconds it held before.

   What stops the handover being a flat dissolve is a small per-mass OFFSET. The
   three reach the new family about a second apart, so for a moment the near one has
   turned and the far one has not -- which is where the slight mix lives. It is a
   lead and a lag on one colour, not three colours running loose.

   --------------------------------------------------------------- and the cursor
   "Respond without feeling directly attached." Two things buy that:

     * the pointer is followed through a heavy lag (EASE), so the gradient is
       always arriving somewhere the cursor has already left
     * each mass only moves a FRACTION of the way toward it (PULL), and the
       fractions differ, so the group spreads toward the cursor instead of
       translating with it

   Neither one ever reaches the pointer, which is the point.
   ========================================================================= */
(function () {
  'use strict';

  const foot = document.getElementById('footer');
  if (!foot) return;
  const cv = foot.querySelector('.pf__glow');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  if (!ctx) return;

  /* The three families, as [core, light]. Taken from config.js rather than picked
     again by eye: these are the same values the hero and the two section halos
     use, so the footer is lit by the page's own palette. */
  const FAMILIES = [
    [[234,  82,  26], [255, 163, 133]],   // orange   #ea521a / #ffa385
    [[  5, 135, 193], [108, 204, 249]],   // blue     #0587c1 / #6cccf9
    [[ 40, 149, 129], [ 96, 240, 223]]    // green    #289581 / #60f0df
  ];

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
     (see PER_FAM below); only
     cOff differs, and only by a fraction of a step. */
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
  const PER_FAM = 3;         // word changes per colour family
  const XFADE   = 2.6;       // seconds the hand-over takes

  /* cOff above was a lead/lag in STEPS of the 1/0.030 = 33.3s clock this replaced,
     i.e. about +/-0.73s. The clock is gone but the lead/lag is the thing that stops
     the three masses turning over in lockstep, so it is kept at the same number of
     SECONDS -- hence the old step length surviving here as a conversion. */
  const OLD_STEP = 1 / 0.030;

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
  const ALPHA = 0.30;        // peak alpha of a mass at its centre

  /* ------------------------------------------------------------------ sizing */
  let W = 0, H = 0;
  function resize() {
    /* The CANVAS's rect, not the footer's: it deliberately overhangs on three sides
       so the blur's edge falloff lands outside .pf's clip (see .pf__glow in the CSS),
       and the drawing space has to be the box actually being painted. */
    const r = cv.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width  * SCALE));
    H = Math.max(1, Math.round(r.height * SCALE));
    if (cv.width !== W)  cv.width  = W;
    if (cv.height !== H) cv.height = H;
  }

  /* ----------------------------------------------------------------- pointer */
  /* Held in fractions of the canvas box. Starting at the centre-BOTTOM, where the
     masses live, means the first frame after a pointer appears is a nudge rather than
     a jump in from somewhere else. */
  let tx = 0.5, ty = 1.0;       // target
  let cx = 0.5, cy = 1.0;       // the lagged position actually used
  addEventListener('pointermove', ev => {
    const r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    tx = (ev.clientX - r.left) / r.width;
    ty = (ev.clientY - r.top)  / r.height;
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
  addEventListener('pf:phrase', () => {
    if (++swaps % PER_FAM) return;
    const t = performance.now() / 1000;
    fam   = Math.round(phaseAt(t, 0));
    famT0 = t;
  });

  /* Where blob b is in the orange -> blue -> green walk at time t, as a colour. */
  function colourAt(b, t, shade) {
    const f  = ((phaseAt(t, b.cOff * OLD_STEP) % 3) + 3) % 3;
    const i  = Math.floor(f);
    const k  = f - i;
    const m  = k;
    const a  = FAMILIES[i][shade];
    const bb = FAMILIES[(i + 1) % 3][shade];
    return [
      Math.round(a[0] + (bb[0] - a[0]) * m),
      Math.round(a[1] + (bb[1] - a[1]) * m),
      Math.round(a[2] + (bb[2] - a[2]) * m)
    ];
  }

  /* ------------------------------------------------------------------- frame */
  function draw(now) {
    const t = now / 1000;

    cx += (tx - cx) * EASE;
    cy += (ty - cy) * EASE;

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

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
      const x = (b.x + dx + (cx - (b.x + dx)) * b.pull)        * W;
      const y = (b.y + dy + (cy - (b.y + dy)) * b.pull * 0.45) * H;

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
      const r      = b.r * W * breath * (1 + 0.12 * near);

      /* STRETCH. The mass is drawn as an ellipse whose long axis turns, not as a
         disc: scale the context and the same radial gradient comes out elongated,
         with its falloff stretched with it so there is still no edge anywhere. The
         elongation itself breathes on a third unrelated clock, so a mass is a tongue
         at one moment and nearly round at another. */
      const e   = 1 + b.el * (0.60 * Math.sin(t * b.elSpd + b.rPh)
                            + 0.40 * Math.sin(t * b.elSpd * 0.41 + 2.4));
      const ang = t * b.aSpd + b.aPh
                + 0.35 * Math.sin(t * b.aSpd * 0.6 + b.dPh);   // the axis wanders too

      const core  = colourAt(b, t, 0);
      const light = colourAt(b, t, 1);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.scale(e, 1 / e);          // area-preserving, so stretching does not also brighten
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0.00, 'rgba(' + light.join(',') + ',' + ALPHA.toFixed(3) + ')');
      g.addColorStop(0.20, 'rgba(' + core.join(',')  + ',' + (ALPHA * 0.86).toFixed(3) + ')');
      g.addColorStop(0.50, 'rgba(' + core.join(',')  + ',' + (ALPHA * 0.48).toFixed(3) + ')');
      g.addColorStop(0.80, 'rgba(' + core.join(',')  + ',' + (ALPHA * 0.14).toFixed(3) + ')');
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
    const floorCol = colourAt(BLOBS[1], t, 0);
    const fl = ctx.createLinearGradient(0, H, 0, H * 0.72);
    fl.addColorStop(0.00, 'rgba(' + floorCol.join(',') + ',' + (ALPHA * 0.52).toFixed(3) + ')');
    fl.addColorStop(0.42, 'rgba(' + floorCol.join(',') + ',' + (ALPHA * 0.20).toFixed(3) + ')');
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

  /* Off-screen for most of a visit, like the headline -- same reasoning. */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      es.forEach(e => e.isIntersecting ? start() : stop());
    }, { threshold: 0.02 });
    io.observe(foot);
  } else {
    start();
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { resize(); if (!running) draw(performance.now()); });
  }
})();
