/* ============================================================================
   EXPERTISE — the orange halo under the graphic

   A single orange mass sitting behind the four loops and following the cursor with the
   same heavy lag the hero and footer gradients use. Nothing is drawn here: the colour
   and the falloff are a radialGradient in the markup, and this file does one thing to
   it each frame -- move it.

   ------------------------------------------------------------------- no clip
   There is no mask. The rect the gradient fills is far larger than the section and the
   gradient's own falloff is the only edge it has, reaching zero by r 380 -- the radius
   v1/a's halo measures. The rect used to be the section's box, and that was a hard
   line: a gradient paints only inside the shape it fills, so the rect's edges sliced
   the tail off at whatever value it had got to.

   What keeps it UNDER THE GRAPHIC is therefore not a shape but a leash. Where it may
   travel is clamped to the loops' own band -- REACH either side of the axis, a little
   over half the band's height above and below its centre -- so however far the pointer
   goes the mass leans toward it without leaving the graphic or drifting up into the
   section header. Clamping where it CAN GO, rather than cutting what it looks like, is
   what keeps the visible thing a falloff rather than an edge.

   Document order does the rest: the halo is the first child of the svg, so all four
   wires, the three travelling dots and all four blocks of copy paint over it.

   ----------------------------------------------------------------- the cursor
   Two eases, not one, for the same reason the footer's gradient has them: the position
   is followed through a heavy lag so the mass is always arriving somewhere the cursor
   has already left, and it only travels a FRACTION of the way there, so it leans toward
   the pointer rather than being dragged by it. It never reaches the cursor, which is
   the point.
   ========================================================================= */
