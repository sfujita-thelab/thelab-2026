/* ============================================================================
   PAGE GLOW -- the homepage's Expertise glow, behind the hero figure (2026-10-24).

   The same orange mass as homepage/approved/expertise-halo.js: its eleven-stop ramp and
   colours (EXPERTISE in config.js), its 380-unit radius, its lag and its leash. Here it
   is one fixed, round element under the figure's own layer (.travel), so the wires still
   draw over it, and it is moved by a transform -- nothing is repainted as it travels.

     - it lights once the hero figure has opened (expertise-page.js's 380 + 1225ms), with
       the homepage's .9s fade
     - it leans toward the pointer through a heavy lag: 62% of the way across, 42% up and
       down, held within 400 / 129 units of the figure's centre
     - on a phone it is larger (2.02x), centred on the figure, as on the homepage
     - LEFT ALONE IT DRIFTS (2026-10-25): once the pointer has been still for IDLE ms (or
       before it has ever moved, and always on a phone) the glow wanders a slow loop
       round the figure's centre inside the same leash -- two sines, 11s across and 7.3s
       up and down, so the path never quite repeats. The hand-over both ways is eased,
       so it never jumps. Reduced motion keeps it still.
   Units are the homepage's: 1440 across the screen.
   ========================================================================= */
(function () {
  'use strict';
  const XP = window.XP;
  const glow = document.querySelector('.page-glow');
  const fig = document.querySelector('.page-head__fig');
  if (!glow || !fig || typeof EXPERTISE === 'undefined') return;

  // the ramp: offset, which colour, and its opacity as a fraction of the peak
  const RAMP = [
    [0.00, 'core', 1.0000], [0.13, 'warm', 0.9514], [0.26, 'mid',  0.8502],
    [0.39, 'mid',  0.6883], [0.50, 'mid',  0.5263], [0.60, 'tail', 0.3846],
    [0.70, 'tail', 0.2632], [0.80, 'tail', 0.1619], [0.88, 'tail', 0.0911],
    [0.94, 'tail', 0.0405], [1.00, 'tail', 0.0000]
  ];
  const rgba = (hex, a) => {
    const v = parseInt(hex.slice(1), 16);
    return 'rgba(' + (v >> 16 & 255) + ',' + (v >> 8 & 255) + ',' + (v & 255) + ',' + a.toFixed(3) + ')';
  };
  glow.style.background = 'radial-gradient(circle closest-side, ' +
    RAMP.map(([o, k, f]) => rgba(EXPERTISE[k], f * EXPERTISE.alpha) + ' ' + (o * 100) + '%').join(', ') + ')';

  const EASE = 0.045, PULL = 0.62, PULL_Y = 0.42, REACH = 400, RISE = 129;
  const PHONE = matchMedia('(max-width: 767px)');
  const unit = () => innerWidth / 1440;
  const IDLE = 1500, WANDER_X = 0.75, WANDER_Y = 0.8, PERIOD_X = 11000, PERIOD_Y = 7300;
  let tx = null, ty = null, cx = null, cy = null, moved = -Infinity, drift = XP && XP.reduced ? 0 : 1;
  addEventListener('pointermove', e => {
    if (!PHONE.matches) { tx = e.clientX; ty = e.clientY; moved = performance.now(); }
  }, { passive: true });

  const instant = XP && (XP.skipIntro || XP.CAPTURE);
  /* IT FADES OUT WITH THE HERO (2026-10-26): the hero copy's own fade -- over the first 80%
     of a screen, on its smoothstep (expertise-page.js) -- written as the glow's opacity once
     it has lit. The .9s light-up transition is dropped after it has run (.is-set), so from
     then on the fade follows the scroll exactly. */
  let lit = false;
  setTimeout(() => {
    glow.classList.add('is-on'); lit = true;
    setTimeout(() => glow.classList.add('is-set'), 950);
  }, instant ? 0 : 1605);
  const heroFade = () => {
    const hk = Math.min(1, Math.min(1, scrollY / (innerHeight * 0.8)) * 1.05);
    return 1 - hk * hk * (3 - 2 * hk);
  };

  (function frame() {
    const r = fig.getBoundingClientRect();
    const ox = r.left + r.width / 2, oy = r.top + r.height / 2, u = unit();
    const still = XP && XP.reduced;
    if (cx === null) { cx = ox; cy = oy; }
    // the pointer's pull, or the figure's centre where there is no pointer
    const px = PHONE.matches || tx === null ? ox : ox + (tx - ox) * PULL;
    const py = PHONE.matches || ty === null ? oy : oy + (ty - oy) * PULL_Y;
    // the idle loop, and how far toward it: eased in when the pointer rests, out when it moves
    const now = performance.now();
    const want = !still && (PHONE.matches || tx === null || now - moved > IDLE) ? 1 : 0;
    drift += (want - drift) * 0.02;
    const wx = ox + REACH * u * WANDER_X * Math.sin(now / PERIOD_X * 2 * Math.PI);
    const wy = oy + RISE * u * WANDER_Y * Math.sin(now / PERIOD_Y * 2 * Math.PI + 1);
    const gx = px + (wx - px) * drift, gy = py + (wy - py) * drift;
    // a phone has no pointer to lag behind: straight on the loop, so it holds to the figure as it scrolls
    cx = still || PHONE.matches ? gx : cx + (gx - cx) * EASE;
    cy = still || PHONE.matches ? gy : cy + (gy - cy) * EASE;
    const x = Math.max(ox - REACH * u, Math.min(ox + REACH * u, cx));
    const y = Math.max(oy - RISE * u, Math.min(oy + RISE * u, cy));
    glow.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    if (lit) glow.style.opacity = heroFade().toFixed(3);
    requestAnimationFrame(frame);
  })();
})();
