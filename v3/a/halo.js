/* ============================================================================
   PROOF FIELD — the green/aqua mass behind the Proof section.
   Visible at rest; the cursor drags it with lag and stretches the colour mass in
   the direction of travel. Same machinery as the Hero and Work gradients so the
   three behave as one system.
   ========================================================================= */
(function () {
  'use strict';

  const canvas = document.getElementById('halogl');
  // the canvas now spans the whole Expertise section (it sits behind the header
  // copy as well as the circles), so size and track against that box
  const host = canvas && canvas.parentElement;
  const NOGL = /[?&]nogl=1/.test(location.search);
  if (!host || !canvas || NOGL || typeof HALO === 'undefined') return;

  const gl = canvas.getContext('webgl2', {
    alpha: true, antialias: false, depth: false, stencil: false,
    premultipliedAlpha: true, powerPreference: 'high-performance'
  });
  if (!gl) return;

  const NP = HALO.poles.length;
  const TAU = Math.PI * 2;
  const hash1 = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const hexToRgb = h => {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    const v = parseInt(h, 16);
    return [((v>>16)&255)/255, ((v>>8)&255)/255, (v&255)/255];
  };

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('halo: ' + gl.getShaderInfoLog(s));
    return s;
  }
  function program(frag) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(p);
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const nm = gl.getActiveUniform(p, i).name.replace(/\[0\]$/, '');
      u[nm] = gl.getUniformLocation(p, nm);
    }
    return { p, u };
  }

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
  const poleRad = new Float32Array(NP), poleCol = new Float32Array(NP*3);

  function simulate(t) {
    const H = HALO, bg = hexToRgb(CONFIG.bg);
    let ccx = 0, ccy = 0;
    for (let i = 0; i < NP; i++) { ccx += H.poles[i].x; ccy += H.poles[i].y; }
    ccx /= NP; ccy /= NP;
    for (let i = 0; i < NP; i++) {
      const pl = H.poles[i];
      const h1 = hash1(i+1), h2 = hash1(i+8.3), h3 = hash1(i+17.7), h4 = hash1(i+29.1);
      const per = H.orbitPeriod * (0.72 + 0.56*h1), ph = h2*TAU;
      const a = H.orbitAmp * (0.65 + 0.70*h3), b = a * (0.45 + 0.60*h4);
      const rot = h1*TAU, w = TAU*t/per + ph;
      const ex = Math.cos(w)*a, ey = Math.sin(w)*b;
      colorPos[i*2]   = ccx + (pl.x-ccx)*H.colorSpread + ex*Math.cos(rot) - ey*Math.sin(rot);
      colorPos[i*2+1] = ccy + (pl.y-ccy)*H.colorSpread + ex*Math.sin(rot) + ey*Math.cos(rot);
      const sw = TAU*t/(per*H.shapePeriodMul) + ph*0.6, rnd = H.shapeRound || 0;
      shapePos[i*2]   = ccx + (pl.x-ccx)*(1-rnd) + Math.cos(sw)*H.shapeDrift;
      shapePos[i*2+1] = ccy + (pl.y-ccy)*(1-rnd) + Math.sin(sw)*H.shapeDrift*0.7;
      const rp = H.radiusBreathPeriod * (0.80 + 0.40*h3);
      poleRad[i] = pl.r * (1 + rnd*0.5) * (1 + H.radiusBreath*Math.sin(TAU*t/rp + ph));
      const c = hexToRgb(pl.color), bp = H.breathPeriod;
      const bb = 1 + H.brightBreath*Math.sin(TAU*t/(bp*(0.80+0.50*h2)) + ph*1.3);
      const sb = 1 + H.satBreath   *Math.sin(TAU*t/(bp*(0.90+0.50*h4)) + ph*0.7 + 1.7);
      let r = c[0]*bb, g2 = c[1]*bb, bl = c[2]*bb;
      const lum = 0.2126*r + 0.7152*g2 + 0.0722*bl;
      r = lum+(r-lum)*sb; g2 = lum+(g2-lum)*sb; bl = lum+(bl-lum)*sb;
      // wash toward the background, same as the hero and Work gradients. This was
      // missing: HALO.paletteWash existed in the config but nothing here read it,
      // so the halo was the one gradient whose opacity dial did nothing at all.
      const wsh = H.paletteWash || 0;
      poleCol[i*3]   = Math.max(0, r  + (bg[0]-r )*wsh);
      poleCol[i*3+1] = Math.max(0, g2 + (bg[1]-g2)*wsh);
      poleCol[i*3+2] = Math.max(0, bl + (bg[2]-bl)*wsh);
    }
  }

  /* ---- cursor: follow with lag, stretch along the direction of travel ---- */
  const cur = { x: 0, y: 0, tx: 0, ty: 0, amt: 0, want: 0, seen: false };
  addEventListener('pointermove', ev => {
    const r = host.getBoundingClientRect();
    const w2 = r.width || 1, h2 = r.height || 1;
    cur.tx = ((ev.clientX - r.left) / w2 - 0.5) * (w2 / h2);
    cur.ty = ((ev.clientY - r.top) / h2 - 0.5);
    if (!cur.seen) { cur.x = cur.tx; cur.y = cur.ty; cur.seen = true; }
    cur.want = (ev.clientY > r.top && ev.clientY < r.bottom &&
                ev.clientX > r.left && ev.clientX < r.right) ? 1 : 0;
  }, { passive: true });
  addEventListener('pointerleave', () => { cur.want = 0; }, { passive: true });
  addEventListener('blur', () => { cur.want = 0; });

  let cssW = 0, cssH = 0, dpr = 1;
  function resize() {
    const r = host.getBoundingClientRect();
    cssW = Math.max(1, Math.round(r.width));
    cssH = Math.max(1, Math.round(r.height));
    dpr = Math.min(window.devicePixelRatio || 1, HALO.dprMax || 1);
    const w = Math.round(cssW*dpr), h = Math.round(cssH*dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    size(tGrad, Math.max(2, Math.round(w*CONFIG.render.gradScale)),
                Math.max(2, Math.round(h*CONFIG.render.gradScale)));
    const bw = Math.max(2, Math.round(w*CONFIG.render.blurScale));
    const bh = Math.max(2, Math.round(h*CONFIG.render.blurScale));
    size(tPing, bw, bh); size(tPong, bw, bh);
  }
  addEventListener('resize', () => { cssW = 0; });

  let last = performance.now(), t = 0;
  const STILL = /[?&]still=1/.test(location.search);

  /* No gate. This field used to live in Expertise, where it had to stay off until
     the four circles had finished animating -- it waited on EXP_CIRCLES_SETTLED. In
     Proof there is nothing to wait for, and the coupling to another section's
     animation would be a trap: the field is simply on. */

  function frame(now) {
    const dt = Math.min((now - last)/1000, 0.1); last = now;
    t += dt * CONFIG.render.timeScale;

    const r = host.getBoundingClientRect();
    const near = r.bottom > -200 && r.top < innerHeight + 200;

    cur.x += (cur.tx - cur.x) * HALO.ease;
    cur.y += (cur.ty - cur.y) * HALO.ease;
    cur.amt += (cur.want - cur.amt) * HALO.fade;

    const vis = HALO.rest + (1 - HALO.rest) * cur.amt;
    canvas.style.opacity = vis.toFixed(3);

    if (near && vis > 0.01) {
      if (!cssW) resize();
      simulate(t);
      const H = HALO;

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
      gl.uniform1f(u.uScale, H.scale);
      // the mass leans toward the pointer, and elongates along that direction
      /* followX/followY are 0, so these resolve to the fixed offsets -- the mass is
         locked where the reference puts it. The terms are kept so the behaviour is
         one number away if it is ever wanted back. */
      gl.uniform1f(u.uOffX, H.offsetX + cur.x * H.followX * cur.amt);
      gl.uniform1f(u.uOffY, H.offsetY + cur.y * H.followY * cur.amt);
      const fl = Math.hypot(cur.x, cur.y) || 1e-5;
      gl.uniform2f(u.uStretchDir, cur.x / fl, cur.y / fl);
      gl.uniform1f(u.uStretchAmt, Math.min(fl * H.stretch, 0.8) * cur.amt);
      gl.uniform1f(u.uShapeWarpAmp, H.shapeWarpAmp);
      gl.uniform1f(u.uShapeWarpFreq, H.shapeWarpFreq);
      gl.uniform1f(u.uShapeWarpSpeed, H.shapeWarpSpeed);
      gl.uniform1f(u.uColorWarpAmp, H.colorWarpAmp);
      gl.uniform1f(u.uColorWarpFreq, H.colorWarpFreq);
      gl.uniform1f(u.uColorWarpSpeed, H.colorWarpSpeed);
      gl.uniform1f(u.uEdgeGain, H.edgeGain);
      gl.uniform1f(u.uEdgeShape, H.edgeShape);
      gl.uniform1f(u.uFalloff, H.falloff);
      gl.uniform1f(u.uColorFalloff, H.colorFalloff);
      /* The local field response, which is what the cursor drives now that it no
         longer moves anything. uCurWarp is 0, so the colour regions do not even bend:
         uCurSat and uCurHue shift the tone under the pointer and nothing else. */
      gl.uniform2f(u.uCurPos, cur.x, cur.y);
      gl.uniform1f(u.uCurAmt, cur.amt);
      gl.uniform1f(u.uCurRadius, H.curRadius);
      gl.uniform1f(u.uCurWarp, H.curWarp);
      gl.uniform1f(u.uCurSat, H.curSat);
      gl.uniform1f(u.uCurHue, H.curHue || 0);
      gl.uniform1f(u.uCurSpread, H.curSpread);
      draw();

      const soft = 1 + H.blurBreath * Math.sin(TAU * t / H.blurBreathPeriod);
      gl.useProgram(pBlur.p);
      gl.uniform1i(pBlur.u.uTex, 0);
      gl.activeTexture(gl.TEXTURE0);
      const total = H.blurPx * soft * dpr * CONFIG.render.blurScale;
      const iters = Math.max(1, Math.round(H.blurIterations));
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
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(pFlat.p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, src.tex);
      gl.uniform1i(pFlat.u.uTex, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, tGrad.tex);
      gl.uniform1i(pFlat.u.uSharp, 1);
      gl.uniform2f(pFlat.u.uRes, canvas.width, canvas.height);
      gl.uniform2f(pFlat.u.uCssRes, cssW, cssH);
      gl.uniform3fv(pFlat.u.uBg, hexToRgb(CONFIG.bg));
      gl.uniform1f(pFlat.u.uTime, t);
      gl.uniform1f(pFlat.u.uDither, CONFIG.render.dither);
      gl.uniform1f(pFlat.u.uAspect, cssW / cssH);
      gl.uniform1f(pFlat.u.uCurAmt, 0);
      gl.activeTexture(gl.TEXTURE0);
      draw();
    }

    if (!STILL) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
