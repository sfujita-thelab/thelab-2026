/* UP NEXT -> THE NEXT CASE STUDY, one move (2026-11-13).
   The Up Next block plays the next case study's own hero film (the same file). Clicked
   anywhere, its copy fades and the film grows from the block to the whole screen; the
   next page then opens on that film, full screen, at the same frame, and settles it into
   its place under the title while the title rises in.
   THE HAND-OFF: the frame and the film's time go across in sessionStorage ('cs-arrive');
   the next page's <head> reads it before it paints (html.cs-arrive), so its hero starts
   full screen on that frame. Chrome and Safari crossfade the two full-screen frames
   (@view-transition); elsewhere it is a plain page load between them.
   Reduced motion, or a click with a modifier key: an ordinary link. */
(function () {
  'use strict';
  const html = document.documentElement;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(.65,0,.35,1)';

  /* ---------------------------------------------------------- leaving: the grow */
  const sec = document.querySelector('.CaseStudies_case-studies_nextStudyBlockContainer');
  const link = sec && sec.querySelector('a');
  const media = sec && sec.querySelector('.nx__media');
  const film = media && media.querySelector('video');
  let going = false;

  if (sec && link && media) {
    sec.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
      e.preventDefault();
      if (going) return;
      if (REDUCED) { location.href = link.href; return; }
      going = true;

      // the frame on screen now, and where the film is, for the next page to start on
      const st = { t: 0 };
      if (film) {
        film.pause();
        st.t = film.currentTime;
        try {
          const w = Math.min(1600, film.videoWidth || 0);
          if (w) {
            const c = document.createElement('canvas');
            c.width = w; c.height = Math.round(w * film.videoHeight / film.videoWidth);
            c.getContext('2d').drawImage(film, 0, 0, c.width, c.height);
            st.frame = c.toDataURL('image/jpeg', .82);
          }
        } catch (_) { /* a file:// page cannot read its own film: no frame, the move still runs */ }
      }
      try { sessionStorage.setItem('cs-arrive', JSON.stringify(st)); } catch (_) {}

      // out of the block (so nothing above it can clip it) and fixed where it sits now...
      const r = sec.getBoundingClientRect();
      media.style.cssText = `position:fixed;top:${r.top}px;left:${r.left}px;width:${r.width}px;height:${r.height}px;z-index:1000;transition:none`;
      document.body.appendChild(media);
      sec.classList.add('nx-go');
      void media.offsetWidth;
      // ...then to the whole screen, its darkening lifting as it goes
      media.style.transition = ['top', 'left', 'width', 'height'].map(p => `${p} .9s ${EASE}`).join(',');
      media.classList.add('is-full');
      Object.assign(media.style, { top: '0px', left: '0px', width: innerWidth + 'px', height: innerHeight + 'px' });
      setTimeout(() => { location.href = link.href; }, 950);
    });

    // back from the next page (the browser's page cache): put the block as it was
    addEventListener('pageshow', e => {
      if (!e.persisted || !going) return;
      going = false;
      media.style.cssText = ''; media.classList.remove('is-full');
      sec.insertBefore(media, sec.firstChild);
      sec.classList.remove('nx-go');
      if (film) film.play().catch(() => {});
    });
  }

  // only this move crossfades: any other way off the page is an ordinary load
  addEventListener('pageswap', e => { if (e.viewTransition && !going) e.viewTransition.skipTransition(); });

  /* ---------------------------------------------------------- arriving: the settle */
  if (!html.classList.contains('cs-arrive')) return;
  let st = {};
  try { st = JSON.parse(sessionStorage.getItem('cs-arrive')) || {}; sessionStorage.removeItem('cs-arrive'); } catch (_) {}
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);

  const box = document.querySelector('.FullWidthMedia_root > .VideoWithPlayPauseButton_root');
  if (!box) { html.classList.remove('cs-arrive'); return; }
  const v = box.querySelector('video');
  if (v && st.t) {
    const seek = () => { try { v.currentTime = st.t; } catch (_) {} };
    if (v.readyState >= 1) seek(); else v.addEventListener('loadedmetadata', seek, { once: true });
  }

  // full screen (the CSS has it there from the first paint) -> its place under the title
  Object.assign(box.style, { top: '0px', left: '0px', width: innerWidth + 'px', height: innerHeight + 'px' });
  setTimeout(() => {
    const r = box.parentNode.getBoundingClientRect();
    box.style.transition = ['top', 'left', 'width', 'height'].map(p => `${p} 1.1s ${EASE}`).join(',');
    Object.assign(box.style, { top: r.top + 'px', left: r.left + 'px', width: r.width + 'px', height: r.height + 'px' });
    setTimeout(() => {
      box.style.cssText = '';
      html.classList.remove('cs-arrive');
      html.style.removeProperty('--cs-arrive-frame');
    }, 1150);
  }, 300);
})();
