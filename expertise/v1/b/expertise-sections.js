/* ============================================================================
   EXPERTISE PAGE — the sections.

     - where the page is: XP.state() is a float, 0 for the hero, 1-4 for the areas
       and 5 for Reasons, moving smoothly between them as each one arrives; XP.bump()
       is 0 while an area's title holds the screen and rises to 1 while its case study
       passes. The centre graphic (expertise-page.js) is driven by these two numbers.
     - scroll reveals, on the homepage's thresholds and sequences
     - the case studies: their frames open and their pictures drift with the scroll
     - the accordion, the "View case study" cursor, the off-screen video pause
   ========================================================================= */
(function () {
  'use strict';

  const Q = location.search;
  const CAPTURE   = /[?&]top=1/.test(Q) && !/[?&]anim=1/.test(Q);
  const reduced   = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const skipIntro = reduced || /[?&]intro=0/.test(Q);
  const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
  const smooth  = x => { x = clamp01(x); return x * x * (3 - 2 * x); };

  /* ================================================== where the page is */
  /* Each block hands over as its top crosses 65% of the screen, over 40% of it, so a
     state holds for most of a section and the change happens between sections. */
  const areas   = [...document.querySelectorAll('.slide[data-area]')];
  const reasons = document.getElementById('faq');
  const marks   = reasons ? [...areas, reasons] : areas;
  const topOf = el => el.getBoundingClientRect().top;
  function state() {
    const vh = innerHeight;
    let v = 0;
    marks.forEach(el => { v += smooth((vh * 0.65 - topOf(el)) / (vh * 0.4)); });
    return v;
  }
  function bump() {
    const vh = innerHeight;
    let b = 0;
    areas.forEach(a => {
      const r = a.getBoundingClientRect();
      const p = (vh * 0.5 - topOf(a)) / r.height;
      if (p > 0 && p < 1) b = Math.max(b, Math.pow(Math.sin(Math.PI * p), 2));
    });
    return b;
  }
  window.XP = { state, bump, reduced, skipIntro, CAPTURE, smooth };

  /* ================================================================ reveals */
  /* featuredwork.js's watcher: entering the band plays, only a BOTTOM exit re-arms,
     0.12 of hysteresis between. The first pass reveals anything already on screen. */
  const HYST = 0.12;
  const watchers = [];
  const watch = (el, at, onEnter, onExit) => el && watchers.push({ el, at, onEnter, onExit, on: false, timers: [] });
  const later = (w, fn, ms) => w.timers.push(setTimeout(fn, ms));
  const clear = w => { w.timers.forEach(clearTimeout); w.timers = []; };
  const arm = els => els.forEach(el => el.classList.add('pre'));

  // a header: eyebrow 0, headline 95, body 235 -- the Featured Work header's beats --
  // then its pills, one every 60ms from where the homepage's CTA would land
  const HEAD_SEQ = [0, 95, 235, 335];
  // a panel's copy, on the locked panels, is played by expertise-page.js's copy layer
  const pinned = innerWidth > 767;
  document.querySelectorAll('[data-head]').forEach(head => {
    if (pinned && head.closest('.slides .slide')) return;
    const parts = [...head.querySelectorAll('[data-rv]')];
    const pills = [...head.querySelectorAll('.pill')];
    arm(parts); arm(pills);
    watch(head, 0.78,
      w => {
        parts.forEach(el => later(w, () => el.classList.remove('pre'), HEAD_SEQ[+el.dataset.rv] || 0));
        pills.forEach((p, j) => later(w, () => p.classList.remove('pre'), 335 + j * 60));
      },
      () => { arm(parts); arm(pills); });
  });

  // the questions: one after another, 110ms apart
  document.querySelectorAll('[data-list]').forEach(list => {
    const masks = [...list.querySelectorAll('.mask')].filter(m => !m.closest('.acc__a'));
    arm(masks);
    watch(list, 0.86,
      w => masks.forEach((m, j) => later(w, () => m.classList.remove('pre'), j * 110)),
      () => arm(masks));
  });

  // a case study's copy has NO reveal of its own: it arrives with the side column that
  // slides in over the picture, and a second motion inside it would be one too many

  // the hero index follows the hero copy's intro (app.js, 1610ms), a row every 110ms
  const introList = document.querySelector('[data-intro-list]');
  if (introList && !skipIntro && !CAPTURE) {
    const masks = [...introList.querySelectorAll('.mask')];
    arm(masks);
    masks.forEach((m, j) => setTimeout(() => m.classList.remove('pre'), 1610 + 220 + j * 110));
  }

  if (CAPTURE) {
    document.querySelectorAll('.pre').forEach(el => { el.style.transition = 'none'; el.classList.remove('pre'); });
    watchers.length = 0;
  }

  let pumped = 0, cold = true;
  function gates() {
    if (pumped++ < 1) return;            // never undo the armed state before it paints
    const vh = innerHeight;
    for (const w of watchers) {
      const r = w.el.getBoundingClientRect();
      const inBand  = r.top < vh * (cold ? 1 : w.at) && r.bottom > 0;
      const outBand = r.top > vh * (w.at + HYST);
      if (!w.on && inBand) { w.on = true; clear(w); w.onEnter(w); }
      else if (w.on && outBand) { w.on = false; clear(w); w.onExit(w); }
    }
    cold = false;
  }
  addEventListener('scroll', gates, { passive: true });

  /* ============================================================ case studies */
  /* SCRUBBED, not triggered: the frame's opening is the homepage card's -- inset from
     the edges toward its own centre -- but it follows the scroll, so it opens as the
     picture rises and closes again if you go back. Inside, the picture is held 14%
     oversize and drifts against the scroll, so the frame reads as a window onto it. */
  const frames = [...document.querySelectorAll('.xa__frame')];
  function stepFrames() {
    const vh = innerHeight;
    frames.forEach(f => {
      const r = f.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      const open = (reduced || CAPTURE) ? 1 : smooth((vh - r.top) / (vh * 0.75));
      // from 80% of the full measure -- inset 10% each side, the same 2:1 -- out to its
      // full width
      const ins = (10 * (1 - open)).toFixed(2) + '%';
      f.style.clipPath = 'inset(' + ins + ' ' + ins + ')';
      // its stats slide in once it has nearly opened, the second block a step behind
      /* the column slides in as the card comes to the middle of the screen -- from its
         centre 35% of a screen below the middle to its centre ON the middle -- and
         EASES toward where the scroll puts it rather than jumping with every step, on a
         gentler curve (smootherstep), so it glides in */
      const mid = r.top + r.height / 2;
      const target = (reduced || CAPTURE) ? 1 : clamp01((vh * 0.85 - mid) / (vh * 0.35));
      f._sp = (f._sp === undefined || reduced || CAPTURE) ? target : f._sp + (target - f._sp) * 0.07;
      const sp = f._sp;
      // text and stats slide in TOGETHER, as one column
      const blocks = f.querySelectorAll('.xstat'), lag = 0, run = 1;
      blocks.forEach((b, i) => {
        const x = clamp01((sp - i * lag) / run);
        const k = x * x * x * (x * (x * 6 - 15) + 10);
        b.style.setProperty('--k', k.toFixed(4));
        // the picture gives way to the first block as it arrives
        if (i === 0) f.style.setProperty('--ks', k.toFixed(4));
      });

    });
  }

  /* ============================================================== accordion */
  // ONE OPEN AT A TIME: opening a question closes whichever other one is open
  const accQs = [...document.querySelectorAll('.acc__q')];
  const setAcc = (btn, on) => {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.closest('.acc__item').classList.toggle('is-open', on);
    btn.setAttribute('aria-expanded', String(on));
    if (panel) panel.inert = !on;
  };
  accQs.forEach(btn => {
    btn.addEventListener('click', () => {
      const on = !btn.closest('.acc__item').classList.contains('is-open');
      if (on) accQs.forEach(o => { if (o !== btn) setAcc(o, false); });
      setAcc(btn, on);
    });
  });

  /* ================================================ "View case study" cursor */
  // featuredwork.js's: the picture is the trigger, the disc follows on a 0.14 spring
  const cur = document.querySelector('.cs-cursor');
  const cs = { x: 0, y: 0, tx: 0, ty: 0, on: 0, want: 0, seen: false };
  if (cur) {
    /* ON THE MEDIA ONLY, not the copy and stats column beside it. The column lets the
       pointer through, so the test is against the picture's own box -- which narrows as
       the column arrives -- rather than the frame's. */
    const setOn = v => { if (v === !!cs.want) return; cs.want = v ? 1 : 0; cur.classList.toggle('on', v); };
    frames.forEach(f => {
      const media = f.querySelector('img, video, .card__ph');
      f.addEventListener('pointermove', e => {
        const r = (media || f).getBoundingClientRect();
        setOn(e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom);
      });
      f.addEventListener('pointerleave', () => setOn(false));
    });
    addEventListener('pointermove', e => {
      cs.tx = e.clientX; cs.ty = e.clientY; cs.in = true;
      if (!cs.seen) { cs.x = cs.tx; cs.y = cs.ty; cs.seen = true; }
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { cs.in = false; });

    /* THE SLIDES (2026-10-23): the disc is up over the RIGHT HALF of whichever area panel
       is on top under the pointer -- the picture's half, clear of the copy -- and a click
       there follows that panel's case link. Asked every frame from the last pointer
       position, so it comes and goes as panels scroll under a still pointer too. */
    const panelsEl = [...document.querySelectorAll('.slides .slide')];
    const bar = document.querySelector('.topbar');
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const panelAt = (x, y) => {
      if (!fine.matches || innerWidth <= 767) return null;
      if (bar && bar.contains(document.elementFromPoint(x, y))) return null;
      // later panels sit on top, so the last one that holds the point is the one seen
      for (let i = panelsEl.length - 1; i >= 0; i--) {
        const r = panelsEl[i].getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
          return x >= r.left + r.width / 2 ? panelsEl[i] : null;
        }
      }
      return null;
    };
    cs.panel = null;
    cs.checkPanels = () => {
      const p = cs.seen && cs.in ? panelAt(cs.tx, cs.ty) : null;
      if (p !== cs.panel) {
        cs.panel = p;
        document.documentElement.classList.toggle('cs-over', !!p);
        if (!frames.length || p) setOn(!!p);
      }
    };
    addEventListener('click', e => {
      const p = panelAt(e.clientX, e.clientY);
      const link = p && p.querySelector('.project__link');
      if (!link || e.target.closest('a, button')) return;
      link.click();
    });
  }
  function stepCursor() {
    if (cs.checkPanels) cs.checkPanels();
    if (!cur) return;
    cs.x += (cs.tx - cs.x) * 0.14;
    cs.y += (cs.ty - cs.y) * 0.14;
    cs.on += (cs.want - cs.on) * 0.16;
    cur.style.transform = 'translate3d(' + cs.x.toFixed(1) + 'px,' + cs.y.toFixed(1) + 'px,0) scale(' +
                          (0.55 + 0.45 * cs.on).toFixed(3) + ')';
  }

  /* ============================================ videos: play only on screen */
  const vids = [...document.querySelectorAll('.xa__frame video, .slide__media video')];
  if (vids.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (reduced) return;
      const v = e.target;
      if (e.isIntersecting) { if (v.paused) v.play().catch(() => {}); }
      else if (!v.paused) v.pause();
    }), { threshold: 0, rootMargin: '120px' });
    vids.forEach(v => io.observe(v));
  }
  if (reduced) vids.forEach(v => { v.pause(); v.removeAttribute('autoplay'); });
  // the blurred ground (.slide__ambient) follows its sharp clip, so the two never drift apart
  document.querySelectorAll('.slide__ambient').forEach(amb => {
    const main = amb.parentNode.querySelector('.slide__reel');
    if (!main) return;
    main.addEventListener('timeupdate', () => {
      if (Math.abs(amb.currentTime - main.currentTime) > 0.25) amb.currentTime = main.currentTime;
    });
  });

  (function frame() {
    gates();
    stepFrames();
    stepCursor();
    requestAnimationFrame(frame);
  })();
})();
