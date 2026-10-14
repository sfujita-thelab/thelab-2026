/* ============================================================================
   HERO — the mark, the rewriting headline, and the turn that goes with it

   Two things live here, and they are one file because they are one event: the
   headline changes and the mark turns on the same frame.

   ------------------------------------------------------------------- the mark
   The hero's centre object used to be an optical circle drawn in the fragment
   shader. It is the LOGO MARK now -- the same nine dots as .pf__mark in the footer
   and the svg in the topbar, built here as an SVG in the topbar's own 32-unit box.
   Its span is the circle's own diameter (two grid columns), set in the stylesheet,
   so the axis dots land where the circle's rim used to be.

   SVG rather than the footer's nine divs so the hairline stroke and the veil fill are
   one node each, with no box model in the way.

   THE ENTRANCE belongs to the stylesheet, not to this file. The mark turns a full
   revolution, from -360 degrees, and fades up while the grid's vertical lines wipe down -- see .hero__mark --
   and app.js throws the switch on the same frame it starts the grid. Nothing per-dot
   is animated: the mark arrives as one object.

   ------------------------------------------------------------------ the change
   "Build your" is fixed. The line under it cycles through kinds of work, and the
   change is the FOOTER'S OWN HAND-OVER, in two beats: the old word SINKS and fades
   out, and only once it has cleared does the new one RISE and fade in. Two words
   exist at once for the length of a swap -- the outgoing one stays in flow and goes
   on defining the box, the incoming one is absolutely positioned over it and waits
   below. Both move through the same space, so they are sequenced rather than
   simultaneous; the delay on .hero__w--in in the stylesheet is what keeps them off
   each other:

     outgoing   translateY(0)     ->  translateY(+roll)   fading out,   0 ->  450ms
     incoming   translateY(+roll) ->  translateY(0)       fading in,  230 ->  890ms

   They overlap on purpose, from 230 to 350ms, where the old word is still fading and
   the new one has begun -- brief enough to read as a hand-over rather than a crossfade.

   WHAT IS NOT HERE, and the footer has it: the animated box height. The footer's
   headline re-centres itself on its mark when a phrase wraps to two lines, so its box
   height is written in pixels and transitioned. The hero's h1 is white-space:nowrap
   and every phrase is one line, so the box never changes size. --roll is simply its
   own padded height, measured once.

   ------------------------------------------------------------------- the rhythm
   The same three things that keep the footer from reading as a loop, and none of them
   is the speed:

     * the HOLD is long and scales with the phrase, so there is time to read
       "digital platform" and no dead air after "commerce"
     * the ORDER is a fresh shuffle every pass, never the same cycle twice, and
       never the same phrase twice in a row across the seam between passes
     * the HOLD is jittered by up to half a second, so no two waits are the same

   --------------------------------------------------------------------- the turn
   The mark turns 45 degrees with every change -- one dot-step of an eight-dot ring,
   so it lands back on itself and what reads is the movement, not a new arrangement.
   The angle accumulates rather than resetting, which is what keeps every change
   turning the same way instead of rocking back and forth.
   ========================================================================= */
