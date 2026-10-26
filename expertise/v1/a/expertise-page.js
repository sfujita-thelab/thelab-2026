/* ============================================================================
   EXPERTISE PAGE v1/a — THE GRAPHIC, THE BAR AND THE COLOUR.

   ONE FIGURE TRAVELS FROM THE HERO AND HOLDS ONE PLACE FOR ALL FOUR AREAS.

     hero   the homepage's Expertise figure at its own size -- four loops tangent to
            the centre line, four grid columns across, the dots riding them -- opening
            on the homepage's timing.
     scroll the figure HOLDS ITS PLACE on screen while the hero copy leaves, and its
            loops close from the left onto the rightmost one, hinged on the centre line
            like pages on a spine. Before Digital Experiences arrives they are one
            circle, the size of the section's right half, vertical lines 3 to 5.
     areas  the circle STAYS IN THAT SPOT while all four areas scroll past it, and
            changes form for each one -- 01 a nest of ellipses, 02 circles rising on a
            baseline, 03 an orbit with six nodes, 04 one circle made eight in a grid.
            Every change passes back through the single circle, so each area starts
            from one circle. Each featured case study slides OVER it: the figure is on
            the fixed layer under the page content. After the fourth area it lets go
            and scrolls away.

   The figure is drawn on one fixed, full-screen svg (.travel) in screen pixels, placed
   every frame from empty boxes in the layout: .xh__fig in the hero and Digital
   Experiences' .xa__fig. Everything follows the scroll, so it plays back going up.

   STACKED (1023 and below) there is no room beside the copy, so there is no journey and
   no hold: the hero figure scrolls away with the hero, Digital Experiences' circle opens
   into its nest in its own place, and 02-04 draw their own circles in theirs (.xg).

   THE BAR (.xnav) is fixed along the foot of the screen, marks the area you are in,
   and its jumps land each area's header on the circle.

   THE COLOUR is one tone at a time on a full-screen canvas, multiplied onto the page.
   ========================================================================= */