(function () {
  'use strict';

  const section = document.getElementById('expertise');
  if (!section) return;

  const svg  = section.querySelector('.areas__svg');
  const halo = section.querySelector('.exp-halo');
  const grad = document.getElementById('exp-halo-grad');
  if (!svg || !halo || !grad) return;

  /* The band the loops occupy, in the svg's own design units. AXIS and CY are
     expertise.js's; they are restated rather than imported because this file has no way
     to reach inside that IIFE, and they are the graphic's fixed geometry. */
  const AXIS = 720;        // the central vertical line
  const CY   = 740.2;      // the band's centre
  const RY   = 340;        // its half-height
  const REACH = 400;       // how far either side of the axis the mass may wander
  /* And how far above and below the band's centre. A bit over a third of the band's
     half-height, written as a fraction of RY rather than as 129 so it stays in
     proportion if the band is ever resized.

     It is deliberately much shorter than REACH. The leash is what keeps the mass under
     the graphic, and there is far less room to give vertically than horizontally: the
     section header's body copy ends a few units above the band's top edge, so a mass
     that rides up with the pointer puts its tail behind the headline. 0.38 is the most
     that gives real vertical travel -- 258 units of it, end to end -- while the mass's
     own centre stays well inside the loops. */
  const RISE = RY * 0.38;

  const EASE = 0.045;      // pointer lag per frame -- slow, like the other gradients
  const PULL = 0.62;       // and it only goes this fraction of the way across
  /* Less than PULL. The horizontal and vertical leans are not the same gesture: across
     the band the mass has somewhere to go and the movement reads as the graphic being
     lit from the side, where up and down it is mostly changing which loops catch the
     light. Leaning as hard vertically as horizontally made it look like it was trying
     to escape the band and being held back by the clamp -- which it was. */
  const PULL_Y = 0.42;

  let tx = AXIS;                   // where the cursor is, in design units
  let cx = AXIS;                   // where the mass actually is
  let ty = CY,  cy = CY;           // and the same pair for the vertical
  let raf = 0, running = false;
  let shown = '0';                 // the opacity currently written, so it is written once

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  /* The svg is preserveAspectRatio="none" over a 1440-wide viewBox, so screen -> design
     is one scale per axis and nothing about it needs the aspect ratio. */
  /* The viewBox's own height, READ rather than written down. It tracks .exp__inner's
     height, which has changed more than once, and a stale copy here would skew every
     vertical reading by the difference -- silently, because preserveAspectRatio="none"
     means there is no aspect ratio to notice it with. */
  const VBH = parseFloat((svg.getAttribute('viewBox') || '').split(/\s+/)[3]) || 1234.2;

  addEventListener('pointermove', ev => {
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return;
    tx = (ev.clientX - r.left) / r.width  * 1440;
    ty = (ev.clientY - r.top)  / r.height * VBH;
  }, { passive: true });

  function frame() {
    raf = 0;
    if (!running) return;

    /* BOTH AXES NOW, on two different leashes. cy was pinned to CY and the mass only
       ever slid across the band; it now leans up and down as well, but through a weaker
       pull and a much shorter clamp.

       The reason for the asymmetry is the room available, not the gesture: REACH is 400
       either side of a 1440-wide frame, RISE is 129 either side of a band whose own
       half-height is 340 and which has the section header sitting just above it. Letting
       the vertical run as free as the horizontal is what made this read as a second
       object passing behind the loops rather than as the loops being lit -- the mass has
       to stay recognisably ON the graphic.

       Same construction on both: lean a fraction of the way toward the pointer, arrive
       through a heavy lag, then clamp. The clamp is the leash and the lag is the feel;
       neither is doing the other's job. */
    cx += ((AXIS + (tx - AXIS) * PULL)   - cx) * EASE;
    cy += ((CY   + (ty - CY)   * PULL_Y) - cy) * EASE;

    grad.setAttribute('cx', clamp(cx, AXIS - REACH, AXIS + REACH).toFixed(1));
    grad.setAttribute('cy', clamp(cy, CY   - RISE,  CY   + RISE ).toFixed(1));

    /* ---- it waits for the graphic ------------------------------------------------
       The halo used to light the moment the section touched the viewport, so it was
       already there while the four loops were still opening out of their seed line --
       the light arriving before the thing it is lighting.

       expertise.js publishes EXP_CIRCLES_SETTLED for exactly this, and it is stricter
       than that file's own anim.done: done fires once the last loop is 85% open so the
       section can settle under the tail of the movement, where settled waits for all
       four to reach their final widths. 1225ms end to end from the section entering.

       undefined, NOT false, is the ungated case -- that is expertise.js not running at
       all, and a halo that never lights would be the worse failure. The .9s fade is the
       CSS transition on .exp-halo; all that happens here is which end of it to be at,
       and the attribute is only written when it changes rather than every frame. */
    const gate = window.EXP_CIRCLES_SETTLED;
    const want = (gate === undefined || gate) ? '1' : '0';
    if (want !== shown) { shown = want; halo.setAttribute('opacity', want); }

    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    /* No opacity here any more. frame() decides it, from the graphic's own gate. */
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    /* Back to hidden on the way out, so the next entrance starts dark and the halo
       fades in behind the loops again rather than being found already lit. Without it
       the halo came back at full strength and then dipped, because the first frame of
       the new entrance reads a gate that is false again. */
    shown = '0';
    halo.setAttribute('opacity', '0');
  }

  /* Only while the section is on screen. It is in the middle of the page, so for most
     of a visit this would otherwise be a rAF loop writing two attributes nobody can
     see -- and the halo would be lit under a graphic that is nowhere near the viewport. */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => {
      es.forEach(e => e.isIntersecting ? start() : stop());
    }, { threshold: 0 }).observe(section);
  } else {
    start();
  }

  /* Reduced motion: the halo is still there, it simply does not drift -- the lag is
     what would be the motion. */
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  /* stop() FIRST, then light it: stop() now writes opacity 0 on its way out, so the
     other order left the halo hidden for good. */
  if (reduced.matches) { stop(); shown = '1'; halo.setAttribute('opacity', '1'); }
})();
