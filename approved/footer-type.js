/* ============================================================================
   FOOTER — the rewriting headline, and the turn that goes with it

   "Build your next" is fixed. The line under it cycles through kinds of work, and the
   change is a HAND-OVER in two beats: the old word SINKS and fades out, and only once
   it has cleared does the new one RISE and fade in.

   ------------------------------------------------------------------ the scroll
   This is the page's own masked reveal, not a new gesture. Every other line on the
   page arrives by sitting in an overflow-hidden box and sliding up into it, on
   transform .82s cubic-bezier(.16,1,.3,1); the headline now changes the same way,
   so the footer reads as part of the page rather than as a separate effect.

   Two words exist at once for the length of a swap. The outgoing one stays in flow
   and keeps defining the box's height; the incoming one is absolutely positioned over
   it and waits below. Both move through the SAME space, the lower half of the box, so
   they are sequenced rather than simultaneous -- the delay on .pf__w--in in the
   stylesheet is what keeps them off each other:

     outgoing   translateY(0)     ->  translateY(+roll)   fading out,   0 ->  450ms
     incoming   translateY(+roll) ->  translateY(0)       fading in,  230 ->  890ms

   They overlap on purpose, from 230 to 350ms, where the old word is still fading and
   the new one has begun -- brief enough to read as a hand-over rather than a crossfade.

   When it lands the outgoing word is removed and the incoming one is dropped back
   into flow, in that order and in one synchronous block, so there is never a frame
   with two words in flow and the box never jumps to two lines.

   This replaced a single simultaneous move -- outgoing up, incoming arriving at full
   strength with no fade -- which read as blunt: the new word appeared hard-edged while
   the old one was still on its way out. Before that it was a decode wipe, a noise head
   running left to right; that read as machine output rather than as type.

   ------------------------------------------------------------------ the rhythm
   The brief asks for considered and relatively slow, and for it not to feel like a
   loop. Three things do that, and none of them is the scroll speed:

     * the HOLD is long and scales with the phrase, so there is time to read
       "content system" and no dead air after "product"
     * the ORDER is a fresh shuffle every pass, never the same cycle twice, and
       never the same phrase twice in a row across the seam between passes
     * the HOLD is jittered by up to half a second, so no two waits are the same

   ------------------------------------------------------------------- the turn
   The mark turns 45 degrees with every change -- one dot-step of an eight-dot ring,
   so it lands back on itself and what reads is the movement, not a new arrangement.
   The angle accumulates rather than resetting, which is what keeps every change
   turning the same way instead of rocking back and forth.
   ========================================================================= */