(function () {
  'use strict';

  const line = document.querySelector('.hero__head-dyn');
  const mark = document.querySelector('.hero__mark');

  /* ----------------------------------------------------------------- mark */
  /* Eight dots at 45 degree intervals from straight up, plus the centre -- the same
     geometry as .pf__mark and the topbar svg, in the topbar's own 32-unit box so the
     ratios are literally the shared ones: dot 0.225 of the span (r 3.6) on a ring of
     (32 - 7.2) / 2 = 12.4. The box is centred on zero, which is what lets --spin and
     --enter-rot rotate the mark about its middle with no transform-origin to keep in
     step with its size.

     Built once, at rest. The entrance and the turn are both transforms on the
     container, so nothing here is ever re-measured or re-written. */
  const R  = 12.4;              // ring radius, in the 32-unit box
  const DR = 3.6;               // one dot's radius
  const SPAN = 32;              // the viewBox's full span

  let svg = null;

  if (mark) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', (-SPAN / 2) + ' ' + (-SPAN / 2) + ' ' + SPAN + ' ' + SPAN);
    svg.setAttribute('aria-hidden', 'true');

    const dot = (cx, cy) => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('class', 'hero__dot');
      c.setAttribute('cx', cx.toFixed(4));
      c.setAttribute('cy', cy.toFixed(4));
      c.setAttribute('r',  DR);
      svg.appendChild(c);
    };

    for (let i = 0; i < 8; i++) {
      const a = (-90 + i * 45) * Math.PI / 180;
      dot(Math.cos(a) * R, Math.sin(a) * R);
    }
    dot(0, 0);                                  // the centre

    mark.innerHTML = '';
    mark.appendChild(svg);

    /* One CSS pixel, expressed in the box's user units. The mark is --hero-mark wide
       and the box is 32 across, so a stroke of 32 / that width renders as exactly one
       pixel -- the hairline the grid lines and the old rim are. Re-run on resize
       because --hero-mark is two grid columns and moves with the viewport.

       The USED WIDTH, via getComputedStyle, and both halves of that matter:

         not --hero-mark itself, because getComputedStyle on an unregistered custom
         property can hand back unevaluated calc() text rather than a resolved length;

         not getBoundingClientRect either, because that is the AXIS-ALIGNED box of the
         element AS TRANSFORMED -- and the mark turns through its entrance, so that box
         breathes: a 680px square measures 961.6 across at 45 degrees (680 * root 2) and
         680 again at 0. Sizing off it put the hairline anywhere from 0.71px to 1px
         depending on the frame it was measured. The used width is immune to the
         transform. */
    const sizeStroke = () => {
      const w = parseFloat(getComputedStyle(svg).width) || 0;
      svg.style.setProperty('stroke-width', (w > 0 ? SPAN / w : 0.05).toFixed(5));
    };
    sizeStroke();
    addEventListener('resize', sizeStroke, { passive: true });
  }

  if (!line) return;

  /* The footer's list, unchanged. Kept short for the same reason it is short there:
     the headline is nowrap, so a long phrase cannot wrap -- it would simply run wide. */
  const PHRASES = [
    'commerce platform.',
    'digital presence.',
    'next growth channel.',
    'AI capabilities.',
    'competitive edge.'
  ];

  const T = {
    /* The hand-over's own duration, in ms, and the stylesheet's .hero__w--in delay
       plus its travel have to add up to it: the swap is committed when this elapses
       on the same rAF clock the hold runs on. Same numbers as the footer, so the two
       headlines move at one speed. */
    roll:    890,
    /* The WAIT is 1.5x quicker -- 3200/95/500 divided by 1.5. The hold is what sets
       the pace: a cycle is this plus the 890ms hand-over, so at 3200 a phrase sat for
       about four seconds and now sits for a bit under three.

       `roll` is deliberately NOT scaled with them. It is the hand-over's own duration
       and it is pinned to the stylesheet -- .hero__w--in's 230ms delay plus its 660ms
       travel is this number -- so changing it here alone would commit the swap before
       the words had finished moving. The pace is the gap between changes; the change
       itself still takes as long as it takes. */
    hold:   2133,      // ms before a swap starts...
    perChar:  63,      // ...plus this much for every character in the phrase
    holdVary: 333      // ms of random spread on top
  };

  const rand = (a, b) => a + Math.random() * (b - a);

  /* ---------------------------------------------------------------- order */
  /* A fresh shuffle each pass rather than a fixed rotation. `last` carries across
     the seam so a reshuffle cannot repeat the phrase that is already on screen. */
  let queue = [];
  let last  = PHRASES[0];
  function nextPhrase() {
    if (!queue.length) {
      queue = PHRASES.slice();
      for (let i = queue.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [queue[i], queue[j]] = [queue[j], queue[i]];
      }
      if (queue[0] === last && queue.length > 1) [queue[0], queue[1]] = [queue[1], queue[0]];
    }
    last = queue.shift();
    return last;
  }

  /* ----------------------------------------------------------------- turn */
  /* 45 degrees per change, ACCUMULATED. Writing an absolute angle that grows is
     what makes the CSS transition carry it: setting it back to 0 between changes
     would animate the mark backwards through the same eighth it just turned. */
  let spin = 0;
  function turn() {
    if (!mark) return;
    /* Belt and braces. app.js adds is-settled when the intro is over, which swaps the
       entrance's transition for the turn's own slower curve. If a phrase ever changed
       before that happened, the turn would run on the grid's easing and the 380ms
       entrance delay -- so claim it here too rather than depend on the ordering. */
    mark.classList.add('is-settled');
    spin += 45;
    mark.style.setProperty('--spin', spin + 'deg');
    dispatchEvent(new CustomEvent('hero:phrase'));
  }

  /* ----------------------------------------------------------------- loop */
  /* The markup ships the first phrase inside a span already, because the line is also
     the intro's mask and the mask animates its child. Fall back to wrapping bare text
     so the very first swap is the same code path as every one after it. */
  let word = line.querySelector('span');
  if (!word) {
    word = document.createElement('span');
    word.textContent = line.textContent.trim() || PHRASES[0];
    line.textContent = '';
    line.appendChild(word);
  }

  /* The clip box's padding, read once. h1 .mask carries .16em / .10em for the same
     reason every mask on the page does -- at line-height 1 the line box is 1em but the
     face's ascent+descent is about 1.165em, so a bare overflow:hidden would cut the
     tails off the p, g and y these phrases carry. --roll is the FULL padded height, so
     a word that has rolled out has cleared the box rather than stopping with its
     descenders still showing. */
  const cs   = getComputedStyle(line);
  const padT = parseFloat(cs.paddingTop)    || 0;
  const padB = parseFloat(cs.paddingBottom) || 0;
  const boxFor = el => el.offsetHeight + padT + padB;

  /* Measured once and re-measured on resize, not per swap: the box cannot change size
     between phrases here, only when the viewport does and the clamp()ed font size with
     it. The height itself is left to the stylesheet -- unlike the footer there is
     nothing to transition, so only the travel is written. */
  /* Two things, both measured rather than declared, and both re-run when the viewport
     or the font changes.

     --roll is the travel: the box's full padded height, so a word that has rolled out
     has cleared its descenders rather than stopping with them still showing.

     min-width is the FIX for the cut-off. The incoming word is absolutely positioned
     inside a box whose width is set by the word still in flow, and that box clips. Any
     phrase wider than the one on screen was therefore truncated the moment it arrived.
     Holding the box open to the widest phrase in the list means the clip never has
     anything to catch -- and because the box is a left-aligned flex item in an
     absolutely positioned h1, widening it moves nothing. */
  function measure() {
    line.style.setProperty('--roll', boxFor(word) + 'px');

    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;left:0;top:0';
    line.appendChild(probe);
    let widest = 0;
    for (const p of PHRASES) {
      probe.textContent = p;
      widest = Math.max(widest, probe.getBoundingClientRect().width);
    }
    probe.remove();
    line.style.minWidth = Math.ceil(widest) + 'px';
  }
  measure();
  addEventListener('resize', measure, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  let current = word.textContent.trim() || PHRASES[0];
  let rolling = false;
  let holdFor = T.hold;
  let t0      = 0;
  let running = false;
  let raf     = 0;
  let rollT0  = 0;                          // when the current swap started
  let rollIn  = null, rollOut = null;       // the two words in play while it runs

  function holdLength(s) {
    return T.hold + s.length * T.perChar + rand(0, T.holdVary);
  }

  /* Put the incoming word in flow and take the outgoing one out, in that order and
     without yielding, so no frame is ever rendered with two words in flow. */
  function land(incoming, outgoing) {
    if (!rolling) return;
    rolling = false;
    if (outgoing && outgoing.parentNode) outgoing.parentNode.removeChild(outgoing);
    incoming.classList.remove('hero__w--in');
    incoming.style.transition = '';
    incoming.style.transform  = '';
    incoming.style.opacity    = '';
    word    = incoming;
    current = incoming.textContent;
    holdFor = holdLength(current);
    t0      = performance.now();
  }

  function roll() {
    /* Hand the line over to the fast transition pair. Added at the FIRST swap rather
       than up front: until now the line was still the intro's mask, and the intro
       reveal is meant to run at the page's own .82s like every other line. By the time
       a swap is due the intro has long landed, so the two never contend. */
    line.classList.add('is-live');

    const next     = nextPhrase();
    const outgoing = word;
    const incoming = document.createElement('span');
    incoming.className = 'hero__w--in';
    incoming.textContent = next;

    /* TRANSITIONS OFF while the start state is established, and this is not a nicety.
       Reading the element's layout below forces its first style resolution -- and at
       that moment it has no transform and the default opacity. Setting the start values
       after that resolution makes them a transition TARGET rather than a starting
       point: the word would render at rest, fully visible, from the instant it is
       created, and then creep downward. */
    incoming.style.transition = 'none';
    line.appendChild(incoming);

    const roll = boxFor(incoming);
    line.style.setProperty('--roll', roll + 'px');
    incoming.style.transform = 'translateY(' + roll + 'px)';
    incoming.style.opacity   = '0';         // it fades in on its own delayed beat

    /* Commit the start state as the element's CURRENT style, with transitions still
       off. Reading its own layout is what forces that resolution; without it both ends
       land in one pass and nothing animates. */
    void incoming.offsetHeight;

    rolling  = true;
    rollT0   = performance.now();
    rollIn   = incoming;
    rollOut  = outgoing;
    /* Hand the stylesheet's timing back and move in the same step. The transition that
       runs is the one on the AFTER-change style, and the before-change style is the
       start state committed above -- so it travels from below, on its own delay. */
    incoming.style.transition = '';
    incoming.style.transform  = 'translateY(0)';
    incoming.style.opacity    = '1';
    /* DOWN and out, fading as it goes -- the opposite direction to the incoming word,
       and earlier, so the box is clear before the new one starts to rise. */
    outgoing.style.transform = 'translateY(' + roll + 'px)';
    outgoing.style.opacity   = '0';

    turn();                                 // the mark turns as the word changes
  }

  function step(now) {
    raf = 0;
    if (!running) return;
    if (rolling) {
      if (now - rollT0 >= T.roll) land(rollIn, rollOut);
    } else if (now - t0 >= holdFor) {
      roll();
    }
    raf = requestAnimationFrame(step);
  }

  /* Declared above start/stop because start consults it on its very first call. */
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  function start() {
    if (running || reduced.matches) return;
    running = true;
    t0 = performance.now();
    if (!rolling) holdFor = holdLength(current);
    raf = requestAnimationFrame(step);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    /* Resolve to a whole phrase rather than freezing mid-roll. If the hero is scrolled
       away during a change, a paused transition would leave two words stalled half way
       through the box; land it now so what is on screen when it comes back is one word,
       sitting where it belongs. */
    if (rolling) land(rollIn, rollOut);
  }

  /* Gated on .hero-space, NOT on .hero itself. The hero is position:fixed inset:0, so
     it intersects the viewport for the entire life of the page and an observer on it
     would never fire -- the loop would go on running under the Work section and all the
     way down to the footer. .hero-space is the in-flow 100vh spacer the hero is pinned
     over, so it leaves the viewport exactly when the hero has been scrolled past. */
  const spacer = document.querySelector('.hero-space');
  if (spacer && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      es.forEach(e => e.isIntersecting ? start() : stop());
    }, { threshold: 0 });
    io.observe(spacer);
  } else {
    start();
  }

  /* Reduced motion: one phrase, no hand-over, no turn. start() already refuses to run
     while the query matches, so this only has to catch it being turned on mid-visit
     with the loop already going. */
  function respect() { if (reduced.matches) stop(); }
  reduced.addEventListener ? reduced.addEventListener('change', respect)
                           : reduced.addListener(respect);
  respect();
})();
