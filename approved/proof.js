/* ============================================================================
   PROOF SECTION
     - masked headline / CTA reveal
     - stats revealed a row at a time, each number counting up
     - everything replays when you scroll away and come back
   ========================================================================= */
(function () {
  'use strict';

  const section = document.getElementById('proof');
  if (!section) return;

  const CAPTURE = /[?&]top=1/.test(location.search) && !/[?&]anim=1/.test(location.search);

  /* Three steps: the headline is one mask now, not one per line, and the eyebrow is
     gone. Rebased off the headline so the section still opens on the beat -- holding
     the old numbers would have left 110ms of nothing where the eyebrow used to be. */
  const HEAD_SEQ = [
    ['[data-pv="1"]',   0],   // headline
    ['[data-pv="2"]', 180],   // body
    ['[data-pv="3"]', 280]    // CTA
  ];
  const head  = section.querySelector('.sec-head__title');
  const stats = [...section.querySelectorAll('.stat')];
  const rows  = [0, 1].map(r => stats.filter(s => +s.dataset.row === r));

  /* ------------------------------------------------------------------ arming */
  const armed = [];
  HEAD_SEQ.forEach(([sel]) => {
    const el = section.querySelector(sel);
    if (el) { el.classList.add('pre'); armed.push(el); }
  });
  stats.forEach(s => {
    s.classList.add('pre');
    s.querySelectorAll('.mask').forEach(m => m.classList.add('pre'));
    armed.push(s);
  });

  void section.offsetHeight;

  function setNum(el, v) {
    const suffix = el.dataset.suffix || '';
    el.textContent = Math.round(v) + suffix;
  }
  stats.forEach(s => {
    const n = s.querySelector('.stat__num > span');
    if (n) setNum(n, CAPTURE ? +n.dataset.to : 0);
  });

  if (CAPTURE) {
    armed.forEach(el => {
      el.style.transition = 'none';
      el.classList.remove('pre');
      el.querySelectorAll && el.querySelectorAll('.mask').forEach(m => m.classList.remove('pre'));
    });
  }

  /* -------------------------------------------------------------- count-up */
  /* Eased, so it decelerates into the final value rather than ticking like a
     slot machine, and it always lands exactly on the target. */
  const counters = [];
  function countUp(el, dur) {
    const to = parseFloat(el.dataset.to) || 0;
    const c = { el, to, t0: performance.now(), dur, live: true };
    counters.push(c);
    return c;
  }
  function stepCounters(now) {
    for (let i = counters.length - 1; i >= 0; i--) {
      const c = counters[i];
      if (!c.live) { counters.splice(i, 1); continue; }
      const p = Math.min(1, (now - c.t0) / c.dur);
      const e = 1 - Math.pow(1 - p, 3);
      setNum(c.el, c.to * e);
      if (p >= 1) { setNum(c.el, c.to); c.live = false; }
    }
  }

  /* ------------------------------------------------- reversible stage gating */
  const stage = { head: false, rows: [false, false] };

  /* ONE TIMER LIST PER STAGE, not one for the section. They used to share a single
     array with a clearAll() that emptied it, and setHead was the only caller -- which
     was harmless for as long as the headline was the first thing to cross its gate.

     It stopped being harmless when the stats were top-aligned with the headline. The
     two blocks now start on the same line, and the row gate enters at 0.84 of the
     viewport against the headline's 0.80 -- a LARGER fraction crosses EARLIER on the
     way down -- so setRow would schedule its staggered reveal and setHead would run a
     frame later and clear it. The stats stayed .pre, which is invisible, and whether it
     happened at all depended on how fast you were scrolling when you arrived.
     Reproduced at 6 of 14 landing positions; 0 of 14 with this.

     Scoping the list also fixes a second case nobody had hit: a row that is revealed and
     then scrolled away from before its 260ms stagger has finished used to leave live
     timers that removed .pre after the exit had put it back. Each state change now
     cancels its own pending work and nobody else's. */
  const timers = { head: [], r0: [], r1: [] };
  const later = (key, fn, ms) => timers[key].push(setTimeout(fn, ms));
  const clearKey = key => { timers[key].forEach(clearTimeout); timers[key] = []; };

  function setHead(on) {
    if (on === stage.head) return;
    stage.head = on;
    clearKey('head');
    HEAD_SEQ.forEach(([sel, d]) => {
      const el = section.querySelector(sel);
      if (!el) return;
      if (on) later('head', () => el.classList.remove('pre'), d);
      else el.classList.add('pre');
    });
  }

  function setRow(r, on) {
    if (on === stage.rows[r]) return;
    stage.rows[r] = on;
    const key = 'r' + r;
    clearKey(key);
    const delay = r * 260;                 // the second row follows the first
    rows[r].forEach((s, i) => {
      const n = s.querySelector('.stat__num > span');
      if (on) {
        later(key, () => {
          s.classList.remove('pre');
          s.querySelectorAll('.mask').forEach((m, j) => later(key, () => m.classList.remove('pre'), 90 + j * 90));
          if (n) countUp(n, 1150);
        }, delay + i * 110);
      } else {
        s.classList.add('pre');
        s.querySelectorAll('.mask').forEach(m => m.classList.add('pre'));
        if (n) { counters.forEach(c => { if (c.el === n) c.live = false; }); setNum(n, 0); }
      }
    });
  }

  function visible(el, enterAt, exitAt) {
    const r = el.getBoundingClientRect(), vh = window.innerHeight;
    // outB is a BOTTOM exit only: once something has framed out through the top
    // it stays in its finished state. See the note in featuredwork.js.
    return { inB: r.top < vh * enterAt && r.bottom > 0,
             outB: r.top > vh * exitAt };
  }

  /* THE FIRST PASS IS A COLD START, and it cannot use the scrolling thresholds.

     visible() reveals at enterAt and re-arms at exitAt, and the gap between them is
     deliberate -- it is what stops a row flapping as it crosses the line. But the gap is
     also a band where NEITHER fires, and on the first evaluation there is no previous
     state for it to protect: a page loaded (or reloaded, with the scroll restored) at a
     position that puts a row between 0.84 and 0.98 of the viewport leaves it armed and
     invisible, with nothing to trigger it until the reader happens to scroll.

     Measured before this: of 15 reload positions across the section, 4 left an on-screen
     row hidden -- every one of them with the row's top between 0.84 and 0.98.

     So the first pass enters on 1: anything on screen at all is revealed, hysteresis or
     not. Every pass after it uses the real thresholds, so the flap protection is intact
     for the only case it was ever for. */
  let cold = true;

  function gates() {
    if (CAPTURE) return;
    if (head) {
      const v = visible(head, cold ? 1 : 0.80, 0.94);
      /* No section-wide clear here any more: setHead cancels its own pending work and
         the rows cancel theirs, so the two cannot reach into each other. */
      if (!stage.head && v.inB) setHead(true);
      else if (stage.head && v.outB) setHead(false);
    }
    rows.forEach((group, r) => {
      if (!group.length) return;
      const v = visible(group[0], cold ? 1 : 0.84, 0.98);
      if (!stage.rows[r] && v.inB) setRow(r, true);
      else if (stage.rows[r] && v.outB) setRow(r, false);
    });
    cold = false;
  }

  /* ------------------------------------------------------------------- loop */
  let pumped = 0;
  function tick(now) {
    const t = now || performance.now();
    if (pumped++ >= 1) gates();
    stepCounters(t);
    requestAnimationFrame(tick);
  }
  // step the counters on scroll as well as in the loop, so the numbers stay
  // correct even if frames are being dropped
  addEventListener('scroll', () => {
    if (pumped >= 1) gates();
    stepCounters(performance.now());
  }, { passive: true });
  requestAnimationFrame(tick);
})();