(function () {
  'use strict';

  const line = document.querySelector('.pf__head-dyn');
  const mark = document.querySelector('.pf__mark');
  if (!line) return;

  /* Kept short on purpose. At 64 the headline box holds 464 units before it reaches
     the mark's leading edge, and the two phrases that used to be here -- "commerce
     experience" (635) and "brand experience" (499) -- were the only ones that did not
     fit. Shortened rather than wrapped: the block centres itself if a phrase ever does
     wrap, but a two-line headline is the shape this layout is drawn around. */
  const PHRASES = [
    'commerce platform.',
    'digital presence.',
    'next growth channel.',
    'AI capabilities.',
    'competitive edge.'
  ];

  const T = {
    /* The scroll's own duration, in ms. This is the .82s on .pf__head-dyn > span in
       the stylesheet, and the two have to stay in step: the swap is committed when
       this elapses on the SAME rAF clock the hold runs on. 820 -> 1400 -> 2200 -> 1690 -> 1290 -> 890. It read as
       a snap at the short end and as a stall at 2200; every part scales together, so
       this is that 2200 divided by 1.3.

       It used to commit off transitionend with a setTimeout behind it. One clock is
       better on both counts -- transitionend is dropped by browsers when a transition
       is interrupted or the element is not being rendered, which would strand two
       words in the box, and a timer kept running independently of the loop that is
       already gated to the footer being on screen. */
    roll:    890,
    hold:   3200,      // ms before a swap starts...
    perChar:  95,      // ...plus this much for every character in the phrase
    holdVary: 500      // ms of random spread on top
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
    spin += 45;
    mark.style.setProperty('--spin', spin + 'deg');
    /* Announce the change. footer-glow.js in option C listens and sends a ripple out
       from the mark; option B's glow ignores it. Dispatched here rather than from the
       phrase bookkeeping so the ripple, the turn and the new word are one event. */
    dispatchEvent(new CustomEvent('pf:phrase'));
  }

  /* ----------------------------------------------------------------- loop */
  /* The markup ships the first phrase as bare text. Wrap it once so there is always
     exactly one in-flow word to roll out of, and so the very first swap is the same
     code path as every one after it. */
  let word = line.querySelector('span');
  if (!word) {
    word = document.createElement('span');
    word.textContent = line.textContent.trim() || PHRASES[0];
    line.textContent = '';
    line.appendChild(word);
  }

  /* The clip box's padding, read once. The box's height is written in pixels from here
     on -- auto does not transition, and the height is what carries the whole headline to
     its new centre when a phrase wraps. See the .pf__head-dyn comment in the stylesheet. */
  const cs   = getComputedStyle(line);
  const padT = parseFloat(cs.paddingTop)    || 0;
  const padB = parseFloat(cs.paddingBottom) || 0;
  const boxFor = el => el.offsetHeight + padT + padB;

  function setBox(h) {
    line.style.height = h + 'px';
    /* The travel is the BOX, not one line. A two-line phrase has to clear a two-line box,
       and a one-line phrase leaving for a two-line one has to clear the taller of the
       two -- so both words move by whatever the box is becoming. */
    line.style.setProperty('--roll', h + 'px');
  }
  setBox(boxFor(word));

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
    incoming.classList.remove('pf__w--in');
    incoming.style.transition = '';
    incoming.style.transform  = '';
    incoming.style.opacity    = '';
    word    = incoming;
    current = incoming.textContent;
    holdFor = holdLength(current);
    t0      = performance.now();
  }

  function roll() {
    const next     = nextPhrase();
    const outgoing = word;
    const incoming = document.createElement('span');
    incoming.className = 'pf__w--in';
    incoming.textContent = next;
    /* TRANSITIONS OFF while the start state is established, and this is not a nicety.
       boxFor() below measures the new word with offsetHeight, which forces the element's
       first style resolution -- and at that moment it has no transform and the default
       opacity. Setting the start values after that resolution makes them a transition
       TARGET rather than a starting point: the word renders at rest, fully visible, from
       the instant it is created, and then creeps downward. That was the "the new one is
       already there" bug. */
    incoming.style.transition = 'none';
    line.appendChild(incoming);

    /* Measure the new word BEFORE asking it to move. It is out of flow, but it is laid
       out at the box's own content width, so the height it wraps to is the height the
       box has to become -- which is known here, at the start of the roll, rather than
       at the end when it lands. That is the whole point: the block starts gliding to its
       new centre as the word sets off, instead of jumping when it arrives. */
    const boxH = boxFor(incoming);
    line.style.setProperty('--roll', boxH + 'px');
    incoming.style.transform = 'translateY(' + boxH + 'px)';
    incoming.style.opacity   = '0';         // it fades in on its own delayed beat

    /* Commit the start state as the element's CURRENT style, with transitions still
       off. Reading the element's own layout is what forces that resolution; without it
       both ends land in one pass and nothing animates. */
    void incoming.offsetHeight;

    line.style.height = boxH + 'px';        // now let the box glide to its new size

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
    outgoing.style.transform = 'translateY(' + boxH + 'px)';
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

  /* Declared above start/stop because start consults it on its very first call,
     which on a browser without IntersectionObserver happens synchronously. */
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
    /* Resolve to a whole phrase rather than freezing mid-roll. If the footer is
       scrolled away during a change, a paused transition would leave two words
       stalled half way through the box; land it now so what is on screen when it
       comes back is one word, sitting where it belongs. */
    if (rolling) land(rollIn, rollOut);
  }

  /* Only runs while the footer is actually on screen -- it is the last thing on
     the page, so for most of a visit this would otherwise be a rAF loop doing
     nothing but burning battery. */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      es.forEach(e => e.isIntersecting ? start() : stop());
    }, { threshold: 0.08 });
    io.observe(document.getElementById('footer'));
  } else {
    start();
  }

  /* Reduced motion: one phrase, no scroll, no turn. start() already refuses
     to run while the query matches, so this only has to catch the case where it is
     turned on mid-visit, with the loop already going. */
  function respect() { if (reduced.matches) stop(); }
  reduced.addEventListener ? reduced.addEventListener('change', respect)
                           : reduced.addListener(respect);
  respect();
})();
