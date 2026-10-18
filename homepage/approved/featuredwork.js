/* ============================================================================
   FEATUREDWORK SECTION
     - the cool gradient (same machinery as the hero, but anchored in place)
     - sequential reveal on entry
     - the hero's circle reborn as the "View case study" cursor
     - the logo ticker
   ========================================================================= */
(function () {
  'use strict';

  const section = document.getElementById('featuredwork');
  if (!section) return;

  /* ======================================================= the cool gradient */
  const canvas = document.getElementById('featuredworkgl');
  // ?nogl=1 skips both gradients — handy for checking layout without paying for
  // the shaders (and essential when capturing on software rendering)
  const NOGL  = /[?&]nogl=1/.test(location.search);
  const STILL = /[?&]still=1/.test(location.search);
  // transparent + premultiplied: the section canvas must not paint a background,
  // or it covers the hero as the section scrolls up over it
  const gl = !NOGL && canvas && canvas.getContext('webgl2', {
    alpha: true, antialias: false, depth: false, stencil: false,
    premultipliedAlpha: true, powerPreference: 'high-performance'
  });

  // cursor field state — declared up here because the gradient pass reads it
  const fld = { x: 0, y: 0, tx: 0, ty: 0, amt: 0, want: 0, seen: false };

  const NP = FEATUREDWORK.poles.length;
  let renderGradient = null;

  if (gl) {
    /* Luma-preserving hue rotation in RGB. An HSV round trip would do the same
       job but wraps badly near the blue/cyan boundary, which is exactly where
       this palette lives. */
    const rotateHue = (r, g, b, deg) => {
      const a = deg * Math.PI / 180, c = Math.cos(a), s2 = Math.sin(a);
      return [
        r*(0.213 + c*0.787 - s2*0.213) + g*(0.715 - c*0.715 - s2*0.715) + b*(0.072 - c*0.072 + s2*0.928),
        r*(0.213 - c*0.213 + s2*0.143) + g*(0.715 + c*0.285 + s2*0.140) + b*(0.072 - c*0.072 - s2*0.283),
        r*(0.213 - c*0.213 - s2*0.787) + g*(0.715 - c*0.715 + s2*0.715) + b*(0.072 + c*0.928 + s2*0.072)
      ];
    };

    const hexToRgb = h => {
      h = h.replace('#', '');
      if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      const v = parseInt(h, 16);
      return [((v>>16)&255)/255, ((v>>8)&255)/255, (v&255)/255];
    };

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw new Error('work shader: ' + gl.getShaderInfoLog(s));
      return s;
    };
    const program = frag => {
      const p = gl.createProgram();
      gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, frag));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS))
        throw new Error('work link: ' + gl.getProgramInfoLog(p));
      const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) {
        const nm = gl.getActiveUniform(p, i).name.replace(/\[0\]$/, '');
        u[nm] = gl.getUniformLocation(p, nm);
      }
      return { p, u };
    };

    const hasFloat = !!gl.getExtension('EXT_color_buffer_float');
    if (hasFloat) gl.getExtension('OES_texture_float_linear');
    const IFMT = hasFloat ? gl.RGBA16F : gl.RGBA8;
    const TYPE = hasFloat ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;

    const target = () => {
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
    };
    const size = (t, w, h) => {
      if (t.w === w && t.h === h) return;
      t.w = w; t.h = h;
      gl.bindTexture(gl.TEXTURE_2D, t.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, IFMT, w, h, 0, gl.RGBA, TYPE, null);
    };

    const pGrad = program(FRAG_GRADIENT.replace('__NPOLES__', String(NP)));
    const pBlur = program(FRAG_BLUR);
    const pFlat = program(FRAG_FLAT);
    const tGrad = target(), tPing = target(), tPong = target();
    gl.bindVertexArray(gl.createVertexArray());
    const draw = () => gl.drawArrays(gl.TRIANGLES, 0, 3);
    const bind = t => { gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo); gl.viewport(0, 0, t.w, t.h); };

    const shapePos = new Float32Array(NP*2), colorPos = new Float32Array(NP*2);
    const poleRad  = new Float32Array(NP),   poleCol  = new Float32Array(NP*3);
    const TAU = Math.PI * 2;
    const hash1 = n => { const s = Math.sin(n*127.1+311.7)*43758.5453; return s - Math.floor(s); };

    function simulate(t) {
      const W = FEATUREDWORK, bg = hexToRgb(CONFIG.bg);
      let ccx = 0, ccy = 0;
      for (let i = 0; i < NP; i++) { ccx += W.poles[i].x; ccy += W.poles[i].y; }
      ccx /= NP; ccy /= NP;
      for (let i = 0; i < NP; i++) {
        const pl = W.poles[i];
        const h1 = hash1(i+1), h2 = hash1(i+8.3), h3 = hash1(i+17.7), h4 = hash1(i+29.1);
        const per = W.orbitPeriod * (0.72 + 0.56*h1), ph = h2*TAU;
        const a = W.orbitAmp * (0.65 + 0.70*h3), b = a * (0.45 + 0.60*h4);
        const rot = h1*TAU, w = TAU*t/per + ph;
        const ex = Math.cos(w)*a, ey = Math.sin(w)*b;
        colorPos[i*2]   = ccx + (pl.x-ccx)*W.colorSpread + ex*Math.cos(rot) - ey*Math.sin(rot);
        colorPos[i*2+1] = ccy + (pl.y-ccy)*W.colorSpread + ex*Math.sin(rot) + ey*Math.cos(rot);
        const sw = TAU*t/(per*W.shapePeriodMul) + ph*0.6;
        const rnd = W.shapeRound || 0;
        const sx  = ccx + (pl.x - ccx) * (1 - rnd);
        const sy  = ccy + (pl.y - ccy) * (1 - rnd);
        shapePos[i*2]   = sx + Math.cos(sw)*W.shapeDrift;
        shapePos[i*2+1] = sy + Math.sin(sw)*W.shapeDrift*0.7;
        const rp = W.radiusBreathPeriod * (0.80 + 0.40*h3);
        poleRad[i] = pl.r * (1 + (W.shapeRound || 0) * 0.5)
                          * (1 + W.radiusBreath*Math.sin(TAU*t/rp + ph));
        const c = hexToRgb(pl.color), bp = W.breathPeriod;
        const bb = 1 + W.brightBreath*Math.sin(TAU*t/(bp*(0.80+0.50*h2)) + ph*1.3);
        const sb = 1 + W.satBreath   *Math.sin(TAU*t/(bp*(0.90+0.50*h4)) + ph*0.7 + 1.7);
        let r = c[0]*bb, g = c[1]*bb, bl = c[2]*bb;
        const lum = 0.2126*r + 0.7152*g + 0.0722*bl;
        r = lum+(r-lum)*sb; g = lum+(g-lum)*sb; bl = lum+(bl-lum)*sb;
        // Each pole's hue drifts on its own slow cycle, with its own period and
        // phase, so the blues shift relative to each other instead of the whole
        // field sliding one way together.
        if (W.hueBreath) {
          const hp = (W.hueBreathPeriod || 74) * (0.78 + 0.44*h1);
          const d  = W.hueBreath * Math.sin(TAU*t/hp + ph*0.9 + h3*TAU);
          const q  = rotateHue(r, g, bl, d);
          r = q[0]; g = q[1]; bl = q[2];
        }
        const wsh = W.paletteWash;
        poleCol[i*3]   = Math.max(0, r  + (bg[0]-r )*wsh);
        poleCol[i*3+1] = Math.max(0, g  + (bg[1]-g )*wsh);
        poleCol[i*3+2] = Math.max(0, bl + (bg[2]-bl)*wsh);
      }
    }

    let cssW = 0, cssH = 0, dpr = 1;
    function resize() {
      const r = section.getBoundingClientRect();
      const u = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--u')) || 1;
      cssW = Math.max(1, Math.round(r.width));
      cssH = Math.max(1, Math.round(r.height + 1450 * u));  // matches the CSS overhang
      // This canvas is tall (the whole section) and holds nothing but a soft
      // gradient plus hairline grid, so it does not need retina backing. Capping
      // it here is most of the section's GPU cost.
      dpr  = Math.min(window.devicePixelRatio || 1, FEATUREDWORK.dprMax || 1);
      const w = Math.round(cssW*dpr), h = Math.round(cssH*dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      size(tGrad, Math.max(2, Math.round(w*CONFIG.render.gradScale)),
                  Math.max(2, Math.round(h*CONFIG.render.gradScale)));
      const bw = Math.max(2, Math.round(w*CONFIG.render.blurScale));
      const bh = Math.max(2, Math.round(h*CONFIG.render.blurScale));
      size(tPing, bw, bh); size(tPong, bw, bh);
    }

    renderGradient = function (t, expand) {
      if (!cssW) resize();
      const W = FEATUREDWORK;
      const e = expand || 0;
      simulate(t);

      bind(tGrad);
      gl.useProgram(pGrad.p);
      const u = pGrad.u;
      gl.uniform2f(u.uRes, tGrad.w, tGrad.h);
      gl.uniform1f(u.uTime, t);
      gl.uniform1f(u.uAspect, cssW / cssH);
      gl.uniform2fv(u.uShapePos, shapePos);
      gl.uniform2fv(u.uColorPos, colorPos);
      gl.uniform1fv(u.uPoleRad, poleRad);
      gl.uniform3fv(u.uPoleCol, poleCol);
      gl.uniform1f(u.uScale, W.scale * (1 + e * W.expandScale));
      gl.uniform1f(u.uOffX, W.offsetX);
      gl.uniform1f(u.uOffY, W.offsetY - e * W.expandRise);
      gl.uniform1f(u.uShapeWarpAmp, W.shapeWarpAmp);
      gl.uniform1f(u.uShapeWarpFreq, W.shapeWarpFreq);
      gl.uniform1f(u.uShapeWarpSpeed, W.shapeWarpSpeed);
      gl.uniform1f(u.uColorWarpAmp, W.colorWarpAmp);
      gl.uniform1f(u.uColorWarpFreq, W.colorWarpFreq);
      gl.uniform1f(u.uColorWarpSpeed, W.colorWarpSpeed);
      gl.uniform1f(u.uEdgeGain, W.edgeGain * (1 + e * W.expandGain));
      gl.uniform1f(u.uEdgeShape, W.edgeShape);
      gl.uniform1f(u.uFalloff, W.falloff);
      gl.uniform1f(u.uColorFalloff, W.colorFalloff);

      gl.uniform2f(u.uCurPos, fld.x, fld.y);
      gl.uniform1f(u.uCurAmt, fld.amt);
      gl.uniform1f(u.uCurRadius, W.curRadius);
      gl.uniform1f(u.uCurWarp, W.curWarp);
      gl.uniform1f(u.uCurSat, W.curSat);
      gl.uniform1f(u.uCurHue, W.curHue || 0);
      gl.uniform1f(u.uFloorAt,   W.floorAt   || 0);
      gl.uniform1f(u.uFloorSoft, W.floorSoft || 0);
      gl.uniform1f(u.uCurSpread, W.curSpread);
      draw();

      // the softness itself breathes — part of the "alive but not moving" brief
      const soft = 1 + W.blurBreath * Math.sin(TAU * t / W.blurBreathPeriod);
      gl.useProgram(pBlur.p);
      gl.uniform1i(pBlur.u.uTex, 0);
      gl.activeTexture(gl.TEXTURE0);
      const total = W.blurPx * soft * dpr * CONFIG.render.blurScale;
      const iters = Math.max(1, Math.round(W.blurIterations));
      let denom = 0; for (let i = 0; i < iters; i++) denom += Math.pow(2, i);
      const base = total / Math.max(denom, 1e-4);
      let src = tGrad;
      for (let i = 0; i < iters; i++) {
        const step = Math.max(base * Math.pow(2, i), 1.0);
        bind(tPing); gl.bindTexture(gl.TEXTURE_2D, src.tex);
        gl.uniform2f(pBlur.u.uRes, tPing.w, tPing.h);
        gl.uniform2f(pBlur.u.uDir, step, 0); draw();
        bind(tPong); gl.bindTexture(gl.TEXTURE_2D, tPing.tex);
        gl.uniform2f(pBlur.u.uRes, tPong.w, tPong.h);
        gl.uniform2f(pBlur.u.uDir, 0, step); draw();
        src = tPong;
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(pFlat.p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, src.tex);
      gl.uniform1i(pFlat.u.uTex, 0);
      gl.uniform2f(pFlat.u.uRes, canvas.width, canvas.height);
      gl.uniform2f(pFlat.u.uCssRes, cssW, cssH);
      gl.uniform3fv(pFlat.u.uBg, hexToRgb(CONFIG.bg));
      gl.uniform1f(pFlat.u.uTime, t);
      gl.uniform1f(pFlat.u.uDither, CONFIG.render.dither);
      gl.uniform1f(pFlat.u.uAspect, cssW / cssH);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, tGrad.tex);
      gl.uniform1i(pFlat.u.uSharp, 1);
      gl.uniform2f(pFlat.u.uCurPos, fld.x, fld.y);
      gl.uniform1f(pFlat.u.uCurAmt, fld.amt);
      gl.uniform1f(pFlat.u.uCurRadius, W.curRadius);
      gl.uniform1f(pFlat.u.uCurBlur, W.curBlur);
      gl.activeTexture(gl.TEXTURE0);
      draw();
    };

    let rt = null;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { cssW = 0; }, 90); });
  }

  /* ============================================================ sequential reveal */
  /* Each group waits for its OWN area to be properly in view, rather than firing the
     whole section off the moment its top edge appears. That is what lets you actually
     watch each piece animate in while scrolling. */

  // NB: .featuredwork .sec-head has absolutely-positioned children, so its own box is zero
  // height and can never satisfy an intersection test. Watch the headline instead.
  const header = section.querySelector('.sec-head__title');
  const cards  = [...section.querySelectorAll('[data-card]')];
  const ticker = section.querySelector('.ticker');

  /* Four steps, not five: the headline wraps inside its box now rather than being
     cut into one <span> per line, so it is a single mask and reveals as one block.
     The old step 2 was the second line of the headline; the beats after it have
     moved up to keep the same shape of entrance. */
  const HEADER_SEQ = [
    ['[data-rv="0"]',   0],   // eyebrow
    ['[data-rv="1"]',  95],   // headline
    ['[data-rv="2"]', 235],   // body copy
    ['[data-rv="3"]', 335]    // CTA
  ];

  // arm everything in JS, so the hidden state only exists while the code that
  // removes it is running
  const armed = [];
  HEADER_SEQ.forEach(([sel]) => {
    const el = section.querySelector(sel);
    if (el) { el.classList.add('pre'); armed.push(el); }
  });
  cards.forEach(c => {
    c.classList.add('pre', 'framed');
    const im = c.querySelector('.card__img');
    if (im) im.style.clipPath = 'inset(16% 13% 16% 13%)';
    armed.push(c);
  });
  if (ticker) { ticker.classList.add('pre'); armed.push(ticker); }

  void section.offsetHeight;          // paint the armed state before revealing

  const CAPTURE = /[?&]top=1/.test(location.search) && !/[?&]anim=1/.test(location.search);
  if (/[?&]top=1/.test(location.search)) {
    // capture aid: collapse the hero spacer and take the hero out of the way
    const sp = document.querySelector('.hero-space'); if (sp) sp.style.height = '0';
    const hero = document.querySelector('.hero');     if (hero) hero.style.display = 'none';
    const st = document.getElementById('stage');      if (st) st.style.display = 'none';
  }
  if (CAPTURE) {
    armed.forEach(el => {
      el.style.transition = 'none';
      el.classList.remove('pre', 'framed');
      const im = el.querySelector && el.querySelector('.card__img');
      if (im) { im.style.transition = 'none'; im.style.clipPath = ''; }
    });
  }

  /* Watchers are REVERSIBLE: entering the band plays the reveal, leaving it puts
     the element back to its pre-animation state so the reveal plays again next
     time. A band of hysteresis between the enter and exit thresholds stops it
     flickering when you hover around the boundary. */
  const watchers = [];
  const HYST = 0.12;

  function watch(el, atFraction, onEnter, onExit) {
    if (!el || CAPTURE) return;
    watchers.push({ el, atFraction, onEnter, onExit, on: false, timers: [] });
  }
  function later(w, fn, ms) { w.timers.push(setTimeout(fn, ms)); }
  function clearTimers(w) { w.timers.forEach(clearTimeout); w.timers = []; }

  let pumped = 0;
  function pumpWatchers() {
    // rAF runs before paint, so acting on the very first frame would undo the
    // armed state before it was ever drawn
    if (pumped++ < 1) return;
    const vh = window.innerHeight;
    for (const wv of watchers) {
      const r = wv.el.getBoundingClientRect();
      const inBand  = r.top < vh * wv.atFraction && r.bottom > 0;
      // Only a BOTTOM exit resets. An element that has framed out through the top
      // of the viewport keeps its finished state — scrolling back up should not
      // re-arm something the reader has already watched arrive. Only things still
      // below the fold are re-armed, ready to play when they come back up.
      const outBand = r.top > vh * (wv.atFraction + HYST);
      if (!wv.on && inBand) { wv.on = true; clearTimers(wv); wv.onEnter(wv); }
      else if (wv.on && outBand) { wv.on = false; clearTimers(wv); wv.onExit(wv); }
    }
  }

  // header: wait until it is clearly inside the viewport, not merely at the edge
  watch(header, 0.78,
    wv => HEADER_SEQ.forEach(([sel, delay]) => {
      const el = section.querySelector(sel);
      if (el) later(wv, () => el.classList.remove('pre'), delay);
    }),
    () => HEADER_SEQ.forEach(([sel]) => {
      const el = section.querySelector(sel);
      if (el) el.classList.add('pre');
    }));

  // cards: each triggers on its own area, with a small stagger
  cards.forEach((card, i) => {
    const im = card.querySelector('.card__img');
    const txt = [...card.querySelectorAll('.card__meta .mask')];
    txt.forEach(m => m.classList.add('pre'));
    watch(card, 0.86,
      wv => {
        const d = i * 110;
        later(wv, () => card.classList.remove('pre'), d);
        later(wv, () => {
          card.classList.remove('framed');
          if (im) im.style.clipPath = 'inset(0% 0% 0% 0%)';
        }, d + 60);
        // the copy follows the frame: client name, headline, then the pill
        txt.forEach((m, j) => later(wv, () => m.classList.remove('pre'), d + 420 + j * 110));
      },
      () => {
        card.classList.add('pre', 'framed');
        txt.forEach(m => m.classList.add('pre'));
        if (im) im.style.clipPath = 'inset(16% 13% 16% 13%)';
      });
  });

  watch(ticker, 0.92,
    () => ticker.classList.remove('pre'),
    () => ticker.classList.add('pre'));

  /* ================================================ "View case study" cursor */
  /* The hero's big optical disc, reborn at cursor scale. It follows on its own
     spring rather than being pinned to the mouse, which is what keeps it feeling
     like the same physical object rather than a novelty cursor. */
  const cur = document.querySelector('.cs-cursor');
  const cs = { x: 0, y: 0, tx: 0, ty: 0, on: 0, want: 0, seen: false };

  if (cur && cards.length) {
    /* The IMAGE block is the trigger, not the card. A card is 680x340 -- the 340 image
       plus the text column beside it -- so binding to the card put the cursor up while
       the pointer was over the copy, a long way from anything clickable. */
    cards.forEach(card => {
      const img = card.querySelector('.card__img');
      if (!img) return;
      img.addEventListener('pointerenter', () => { cs.want = 1; cur.classList.add('on'); });
      img.addEventListener('pointerleave', e => {
        // moving straight from one image block to another keeps it alive; moving onto
        // this card's own copy does not, because the copy is not a trigger any more
        const to = e.relatedTarget;
        if (to && to.closest && to.closest('.card__img')) return;
        cs.want = 0; cur.classList.remove('on');
      });
    });
    addEventListener('pointermove', e => {
      cs.tx = e.clientX; cs.ty = e.clientY;
      if (!cs.seen) { cs.x = cs.tx; cs.y = cs.ty; cs.seen = true; }
    }, { passive: true });
  }

  /* ============================================== cards that play by themselves */
  /* Two of the three cards are video rather than a still, and they play on their own:
     the markup carries autoplay/muted/loop/playsinline, so they are running before any
     script touches them and they keep running if this block never executes.

     What this adds is only the OFF-SCREEN PAUSE. The Work section is one screen of a
     long page, and two 720x720 loops decoding while someone is reading the footer is
     battery spent on something nobody can see. The same reasoning gates the footer's
     headline and the gradients.

     Deliberately biased toward playing: anything even slightly on screen plays, and only
     a card fully out of view is paused. A threshold of 0 with no margin would stop them
     at the moment they are about to be needed. play() returns a promise that rejects if
     the element is paused again before it resolves -- which a fast scroll does -- so the
     empty catch keeps that off the console.

     No rewind on pause. These are ambient loops, not a reveal; resuming where it left
     off is what a continuously running thing should look like when you come back. */
  const vids = [...section.querySelectorAll('.card__img video')];
  if (vids.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const v = e.target;
        if (e.isIntersecting) { if (v.paused) v.play().catch(() => {}); }
        else if (!v.paused) v.pause();
      });
    }, { threshold: 0, rootMargin: '120px' });
    vids.forEach(v => io.observe(v));
  }

  /* Reduced motion: an ambient loop is exactly the kind of unrequested movement the
     preference is about, so it is held on its first frame instead. */
  const stillPref = matchMedia('(prefers-reduced-motion: reduce)');
  function respectMotion() {
    if (!stillPref.matches) return;
    vids.forEach(v => { v.pause(); v.removeAttribute('autoplay'); });
  }
  stillPref.addEventListener ? stillPref.addEventListener('change', respectMotion)
                             : stillPref.addListener(respectMotion);
  respectMotion();

  /* ======================================================= cursor interaction */
  /* Tracked in the section's own p-space so it lines up with the gradient, and
     eased so the field trails the pointer slightly. */

  addEventListener('pointermove', ev => {
    const r = section.getBoundingClientRect();
    const w2 = r.width || 1, h2 = r.height || 1;
    const sx = (ev.clientX - r.left) / w2;
    const sy = (ev.clientY - r.top) / h2;
    fld.tx = (sx - 0.5) * (w2 / h2);
    fld.ty = (sy - 0.5);
    if (!fld.seen) { fld.x = fld.tx; fld.y = fld.ty; fld.seen = true; }
    // only "on" while the pointer is actually over the section
    fld.want = (ev.clientY > r.top && ev.clientY < r.bottom) ? 1 : 0;
  }, { passive: true });
  addEventListener('pointerleave', () => { fld.want = 0; }, { passive: true });
  addEventListener('blur', () => { fld.want = 0; });

  /* =============================================================== logo ticker */
  const track = document.querySelector('.ticker__track');
  let tickerW = 0, tickerX = 0;

  /* ==================================================================== loop */
  let last = performance.now(), t = 0;
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now; t += dt * CONFIG.render.timeScale;

    const r = section.getBoundingClientRect();

    pumpWatchers();

    const near = r.bottom > -200 && r.top < innerHeight + 200;
    // How far the cool mass has swollen, from scroll. Zero while it still sits low
    // in the section; one once it has filled the viewport.
    // anchor on the dome's apex (about 70% down the section), not the section middle,
    // or the expansion starts long before the gradient is even in view
    const domeDoc = r.top + r.height * 0.70;
    const expand = Math.max(0, Math.min(1,
      (window.innerHeight - domeDoc) / Math.max(FEATUREDWORK.expandPx, 1)));
    const se = expand * expand * (3 - 2 * expand);

    fld.x += (fld.tx - fld.x) * FEATUREDWORK.curEase;
    fld.y += (fld.ty - fld.y) * FEATUREDWORK.curEase;
    fld.amt += (fld.want - fld.amt) * FEATUREDWORK.curFade;

    if (near && renderGradient) renderGradient(t, se);

    if (cur) {
      const e = 0.14;                       // eased follow, not pinned
      cs.x += (cs.tx - cs.x) * e;
      cs.y += (cs.ty - cs.y) * e;
      cs.on += (cs.want - cs.on) * 0.16;    // scale eases in and out with it
      const s = 0.55 + 0.45 * cs.on;
      cur.style.transform =
        'translate3d(' + cs.x.toFixed(1) + 'px,' + cs.y.toFixed(1) + 'px,0) scale(' + s.toFixed(3) + ')';
    }

    if (track && near) {
      if (!tickerW) {
        const row = track.firstElementChild;
        if (row) tickerW = row.getBoundingClientRect().width;
      }
      if (tickerW) {
        tickerX -= dt * (tickerW / 46);     // one row every ~46s. Slow.
        if (tickerX <= -tickerW) tickerX += tickerW;   // seamless: two identical rows
        track.style.transform = 'translate3d(' + tickerX.toFixed(2) + 'px,0,0)';
      }
    }

    if (!STILL) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  addEventListener('resize', () => { tickerW = 0; });
  addEventListener('scroll', pumpWatchers, { passive: true });
})();
