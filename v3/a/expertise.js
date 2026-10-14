/* ============================================================================
   EXPERTISE SECTION
     - the #f4f4f4 surface that swells up over the Work gradient
     - copy reveal, then the circle graphic, then the expertise area labels
   ========================================================================= */
(function () {
  'use strict';

  const section = document.getElementById('expertise');
  if (!section) return;

  const cover = section.querySelector('.cover');
  const circles = [...section.querySelectorAll('.cc')];
  const CAPTURE = /[?&]top=1/.test(location.search) && !/[?&]anim=1/.test(location.search);

  /* ------------------------------------------------------------ cover scroll */
  /* Only the radius changes. The centre is pinned, so this reads as one large
     circular surface swelling up over the Work section rather than a panel
     sliding in — and the curved edge stays visible the whole way. */
  const COVER_FROM = 0.26;   // radius at the start of the transition
  /* The growth distance, and the trigger below it, are a PAIR -- they are what keeps
     the arc off both the Expertise header on the way down and the logo ticker on the
     way up, and neither constraint can be satisfied by moving the trigger alone.

     The arc has to pass the ticker at some point: it rises through the ticker's band
     at around scale 0.86 whatever the timing is. The only question is whether the
     ticker is still on screen when it does. Pushing the trigger later to clear the
     header pushes that crossing later too, and straight into view. Measured across
     both constraints at once -- worst arc-vs-eyebrow scrolling down, worst
     arc-vs-ticker scrolling up, negative meaning clear:

       PX  900 / AT 0.90   header -100   ticker  +31     crosses the ticker
       PX 1300 / AT 1.00   header   -9   ticker  -25     clears, by nothing
       PX 1500 / AT 1.15   header  -48   ticker  -34
       PX 1600 / AT 1.20   header  -48   ticker  -52     <- this
       PX 1800 / AT 1.30   header  -49   ticker  -84     same margin, slower still

     A LONGER growth is what opens the window: it spreads the two crossings further
     apart in scroll, so there is room to clear one without running into the other.
     The trigger then moves early enough to keep the header clear. The circle starts
     opening sooner than it did, at a scale of 0.26 where it is barely a shape, and
     reaches full bleed about 450px of scroll later than before. */
  const COVER_PX   = 1600;    // scroll distance the growth takes
  /* The trigger is the logo ticker — the last piece of Work content — reaching the
     top third of the viewport. Keying off the element rather than off a viewport
     fraction means the Work content and the blue gradient are guaranteed to have
     had their run before anything white starts moving, and it stays true if the
     Work section is ever re-laid-out. Lowering this number starts the transition
     later and leaves the blue gradient on screen for longer. */
  /* Growth begins when the ticker's top reaches 0.90 of the way down the viewport --
     just after the ticker has appeared. It used to be the viewport's MIDDLE, and that
     was too late: measured by stepping the scroll, the Expertise eyebrow came onto the
     screen while the cover was still at scale 0.28, so the arc swept up across the
     section header for most of a screen.

     0.90 is the latest value with real margin. Swept against the worst moment -- the
     eyebrow arriving at scrollY 1675 -- the arc sits this far from it:

       0.50  +229   the arc is BELOW the eyebrow: it cuts across the header
       0.70   +91   still crossing
       0.80   -10   breakeven, touching
       0.90  -121   clear
       1.00  -235   clear, but the circle opens noticeably earlier

     This is not only a pacing choice -- it is what keeps the circle reading as an arc.
     The circle's widest point is its centre, and above that centre the shape only ever
     widens as it goes down, which is the upward arc we want; below it the sides close
     back in and it reads as a disc floating in the blue. So the circle has to be
     full-bleed BEFORE its centre arrives, and starting earlier buys exactly that. */
    const COVER_AT = 1.20;     // fraction of the viewport the ticker's top must reach
  const COVER_OFFSET = 0;    // design units of extra scroll before anything moves
  /* How far below the fold the section's top still is when the expansion begins,
     as a fraction of the viewport. At 0 it starts the moment the section edge
     appears; this starts it that much earlier, so the circle is already opening
     while you are still reading the Work cards. The growth distance is
     unchanged — only the start point moves. */
  const COVER_LEAD = 0.12;
  const COVER_TOP  = -400;   // the element's top offset, in design units (matches the CSS)
  const COVER_R    = 1146;   // its radius at scale 1, in design units

  let coverage = 0;          // how much of the viewport the cover now fills, 0..1

  function unit() {
    return parseFloat(getComputedStyle(document.documentElement)
             .getPropertyValue('--u')) || 1;
  }

  const ticker = document.querySelector('.ticker');

  function coverStep() {
    if (!cover) return;
    const r = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const u = unit();
    // Progress is measured from the moment the ticker's top crosses COVER_AT of the
    // viewport. Falls back to the section edge only if the ticker is missing.
    const from = ticker
      ? vh * COVER_AT - COVER_OFFSET * u - ticker.getBoundingClientRect().top
      : vh * (1 + COVER_LEAD) - r.top;
    const p = Math.max(0, Math.min(1, from / COVER_PX));
    const e = p * p * (3 - 2 * p);
    const s = COVER_FROM + (1 - COVER_FROM) * e;
    cover.style.setProperty('--cover-s', s.toFixed(4));

    // Where the circle's top arc actually is on screen. This — not "the section
    // has entered the viewport" — is what the first reveal waits for.
    const centreY = r.top + (COVER_TOP + COVER_R) * u;
    const apex    = centreY - COVER_R * u * s;
    coverage = Math.max(0, Math.min(1, (vh - apex) / vh));
  }

  /* ----------------------------------------------------------- loop graphic */
  /* Not four circles in a row. Four LOOPS, every one tangent to the same vertical line
     at x 720 — the centre grid line — each an ellipse of identical height anchored on
     that axis so that its centre sits exactly one semi-width out from it:

         centre = AXIS + side * rx      =>  the loop's near edge is always ON the axis

     That single identity is the whole construction. Because every loop touches the line
     at one point and nowhere else, the middle reads as a pinch where all four converge
     rather than as a Venn overlap.

     The widths come straight off the grid in work-expertise.png, whose lines fall at
     40 / 380 / 720 / 1060 / 1400. Each loop's FAR edge lands on one of them:

         40 -> 720   rx 340      380 -> 720   rx 170
        720 -> 1060  rx 170     720 -> 1400   rx 340

     so the narrow pair nests inside the wide pair and every extreme of the graphic is
     on a grid line. It also makes the entrance almost free: rx goes from nothing to
     full and the centre follows it off the axis, so at rx 0 all four collapse onto the
     same vertical line and the system opens straight out of it — anchored the whole
     way, growing only horizontally, never sliding. */
  /* 805.2, 65 above where it was. The band used to be parked under the header's CTA --
     top edge 530.2 against a CTA bottom of 506.2 -- which read as the graphic waiting its
     turn. The arc's apex is now 465.2: clear of the body copy (375.2 -> 435.2), and level
     with the top of the CTA pill (467.2) rather than crossing it. The loops are hairlines
     at 15% ink and only the centre of the arc comes anywhere near, so the pill still reads
     clean. The expertise area row is centred on this, and the section's height follows. */
  /* The band's centre. It has moved a good deal -- it began 10 above where the other two
     options put it, and this option was always the one where the heading and the graphic
     OVERLAP, walked back and forth across that line a dozen times. The CTA at the foot of
     the graphic rather than in the header is the other thing that came out of those
     rounds. Lower this number to put the loops further into the copy.

     The two options it was compared against are gone -- they are in _archive/2026-10-14 if any
     of that comparison is ever wanted again.

     It costs nothing in legibility -- the loops are hairlines at 15% ink and only the
     very top of the arc is anywhere near the text -- and the section keeps its shape,
     because everything that hangs off this number moves with it: the capability row is
     centred on the band, and the section's height comes down by the same 75 so the tail
     under the graphic is the 99 it has always been. */
  const CY   = 700.2;       // the band's centre
  const AXIS = 720;       // the central vertical line, and the centre grid line
  /* 340, matching the outer loops' rx exactly, so those two are true 1:1 circles.
     Every loop shares this half-height, so the inner pair stands exactly as tall as
     the outer pair — only their width differs.

     The band was taken to 90% and then 95% (ry 306, then 323) and brought back. Only
     ry was ever scaled, because rx is what registers the graphic to the page -- every
     loop's far edge lands on a grid line, 40 / 380 / 1060 / 1400 -- and the cost was
     that the outer pair stopped being circles. At full height there is no trade:
     rx == ry on the outer pair AND every far edge lands on a line. */
  const RY   = 340;       // shared half-height

  /* In document order, which is also left-to-right order and so opening order. */
  const LOOPS = [
    { side: -1, rx: 340 },   //  40 -> 720
    { side: -1, rx: 170 },   // 380 -> 720
    { side:  1, rx: 170 },   // 720 -> 1060
    { side:  1, rx: 340 }    // 720 -> 1400
  ];
  const HAIRLINE = 0.75;  // rx 0 disables rendering of an SVG ellipse, so keep a sliver

  /* One stroke per loop. Hover just takes it from 15% to 30% of #222 — twice the
     weight — and fades the other three expertise areas' copy back, so the loop and the
     words that belong to it read as a single selection. */
  const REST_INK = 'rgba(34,34,34,.15)';   // the only ink: there is no hover state

  const OPEN_AT = 0.3;      // how much of its opening a loop takes to reach full weight

  const HOLD    = 140;    // the seed line registers before anything opens
  const DUR     = 560;    // one loop's own opening
  /* Well under DUR, so a loop is barely a quarter of the way out when the next is pulled
     off it and the four overlap into one continuous unfolding rather than four events. */
  const STAGGER = 175;
  const TOTAL   = HOLD + STAGGER * 3 + DUR;   // 1225ms end to end

  /* A expertise area's copy comes in halfway through its own loop's opening, which puts the
     four on the same left-to-right cascade as the loops: 255 / 430 / 605 / 780ms. */
  const AREA_AT = 0.5;

  const smooth = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);

  /* Smoothstep, not a cubic ease-out. A pure ease-out starts at maximum velocity, so
     every loop looked FIRED from the centre — the opposite of being pulled. Smoothstep
     leaves zero velocity at both ends: a loop is tugged into motion, runs quickest in the
     middle and settles soft into its final width. Monotonic and bounded by construction,
     so nothing can overshoot or bounce. */

  /* How far a loop has opened at the moment the next one is pulled off it. This is the
     one number that makes the chain join seamlessly, so it is derived from the timing
     rather than guessed: the next loop is released STAGGER ms into a DUR-long opening. */
  const LINK = smooth(STAGGER / DUR);

  /* Where each loop's half-width STARTS.

     Loop 0 starts collapsed on the axis — it is the seed, and the whole graphic unfolds
     out of it. Every loop after it is born on the line of the one before, so nothing ever
     expands independently out of the centre:

       loop 1 opens the same way as loop 0, so it starts at loop 0's width at that exact
              instant (LOOPS[0].rx * LINK) — the two outlines are coincident at release
              and then separate, loop 0 racing on out while loop 1 settles short of it;
       loop 2 opens the other way, so it cannot be coincident with loop 1 anywhere except
              the axis — which is precisely where loop 1 (and loop 0) touch, so that is
              where it is born;
       loop 3 opens the same way as loop 2, so it inherits loop 2's width in turn.

     Because the inherited width is exactly the predecessor's live width, the hand-off is
     invisible: a second line appears on top of an existing one and peels away from it. */
  const START_RX = [
    0,
    LOOPS[0].rx * LINK,
    0,
    LOOPS[2].rx * LINK
  ];

  const areaEls   = [...section.querySelectorAll('.area')];
  const areaMasks = areaEls.map(el => [...el.querySelectorAll('.mask')]);

  // how far loop i has opened, 0..1, at e ms into the entrance
  const progress = (i, e) => smooth((e - HOLD - i * STAGGER) / DUR);

  // the centre of loop i, which is wherever its current half-width puts it
  const centreOf = (i, rx) => AXIS + LOOPS[i].side * rx;

  /* Geometry is set straight on the ellipse — cx/cy/rx/ry — rather than via a group
     transform. Transforms on SVG groups proved unreliable here, and animating rx keeps
     the stroke a constant 1px however wide the loop gets. */
  function placeLoops(ps) {
    circles.forEach((g, i) => {
      const el = g.querySelector('.wire');
      if (!el) return;
      const rx = Math.max(HAIRLINE, START_RX[i] + (LOOPS[i].rx - START_RX[i]) * ps[i]);
      el.setAttribute('rx', rx.toFixed(2));
      el.setAttribute('ry', String(RY));
      el.setAttribute('cx', centreOf(i, rx).toFixed(2));   // near edge stays on the axis
      el.setAttribute('cy', String(CY));
      /* The seed is drawn from the first frame; every other loop fades up over the start
         of its own opening. That fade is invisible, because at that point it is sitting
         exactly on top of the line it was pulled from. */
      el.style.opacity = i === 0 ? '1' : smooth(ps[i] / OPEN_AT).toFixed(3);
    });
  }

  function revealAreas(ps) {
    areaMasks.forEach((ms, i) => {
      if (ps[i] > AREA_AT) ms.forEach(m => m.classList.remove('pre'));
    });
  }
  function hideAreas() {
    areaMasks.forEach(ms => ms.forEach(m => m.classList.add('pre')));
  }

  circles.forEach(g => {
    const wire = g.querySelector('.wire');
    if (!wire) return;
    wire.removeAttribute('transform');
    wire.style.stroke = REST_INK;
    wire.setAttribute('stroke-width', '1');
  });

  const anim = { t0: 0, running: false, done: false, settled: false };

  /* Published for halo.js, which must stay completely hidden until the four loops
     have reached their final widths. Note this is stricter than anim.done, which fires
     once the LAST loop is 85% of the way open so the section can settle under the tail
     of the movement — the halo, like the travelling dot, waits for the whole thing. Set
     to false right
     now rather than left undefined, so that `undefined` can mean "expertise.js is not
     running" and leave the halo ungated. */
  function setSettled(on) { anim.settled = on; window.EXP_CIRCLES_SETTLED = on; }
  setSettled(false);

  const REST  = [0, 0, 0, 0];
  const FINAL = [1, 1, 1, 1];

  function animStep(now) {
    if (!anim.running) return;
    const e  = now - anim.t0;
    const ps = [progress(0, e), progress(1, e), progress(2, e), progress(3, e)];
    placeLoops(ps);
    revealAreas(ps);
    if (e > HOLD + STAGGER * 3 + DUR * 0.85) anim.done = true;
    if (e >= TOTAL) setSettled(true);
    if (e > TOTAL + 80) anim.running = false;
  }

  placeLoops(CAPTURE ? FINAL : REST);
  if (CAPTURE) setSettled(true);

  /* The loops have NO hover state. Pointing at one used to take its stroke from 15%
     to 30% of #222 and drop the other three expertise area blocks to 40% opacity; that is
     gone, so the graphic reads the same however the pointer moves across it. What went
     with it: a pointermove hit-test resolving the cursor to the narrowest loop
     containing it, a pointerleave reset, and setHover(). REST_INK below is now the only
     ink the wires ever take. */

  /* --------------------------------------------------------- travelling dots */
  /* Dots riding the wires. A dot's position is its loop's own parametric point, so it
     is on the path by construction and cannot drift off it however the geometry moves.

     The angle is measured from the AXIS on every loop — theta 0 for the two that open
     left, PI for the two that open right — so phi 0 is the shared tangent point for all
     four. That is the one place every wire touches, which makes it the natural seam: a
     lap begins and ends there, and the next lap may be on a different wire, in either
     direction, with no jump.

     Each lap is a smoothstep from 0 to TAU rather than a constant rate, so a dot leaves
     the convergence slowly, runs quickest through the wide part of the loop and eases
     back to a stop where the wires meet. The ease-in-out is the lap itself, not a speed
     fudge on top of one.

     Nothing is shared between dots: every lap picks its own wire, direction and duration,
     and rests a random moment on the axis before the next, so they drift out of step and
     stay that way. */
  /* BACK ON in this option. They were paused because the three gathered at the axis --
     the one point every loop passes through, and where a lap used to both end and rest.

     The cause was upstream of any guard, and that was worth learning twice: holding them
     110 units apart froze a dot in 78% of frames and bunched them at exactly that radius,
     and scheduling the laps so their arrivals miss each other still left 1508 of 1801
     frames inside 110. A guard can stop an overlap; it cannot create space, because by
     the time it fires the two are already together.

     What fixed it is that they no longer stop: REST_MAX is 0 and the lap runs at a
     constant rate rather than easing to a halt at both ends. See both for the detail.
     Set this true to park them again. */
  const DOTS_PAUSED = false;

  const dots = [...section.querySelectorAll('.dot')];
  const TAU  = Math.PI * 2;
  const DOT_INK = '#222';                   // one ink, the same as the lines
  /* One circuit. 30% quicker than the 15000/26000 these were: /1.30. */
  const LAP_MIN = 11538, LAP_MAX = 20000;
  /* NO REST, and no easing into the seam either. Both are gone, and they were the whole
     problem: a lap used to be a smoothstep from 0 to TAU, which crawls through its first
     and last tenth, and then the dot sat still on the axis for up to two seconds on top
     of that. Every loop passes through that one point, so three dots all decelerating
     into it and parking there is not drift -- it is three dots being aimed at the same
     spot and told to wait.

     It cannot be fixed downstream, which was worth learning twice. Holding them apart at
     110 units froze a dot in 78% of frames and bunched them at exactly that radius;
     scheduling the arrivals and keeping the stop left 1508 of 1801 frames inside 110.
     The dots simply keep moving now: a constant rate, straight through the seam, so no
     two of them are ever slow in the same place.

     What is lost is the ease-in-out, which gave a lap its shape. What replaces it is
     that the graphic always has three things in motion. */
  const REST_MAX = 0;

  /* Clear air, in ms, that a dot's arrival at the seam keeps from any other dot's
     predicted time there. This is the number that actually spreads them: see newLap. */
  const SEAM_GAP = 2600;

  /* DIRECTION IS THE DOT'S, not the lap's, and it is handed out once here and never
     written again. Two of the three run one way and the odd one the other -- with three
     dots and two directions that is the only split there is -- so the group reads as
     circulating rather than as a formation, while no individual dot ever turns round.

     Those are separate properties and both were asked for. A dot that reverses reads as
     indecision; three dots that all go the same way read as one mechanism with three
     markers on it. Fixing the direction per DOT rather than per lap is what gets both.

     The cost is accepted rather than designed out: two dots on the same wire going
     opposite ways now MEET head-on, where before they could only ever catch up with one
     another. Nothing downstream guards against it -- see the note under the separation
     guard -- and the avoidance that does exist is upstream in newLap, which prefers a
     free wire and times the seam crossings apart. Both still work; neither was ever a
     guarantee. */
  const travel = dots.map((_, k) => ({ i: 0, dir: k % 2 ? -1 : 1,
                                       dur: LAP_MIN, t0: 0, arrive: 0 }));
  let dotsArmed = false;
  dots.forEach(d => d.setAttribute('fill', DOT_INK));

  function newLap(t, now, firstIdx) {
    /* Prefer a wire no other dot is on. Left purely to chance, dots on four loops land
       on the same path often enough to read as a pair tracking each other, which is the
       one thing "not in sync" has to rule out. At THREE dots on four loops there is
       always exactly one free wire, so this still never falls back to the full pool --
       it had two spare when there were two dots. A fourth dot would exhaust it. */
    const taken = travel.filter(o => o !== t).map(o => o.i);
    const free  = LOOPS.map((_, k) => k).filter(k => taken.indexOf(k) < 0);
    const pool  = free.length ? free : LOOPS.map((_, k) => k);
    t.i   = pool[(Math.random() * pool.length) | 0];
    /* t.dir IS NOT TOUCHED HERE. A lap used to draw its own direction, so a dot could
       come back round the other way and the group read as rocking rather than
       circulating. The direction belongs to the DOT now -- set once where travel is
       built -- so a dot keeps its own way round for every lap it ever runs, and the
       three do not all share it. Same reasoning the footer mark's 45-degree turns carry:
       accumulate in one direction and what reads is movement, alternate and what reads
       is indecision. */

    /* THE LAP LENGTH IS CHOSEN, not taken. Every loop passes through the axis, and a
       lap begins and ends there, so the seam is the one place the three can gather --
       and the only lever on when a dot gets there is how long its lap takes. So rather
       than drawing a duration and living with it, draw up to two dozen and keep the
       first whose ARRIVAL misses every other dot's predicted time at the seam by
       SEAM_GAP. Another dot's window is known: it reaches the seam at its own `arrive`
       and may sit there for up to REST_MAX.

       This is what replaced leaning on the separation guard. Holding dots apart at a
       distance worth having (110 units) left them frozen 78% of frames and bunched at
       exactly that radius -- the guard can stop an overlap, but it cannot create space,
       because by the time it fires the two are already together. Spacing them in TIME
       at the one bottleneck is what keeps them apart everywhere.

       If no draw is clean the best of them is used. The guard below is still there for that, and for the two crossings
       away from the axis, which are rare enough to absorb. */
    const rest   = firstIdx >= 0 ? 0 : Math.random() * REST_MAX;
    const depart = now + rest;
    let bestDur = LAP_MIN, bestScore = -Infinity;
    for (let n = 0; n < 24; n++) {
      const dur = LAP_MIN + Math.random() * (LAP_MAX - LAP_MIN);
      const arrive = depart + dur;
      let score = Infinity;
      for (const o of travel) {
        if (o === t) continue;
        const a = o.arrive - SEAM_GAP;              // their crossing, widened both ways
        const b = o.arrive + SEAM_GAP;
        const d = arrive < a ? a - arrive
                : arrive > b ? arrive - b
                : -Math.min(arrive - a, b - arrive);
        if (d < score) score = d;
      }
      if (score > bestScore) { bestScore = score; bestDur = dur; }
      if (score > 0) break;                          // clean draw, take it
    }
    t.dur = bestDur;
    /* The FIRST lap is BACKDATED -- t0 in the past -- so a dot is already part-way round
       its circuit the moment the graphic hands over. What you see as the section frames
       in is two dots in motion, not two dots setting off. Up to 0.9 of a lap, so where
       each one starts is also what spreads the pair apart: no clock stagger is needed,
       and none is used.

       LATER laps still begin at phi 0, the tangent point all four loops share at the
       graphic's centre. That is not decoration -- it is the one place a dot can change
       wire without jumping, since every loop passes through it. Only the opening lap is
       allowed to start mid-path, because nothing is being handed over to it. */
    t.t0  = firstIdx >= 0 ? now - Math.random() * t.dur * 0.9 : depart;
    t.arrive = t.t0 + t.dur;        // when this dot will next be at the seam
  }

  /* ---------------------------------------------------- keeping them apart */
  /* Two dots must never sit on top of each other, and picking a free wire is not
     enough to guarantee it. There are three places on this graphic where two paths
     meet:

       the AXIS, where all four loops are tangent -- and where every lap starts, ends
       and rests, so it is by far the most frequent;
       x 493.3, y CY +/- 320.4, where loops 0 and 1 cross;
       x 946.7, y CY +/- 320.4, where loops 2 and 3 cross.

     Loops that open opposite ways only ever share the axis, so the crossings come in
     two pairs: {0,1} and {2,3}. With THREE dots and two pairs the pigeonhole settles
     it -- two of them are always on a crossing pair, whatever newLap chooses. So the
     wire preference cannot be made to solve this and the guard has to be geometric.

     That is why avoidance is a PREFERENCE here and not a rule: newLap picks a free wire
     where it can and times each lap so the dot reaches the tangent point clear of when
     the others will, but two dots on a crossing pair can still meet and are allowed to.
     A geometric guard could forbid it, and one did -- see the note further down for why
     it was taken out. */


  function dotStep(now) {
    if (!dots.length) return;
    if (DOTS_PAUSED) { dots.forEach(d => { d.style.opacity = '0'; }); return; }
    if (!anim.settled) {                      // parked until the opening is over
      dots.forEach(d => { d.style.opacity = '0'; });
      dotsArmed = false;
      return;
    }
    if (!dotsArmed) { travel.forEach((t, k) => newLap(t, now, k)); dotsArmed = true; }

    /* Where each dot WANTS to be this frame. newLap fires in here when a lap runs out,
       which is why this is a function and not a table -- but it is idempotent after
       that first call, so a held dot can be re-evaluated safely. */
    function at(t) {
      let s = (now - t.t0) / t.dur;
      if (s >= 1) { newLap(t, now, -1); s = 0; }
      // s < 0 is the rest between laps: the dot simply waits on the axis
      const resting = s < 0;
      /* LINEAR. smooth() here is what stopped a dot dead at both ends of its lap, on
         the one point all four loops share. A constant rate carries it through. */
      const phi = TAU * Math.max(0, Math.min(1, s)) * t.dir;
      const L   = LOOPS[t.i];
      const th  = (L.side < 0 ? 0 : Math.PI) + phi;
      return { x: centreOf(t.i, L.rx) + L.rx * Math.cos(th),
               y: CY + RY * Math.sin(th), resting: resting };
    }

    const P = travel.map(at);

    /* NO SEPARATION GUARD. There was one: a dot that would land within MIN_SEP of
       another was HELD, its lap frozen for that frame until the other had passed. It
       worked -- it took the closest approach from 0.01 units to 41 -- but holding a dot
       is still stopping it, and overlapping is now the lesser fault of the two.

       Avoidance is all upstream of here instead, where it costs no motion: newLap
       prefers a wire no other dot is on, and it chooses each lap's DURATION so the dot
       arrives at the shared tangent point clear of when the others will be there. Those
       two make a collision unlikely rather than impossible, which is what was asked for.

       What makes overlapping survivable at all is that the dots no longer stop: with a
       constant-rate lap and no rest, two of them crossing are both still moving, so it
       reads as one passing the other rather than as two parked in the same place. */
    P.forEach((p, k) => {
      const el = dots[k];
      el.setAttribute('cx', p.x.toFixed(2));
      el.setAttribute('cy', p.y.toFixed(2));
      el.style.opacity = '1';
    });
    }

  /* ------------------------------------------------------------ reveal order */
  /* Four steps: the headline is one mask now, not one per line. */
  /* The CTA is no longer part of the header in this option -- it sits at the foot of
     the graphic -- so it no longer arrives with it. 470 made it the fourth line of a
     four-line header, which is exactly what it stopped being; 760 lands it after the
     copy below has begun, so it reads as closing the section rather than as trailing
     the heading. */
  const SEQ = [
    ['[data-xv="0"]',    0],   // eyebrow
    ['[data-xv="1"]',  110],   // headline
    ['[data-xv="2"]',  330],   // body
    ['[data-xv="3"]',  760]    // CTA, at the foot of the graphic
  ];

  const armed = [];
  SEQ.forEach(([sel]) => {
    const el = section.querySelector(sel);
    if (el) { el.classList.add('pre'); armed.push(el); }
  });
  const areas = [...section.querySelectorAll('.area .mask')];
  areas.forEach(c => { c.classList.add('pre'); armed.push(c); });

  void section.offsetHeight;

  if (CAPTURE) {
    armed.forEach(el => { el.style.transition = 'none'; el.classList.remove('pre'); });
  }

  /* Two gates, each waiting on something actually visible:
       1. copy      - the headline has entered the viewport, as in every section
       2. circles   - the graphic's own band is on screen
     There is no longer a third gate for the expertise area labels. They used to be dealt
     out together once the spread was over; now each one belongs to a circle and comes
     in on that circle's clock from inside the entrance itself, which is what keeps the
     copy attached to its circle the whole way.

     Both stages are REVERSIBLE, so scrolling back up resets them and scrolling down
     plays them again. The exit thresholds sit below the enter thresholds so the
     boundary does not flicker. */
  const stage = { copy: false, circles: false, copyAt: 0 };
  const areasEl = section.querySelector('.areas');
  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  function setCopy(on) {
    if (on === stage.copy) return;
    stage.copy = on;
    if (on) {
      stage.copyAt = performance.now();
      SEQ.forEach(([sel, d]) => {
        const el = section.querySelector(sel);
        if (el) later(() => el.classList.remove('pre'), d);
      });
    } else {
      SEQ.forEach(([sel]) => {
        const el = section.querySelector(sel);
        if (el) el.classList.add('pre');
      });
    }
  }

  function setCircles(on, now) {
    if (on === stage.circles) return;
    stage.circles = on;
    if (on) {
      anim.t0 = now; anim.running = true; anim.done = false;
    } else {
      anim.running = false; anim.done = false;
      setSettled(false);                    // and the halo goes back into hiding
      placeLoops(REST);                     // back to a single line on the axis
      hideAreas();                           // with the copy stowed again
      dots.forEach(d => { d.style.opacity = '0'; });   // and the dots off the wires
    }
  }

  function gates(now) {
    if (CAPTURE) return;

    /* 1. copy — an ordinary entrance, on the same 0.78 / 0.90 thresholds the Work
       section header uses, so Expertise arrives the way every other section does.
       It used to be gated on the circle's edge having passed above the headline;
       what keeps the two apart now is distance, not timing — the content sits 200u
       further down the section than the arc, which is a fixed gap that holds in
       both scroll directions instead of only on the way in. */
    const head = section.querySelector('.exp__head');
    const vh0  = window.innerHeight;
    const hr   = head ? head.getBoundingClientRect() : null;
    const inCopy  = hr && hr.top < vh0 * 0.78 && hr.bottom > 0;
    const outCopy = hr && hr.top > vh0 * 0.90;     // bottom exit only
    if (!stage.copy && inCopy) { clearTimers(); setCopy(true); }
    else if (stage.copy && outCopy) { clearTimers(); setCopy(false); }

    /* 2. circles — on the circle graphic's OWN band, and independent of the copy.
       They used to wait on stage.copy, which was safe while the copy gate was tied
       to the cover's geometry and stayed true for most of the section. Now that the
       copy is an ordinary entrance it switches off as soon as the headline leaves
       the top of the screen — and the circles, which are 700u further down and only
       just arriving, would have been reset at exactly the wrong moment. The band is
       computed from the real circle geometry rather than from .areas, whose box is
       the whole section and so is on screen almost always. */
    if (areasEl) {
      const u2  = unit();
      const top = section.getBoundingClientRect().top;
      const bandTop = top + (CY - RY) * u2;
      const bandBot = top + (CY + RY) * u2;
      const inBand  = bandTop < vh0 * 0.92 && bandBot > 0;
      const outBand = bandTop > vh0 * 1.05;        // bottom exit only
      if (!stage.circles && inBand) setCircles(true, now);
      else if (stage.circles && outBand) setCircles(false, now);
    }
  }

  /* ------------------------------------------------------------------- loop */
  function tick(now) {
    const t = now || performance.now();
    coverStep();
    gates(t);
    animStep(t);
    dotStep(t);
    requestAnimationFrame(tick);
  }


  /* Scroll drives the gates as well as the loop. rAF alone is enough in a real
     browser, but tying the stages to the scroll event too means they stay correct
     even if frames are being dropped. */
  function onScroll() {
    const t = performance.now();
    coverStep();
    gates(t);
    animStep(t);        // time-based, so it stays correct if frames are dropped
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  coverStep();
  requestAnimationFrame(tick);
})();