(function () {
  'use strict';
  const XP = window.XP;
  if (!XP) return;
  const NS = 'http://www.w3.org/2000/svg';
  const TAU = Math.PI * 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
  const smooth = XP.smooth;
  const instant = XP.skipIntro || XP.CAPTURE;
  const still = XP.reduced;

  /* ONE INK, AND IT DOES NOT STACK. Every line of every figure is drawn SOLID inside a
     single group (.ink) that is see-through as a whole, at the grid lines' own weight.
     A group's opacity is applied after its contents are composited, so where lines
     overlap -- loops gathering onto one circle, the tight ends of the nest, an echo on
     its loop -- they merge into one line instead of darkening, and no line on the page
     reads heavier than the vertical grid. The dots sit outside the group, solid. */

  // the homepage figure's entrance: 140ms hold, 175ms apart, 560ms each
  const HOLD = 140, DUR = 560, STAGGER = 175, OPENED = HOLD + STAGGER * 3 + DUR;
  const LAP_MIN = 11538, LAP_MAX = 20000;          // expertise.js's lap lengths
  const T0 = performance.now() + (instant ? -1e5 : 380);   // opens with the grid, at 380

  function el(svg, tag, cls) {
    const e = document.createElementNS(NS, tag);
    if (cls) e.setAttribute('class', cls);
    svg.appendChild(e);
    return e;
  }
  // [cx, cy, rx, ry, rotation in radians]
  function setE(e, g) {
    e.setAttribute('cx', g[0].toFixed(2)); e.setAttribute('cy', g[1].toFixed(2));
    e.setAttribute('rx', Math.max(0.75, g[2]).toFixed(2)); e.setAttribute('ry', Math.max(0.75, g[3]).toFixed(2));
    if (g[4]) e.setAttribute('transform', 'rotate(' + (g[4] * 180 / Math.PI).toFixed(3) + ' ' + g[0].toFixed(2) + ' ' + g[1].toFixed(2) + ')');
    else e.removeAttribute('transform');
  }
  function pointOn(g, a) {
    const x = g[2] * Math.cos(a), y = g[3] * Math.sin(a), r = g[4] || 0;
    return [g[0] + x * Math.cos(r) - y * Math.sin(r), g[1] + x * Math.sin(r) + y * Math.cos(r)];
  }
  function ride(d, g, now) {
    if (!d.t0) d.t0 = now - d.ph * d.dur;
    let p = (now - d.t0) / d.dur;
    let lapped = false;
    if (p >= 1) { d.t0 = now; d.dur = LAP_MIN + Math.random() * (LAP_MAX - LAP_MIN); p = 0; lapped = true; }
    const pt = pointOn(g, (still ? 0.25 : p) * TAU * d.dir + Math.PI / 2);
    d.el.setAttribute('cx', pt[0].toFixed(2)); d.el.setAttribute('cy', pt[1].toFixed(2));
    return lapped;
  }

  /* WHERE SOMETHING INSIDE AN AREA'S INTRO SITS WHEN THE INTRO IS NOT HELD. The intro is
     sticky on desktop, so its own box moves while it holds; its section's does not, and
     the intro is the section's first child, so this is the section's top plus the
     element's offset inside the intro -- a viewport y, like getBoundingClientRect's. */
  function naturalTop(node) {
    const intro = node.closest('.xa__intro'), sec = node.closest('.xa');
    if (!intro || !sec) return node.getBoundingClientRect().top;
    return sec.getBoundingClientRect().top + (node.getBoundingClientRect().top - intro.getBoundingClientRect().top);
  }

  /* THE FORM CHANGES UNDER THE FEATURED WORK. Each area's case study is the curtain for
     the change to the next form: the morph runs only while that frame covers the middle
     half of the held circle -- from the frame's top passing the band's top to its bottom
     passing the band's bottom -- so the change happens out of sight and the next area
     arrives with its form already made. One frame per area, in order; the fourth turns
     the form back into the circle for Reasons. */
  const caseFrames = [...document.querySelectorAll('.xa__frame')];
  function coveredMorph(cy, R) {
    let v = 0;
    caseFrames.forEach(f => {
      const r = f.getBoundingClientRect();
      const band = R * 0.5, span = Math.max(1, r.height - 2 * band);
      v += clamp01((cy - band - r.top) / span);
    });
    return v;
  }

  /* ======================================================= the travelling figure */
  const travel  = document.querySelector('.travel');
  const heroBox = document.querySelector('.xh__fig');
  const dxBox   = document.querySelector('.xa__fig[data-fig="1"]');
  const lastArea = document.querySelector('.xa[data-area="4"]');
  // the four loops' half-widths, as fractions of the figure's width
  const RXF = [0.25, 0.125, 0.125, 0.25];
  const SIDE = [-1, -1, 1, 1];
  /* THE GATHER CLOSES FROM THE LEFT, like a page turning over: the leftmost loop goes
     first and the next two follow it (STAGGER_IN), each going edge-on halfway across
     -- its width folding to nothing and opening again -- before it lands full size on
     the rightmost loop, which does not move. Each moving loop drags a short trail of
     echoes (ECHO), later and fainter, which catch up and vanish as it lands. Nothing
     shrinks at the end: what lands is the section's circle at its own size. */
  const STAGGER_IN = [0, 0.14, 0.28, 0];
  // no echoes: during the merge only the four loops themselves move, so it never reads
  // as more than four circles
  const ECHO = [], ECHO_A = [];
  const SPAN = 1 - 0.28 - 0.18;               // so the last echo of the last loop lands at 1
  /* THE FORMS the held circle takes, as NEST ellipses each: [x, y, rx, ry, turn, alpha],
     x/y/rx/ry in circle radii from its centre. Every form has the same count so any two
     blend ellipse for ellipse; a form with fewer parts stacks the rest on its parts at
     alpha 0, so they come into view only as they leave. */
  const NEST = 26;
  const NEST_RX = 0.30, NEST_RY = 0.80, NEST_TILT = -38 * Math.PI / 180, NEST_TWIST = -14 * Math.PI / 180;
  const fill = parts => Array.from({ length: NEST }, (_, k) => {
    const p = parts[k % parts.length];
    return [p[0], p[1], p[2], p[3], p[4] || 0, k < parts.length ? 1 : 0];
  });
  const rc = (x, y, r) => [(x - 340) / 340, (y - 340) / 340, r / 340, r / 340, 0];   // from the 680 square
  const FORM_CIRCLE = fill([[0, 0, 1, 1, 0]]);
  /* 01 DIGITAL EXPERIENCES, after 85ca5488...jpg: two sets of rings nested in the one
     circle, crossing like contours on a sphere -- one closing on a small circle low on
     the left, the other on a tilted oval up on the right. Half the ellipses each; ring
     k of a set slides its centre from the circle's to its focus as it shrinks. */
  const HALF = NEST / 2;
  const ringSet = (fx, fy, rEnd, squash, tilt) => Array.from({ length: HALF }, (_, k) => {
    const t = k / (HALF - 1);
    const r = 1 - (1 - rEnd) * t;
    return [fx * t, fy * t, r, r * (1 - squash * t), tilt * t, 1];
  });
  // [focus x, focus y, end radius, squash, tilt] for each set
  const FOCUS_A = [-0.27, 0.27, 0.13, 0, 0], FOCUS_B = [0.42, -0.42, 0.22, 0.38, -Math.PI / 4];
  const FLOW_S = 2.2;                       // seconds per ring-step of the flow
  const FORM_NEST = ringSet(...FOCUS_A).concat(ringSet(...FOCUS_B));
  /* 02 PERFORMANCE CREATIVE, after caa47ca3...jpg: six circles inside one another, all
     resting on the circle's lowest point and threaded on a vertical line (RISE_LINE),
     with a small node where each one crosses the line at its top. */
  const RISE_R = [1, 0.82, 0.66, 0.52, 0.40, 0.28], NODE_R = 0.022;
  /* 02 PERFORMANCE CREATIVE, after 0c487bb7...jpg: a DONUT CHART in line -- the held
     circle as its outer ring, an inner ring at DONUT_IN, and four dividers across the
     band (drawn below with the rays) whose angles keep shifting, so the segments resize
     like a chart updating. No fill and nothing past the outer ring. */
  const DONUT_IN = 0.58;
  const FORM_RISE = fill([[0, 0, 1, 1, 0], [0, 0, DONUT_IN, DONUT_IN, 0]]);
  // the dividers' resting angles (0 = up, clockwise) and how far each one sways
  // none ever points straight up or down, where it would lie on the grid's fourth line
  // and read heavier than the other verticals
  const DIV_A = [0.35, 1.25, 2.35, 4.35], DIV_SWAY = [0, 0.30, 0.35, 0.30];
  /* 03 AI WORKFLOWS & AUTOMATION, after the 2026-10-21 screenshot: a starburst -- 24
     even rays out of one point, the circle's own radius long, no rim -- turning slowly,
     with one dot running out along a ray and back, then on to the next (RAY_DOT). The
     form itself is only that centre point; the rays are drawn below. */
  const FORM_ORBIT = fill([[0, 0, 0.012, 0.012, 0]]);
  const RAYS = 24, RAY_IN = 0, RAY_SPEED = 0.06;        // radians a second
  const RAY_LEN = Array.from({ length: RAYS }, () => 1);
  const RAY_DOT_MS = 2400;                              // one ray, out and back
  const FORM_GRID  = fill([220, 460].flatMap(y => [130, 270, 410, 550].map(x => rc(x, y, 60))));
  // 04 Content that Scales holds the plain circle FOR NOW (its grid form is kept above)
  const FORMS = [FORM_CIRCLE, FORM_NEST, FORM_RISE, FORM_ORBIT, FORM_CIRCLE, FORM_CIRCLE];
  // 02's line, in circle radii -- vertical, through the centre, past the circle both ways
  const RISE_LINE = [0, -1.3, 0, 1.3];
  const LAG = 0.3;                            // how far the last ellipse trails the first
  /* One ellipse of the form at index S. Between two forms it goes BACK THROUGH THE
     CIRCLE: the first half folds form A into the circle, the second opens it into B.
     (Circle to nest, the first step, is direct -- it starts as the circle.) */
  function formAt(S, k) {
    const last = FORMS.length - 1;
    const i = Math.min(last, Math.max(0, Math.floor(S))), f = clamp01(S - i);
    const A = FORMS[i], B = FORMS[Math.min(last, i + 1)];
    const lag = LAG * k / (NEST - 1);
    const step = u => smooth(clamp01((u - lag) / (1 - LAG)));
    const mix = (P, Q, u) => P.map((v, j) => lerp(v, Q[j], u));
    if (A === FORM_CIRCLE || B === FORM_CIRCLE) return mix(A[k], B[k], step(f));
    return f < 0.5 ? mix(A[k], FORM_CIRCLE[k], step(f * 2)) : mix(FORM_CIRCLE[k], B[k], step(f * 2 - 1));
  }
  // how much of form n is showing at S, for the parts that belong to one form only
  const formWeight = (S, n) => smooth(clamp01(1 - Math.abs(S - n) * 2));

  /* EACH FORM MOVES ONCE IT HAS FORMED, quietly, in the travelling dots' tempo: added to
     the drawn ellipse k, weighted by how far that form is showing (w), so a morph under a
     case study is never disturbed by it.
       01  the two ring sets drift -- their centres circle a little, the sets opposite
       02  (the donut's dividers sway -- drawn with its lines, not here)
       04  a wave of growing and shrinking passes across the grid */
  const RISE_DOT_MS = 5200;
  const GROW_ADD = 0.55, GROW_HOLD = 1.4, GROW_FADE = 0.9;      // 02's cycle, seconds
  const GROW_CYCLE = 5 * GROW_ADD + GROW_HOLD + GROW_FADE + 0.4;
  function idle(f, k, now, w1, w2, w4) {
    if (still || (!w1 && !w2 && !w4)) return f;
    f = f.slice();
    const t = now / 1000;
    if (w1) {
      /* the contours FLOW: every ring but the outer one slides continuously along its
         set from the circle toward the focus, fading as it arrives, while the next comes
         in behind it -- one ring-step every FLOW_S seconds, the two sets out of step */
      const setB = k >= HALF, j = setB ? k - HALF : k;
      if (j > 0) {
        const step = 1 / (HALF - 1);
        const q = (j * step + t / FLOW_S * step + (setB ? step / 2 : 0)) % 1;
        const g = setB ? FOCUS_B : FOCUS_A;
        const r = 1 - (1 - g[2]) * q;
        const flow = [g[0] * q, g[1] * q, r, r * (1 - g[3] * q), g[4] * q, Math.min(1, q / step, (1 - q) / step)];
        f = f.map((v, n) => lerp(v, flow[n], w1));
      }
    }
    if (w4 && k < 8) {
      const col = k % 4, row = Math.floor(k / 4);
      const b = 1 + 0.14 * Math.sin(t * 1.6 - (col + row) * 0.9);
      f[2] *= lerp(1, b, w4); f[3] *= lerp(1, b, w4);
    }
    return f;
  }
  /* NEVER PAST THE CIRCLE: the held figure is lines 3 to 5 and nothing in it may cross
     them, whatever an idle motion or a half-made morph does. An ellipse whose far edge
     would leave the unit circle is shrunk about its own centre until it fits. */
  function inside(f) {
    const ext = Math.hypot(f[0], f[1]), rmax = Math.max(f[2], f[3]);
    if (ext + rmax <= 1) return f;
    const k = Math.max(0, 1 - ext) / rmax;
    f = f.slice(); f[2] *= k; f[3] *= k;
    return f;
  }

  let T = null;
  if (travel && heroBox && dxBox) {
    // echoes first, so the loops draw over their own trails
    const g = el(travel, 'g', 'ink');
    const echoes = [0, 1, 2].map(() => ECHO.map(() => el(g, 'ellipse', 'wire')));
    const loops = RXF.map(() => el(g, 'ellipse', 'wire'));
    const nest  = Array.from({ length: NEST }, () => el(g, 'ellipse', 'wire'));
    const base  = el(g, 'line', 'wire');
    const rays  = Array.from({ length: RAYS }, () => el(g, 'line', 'wire ray'));
    const divs  = DIV_A.map(() => el(g, 'line', 'wire'));
    const rayDot = el(travel, 'circle', 'dot'); rayDot.setAttribute('r', '4'); rayDot.setAttribute('opacity', '0');
    const dots  = [0, 1, 2].map(i => {
      const d = el(travel, 'circle', 'dot');
      d.setAttribute('r', '4'); d.setAttribute('opacity', '0');
      return { el: d, w: i, dir: i % 2 ? 1 : -1, t0: 0, dur: LAP_MIN, ph: Math.random() };
    });
    const riseDot = el(travel, 'circle', 'dot'); riseDot.setAttribute('r', '4'); riseDot.setAttribute('opacity', '0');
    T = { loops, echoes, nest, base, rays, divs, rayDot, riseDot, dots };
    const sizeTravel = () => travel.setAttribute('viewBox', '0 0 ' + innerWidth + ' ' + innerHeight);
    sizeTravel();
    addEventListener('resize', sizeTravel);
  }

  function stepTravel(now) {
    if (!T) return;
    const vh = innerHeight, sy = scrollY;
    const hr = heroBox.getBoundingClientRect(), dr = dxBox.getBoundingClientRect();
    const w = hr.width, h = hr.height;
    const hx = hr.left + w / 2;
    const Hp = hr.top + sy + h / 2;                  // the hero figure's centre, on the page
    // the section circle's centre, on the page -- read against its section, which does
    // not stick, so the intro holding still cannot move it
    const Dp = naturalTop(dxBox) + sy + dr.height / 2;
    const land = Math.max(1, Dp - Hp);               // the scroll at which it lands
    const R = dr.width / 2, dx = dr.left + R;
    /* STACKED THERE IS NO JOURNEY. The section's copy sits ABOVE its circle, so a
       figure held on screen would cross the copy. The hero figure scrolls away with the
       hero, and the section's circle opens into its nest in its own place. */
    const phone = innerWidth <= 1023;
    let cy, g, q, S, hy = null;
    if (phone) {
      hy = Hp - sy; cy = Dp - sy; g = 0;
      q = XP.CAPTURE ? 1 : clamp01((vh * 0.9 - dr.top) / (vh * 0.6));
      S = q;
    } else {
      // HELD from the first scroll until the fourth area has passed, then carried off
      const A4 = lastArea ? lastArea.getBoundingClientRect().bottom + sy : Infinity;
      const release = A4 - (Hp + R);
      cy = Hp - Math.max(0, sy - release);
      // the gather waits for 15% of a screen of scroll -- the hero is read first -- and
      // is done a little past halfway to landing
      const g0 = vh * 0.15, g1 = Math.max(g0 + 1, land * 0.45);
      g = (still || XP.CAPTURE) ? (sy > 4 ? 1 : 0) : clamp01((sy - g0) / (g1 - g0));
      // the nest opens over the 40% of a screen BEFORE landing, so it has formed by the
      // time the circle reaches its section; from there each area's form follows the
      // page (XP.state: 1-4 are the areas)
      // the nest forms over a quarter of a screen, done a third of a screen BEFORE the
      // circle lands, so it is made by the time the area's copy reaches the centre
      q = XP.CAPTURE ? 1 : clamp01((sy - land + vh * 0.58) / (vh * 0.25));
      S = sy < land ? q : 1 + coveredMorph(cy, R);
    }
    const e = now - T0;

    /* One loop's place at gather progress t (0 hero, 1 landed). EVERY LOOP STAYS
       ATTACHED TO THE CENTRE LINE, as on the homepage: a left loop by its right edge, a
       right loop by its left edge. The left loops turn over that line like pages on a
       spine -- their width runs through zero as they stand edge-on and comes out on the
       right -- and the right loops widen in place; all of them grow to the circle's
       size on the way, and the circle they land on is itself tangent to the line. */
    const loopAt = (i, t, open) => {
      const k = smooth(t);
      const half = lerp(w * RXF[i], R, k) * open;         // the loop's half-width
      const y0 = hy === null ? cy : hy;
      // signed: positive on the line's left, negative once turned over to its right
      const side = SIDE[i] < 0 ? Math.cos(Math.PI * k) : -1;
      const s = half * side;
      return [hx - s, y0, Math.max(0.75, Math.abs(s)), lerp(h / 2, R, k), 0];
    };
    const fade = phone ? 1 : 1 - smooth(q * 4);
    T.loops.forEach((L, i) => {
      const open = smooth((e - HOLD - i * STAGGER) / DUR);
      const t = clamp01((g - STAGGER_IN[i]) / SPAN);
      const geo = loopAt(i, t, open);
      setE(L, geo);
      /* Faded in WITH the opening. Folded flat on the centre line, a loop still draws a
         line down each of its sides, and four of them stacked into a bar on top of the
         grid's own line before the figure had opened. Now nothing shows until a loop
         starts to open, and the centre line is the grid's alone. */
      const shown = smooth(open * 4);
      L.setAttribute('opacity', (fade * shown).toFixed(3));
      L.geo = geo;
      if (i < 3) T.echoes[i].forEach((E, j) => {
        const te = clamp01((g - STAGGER_IN[i] - ECHO[j]) / SPAN);
        setE(E, loopAt(i, te, open));
        // seen only while moving: nothing at rest, nothing once landed
        E.setAttribute('opacity', (ECHO_A[j] * Math.sin(Math.PI * te) * fade * shown).toFixed(3));
      });
    });
    const w1 = phone ? 0 : formWeight(S, 1), w2 = phone ? 0 : formWeight(S, 2), w4 = 0;   // 04's grid wave is off while it holds the circle
    T.nest.forEach((N, k) => {
      const f = inside(idle(formAt(S, k), k, now, w1, w2, w4));
      const geo = [dx + f[0] * R, cy + f[1] * R, f[2] * R, f[3] * R, f[4]];
      setE(N, geo);
      N.setAttribute('opacity', ((phone ? 1 : smooth(q * 4)) * f[5]).toFixed(3));
      N.geo = geo;
    });
    // 02's line draws out from the centre, both ways
    const bw = phone ? 0 : formWeight(S, 2), bw2 = bw;
    T.base.setAttribute('x1', (dx + RISE_LINE[0] * R).toFixed(2));
    T.base.setAttribute('x2', (dx + RISE_LINE[2] * R).toFixed(2));
    T.base.setAttribute('y1', (cy + lerp(0, RISE_LINE[1], bw) * R).toFixed(2));
    T.base.setAttribute('y2', (cy + lerp(0, RISE_LINE[3], bw) * R).toFixed(2));
    // NOT DRAWN: 02's spine sits exactly on the grid's fourth line, and a second line
    // over it read heavier than the other verticals -- the grid line is the spine
    T.base.setAttribute('opacity', '0');
    // 02's dividers: from the inner ring to the outer, each swaying about its angle on
    // its own slow period, the first one fixed
    T.divs.forEach((L, i) => {
      const a = DIV_A[i] + (still ? 0 : DIV_SWAY[i] * Math.sin(now / 1000 * 0.45 + i * 1.7)) - Math.PI / 2;
      const c = Math.cos(a), sn = Math.sin(a), r0 = DONUT_IN * R, r1 = R * lerp(DONUT_IN, 1, bw2);
      L.setAttribute('x1', (dx + c * r0).toFixed(2)); L.setAttribute('y1', (cy + sn * r0).toFixed(2));
      L.setAttribute('x2', (dx + c * r1).toFixed(2)); L.setAttribute('y2', (cy + sn * r1).toFixed(2));
      L.setAttribute('opacity', bw2.toFixed(3));
    });
    // 02's dot climbs the line through the nodes, bottom to top, and starts again
    {
      const u = still ? 0.5 : (now % RISE_DOT_MS) / RISE_DOT_MS;
      const y = 1.25 - 2.5 * smooth(u);
      T.riseDot.setAttribute('cx', dx.toFixed(2));
      T.riseDot.setAttribute('cy', (cy + y * R).toFixed(2));
      T.riseDot.setAttribute('opacity', '0');             // no travelling dots in the areas
    }
    // 03's rays grow out from the ringed centre and turn slowly
    const aw = phone ? 0 : formWeight(S, 3);
    const spin = still ? 0 : now / 1000 * RAY_SPEED;
    T.rays.forEach((L, i) => {
      const a = spin + i / RAYS * TAU, c = Math.cos(a), sn = Math.sin(a);
      const r0 = RAY_IN * R, r1 = lerp(RAY_IN, RAY_LEN[i], aw) * R;
      L.setAttribute('x1', (dx + c * r0).toFixed(2)); L.setAttribute('y1', (cy + sn * r0).toFixed(2));
      L.setAttribute('x2', (dx + c * r1).toFixed(2)); L.setAttribute('y2', (cy + sn * r1).toFixed(2));
      L.setAttribute('opacity', aw.toFixed(3));
    });
    // the dot on the rays: out along one and back, then the next ray round
    {
      const u = (still ? 0.5 : (now % RAY_DOT_MS) / RAY_DOT_MS);
      const ray = still ? 3 : Math.floor(now / RAY_DOT_MS) % RAYS;
      const a = spin + ray / RAYS * TAU;
      const r = R * (0.12 + 0.76 * (0.5 - 0.5 * Math.cos(TAU * u)));
      T.rayDot.setAttribute('cx', (dx + Math.cos(a) * r).toFixed(2));
      T.rayDot.setAttribute('cy', (cy + Math.sin(a) * r).toFixed(2));
      T.rayDot.setAttribute('opacity', '0');              // no travelling dots in the areas
    }
    if (e < OPENED) return;
    /* THE DOTS BELONG TO THE RESTING HERO: they fade over the first 15% of a screen of
       scroll and are gone by the time the loops START to merge, so they never ride a loop
       that is moving; they come back as you return to the top. */
    const dotsShown = phone ? 1 : 1 - smooth(scrollY / (innerHeight * 0.15));
    T.dots.forEach((d, n) => {
      d.el.setAttribute('opacity', dotsShown.toFixed(3));
      // on the loops until they have gathered, then round the held form's outer ellipse
      if (q > 0.5) { ride(d, T.nest[0].geo, now); return; }
      if (ride(d, T.loops[d.w].geo, now)) {
        const taken = T.dots.filter(o => o !== d).map(o => o.w);
        const free = [0, 1, 2, 3].filter(i => taken.indexOf(i) < 0);
        d.w = free[Math.floor(Math.random() * free.length)];
      }
    });
  }

  /* ================================================== 02-04: their own figures */
  const W = 680, H = 680, PAD = 8, M = 340;
  const C = (cx, cy, r) => [cx, cy, r, r, 0];
  // each area's shape, in a square the circle's size; eight copies of the circle build it
  const SHAPES = {
    2: { parts: [C(M, M, 300), C(M, M, 300 * 0.58)], lines: [] },                       // the donut's two rings
    3: { parts: [C(M, M, 300), C(M, M, 14), C(M, M, 23), C(M, M, 32)], lines: [] },          // ringed centre
    4: { parts: [C(M, M, M)], lines: [] }                                                 // the circle, for now
  };
  const SRC = C(M, M, M);
  const figs = [...document.querySelectorAll('.xg')].map(svg => {
    const n = +svg.dataset.graphic, S = SHAPES[n];
    svg.setAttribute('viewBox', [-PAD, -PAD, W + 2 * PAD, H + 2 * PAD].join(' '));
    const g = el(svg, 'g', 'ink');
    const parts = Array.from({ length: 8 }, () => el(g, 'ellipse', 'wire'));
    const lines = S.lines.map(() => el(g, 'line', 'wire'));
    const d = el(svg, 'circle', 'dot'); d.setAttribute('opacity', '0');
    return { svg, S, parts, lines, dot: { el: d, dir: 1, t0: 0, dur: LAP_MIN, ph: Math.random() } };
  });
  function sizeFigs() {
    figs.forEach(f => {
      const w = f.svg.getBoundingClientRect().width;
      if (w) f.dot.el.setAttribute('r', (4 * (W + 2 * PAD) / w).toFixed(2));
    });
  }
  sizeFigs();
  addEventListener('resize', sizeFigs);

  function stepFig(f, now) {
    if (innerWidth > 1023) return;                   // side by side, the held figure is theirs
    const vh = innerHeight, r = f.svg.getBoundingClientRect();
    if (r.bottom < -50 || r.top > vh + 50) return;
    const p = XP.CAPTURE ? 1 : clamp01((vh * 0.9 - r.top) / (vh * 0.6));
    f.parts.forEach((e, i) => {
      const q = smooth((p - i * 0.05) / 0.6);
      const t = f.S.parts[i % f.S.parts.length];
      setE(e, [0, 1, 2, 3, 4].map(j => lerp(SRC[j], t[j], q)));
    });
    const lq = smooth((p - 0.55) / 0.45);
    f.S.lines.forEach((L, i) => {
      const mx = (L[0] + L[2]) / 2, my = (L[1] + L[3]) / 2, l = f.lines[i];
      l.setAttribute('x1', lerp(mx, L[0], lq).toFixed(2)); l.setAttribute('y1', lerp(my, L[1], lq).toFixed(2));
      l.setAttribute('x2', lerp(mx, L[2], lq).toFixed(2)); l.setAttribute('y2', lerp(my, L[3], lq).toFixed(2));
      l.setAttribute('opacity', lq > 0.01 ? '1' : '0');
    });
    const formed = p > 0.97;
    f.dot.el.setAttribute('opacity', formed ? '1' : '0');
    if (formed) ride(f.dot, f.S.parts[0], now);
  }

  /* ================================================================ the bar */
  /* Fixed along the foot of the screen: it takes its ground once the page moves, slides
     out as Reasons arrives, and underlines the area you are in. */
  const bar = document.querySelector('.xnav');
  const reasonsEl = document.getElementById('reasons');
  const links = bar ? [...bar.querySelectorAll('a')] : [];
  let on = -1;

  /* A JUMP LANDS THE AREA'S HEADER ON THE CIRCLE: the copy's centre at the held circle's
     centre, which is the hero figure's centre on the first screen -- the middle of the
     screen. Stacked there is no held circle, so the header comes to the middle. */
  links.forEach(a => a.addEventListener('click', e => {
    const id = (a.getAttribute('href') || '').slice(1);
    const copy = id && document.querySelector('#' + id + ' .xa__text');
    if (!copy) return;
    e.preventDefault();
    const fig = document.querySelector('.xh__fig');
    const mid = innerWidth > 1023 && fig
      ? fig.getBoundingClientRect().top + scrollY + fig.getBoundingClientRect().height / 2
      : innerHeight / 2;
    const c = copy.getBoundingClientRect();
    scrollTo({ top: Math.max(0, naturalTop(copy) + scrollY + c.height / 2 - mid),
               behavior: XP.reduced ? 'auto' : 'smooth' });
    history.replaceState(null, '', '#' + id);
  }));
  function markBar() {
    if (!bar) return;
    bar.classList.toggle('is-stuck', scrollY > 4);
    bar.classList.toggle('is-off', !!reasonsEl && reasonsEl.getBoundingClientRect().top < innerHeight * 0.85);
    const i = Math.round(XP.state());
    const n = i >= 1 && i <= 4 ? i - 1 : -1;
    if (n === on) return;
    on = n;
    links.forEach((a, j) => {
      a.classList.toggle('is-on', j === n);
      if (j === n) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }

  /* ============================================================= the colour */
  /* ONE TONE AT A TIME: the brand's red (--red, the homepage hero's), blue (--blue,
     Work's) or teal (--teal, Proof's), as five masses of its own shades. Hero red, 01
     blue, 02 red, 03 teal, 04 blue, Reasons red and quieter. */
  const tone = c => [
    [c[0], -0.10,  0.45, 1.45, 0.66], [c[1],  0.70,  0.15, 1.05, 0.52],
    [c[2], -0.70, -0.20, 1.05, 0.50], [c[3],  0.20, -0.65, 1.00, 0.48],
    [c[4],  0.05,  0.05, 0.75, 0.40] ];
  const RED  = ['#ea521a', '#f5381a', '#eb501b', '#ffa385', '#e7521d'];
  const BLUE = ['#0587c1', '#0470a0', '#64b5d9', '#a0d1e7', '#6cccf9'];
  const TEAL = ['#289581', '#197062', '#4ac4b0', '#b1fbec', '#008f77'];
  const STATES = [tone(RED), tone(BLUE), tone(RED), tone(TEAL), tone(BLUE), tone(RED)];
  const STRENGTH = [1, 1, 1, 1, 1, 0.45];
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  STATES.forEach(s => s.forEach(m => { m[0] = rgb(m[0]); }));
  const TURN = Math.PI / 4, SPIN = 0.00035, RES = 0.35;
  const DRIFT = STATES[0].map((_, i) => ({ px: 9 + i * 2.3, py: 11 + i * 1.7, ph: i * 1.9,
                                           amp: 0.08 + 0.02 * (i % 3) }));
  const field = document.querySelector('.field');
  const ctx = field && field.getContext('2d');
  let FW = 0, FH = 0;
  function sizeField() {
    if (!field) return;
    FW = Math.max(2, Math.round(innerWidth * RES));
    FH = Math.max(2, Math.round(innerHeight * RES));
    field.width = FW; field.height = FH;
  }
  sizeField();
  addEventListener('resize', sizeField);
  let ptr = null;
  addEventListener('pointermove', e => { ptr = { x: e.clientX, y: e.clientY }; }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { ptr = null; });
  const lean = { x: 0, y: 0 };
  let idx = XP.state();

  function paintField(now) {
    if (!ctx) return;
    const t = now / 1000;
    const target = XP.state();
    idx = still ? target : idx + (target - idx) * 0.08;
    const last = STATES.length - 1;
    const i0 = Math.min(last, Math.floor(idx)), i1 = Math.min(last, i0 + 1);
    const f = smooth(idx - i0);
    const fade = instant ? 1 : smooth((now - T0 - 100) / 1100);     // the hero gradient's cue, 480ms
    field.style.opacity = (fade * lerp(STRENGTH[i0], STRENGTH[i1], f)).toFixed(3);
    const col = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--col')) || 340;
    const R = Math.min(2 * col, innerHeight * 0.72) / 2 * RES;
    let lx = 0, ly = 0;
    if (ptr) { lx = (ptr.x / innerWidth - 0.5) * 0.35; ly = (ptr.y / innerHeight - 0.5) * 0.35; }
    lean.x += (lx - lean.x) * 0.04; lean.y += (ly - lean.y) * 0.04;
    const A = STATES[i0], B = STATES[i1];
    const rot = idx * TURN + scrollY * SPIN, c = Math.cos(rot), s = Math.sin(rot);
    const mv = still ? 0 : 1;
    ctx.clearRect(0, 0, FW, FH);
    for (let k = 0; k < A.length; k++) {
      const a = A[k], b = B[k], d = DRIFT[k];
      const cs = [0, 1, 2].map(j => Math.round(lerp(a[0][j], b[0][j], f))).join(',');
      const x = lerp(a[1], b[1], f) + mv * d.amp * Math.sin(TAU * t / d.px + d.ph) + lean.x;
      const y = lerp(a[2], b[2], f) + mv * d.amp * 0.7 * Math.cos(TAU * t / d.py + d.ph) + lean.y;
      const rr = lerp(a[3], b[3], f) * R, al = lerp(a[4], b[4], f);
      const px = FW / 2 + (x * c - y * s) * R, py = FH / 2 + (x * s + y * c) * R;
      const g = ctx.createRadialGradient(px, py, 0, px, py, rr);
      g.addColorStop(0,    'rgba(' + cs + ',' + al + ')');
      g.addColorStop(0.40, 'rgba(' + cs + ',' + (al * 0.66) + ')');
      g.addColorStop(0.72, 'rgba(' + cs + ',' + (al * 0.24) + ')');
      g.addColorStop(1,    'rgba(' + cs + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, FW, FH);
    }
  }

  (function frame(now) {
    now = now || performance.now();
    stepTravel(now);
    figs.forEach(f => stepFig(f, now));
    markBar();
    paintField(now);
    requestAnimationFrame(frame);
  })();
})();
