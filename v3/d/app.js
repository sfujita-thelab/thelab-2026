/* ============================================================================
   APP — WebGL2 setup and the render loop.
   No libraries, no build step. Everything tunable lives in config.js.
   ========================================================================= */
(function () {
  'use strict';

  const canvas = document.getElementById('stage');
  const NOGL = /[?&]nogl=1/.test(location.search);
  const gl = !NOGL && canvas.getContext('webgl2', {
    alpha: false, antialias: false, depth: false, stencil: false,
    premultipliedAlpha: false, powerPreference: 'high-performance'
  });

  if (!gl) {
    if (!NOGL) document.getElementById('fallback').hidden = false;
    // still publish the grid vars so the type lays out correctly
    const rs = document.documentElement.style, cw = window.innerWidth;
    const mg = Math.min(CONFIG.grid.marginMax, Math.max(CONFIG.grid.marginMin, cw * CONFIG.grid.marginVW / 100));
    rs.setProperty('--m', mg + 'px');
    rs.setProperty('--col', ((cw - mg * 2) / gridCols()) + 'px');
    rs.setProperty('--u', (cw / 1440) + 'px');
    rs.setProperty('--pad-top', (mg * 0.65) + 'px');
    rs.setProperty('--pad-bottom', (window.innerHeight * 0.0815) + 'px');
    // no WebGL: the grid still has to appear, since app.js owns drawing it
    const g = document.querySelector('.page-grid');
    if (g) {
      const n = gridCols();
      const colW = (cw - mg * 2) / n;
      g.style.setProperty('--grid-a', String(CONFIG.grid.alpha));
      g.innerHTML = '';
      for (let i = 0; i <= n; i++) {
        const el = document.createElement('i');
        el.style.left = (mg + colW * i) + 'px';
        el.style.width = CONFIG.grid.widthPx + 'px';
        g.appendChild(el);
      }
      g.classList.add('drawn', 'toned', 'settled');
    }
    return;
  }

  /* ------------------------------------------------------------- utilities */
  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const v = parseInt(h, 16);
    return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
  }

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      console.error(log, src.split('\n').map((l, i) => (i + 1) + ': ' + l).join('\n'));
      throw new Error('Shader compile failed: ' + log);
    }
    return s;
  }

  function program(fragSrc) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error('Link failed: ' + gl.getProgramInfoLog(p));
    }
    // cache uniform locations
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      const name = info.name.replace(/\[0\]$/, '');
      u[name] = gl.getUniformLocation(p, name);
    }
    return { p, u };
  }

  /* -------------------------------------------- float render target support */
  const hasFloat = !!gl.getExtension('EXT_color_buffer_float');
  if (hasFloat) gl.getExtension('OES_texture_float_linear');
  const IFMT = hasFloat ? gl.RGBA16F : gl.RGBA8;
  const TYPE = hasFloat ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;

  function makeTarget() {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo, w: 0, h: 0 };
  }

  function sizeTarget(t, w, h) {
    if (t.w === w && t.h === h) return;
    t.w = w; t.h = h;
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, IFMT, w, h, 0, gl.RGBA, TYPE, null);
  }

  /* ---- URL overrides -------------------------------------------------------
     ?set=corona.intensity:1.4,blob.scale:1.2   temporarily override any config
     ?ptr=0.62,0.45                             park the pointer lens (0..1 of vp)
     ?freeze=12.5                               pin the animation at that moment
     ?clean=1                                   hide the on-screen hint
     Handy for sharing a specific look, or grabbing a repeatable still.        */
  const setParam = /[?&]set=([^&]+)/.exec(location.search);
  if (setParam) {
    decodeURIComponent(setParam[1]).split(',').forEach(pair => {
      const [path, raw] = pair.split(':');
      if (!path || raw === undefined) return;
      const keys = path.trim().split('.');
      const last = keys.pop();
      const obj = keys.reduce((o, k) => (o && o[k] !== undefined) ? o[k] : null, CONFIG);
      if (obj && obj[last] !== undefined) obj[last] = parseFloat(raw);
    });
  }

  const ptrParam = /[?&]ptr=([\d.]+),([\d.]+)/.exec(location.search);
  const STILL = /[?&]still=1/.test(location.search);

  const NPOLES = CONFIG.poles.length;

  const progGradient  = program(FRAG_GRADIENT.replace('__NPOLES__', String(NPOLES)));
  const progBlur      = program(FRAG_BLUR);
  const progComposite = program(FRAG_COMPOSITE);

  const tGrad = makeTarget();
  const tPing = makeTarget();
  const tPong = makeTarget();

  const vao = gl.createVertexArray();   // empty VAO; the vertex shader is attributeless
  gl.bindVertexArray(vao);

  function draw() { gl.drawArrays(gl.TRIANGLES, 0, 3); }

  function bindTarget(t) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
    gl.viewport(0, 0, t.w, t.h);
  }

  /* ---------------------------------------------------------------- layout */
  const L = { cssW: 0, cssH: 0, dpr: 1, aspect: 1, margin: 0, radius: 0 };

  /* How many columns the grid is drawn on, which is not a constant any more: narrow
     viewports take CONFIG.grid.columnsMobile. Asked through ONE function so the CSS
     variable, the <i> elements and the shader's own grid can never disagree about it
     -- they are three separate drawings of the same lines. */
  function gridCols() {
    const n = (window.innerWidth <= CONFIG.grid.columnsMobileAt)
            ? CONFIG.grid.columnsMobile : CONFIG.grid.columns;
    return Math.max(1, Math.round(n));
  }

  function layout() {
    const cssW = Math.max(1, window.innerWidth);
    const cssH = Math.max(1, window.innerHeight);
    const dpr  = Math.min(window.devicePixelRatio || 1, CONFIG.render.dprMax);

    L.cssW = cssW; L.cssH = cssH; L.dpr = dpr;
    L.aspect = cssW / cssH;

    // grid margin, matching hero.png's 40px at 1440 wide
    L.margin = Math.min(CONFIG.grid.marginMax,
               Math.max(CONFIG.grid.marginMin, cssW * CONFIG.grid.marginVW / 100));

    // The circle is a GRID object: its radius is exactly one column, so its rim
    // always lands on the grid lines either side of centre -- at every viewport
    // width, with no pixel values involved. Horizontal lock comes free: the middle
    // grid line sits at margin + 2*col, which is cssW/2 for ANY margin, so
    // centerX 0.50 is that line by construction rather than by coincidence.
    //
    // maxRadiusVH used to cap this against viewport height, and that cap was the
    // bug. One column and 0.42vh are equal only at 16:9; on anything wider the cap
    // won, the circle shrank below a column and drifted off the lines. Wider than
    // 16:9 is the common case, not the edge case -- browser chrome eats height, so
    // a maximised 2560x1440 window renders at about 2560x1350, where the cap was
    // costing the circle ~37px of radius. The marginMax clamp compounded it above
    // ~2590px wide, where the margin stops growing and columns widen faster still.
    //
    // It is therefore off (0) by default. Set it above 0 only as a guard for
    // extreme letterbox viewports -- past roughly 2.15:1 a full column is taller
    // than the viewport -- accepting that whenever it engages it buys the circle
    // back into frame by breaking exactly the grid alignment it is meant to keep.
    const col = (cssW - L.margin * 2) / gridCols();
    let   rPx = col * CONFIG.circle.radiusScale;
    const capVH = CONFIG.circle.maxRadiusVH;
    if (capVH > 0) rPx = Math.min(rPx, cssH * capVH);
    L.radius = rPx / cssH;                      // into p-space (1 unit = viewport height)

    const w = Math.round(cssW * dpr), h = Math.round(cssH * dpr);
    canvas.width = w; canvas.height = h;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';

    // hand the same grid maths to CSS so the type sits on the shader's columns
    const rs = document.documentElement.style;
    rs.setProperty('--m', L.margin.toFixed(2) + 'px');
    rs.setProperty('--col', col.toFixed(2) + 'px');
    // the design unit: 1 = 1px on the 1440-wide reference artboards
    rs.setProperty('--u', (cssW / 1440).toFixed(5) + 'px');
    rs.setProperty('--pad-top', (L.margin * 0.65).toFixed(2) + 'px');
    // in px, from the same cssH the shader uses — NOT vh, which browsers resolve
    // inconsistently and which would let the type drift off the circle's geometry
    rs.setProperty('--pad-bottom', (cssH * 0.0815).toFixed(2) + 'px');

    buildGrid(col);
    /* The headline's `top` is transitioned once .is-placed is on, and a resize must not
       animate -- the block would slide around while the window is being dragged. Drop the
       class for this pass and put it back on the next frame. */
    const h1Now = document.querySelector('h1');
    const wasPlaced = h1Now && h1Now.classList.contains('is-placed');
    if (wasPlaced) h1Now.classList.remove('is-placed');
    alignHeadlineInk();
    if (wasPlaced) requestAnimationFrame(() => h1Now.classList.add('is-placed'));

    const gw = Math.max(2, Math.round(w * CONFIG.render.gradScale));
    const gh = Math.max(2, Math.round(h * CONFIG.render.gradScale));
    sizeTarget(tGrad, gw, gh);

    const bw = Math.max(2, Math.round(w * CONFIG.render.blurScale));
    const bh = Math.max(2, Math.round(h * CONFIG.render.blurScale));
    sizeTarget(tPing, bw, bh);
    sizeTarget(tPong, bw, bh);

    /* The page grid has just moved. Anything that COPIES it -- the footer's own vertical
       lines do, by measuring these rects -- has to be told, because this runs on an 80ms
       debounce after a resize while a plain resize listener fires immediately. Without
       this the footer rebuilt from the grid's pre-resize positions and then never heard
       about the real move, which is exactly how its lines drifted out of alignment. */
    dispatchEvent(new CustomEvent('hp:layout'));
  }

  /* Timing for the load sequence. Declared up here because buildGrid() needs the
     stagger when layout() first runs. */
  const INTRO_T = { gridStart: 380, gridStagger: 70, gridDur: 700 };

  /* ----------------------------------------------------------- page-level grid */
  /* The grid draws itself ONCE, during the hero intro, and is a plain static layer
     for the whole rest of the page. gridLocked is what guarantees that: layout()
     re-runs on resize and calls buildGrid() again, and without the lock each of
     those rebuilds would re-arm the per-line stagger and the colour transition.
     Once locked, buildGrid only ever repositions the lines. */
  let gridLocked = false;

  function lockGrid() {
    gridLocked = true;
    const host = document.querySelector('.page-grid');
    if (!host) return;
    host.classList.add('drawn', 'toned', 'settled');
    [...host.children].forEach(el => { el.style.transitionDelay = ''; });
  }

  function buildGrid(colWidth) {
    const host = document.querySelector('.page-grid');
    if (!host) return;
    host.style.setProperty('--grid-a', String(CONFIG.grid.alpha));
    const n = gridCols();
    if (host.children.length !== n + 1) {
      host.innerHTML = '';
      for (let i = 0; i <= n; i++) host.appendChild(document.createElement('i'));
      // a rebuild after the intro must come back already finished, never armed
      if (gridLocked) host.classList.add('drawn', 'toned', 'settled');
    }
    [...host.children].forEach((el, i) => {
      el.style.left = (L.margin + colWidth * i).toFixed(2) + 'px';
      el.style.width = CONFIG.grid.widthPx + 'px';
      el.style.transitionDelay = gridLocked
        ? ''
        : (INTRO_T.gridStart + i * INTRO_T.gridStagger) + 'ms';
    });
  }

  /* ------------------------------------------------------- typographic alignment */
  /* hero.png positions the headline by its INK (cap-top / baseline), but CSS can
     only bottom-align the LINE BOX, and how much slack a line box carries depends
     entirely on the font's ascent metrics. So box-anchoring alone puts the type in
     a different place for every typeface.

     Boxes (the CTA pill) are right to align by box. Text is not. This measures the
     resolved font's real metrics and nudges the headline so its ink lands on the
     grid — which keeps it correct if the brand face is swapped in later.          */
  const HEADLINE_CAP_TOP = 505 / 810;   // measured off hero.png
  const FOOT_BOTTOM      = 744 / 810;   // the CTA pill's bottom edge

  function alignHeadlineInk() {
    const h1 = document.querySelector('h1');
    if (!h1) return;

    /* NOTHING TO ALIGN IN THE STACKED LAYOUT. Below 1024 the hero is a flow column and
       the two blocks follow each other; the centring below is for the side-by-side
       composition only.

       This has to clear what it wrote, not just skip: .hero__aside is static at every
       width now, so the margin-top this used to set still applies when the layout
       stacks -- which pushed the body and CTA 405px below the headline at 900. A plain
       early return would leave that margin in place on the way down from desktop. */
    if (window.innerWidth <= CONFIG.grid.mobileAt) {
      h1.style.top = '';
      const f = document.querySelector('.hero__aside');
      if (f) f.style.marginTop = '';
      return;
    }

    /* Both blocks are centred on the MARK, and only ever upward.

       The mark replaced the circle at the same place, so its centre is still
       circle.centerY of the viewport height. Each block is centred on that line
       instead of hanging off the old shared baseline at 744/810.

       "Only move up" is the Math.min: the hung position is kept as a FLOOR, so on a
       short or wide viewport -- where the blocks are already high and centring them
       would push them back down toward the fold -- nothing moves. On every normal
       viewport the centred position is the higher of the two and wins.

       Centred on the BOX, not on the ink. The ink alignment below still decides where
       the headline's baseline sits relative to its own box; this only moves the block
       as a whole. */
    const markY = L.cssH * CONFIG.circle.centerY;

    // The right-hand column: its bottom edge used to be the shared baseline.
    const foot = document.querySelector('.hero__aside');
    const footBottom = L.cssH * FOOT_BOTTOM;
    if (foot) {
      /* marginTop, not top: .hero__aside is static now and a static box ignores `top`.
         Zeroed first for the same reason it always was -- the height has to be read
         with the block at rest, not at wherever the last pass left it. */
      foot.style.marginTop = '0px';
      const fh = foot.getBoundingClientRect().height;
      foot.style.marginTop = Math.min(footBottom - fh, markY - fh / 2).toFixed(2) + 'px';
    }

    /* Measure a CLONE, not the live headline. The live one may be armed or
       mid-animation, and its masks' transforms would be baked into any
       getBoundingClientRect() reading — which silently moved the headline by a
       whole line. The clone is stripped of all animation state. */
    const probe = h1.cloneNode(true);
    probe.querySelectorAll('.mask').forEach(m => {
      m.classList.remove('pre', 'hpre');
      m.style.transition = 'none';
    });
    probe.querySelectorAll('.mask > span').forEach(sp => {
      sp.style.transition = 'none';
      sp.style.transform = 'none';
      sp.style.opacity = '1';
    });
    probe.style.visibility = 'hidden';
    probe.style.transform = 'none';
    probe.style.top = '0px';
    h1.parentNode.appendChild(probe);

    const masks = [...probe.querySelectorAll(':scope > .mask')];
    const host  = probe.querySelector('.mask > span') || probe;
    const strut = document.createElement('span');
    strut.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    host.insertBefore(strut, host.firstChild);

    const baseline = strut.getBoundingClientRect().bottom;
    const probeBox = probe.getBoundingClientRect();
    const boxTop   = probeBox.top;
    const probeH   = probeBox.height;        // the headline's own box, for the centring
    let adv = parseFloat(getComputedStyle(probe).lineHeight) || 0;
    if (masks.length > 1) adv = masks[1].offsetTop - masks[0].offsetTop;
    probe.remove();

    if (!isFinite(baseline) || !isFinite(boxTop)) return;

    /* ALWAYS CENTRED on the mark, with no floor. It used to be
       Math.min(hung, markY - probeH / 2) -- the hung position, with its last line's
       baseline on the column's bottom, kept as a floor so a short or wide viewport
       would not push the block back down toward the fold.

       The floor goes because the headline can now take a second line when a keyword is
       too long for the measure, and the block has to stay centred on the mark through
       that change rather than being held by a baseline that assumes a line count. The
       probe's height already reflects the real wrapped height, so this re-centres on
       every swap that changes it (watchHeadline observes the box). */
    h1.style.top = (markY - probeH / 2).toFixed(2) + 'px';
  }

  /* The offset above is only valid for the line count it was measured at. On first
     paint the headline can still be wrapped under a fallback font; when the real
     face resolves it reflows and the old offset is stale (which shows up as the
     type sitting exactly one line too low). Re-measure whenever the box changes. */
  function watchHeadline() {
    const h1 = document.querySelector('h1');
    if (!h1) return;
    if (typeof ResizeObserver === 'function') {
      let last = 0;
      new ResizeObserver(() => {
        const h = h1.getBoundingClientRect().height;
        /* 0.1, not 0.5: this now tracks a height TRANSITION frame by frame, and the
           last frames of an ease move less than half a pixel each -- at 0.5 the block
           stopped a little short of where the box ended up. */
        if (Math.abs(h - last) < 0.1) return;
        last = h;
        /* THE FAST PATH, and it is the one that runs on every line-count change.
           alignHeadlineInk measures a CLONE, which is right for a font settling or a
           resize but is far too much work to do 30 times across a half-second
           transition -- and it is not needed here: the clone exists to strip entrance
           transforms, and by .is-placed there are none. The live box's height is the
           same number the clone would report, so the centring is the same maths
           against a reading that costs nothing. */
        if (h1.classList.contains('is-placed') &&
            window.innerWidth > CONFIG.grid.mobileAt) {
          h1.style.top = (L.cssH * CONFIG.circle.centerY - h / 2).toFixed(2) + 'px';
          return;
        }
        alignHeadlineInk();
      }).observe(h1);
    }
    // belt and braces for browsers that resolve system fonts after first paint
    requestAnimationFrame(() => requestAnimationFrame(alignHeadlineInk));
    /* and only THEN is the block allowed to animate: everything up to here is the first
       placement, which has to be instant. Every move after it is a line-count change. */
    setTimeout(() => { alignHeadlineInk(); h1.classList.add('is-placed'); }, 250);
  }

  /* --------------------------------------------------------------- pointer */
  /* grip is how much the GRADIENT is currently held by the pointer, as opposed to
     active, which is whether the pointer is on the page at all. A cursor sitting
     still lets grip decay, and the mass drifts back onto its own wander. */
  const ptr = { x: 0, y: 0, tx: 0, ty: 0, active: 0, want: 0, seen: false,
                grip: 0, lastMove: -1e9 };

  // the whole mesh leaning toward the cursor — eased far more heavily than the
  // pointer lens, so it reads as mass rather than tracking
  const follow = { x: 0, y: 0 };

  // the big lens tracks the pointer on its OWN, much slower spring, so the
  // distortion trails the cursor instead of being glued to it
  const lens = { x: 0, y: 0, active: 0 };

  function pointerTo(clientX, clientY) {
    const sx = clientX / L.cssW, sy = clientY / L.cssH;
    ptr.tx = (sx - 0.5) * L.aspect;
    ptr.ty = (sy - 0.5);
    if (!ptr.seen) { ptr.x = ptr.tx; ptr.y = ptr.ty; ptr.seen = true; }
    ptr.want = 1;
    ptr.lastMove = performance.now();     // what the idle release is measured from
  }

  if (ptrParam) {
    const fx = parseFloat(ptrParam[1]), fy = parseFloat(ptrParam[2]);
    ptr.tx = ptr.x = (fx - 0.5) * (window.innerWidth / window.innerHeight);
    ptr.ty = ptr.y = (fy - 0.5);
    ptr.active = ptr.want = 1;
    ptr.grip   = 1;
    ptr.lastMove = Infinity;              // parked: never counts as idle
    ptr.seen = true;
    // snap the slow-eased lens too, so a frozen still shows its settled state
    lens.x = ptr.tx; lens.y = ptr.ty; lens.active = 1;
    follow.x = ptr.tx * CONFIG.pointer.gradFollow;
    follow.y = ptr.ty * CONFIG.pointer.gradFollow * (CONFIG.pointer.gradFollowY || 1);
  }

  window.addEventListener('pointermove', e => {
    if (ptrParam) return;                 // parked by URL, ignore real movement
    pointerTo(e.clientX, e.clientY);
  }, { passive: true });
  window.addEventListener('pointerleave', () => { ptr.want = 0; }, { passive: true });
  window.addEventListener('blur', () => { ptr.want = 0; });

  /* --------------------------------------------------- pole simulation (CPU) */
  /* Orbits and breathing are constant across the screen, so they belong here
     rather than being recomputed per pixel in the shader. Two position sets:
     the silhouette barely drifts, the colour poles run sustained elliptical
     orbits. Sustained is the key word — a noise random-walk wanders and settles,
     which is why the motion used to decay to a standstill.                     */

  const wander = { x: 0, y: 0 };
  const shapePos = new Float32Array(NPOLES * 2);
  const colorPos = new Float32Array(NPOLES * 2);
  const poleRad  = new Float32Array(NPOLES);
  const poleCol  = new Float32Array(NPOLES * 3);

  function hash1(n) {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  const TAU = Math.PI * 2;

  function simulatePoles(t) {
    const B = CONFIG.blob;
    const bg = hexToRgb(CONFIG.bg);

    // centroid of the colour poles, so colorSpread pushes them apart about their
    // shared centre rather than sliding the whole group off toward one corner
    let ccx = 0, ccy = 0;
    for (let i = 0; i < NPOLES; i++) { ccx += CONFIG.poles[i].x; ccy += CONFIG.poles[i].y; }
    ccx /= NPOLES; ccy /= NPOLES;
    const spread = B.colorSpread;

    // centroid of the silhouette poles, for shapeRound
    let scx = ccx, scy = ccy;
    const round = B.shapeRound;

    // Where the whole blob has wandered to. Two incommensurate sines per axis
    // means the path never retraces and never reads as a simple slide.
    wander.x = B.wanderX * (0.62 * Math.sin(TAU * t / B.wanderPx1)
                          + 0.38 * Math.sin(TAU * t / B.wanderPx2 + 2.1));
    wander.y = B.wanderY * (0.62 * Math.cos(TAU * t / B.wanderPy1 + 0.7)
                          + 0.38 * Math.sin(TAU * t / B.wanderPy2 + 4.3));

    for (let i = 0; i < NPOLES; i++) {
      const pl = CONFIG.poles[i];
      const h1 = hash1(i + 1.0), h2 = hash1(i + 8.3);
      const h3 = hash1(i + 17.7), h4 = hash1(i + 29.1);

      // --- colour pole: sustained elliptical orbit, incommensurate period ---
      const per = Math.max(B.orbitPeriod * (0.72 + 0.56 * h1), 0.5);
      const ph  = h2 * TAU;
      const a   = B.orbitAmp * (0.65 + 0.70 * h3);
      const b   = a * (0.45 + 0.60 * h4);
      const rot = h1 * TAU;
      const w   = TAU * t / per + ph;
      const ex  = Math.cos(w) * a, ey = Math.sin(w) * b;
      colorPos[i * 2]     = ccx + (pl.x - ccx) * spread + ex * Math.cos(rot) - ey * Math.sin(rot);
      colorPos[i * 2 + 1] = ccy + (pl.y - ccy) * spread + ex * Math.sin(rot) + ey * Math.cos(rot);

      // --- silhouette pole: far smaller, far slower ------------------------
      const sw = TAU * t / (per * Math.max(B.shapePeriodMul, 0.1)) + ph * 0.6;
      // shapeRound pulls the silhouette poles toward their shared centre, which
      // makes the outline rounder without moving or resizing the blob overall
      const sxb = scx + (pl.x - scx) * (1 - round);
      const syb = scy + (pl.y - scy) * (1 - round);
      shapePos[i * 2]     = sxb + Math.cos(sw) * B.shapeDrift;
      shapePos[i * 2 + 1] = syb + Math.sin(sw) * B.shapeDrift * 0.7;

      // --- expansion / contraction -----------------------------------------
      const rp = Math.max(B.radiusBreathPeriod * (0.80 + 0.40 * h3), 0.5);
      poleRad[i] = pl.r * (1 + round * 0.42)
                        * (1 + B.radiusBreath * Math.sin(TAU * t / rp + ph));

      // --- colour breathing, each pole on its own schedule ------------------
      // This is what shifts the whole composition's colour balance over time,
      // rather than every region brightening together.
      const c  = hexToRgb(pl.color);
      const bp = Math.max(B.breathPeriod, 0.5);
      const bb = 1 + B.brightBreath * Math.sin(TAU * t / (bp * (0.80 + 0.50 * h2)) + ph * 1.3);
      const sb = 1 + B.satBreath    * Math.sin(TAU * t / (bp * (0.90 + 0.50 * h4)) + ph * 0.7 + 1.7);

      let r = c[0] * bb, g = c[1] * bb, bl = c[2] * bb;
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
      r  = lum + (r  - lum) * sb;
      g  = lum + (g  - lum) * sb;
      bl = lum + (bl - lum) * sb;

      // wash toward the background: 0 = full gradient.png, ~0.2 = hero.png
      const wsh = B.paletteWash;
      poleCol[i * 3]     = Math.max(0, r  + (bg[0] - r)  * wsh);
      poleCol[i * 3 + 1] = Math.max(0, g  + (bg[1] - g)  * wsh);
      poleCol[i * 3 + 2] = Math.max(0, bl + (bg[2] - bl) * wsh);
    }
  }

  /* ------------------------------------------------------------- the frames */
  let t0 = performance.now();
  let last = t0;

  // ?freeze=12.5  pins the animation at that moment in time. Useful for
  // grabbing a repeatable still, or for comparing against a reference.
  const freezeMatch = /[?&]freeze=([\d.]+)/.exec(location.search);
  const FREEZE = freezeMatch ? parseFloat(freezeMatch[1]) : null;
  let simTime = FREEZE !== null ? FREEZE : 0;

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;

    // nothing to draw once the hero has faded out — don't burn the GPU on it
    introStep(now);
    if (scrollT >= 1) { if (!STILL) requestAnimationFrame(frame); return; }
    if (FREEZE === null) simTime += dt * CONFIG.render.timeScale;

    // ease the pointer — this is what makes the interaction feel physical
    // instead of glued to the cursor
    const e = CONFIG.pointer.ease;
    ptr.x += (ptr.tx - ptr.x) * e;
    ptr.y += (ptr.ty - ptr.y) * e;
    ptr.active += (ptr.want - ptr.active) * CONFIG.pointer.fade;

    /* Let go of a cursor that has stopped. The target is 1 only while the pointer both
       is on the page AND has moved recently; otherwise the mass eases free and the
       wander -- which never stopped running, it was simply being overridden -- becomes
       the only thing moving it again. Asymmetric on purpose: see idleGrab/idleRelease. */
    const P = CONFIG.pointer;
    const held = (ptr.want && (now - ptr.lastMove) < P.idleAfter) ? 1 : 0;
    ptr.grip += (held - ptr.grip) * (held > ptr.grip ? P.idleGrab : P.idleRelease);

    const LN = CONFIG.lens;
    lens.x += (ptr.tx - lens.x) * LN.ease;
    lens.y += (ptr.ty - lens.y) * LN.ease;
    lens.active += (ptr.want - lens.active) * LN.fade;

    const fe = CONFIG.pointer.gradFollowEase;
    const gfY = CONFIG.pointer.gradFollow * (CONFIG.pointer.gradFollowY || 1);
    const hold = ptr.active * ptr.grip;
    follow.x += (ptr.x * CONFIG.pointer.gradFollow * hold - follow.x) * fe;
    follow.y += (ptr.y * gfY * hold - follow.y) * fe;

    simulatePoles(simTime);

    const bg = hexToRgb(CONFIG.bg);
    const B = CONFIG.blob;

    /* ---- pass 1: the gradient ------------------------------------------- */
    bindTarget(tGrad);
    gl.useProgram(progGradient.p);
    {
      const u = progGradient.u;
      gl.uniform2f(u.uRes, tGrad.w, tGrad.h);
      gl.uniform1f(u.uTime, simTime);
      gl.uniform1f(u.uAspect, L.aspect);

      gl.uniform2fv(u.uShapePos, shapePos);
      gl.uniform2fv(u.uColorPos, colorPos);
      gl.uniform1fv(u.uPoleRad, poleRad);
      gl.uniform3fv(u.uPoleCol, poleCol);

      gl.uniform1f(u.uScale, B.scale);
      gl.uniform1f(u.uOffX, B.offsetX + follow.x + wander.x);
      gl.uniform1f(u.uOffY, B.offsetY + follow.y + wander.y);

      gl.uniform1f(u.uShapeWarpAmp, B.shapeWarpAmp);
      gl.uniform1f(u.uShapeWarpFreq, B.shapeWarpFreq);
      gl.uniform1f(u.uShapeWarpSpeed, B.shapeWarpSpeed);
      gl.uniform1f(u.uColorWarpAmp, B.colorWarpAmp);
      gl.uniform1f(u.uColorWarpFreq, B.colorWarpFreq);
      gl.uniform1f(u.uColorWarpSpeed, B.colorWarpSpeed);

      gl.uniform1f(u.uEdgeGain, B.edgeGain);
      gl.uniform1f(u.uEdgeShape, B.edgeShape);
      gl.uniform1f(u.uFalloff, B.falloff);
      gl.uniform1f(u.uColorFalloff, B.colorFalloff);

      // direction and amount of the pull toward the cursor
      const fl = Math.hypot(follow.x, follow.y);
      if (fl > 1e-4) {
        gl.uniform2f(u.uStretchDir, follow.x / fl, follow.y / fl);
        gl.uniform1f(u.uStretchAmt, Math.min(fl * CONFIG.pointer.gradStretch /
                                   Math.max(CONFIG.pointer.gradFollow, 1e-4), 0.9));
      } else {
        gl.uniform2f(u.uStretchDir, 1, 0);
        gl.uniform1f(u.uStretchAmt, 0);
      }
    }
    draw();

    /* ---- pass 2: blur chain --------------------------------------------- */
    gl.useProgram(progBlur.p);
    gl.uniform1i(progBlur.u.uTex, 0);
    gl.activeTexture(gl.TEXTURE0);

    // the blur runs at blurScale, so a radius in CSS px is this many texels
    const texelsPerCssPx = (L.dpr * CONFIG.render.blurScale);
    const total = CONFIG.blur.radiusPx * texelsPerCssPx;
    const iters = Math.max(1, Math.round(CONFIG.blur.iterations));

    // geometric step sizes (1,2,4...) reach a wide blur in few passes
    let denom = 0;
    for (let i = 0; i < iters; i++) denom += Math.pow(2, i);
    const base = total / Math.max(denom, 1e-4);

    let src = tGrad;
    for (let i = 0; i < iters; i++) {
      const step = Math.max(base * Math.pow(2, i), 1.0);

      // horizontal: src -> tPing
      bindTarget(tPing);
      gl.bindTexture(gl.TEXTURE_2D, src.tex);
      gl.uniform2f(progBlur.u.uRes, tPing.w, tPing.h);
      gl.uniform2f(progBlur.u.uDir, step, 0);
      draw();

      // vertical: tPing -> tPong
      bindTarget(tPong);
      gl.bindTexture(gl.TEXTURE_2D, tPing.tex);
      gl.uniform2f(progBlur.u.uRes, tPong.w, tPong.h);
      gl.uniform2f(progBlur.u.uDir, 0, step);
      draw();

      src = tPong;
    }
    const blurred = src;

    /* ---- pass 3: composite to screen ------------------------------------ */
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(progComposite.p);
    {
      const u = progComposite.u;
      const C = CONFIG.circle, R = CONFIG.refraction, K = CONFIG.corona, P = CONFIG.pointer;

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tGrad.tex);
      gl.uniform1i(u.uSharp, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, blurred.tex);
      gl.uniform1i(u.uSoft, 1);

      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform2f(u.uCssRes, L.cssW, L.cssH);
      gl.uniform1f(u.uAspect, L.aspect);
      gl.uniform1f(u.uTime, simTime);
      gl.uniform3fv(u.uBg, bg);

      gl.uniform2f(u.uCircleC, (C.centerX - 0.5) * L.aspect, (C.centerY - 0.5));
      gl.uniform1f(u.uCircleR, L.radius);   // stays at full hero size through the scroll
      gl.uniform1f(u.uBlurMix, C.blurMix);
      gl.uniform1f(u.uVeilAlpha, C.veilAlpha);
      gl.uniform3fv(u.uVeilCol, hexToRgb(C.veilColor || CONFIG.bg));
      gl.uniform1f(u.uStrokeAlpha, C.strokeAlpha);
      gl.uniform1f(u.uStrokeMul, C.strokeMul);
      gl.uniform1f(u.uStrokeDrawMul, C.strokeDrawMul ?? C.strokeMul);
      gl.uniform1f(u.uStrokePx, C.strokePx);

      gl.uniform1f(u.uRefract, R.strength);
      gl.uniform1f(u.uRefractFalloff, R.falloff);

      gl.uniform2f(u.uPtr, ptr.x, ptr.y);
      gl.uniform1f(u.uPtrActive, ptr.active);
      gl.uniform1f(u.uPtrRadius, P.radiusVH);
      gl.uniform1f(u.uPtrStrength, P.strength);
      gl.uniform1f(u.uPtrBlur, P.blurBoost);
      gl.uniform1f(u.uPtrLift, P.lift);

      gl.uniform1f(u.uCoronaInt, K.intensity);
      gl.uniform1f(u.uCoronaSpread, K.spread);
      gl.uniform1f(u.uCoronaOuter, K.outerScale);
      gl.uniform1f(u.uCoronaOuterW, K.outerWeight);
      gl.uniform1f(u.uCoronaBias, K.bias);
      gl.uniform1f(u.uCoronaSat, K.saturation);
      gl.uniform1f(u.uCoronaGamma, K.gamma);

      gl.uniform2f(u.uLensPos, lens.x, lens.y);
      gl.uniform1f(u.uLensActive, lens.active);
      gl.uniform1f(u.uLensRadius, LN.radius);
      gl.uniform1f(u.uLensStrength, LN.strength);
      gl.uniform1f(u.uLensPull, LN.pull);
      gl.uniform1f(u.uLensBlur, LN.blur);
      gl.uniform1f(u.uLensLift, LN.lift);
      gl.uniform1f(u.uLensFeather, LN.edgeFeather);

      const S = CONFIG.smear;
      gl.uniform1f(u.uSmearInt, S.intensity);
      gl.uniform1f(u.uSmearRadius, S.radius);
      gl.uniform1f(u.uSmearReach, S.reach);
      gl.uniform1f(u.uSmearRimWidth, S.rimWidth);
      gl.uniform1f(u.uSmearSat, S.saturation);
      gl.uniform1i(u.uSmearTaps, Math.round(S.taps));

      gl.uniform1f(u.uGridMargin, L.margin);
      gl.uniform1f(u.uGridAlpha, CONFIG.grid.alpha);
      gl.uniform1f(u.uGridWidth, CONFIG.grid.widthPx);
      gl.uniform1i(u.uGridCols, gridCols());

      gl.uniform1f(u.uDither, CONFIG.render.dither);
      gl.uniform1f(u.uCircleDraw, intro.draw);
      gl.uniform1f(u.uCircleFill, intro.fill);
      /* The orange aura is off: uHaloFade scales BOTH gradient samples and the corona's
         own, so zeroing it resolves the composite to the flat background. The canvas
         still paints -- it is what the grid and the dither sit on -- it simply has no
         gradient in it. See blob.enabled in config.js. */
      gl.uniform1f(u.uHaloFade, CONFIG.blob.enabled ? intro.halo : 0);

      /* The centre circle is the logo mark now. Everything the shader gates to the
         circle's SDF is zeroed here, AFTER the real values have been written, so one
         flag in config.js switches the glass off and on without touching the shader.

         The cursor lenses go too, and that is not tidiness: the big lens is gated by
         `lgate`, a smoothstep across the circle's rim, so leaving it on would have
         left a circle-shaped lens roaming an image with no circle in it. uHaloFade is
         deliberately NOT touched -- it fades the gradient itself up through the intro,
         and the gradient stays. */
      if (!C.enabled) {
        gl.uniform1f(u.uCircleDraw, 0);     // the traced rim
        gl.uniform1f(u.uCircleFill, 0);     // refraction, blur-inside and the veil
        gl.uniform1f(u.uStrokeAlpha, 0);    // the resting hairline rim
        gl.uniform1f(u.uCoronaInt, 0);      // the eclipse glow at the rim
        gl.uniform1f(u.uSmearInt, 0);       // the rim smear
        gl.uniform1f(u.uPtrStrength, 0);
        gl.uniform1f(u.uPtrBlur, 0);
        gl.uniform1f(u.uPtrLift, 0);
        gl.uniform1f(u.uLensStrength, 0);
        gl.uniform1f(u.uLensBlur, 0);
        gl.uniform1f(u.uLensLift, 0);
      }
    }
    draw();

    if (!STILL) requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------- scroll transition */
  /* The hero does not move. It is position:fixed, so it simply stays where it is
     and fades out in place while the Work section scrolls up over it — which is
     what makes Work read as REPLACING the hero rather than the two sliding past
     each other. The circle contracts as it goes, so it reads as collapsing down
     into the "View case study" cursor it becomes in the next section. */
  const heroEl = document.querySelector('.hero');
  const glowEl = document.querySelector('.hero-glow');
  let scrollT = 0;

  /* ---- the gradient's opacity has TWO owners, and one channel -------------------
     The scroll hand-off fades it out with the hero. The intro fades it in after the
     grid lines set off. Both want .hero-glow's opacity, and an element has only one --
     so they are kept as separate FACTORS and multiplied here, rather than each writing
     the property and the later write erasing the earlier one.

     That is not hypothetical: the fade was first built as `opacity: 0` in the CSS plus
     a class, and onScroll() runs once at startup and wrote an inline opacity:1 straight
     over it. The transition ran from 34ms rather than the intended 480, because it was
     transitioning away from a value the stylesheet never got to keep. */
  let fadeScroll = 1;          // 1 at the top of the page, 0 once Work has taken over
  let fadeIntro  = 0;          // 0 until the intro cue, then eased to 1
  function applyGlow() {
    if (glowEl) glowEl.style.opacity = (fadeScroll * fadeIntro).toFixed(3);
  }

  function onScroll() {
    const vh = Math.max(1, window.innerHeight);
    scrollT = Math.min(1, Math.max(0, window.scrollY / (vh * 0.80)));
    const ease = scrollT * scrollT * (3 - 2 * scrollT);
    if (heroEl) {
      // text_animation.mov: the copy fades and drifts upward at the same time,
      // finishing well before the section change completes. Restrained on purpose —
      // this is the only thing that moves; grid, background and halo do not.
      /* 1.05, HALF the 2.1 it was, so the copy takes twice as much scroll to go. The
         multiplier is the whole speed control: scrollT runs 0 -> 1 over 0.8 of a
         viewport, and this is how much faster than that the copy fades. At 2.1 it was
         gone by 343px of a 900px viewport -- about a third of the way out of the hero,
         which is what made it read as snatched away. At 1.05 it is gone by 686, three
         quarters of the way, and still finished before Work arrives at 900.

         Only the COPY. The WebGL canvas and the atmospheric gradient still hand over on
         scrollT's own curve, and they have to: #stage is fixed and .featuredwork has no
         background of its own, so anything left of the hero's orange paints straight
         through the Work section. They finish at ~620 against a section edge at 900, and
         doubling that span would put them 338px inside it. */
      const k = Math.min(1, scrollT * 1.05);
      const e = k * k * (3 - 2 * k);
      heroEl.style.opacity = String(1 - e);
      heroEl.style.transform = 'translate3d(0,' + (-e * vh * 0.075).toFixed(1) + 'px,0)';
      /* And once it is invisible, it stops taking the pointer. Driven off the SAME e as
         the opacity rather than a scroll threshold of its own, so there is no window in
         which the hero looks gone and still answers the mouse. See .hero.is-gone. */
      heroEl.classList.toggle('is-gone', e > 0.99);
    }
    fadeScroll = Math.max(0, 1 - ease * 1.06);
    canvas.style.opacity = String(fadeScroll);
    // the atmospheric gradient belongs to the hero, so it leaves with it
    applyGlow();
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------- the topbar hides */
  /* Down hides it, up brings it back. All of the movement is the transform on .topbar;
     this only decides when, so there is one place to retune the motion and one place to
     retune the rules.

     THE THRESHOLD is what keeps it from flickering. A trackpad delivers scroll in
     one- and two-pixel steps that change sign constantly, so reacting to every event
     would strobe the bar. Direction is only acted on once the page has moved TOL since
     the last decision, which is small enough to feel immediate and large enough that
     noise never reaches it.

     NEAR THE TOP it is always shown, whatever the direction. The hero's own type sits
     right under it and a bar that is still hidden when you arrive back at the top reads
     as broken rather than as considered.

     is-back carries the quicker return curve. It is a second class rather than a
     reversal of the first because the two directions are deliberately not symmetrical. */
  const topbar = document.querySelector('.topbar');
  if (topbar) {
    const TOL  = 8;     // px of travel before a direction change counts
    /* A DISTANCE SCROLLED, not a section's edge. Below KEEP the bar is always shown,
       whatever the direction: the hero's own type sits right under it and a bar that is
       still hidden when you arrive back at the top reads as broken rather than as
       considered.

       It was briefly measured off the FEATUREDWORK SECTION instead -- hide once Work's top came
       within 120, then 200, of the viewport's, which held the bar for the whole hero and
       let it go as Work arrived -- and that is reverted. If it is ever wanted back, the
       shape of it was one rect read per accepted scroll (never a cached offset, because
       the hero is sized in viewport units) feeding both the hide and the ground. */
    const KEEP = 120;   // px from the top where it is always shown
    let lastY = window.scrollY;
    let away  = false;

    addEventListener('scroll', () => {
      const y = Math.max(0, window.scrollY);
      const dy = y - lastY;
      if (Math.abs(dy) < TOL) return;
      lastY = y;

      const hide = dy > 0 && y > KEEP;
      if (hide !== away) {
        away = hide;
        topbar.classList.toggle('is-back', !hide);
        topbar.classList.toggle('is-away', hide);
      }

      /* Whether the bar is STANDING on anything is a separate question from whether it is
         hidden, and it has to be asked on every accepted scroll rather than only when the
         direction changes. Scrolling all the way back up from the footer is one single
         direction change at the start and then nothing: `away` is false for the whole
         journey, so an early return on it would never notice the bar arriving at the top
         and the ground would still be there over the hero.

         Shown AND past KEEP. The hero is built with the bar floating over it, so the same
         120px that always shows the bar near the top is what takes its ground away. */
      topbar.classList.toggle('is-solid', !hide && y > KEEP);
    }, { passive: true });
  }


  /* ---- the phone's menu ------------------------------------------------------------
     Open/close only: the panel's look is CSS, and everything here is state. The scroll
     lock is on the root rather than the body because that is the element this page
     actually scrolls, and leaving it locked is the one way this can break the page --
     so every exit (the trigger, a link, Escape, growing past the breakpoint) goes
     through the same setOpen. */
  const navtoggle = document.querySelector('.navtoggle');
  const menu      = document.getElementById('menu');
  if (navtoggle && menu) {
    const setOpen = (open) => {
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', String(!open));
      navtoggle.setAttribute('aria-expanded', String(open));
      navtoggle.textContent = open ? 'Close' : 'Menu';
      document.documentElement.style.overflow = open ? 'hidden' : '';
      const bar = document.querySelector('.topbar');
      if (bar) bar.classList.toggle('is-menu', open);
    };
    navtoggle.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
    /* A link closes it. They are placeholders on this page, so without this the panel
       would simply stay over whatever the link did not navigate to. */
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    addEventListener('resize', () => { if (window.innerWidth > 767) setOpen(false); });
  }

  /* ---- the hero CTA does NOT scroll ------------------------------------------------
     It said "Start exploring" and ran a hand-rolled tween down to the Work section: a
     frame-by-frame scroll at half the browser's native rate, because scrollIntoView has
     no speed control at all. The label is "Work with us" now, which is a destination
     rather than a direction, so the button takes no action here -- it is a placeholder
     for a real link in the same way the nav's items are.

     The whole tween is gone rather than left unattached, and so is the
     scroll-margin-top it used to read: nothing scrolls to this section any more, so the
     section carries no clearance for the fixed bar. If a scroll is ever wanted back,
     both come back together -- the shape of the tween was: duration from distance at
     0.835 px/ms (half the measured native 1.67), clamped to 420-1800ms, easeInOutCubic,
     and a wheel/touch/key listener that cancels the moment the reader takes over. */

  /* --------------------------------------------------------------- page intro */
  /* Grid lines and circle draw TOGETHER -> halo fades up -> text reveals line by line.
     The later stages deliberately overlap so it reads as one continuous move rather
     than a stepped presentation.

     The circle used to wait for the grid: the last line landed at 380 + 3*70 + 700 =
     1290 and the circle began tracing at that exact moment, so the two read as one
     thing after another. They now start on the same frame -- circleStart IS gridStart --
     and the circle's duration is stretched from 680 to 910 so it finishes with the last
     line rather than well before it. Both are drawing, the whole time, from 380 to 1290.

     Everything downstream keeps the offsets it had RELATIVE to the circle finishing, so
     only the overlap changed, not the rhythm after it: fill on completion, halo +120,
     text +320 and then its own stagger. The intro as a whole is 680ms shorter, which is
     exactly the time the circle used to spend waiting its turn. */
  const INTRO = {
    gridStart:   INTRO_T.gridStart, gridStagger: INTRO_T.gridStagger,
    toneStart:   1290,                     // the lines reach resting weight as both land
    circleStart: INTRO_T.gridStart,        // == 380: the same frame the first line starts
    /* 480: a beat after the first grid line sets off at 380, not with it. Together the
       two read as one event and the lines lose the empty field they are drawn against;
       100ms apart, the light clearly follows them. The fade itself is 1.1s, in the CSS
       on .hero-glow, so it lands at ~1580 just as the headline reveals at 1610. */
    glowStart:   INTRO_T.gridStart + 100,
    circleDur:   910,                      // 380 + 910 = 1290, the last line's landing
    fillStart:   1290, fillDur:     520,   // = circleStart + circleDur
    haloStart:   1410, haloDur:     820,
    /* ONE frame for all four. The cascade is gone: the headline's two lines, the body
       and the CTA used to come in on a 90 / 150 / 110 step and now rise together, so the
       hero reads as a single block arriving rather than a list being filled in. 1610 is
       where the first line always started, so the intro as a whole is no shorter -- it
       just stops trailing 350ms behind itself. */
    text:      [1610, 1610, 1610, 1610]        // 2 headline lines, body, CTA -- together
  };

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const skipIntro = reduced || /[?&]intro=0/.test(location.search);

  // ?introAt=900 pins the intro to that moment, so a single frame can be captured
  const atM = /[?&]introAt=(\d+)/.exec(location.search);
  const INTRO_AT = atM ? parseInt(atM[1], 10) : null;
  const intro = { t0: performance.now(), draw: 0, fill: 0, halo: 0, done: skipIntro };
  const heroMasks = [...document.querySelectorAll('[data-hv]')];

  function armIntro() {
    /* The mark enters WITH the grid: it turns a full revolution and fades up as the lines
       wipe down, both off the same switch so they cannot drift. The transition and its
       380ms delay live on .hero__mark; all that happens here is when the class lands. */
    const mark = document.querySelector('.hero__mark');
    const markIn = (animated) => {
      if (!mark) return;
      if (!animated) mark.style.transition = 'none';
      mark.classList.add('is-in');
      if (!animated) mark.classList.add('is-settled');
    };

    /* The hero gradient's fade. The canvas paints from frame one either way; this is
       only how much of it reaches the page -- there is no second state for the drawing
       code to know about, and the pointer reaction, the drift and the colour walk all
       run through the fade exactly as they do after it.

       Driven here rather than by a CSS transition because the property is shared with
       the scroll hand-off (see applyGlow): a transition would animate the element's one
       opacity, and the next scroll frame would overwrite it mid-flight. Tweening the
       FACTOR leaves the product correct at every frame of both.

       1.1s, smoothstepped. Against the 480ms cue that puts it fully up at ~1580, which
       is where the headline reveals at 1610 -- the gradient finishes arriving as the
       type starts. */
    const GLOW_DUR = 1100;
    const glowIn = (animated) => {
      if (!animated) { fadeIntro = 1; applyGlow(); return; }
      const t0 = performance.now();
      (function step(now) {
        const k = Math.min(1, (now - t0) / GLOW_DUR);
        fadeIntro = k * k * (3 - 2 * k);
        applyGlow();
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    };

    if (skipIntro) {
      intro.draw = intro.fill = intro.halo = 1;
      markIn(false);
      glowIn(false);
      lockGrid();
      return;
    }
    heroMasks.forEach(el => el.classList.add('hpre'));
    const grid = document.querySelector('.page-grid');
    void document.body.offsetHeight;           // paint the armed state first

    if (INTRO_AT !== null) {
      // pinned for capture: jump straight to the state at that moment
      if (grid) {
        grid.classList.add('drawn');
        if (INTRO_AT >= INTRO.toneStart) lockGrid();
      }
      // pinned: the mark is either in or not, never mid-turn
      if (INTRO_AT >= INTRO.gridStart) markIn(false);
      if (INTRO_AT >= INTRO.glowStart) glowIn(false);
      INTRO.text.forEach((ms, i) => {
        if (heroMasks[i] && INTRO_AT >= ms) {
          heroMasks[i].style.transition = 'none';
          heroMasks[i].classList.remove('hpre');
        }
      });
      return;
    }

    requestAnimationFrame(() => markIn(true));   // the same frame the lines start
    setTimeout(() => glowIn(true), INTRO.glowStart);
    if (grid) {
      requestAnimationFrame(() => grid.classList.add('drawn'));
      setTimeout(() => grid.classList.add('toned'), INTRO.toneStart);
    }
    INTRO.text.forEach((ms, i) => {
      const el = heroMasks[i];
      if (el) setTimeout(() => el.classList.remove('hpre'), ms);
    });
    // after the last line lands, let the grid stop being an animated thing
    setTimeout(() => {
      lockGrid();
      /* The entrance has landed; hand the transform back to --spin on its own curve,
         so the first phrase change does not turn the mark on the grid's easing. */
      if (mark) mark.classList.add('is-settled');
      intro.done = true;
    }, INTRO.text[INTRO.text.length - 1] + 1100);
  }

  function introStep(now) {
    if (skipIntro && INTRO_AT === null) return;
    const e = INTRO_AT !== null ? INTRO_AT : (now - intro.t0);
    const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
    intro.draw = ease((e - INTRO.circleStart) / INTRO.circleDur);
    intro.fill = ease((e - INTRO.fillStart)   / INTRO.fillDur);
    intro.halo = ease((e - INTRO.haloStart)   / INTRO.haloDur);
  }

  /* ------------------------------------------------------------------ boot */
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 80);
  });

  /* ---- and a WATCH on the element, not just the window ---------------------------
     layout() reads window.innerWidth, and on a phone that number is not final when
     this script first runs: the page lays out at a default width, the viewport meta
     is applied, and innerWidth changes WITHOUT a resize event that this listener
     sees. The first layout therefore ran against ~667px on a 375px screen and
     nothing ever corrected it.

     Everything in the page is sized in --u, which is cssW / 1440, so a 667 reading
     made every calc(N * var(--u)) on mobile 78% too large: the five grid lines ran
     off the screen at 490 and 647, the Expertise cover circle showed its side and
     bottom edges, and the Work gradient was far taller than its section. Measured
     before this: u = 0.46319 on load, 0.26042 after one synthetic resize.

     A ResizeObserver on the root element sees the box actually change, whatever the
     window event does or does not do. It is debounced through the same timer, so a
     drag still coalesces into one layout. */
  if ('ResizeObserver' in window) {
    let first = true;
    new ResizeObserver(() => {
      if (first) { first = false; return; }   // the initial callback IS the first layout
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(layout, 80);
    }).observe(document.documentElement);
  }

  layout();
  armIntro();
  watchHeadline();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { layout(); });
  }
  requestAnimationFrame(frame);

  // exposed so tweak.js can force a relayout when a layout value changes
  window.HERO = { layout, gl, get time() { return simTime; }, set time(v) { simTime = v; } };
})();
