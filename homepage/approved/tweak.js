/* ============================================================================
   TWEAK PANEL — press  T  to open. Drag sliders, watch it change live, then
   "Copy config" puts a ready-to-paste snippet on your clipboard.
   This file is pure convenience; deleting it does not affect the prototype.
   ========================================================================= */
(function () {
  'use strict';
  // ?edit=1 -- see the rule in index.html. Set before the early return below, so
  // it still works on a page with no panel.
  if (/[?&]edit=1/.test(location.search)) {
    document.documentElement.setAttribute('data-edit', '');
  }

  const panel = document.getElementById('tweak');
  const hint  = document.getElementById('hint');
  // ?clean=1 hides the hint line — handy for screenshots / client review
  if (/[?&]clean=1/.test(location.search) && hint) hint.remove();
  if (!panel || typeof SCHEMA === 'undefined') return;

  /* Paths normally resolve against CONFIG. A path whose first segment names one
     of these roots resolves against that object instead, so the panel can reach
     the other sections' settings too -- `featuredwork.curSat` is FEATUREDWORK.curSat. CONFIG has
     no key of the same name, so there is nothing to shadow. */
  const ROOTS = {
    featuredwork: typeof FEATUREDWORK !== 'undefined' ? FEATUREDWORK : null,
    halo: typeof HALO !== 'undefined' ? HALO : null,
    expertise: typeof EXPERTISE !== 'undefined' ? EXPERTISE : null
  };

  const resolve = path => {
    const keys = path.split('.');
    const root = ROOTS[keys[0]];
    return root ? { obj: root, keys: keys.slice(1) } : { obj: CONFIG, keys };
  };

  const get = path => {
    const { obj, keys } = resolve(path);
    return keys.reduce((o, k) => o[k], obj);
  };
  const set = (path, v) => {
    const { obj, keys } = resolve(path);
    const ks = keys.slice();
    const last = ks.pop();
    ks.reduce((o, k) => o[k], obj)[last] = v;
  };

  // values that change the canvas / buffer geometry need a relayout
  const RELAYOUT = /^(circle\.(radiusScale|maxRadiusVH)|grid\.(columns|marginVW)|render\.(dprMax|gradScale|blurScale))/;

  const defaults = {};
  const html = [];

  /* A row is either a slider  [path, min, max, step, label?]
     or a colour swatch         [path, 'color', label, fallbackPath?].
     The label is optional on a slider and defaults to the last path segment --
     pass one where that would be ambiguous, e.g. three different gradients all
     exposing a key called `paletteWash`.
     Groups are <details>, because three gradients' worth of controls is far more
     than one scroll of sliders can stay navigable through. The first is open. */
  SCHEMA.forEach(([group, rows], gi) => {
    html.push(`<details${gi === 0 ? ' open' : ''}><summary>${group}</summary>`);
    rows.forEach(([path, a, b, c, d]) => {
      defaults[path] = get(path);
      const id   = 'tw_' + gi + '_' + path.replace(/\./g, '_');
      const keys = path.split('.');
      const name = a === 'color' ? b : (d || keys[keys.length - 1]);
      const label = name.replace(/([A-Z])/g, ' $1').toLowerCase();
      html.push(a === 'color'
        ? `<div class="row swatch">` +
            `<label for="${id}">${label}</label>` +
            `<input type="color" id="${id}" data-path="${path}"` +
                  `${c ? ` data-fallback="${c}"` : ''}>` +
          `</div>`
        : `<div class="row">` +
            `<label for="${id}">${label}</label>` +
            `<span class="val" id="${id}_v"></span>` +
            `<input type="range" id="${id}" data-path="${path}" ` +
                   `min="${a}" max="${b}" step="${c}">` +
          `</div>`
      );
    });
    html.push(`</details>`);
  });

  html.push(
    `<div class="bar">` +
      `<button id="tw_copy">Copy config</button>` +
      `<button id="tw_reset">Reset</button>` +
    `</div>`,
    `<p class="note">T toggles this panel. <b>Opacity</b> at the top washes each ` +
    `gradient toward the page colour without altering its palette \u2014 1.00 would ` +
    `be invisible. Bump <b>time scale</b> under <b>Hero \u00b7 flow</b> to ` +
    `fast-forward the morph while tuning, then put it back to 1. Copy config ` +
    `sends only what you changed.</p>`
  );

  panel.innerHTML = html.join('');

  const fmt = v => (Math.abs(v) >= 100 || Number.isInteger(v))
    ? String(v) : v.toFixed(String(v).length > 6 ? 3 : 3).replace(/0+$/, '').replace(/\.$/, '');

  const inputs = [...panel.querySelectorAll('input[type=range]')];
  const swatches = [...panel.querySelectorAll('input[type=color]')];

  /* <input type=color> only accepts #rrggbb, so a 3-digit hex has to be expanded
     or the swatch silently falls back to black and the first click would then
     write that black back into the config. */
  const hex6 = v => {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(v || ''));
    if (!m) return '#000000';
    const h = m[1];
    return '#' + (h.length === 3 ? h[0]+h[0]+h[1]+h[1]+h[2]+h[2] : h).toLowerCase();
  };

  /* The same value may appear in more than one group -- opacity sits both in its
     own group and beside each palette. Dragging one has to move the others, or
     they sit showing stale numbers until the next full sync. */
  function syncPath(path, except) {
    panel.querySelectorAll('[data-path="' + path + '"]').forEach(o => {
      if (o === except) return;
      const v = get(path);
      if (o.type === 'color') { o.value = hex6(v); return; }
      o.value = v;
      const out = document.getElementById(o.id + '_v');
      if (out) out.textContent = fmt(v);
    });
  }

  function sync() {
    inputs.forEach(el => {
      const v = get(el.dataset.path);
      el.value = v;
      document.getElementById(el.id + '_v').textContent = fmt(v);
    });
    swatches.forEach(el => {
      // A derived colour (veilColor: null = follow bg) has nothing of its own to
      // show. Display what is actually on screen rather than a misleading black --
      // and note that picking a colour here deliberately breaks that link, which
      // is the only way to override it.
      const own = get(el.dataset.path);
      const fb  = el.dataset.fallback;
      el.value = hex6(own == null && fb ? get(fb) : own);
    });
  }

  panel.addEventListener('input', e => {
    const el = e.target;
    if (el.tagName !== 'INPUT') return;
    if (el.type === 'color') {
      // stored as the hex string the config holds; every renderer calls
      // hexToRgb() per frame, so this takes effect on the next one
      set(el.dataset.path, el.value);
      syncPath(el.dataset.path, el);
      return;
    }
    const v = parseFloat(el.value);
    set(el.dataset.path, v);
    const out = document.getElementById(el.id + '_v');
    if (out) out.textContent = fmt(v);
    syncPath(el.dataset.path, el);
    if (RELAYOUT.test(el.dataset.path) && window.HERO) window.HERO.layout();
  });

  document.getElementById('tw_reset').addEventListener('click', () => {
    Object.entries(defaults).forEach(([p, v]) => set(p, v));
    if (window.HERO) window.HERO.layout();
    sync();
  });

  document.getElementById('tw_copy').addEventListener('click', async e => {
    const changed = Object.keys(defaults).filter(p => get(p) !== defaults[p]);
    const body = (changed.length ? changed : Object.keys(defaults))
      .map(p => {
        const v = get(p);
        return `  ${p.padEnd(24)} : ${typeof v === 'string' ? `'${v}'` : v}`;
      }).join(',\n');
    const text = `/* paste these back into config.js */\n{\n${body}\n}\n`;
    try {
      await navigator.clipboard.writeText(text);
      e.target.textContent = 'Copied ✓';
    } catch (_) {
      console.log(text);
      e.target.textContent = 'See console';
    }
    setTimeout(() => { e.target.textContent = 'Copy config'; }, 1400);
  });

  sync();

  addEventListener('keydown', e => {
    if (e.key === 't' || e.key === 'T') {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      panel.classList.toggle('open');
      sync();
    }
  });

  // fade the hint once the pointer has been moved
  let faded = false;
  addEventListener('pointermove', () => {
    if (faded) return;
    faded = true;
    setTimeout(() => hint && hint.classList.add('gone'), 2200);
  }, { passive: true, once: false });
})();
