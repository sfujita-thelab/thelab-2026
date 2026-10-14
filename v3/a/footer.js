/* ============================================================================
   FOOTER — option B

   The squeeze is gone. There is no ball pushed through the boundary, no pinned
   sequence, no parallax shear and nothing held between sections.

   Three jobs, all small:

     1. the MARK — nine dots at their resting offsets. The geometry is the same
        as it always was (90u dots on a ring of radius 155u, 400u overall) and it
        is still derived from one number in the CSS, --pf-mark, rather than
        written down a second time here. Only the entrance is gone.

     2. the GRID — the five footer lines, copied from the light section's lines
        rather than recomputed.

     3. the NAV — inverted to light while the dark is behind it.

   The turn that accompanies each headline change lives in footer-type.js, which
   owns the timing it has to be in step with.
   ========================================================================= */
(function () {
  'use strict';

  const foot = document.getElementById('footer');
  if (!foot) return;
  const mark = foot.querySelector('.pf__mark');
  const grid = foot.querySelector('.pf__grid');
  const bar  = document.querySelector('.topbar');
  /* The grid is the hard requirement; the MARK is not. This footer's logo is an inline
     svg in .pf__lockup, so there is no .pf__mark to build dots into -- and requiring one
     took the grid lines and the nav inversion down with it. */
  if (!grid) return;

  /* ----------------------------------------------------------------- dots */
  /* Eight unit vectors at 45 degree intervals from straight up, plus the centre.
     At R = 155u the axis dots land at 155 and the diagonals at 109.6, which is
     what new-footer.png measures (109.3). The CSS multiplies each vector by --R,
     so these are the only numbers involved and nothing is animated into place. */
  const DIRS = [];
  for (let i = 0; i < 8; i++) {
    const a = (-90 + i * 45) * Math.PI / 180;
    DIRS.push([Math.cos(a), Math.sin(a)]);
  }
  DIRS.push([0, 0]);                              // the centre dot

  if (mark) DIRS.forEach(([dx, dy]) => {
    const el = document.createElement('i');
    el.className = 'pf__dot';
    el.style.setProperty('--dx', dx.toFixed(5));
    el.style.setProperty('--dy', dy.toFixed(5));
    mark.appendChild(el);
  });

  /* ------------------------------------------------- the five grid lines */
  /* COPIED from the light section's lines, never recomputed. Running the same
     formula is not enough and was the bug: .page-grid is position:fixed, so it is
     laid out against the VIEWPORT, and --m/--col are derived from
     window.innerWidth, which includes the scrollbar. The footer's lines are
     position:absolute in the document flow, which excludes it. Same numbers, two
     different coordinate bases -- so the columns came out a different width and
     the whole set sat offset by the scrollbar.

     Measuring each light line's rect and converting into the footer's own box is
     exact by construction, whatever the scrollbar is doing, so a line is literally
     the same line across the boundary and only its colour changes. */
  function buildGrid() {
    const src = [...document.querySelectorAll('.page-grid i')];
    const n = src.length ||
              ((typeof CONFIG !== 'undefined' ? CONFIG.grid.columns : 4) + 1);
    if (grid.children.length !== n) {
      grid.innerHTML = '';
      for (let i = 0; i < n; i++) grid.appendChild(document.createElement('i'));
    }
    const base = grid.getBoundingClientRect().left;
    const cs   = getComputedStyle(document.documentElement);
    const m    = parseFloat(cs.getPropertyValue('--m')) || 0;
    const col  = parseFloat(cs.getPropertyValue('--col')) || 0;
    [...grid.children].forEach((el, i) => {
      const x = src[i] ? src[i].getBoundingClientRect().left - base   // the real thing
                       : m + col * i;                                 // only if absent
      el.style.left = x.toFixed(2) + 'px';
    });
  }

  /* -------------------------------------------------------- nav inversion */
  /* The topbar is fixed at z-index 6, above the footer, so the dark passes behind it.
     Flip as the footer's edge crosses the MIDDLE of the bar, so the switch happens
     while the dark is actually behind it rather than before.

     getBoundingClientRect is fine here: nothing transforms .pf, so the rect IS the
     layout position and there is no feedback loop to avoid. */
  let dark = false;
  let entered = false;

  function frame() {
    /* ---- the mark's entrance ------------------------------------------------
       It turns in and grows to size as its centre comes onto the screen, and resets
       when it leaves so it plays again on the way back. The animation itself is the
       CSS transition on .pf__mark; this only says when.

       Driven from here rather than an IntersectionObserver because .pf__mark is a
       0x0 box -- an observer on it can never intersect, and one on its parent band
       fires 280px too early, which would spend the entrance off camera. A 0x0 box
       does give a stable rect though: rotate() and scale() turn it about its own
       origin, so its top never moves however far through the entrance it is, and
       the test cannot feed back on itself. */
    /* Only if there IS a mark. This footer's logo is an inline svg in .pf__lockup and
       there is no .pf__mark at all, so the entrance has nothing to drive -- and reading
       a rect off null threw on every frame, which took the nav inversion below it down
       with it. */
    if (mark) {
      const m = mark.getBoundingClientRect().top;
      const vh = window.innerHeight;
      const inView = m > 40 && m < vh - 40;
      if (inView !== entered) { entered = inView; mark.classList.toggle('is-in', inView); }
    }

    /* ---- nav inversion ------------------------------------------------------ */
    if (!bar) return;
    const top = foot.getBoundingClientRect().top;
    const b   = bar.getBoundingClientRect();
    const over = top <= b.top + b.height / 2;
    if (over !== dark) { dark = over; bar.classList.toggle('on-dark', over); }
  }

  /* rAF-coalesced: scroll fires far faster than the screen refreshes. */
  let queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; frame(); });
  }

  addEventListener('scroll', onScroll, { passive: true });
  /* Two triggers, and the second is the one that matters. The resize listener keeps the
     lines roughly right DURING a drag; 'hp:layout' is dispatched by app.js at the end of
     its own (80ms-debounced) layout, which is the moment the page grid has actually
     moved. Rebuilding only on resize meant copying the grid's old positions and never
     hearing about the new ones -- the lines drifted on every resize. */
  addEventListener('resize', () => { buildGrid(); frame(); });
  addEventListener('hp:layout', () => { buildGrid(); frame(); });

  buildGrid();
  frame();

  // app.js rewrites --m / --col / --u on resize and again once fonts settle.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { buildGrid(); frame(); });
  }
})();