/* ============================================================================
   EXPERTISE — centring the four blocks on their own ink

   The blocks are placed on the column centres and max-width holds them to a 260
   measure, so as BOXES they are already centred between the grid lines, 40u clear
   either side. They did not look it, and the reason is that the type is set left and
   ragged right: every line starts hard against the box's left edge and all the slack
   collects on the right, so a block whose longest line falls short of the measure
   sits visibly left of where its box is.

   CSS cannot fix that. width:max-content is the intrinsic width BEFORE wrapping, so
   once it is clamped to the measure the box stays the full 260 however short the
   wrapped lines turn out to be; fit-content is no better, and on an absolutely
   positioned box it is actively worse -- it resolves against the space from `left` to
   the container edge, which squeezed the fourth block to 210 and re-wrapped it.

   So the longest wrapped line is measured and the box is set to it. Narrowing a box
   to its own longest line cannot change where the lines break -- every one of them
   already fits -- so nothing re-wraps and no height moves; the box simply stops being
   wider than its contents, and translateX(-50%) then centres what is actually there.

   Re-run on resize and once the real font has resolved, because both change where the
   lines break and so which one is longest.
   ========================================================================= */
(function () {
  'use strict';

  const areas = [...document.querySelectorAll('#expertise .area')];
  if (!areas.length) return;

  /* The widest line box in an element, found over its text nodes rather than its
     elements: a wrapped <span> reports one rect per LINE, which is exactly what is
     wanted, where the span's own box would just report the measure back. */
  function widestLine(el) {
    let w = 0;
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (!n.nodeValue.trim()) continue;
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) if (r.width > w) w = r.width;
    }
    return w;
  }

  function fit() {
    // measure at the full measure, then shrink -- not the other way round
    areas.forEach(el => { el.style.width = ''; });
    void areas[0].offsetWidth;
    const widths = areas.map(widestLine);
    areas.forEach((el, i) => { if (widths[i] > 0) el.style.width = Math.ceil(widths[i]) + 'px'; });
  }

  fit();
  addEventListener('resize', fit, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();
