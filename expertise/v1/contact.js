/* CONTACT PANEL -- thelab.co's "Connect with us" slide-in (its header's Connect button),
   on every page. One file, copied into each page's folder like footer.js: it brings its
   own CSS and markup, so a page needs only the <script> tag.

   What opens it: any link or button whose label is "Get connected" or "Start a
   conversation" (the nav, the phone menu, the footer's pill, Expertise's FAQ).

   The live site's parts, the CSS-module hashes off their class names, rule for rule from
   its stylesheet: ContactUsForm_overlay / _popover / _dialog / _close, the
   ContactUsFormContent form, the FormField_inputs fields (labels that float up to the
   eyebrow when a field is in use) and a Submit in this site's own CTA pill (.cta, each page's own CSS). The panel is
   on the homepage's light ground (the live one is black), its left edge on the grid's v3 line (the full width at 1023 and below), sliding in
   from the right in 0.3s, over the page's white-30% difference veil.

   PROTOTYPE: nothing is sent. Submit checks the required fields, then thanks the
   reader in place of the form. */
(() => {
  const CSS = `
  .ContactUsForm_contactFormOverlay { position: fixed; inset: 0; z-index: 9998; pointer-events: none;
    background-color: rgb(var(--white-base) / 30%); mix-blend-mode: difference; opacity: 0; transition: opacity .2s; }
  .ContactUsForm_contactFormOverlay.ContactUsForm_isOpen { opacity: 1; }
  .ContactUsForm_overlay { position: fixed; inset: 0; z-index: 9999; height: 100dvh; }
  .ContactUsForm_overlay[hidden] { display: none; }
  .ContactUsForm_popover { position: fixed; top: 0; right: 0; z-index: 10000; height: 100dvh; }
  .ContactUsForm_popover[data-entering] { animation: ContactUsForm_slide .3s ease; }
  /* out: its own keyframes -- the same name played in reverse is, to the browser, the
     animation that already ran, so it would not run (nor end) again */
  .ContactUsForm_popover[data-exiting] { animation: ContactUsForm_slideOut .3s ease-in forwards; }
  @keyframes ContactUsForm_slide { from { transform: translateX(100%); } to { transform: none; } }
  @keyframes ContactUsForm_slideOut { from { transform: none; } to { transform: translateX(100%); } }
  @media (prefers-reduced-motion: reduce) { .ContactUsForm_popover[data-entering], .ContactUsForm_popover[data-exiting] { animation-duration: .01s; } }

  /* the homepage's light ground (.theme-light .theme-lightGray), not the live panel's black */
  .ContactUsForm_dialog.theme-light { --color-primary: var(--light-gray); --color-contrast-base: var(--black-base);
    --color-contrast: rgb(var(--color-contrast-base)); --color-text-primary: var(--black);
    --color-text-secondary: var(--dark-gray); --color-text-contrast: var(--white); }
  .ContactUsForm_dialog { position: relative; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center;
    width: 50vw; height: 100%; padding-inline: var(--spacer-64);   /* its left edge on the v3 line, the page's centre (the live one is 800 wide) */ overflow-y: auto; outline: 0;
    color: var(--color-text-primary); background-color: var(--color-primary); }
  @media (max-width: 1023px) { .ContactUsForm_dialog { width: 100vw; } }
  .ContactUsForm_dialog *, .ContactUsForm_dialog *::before, .ContactUsForm_dialog *::after { box-sizing: border-box; }
  .ContactUsForm_dialog h2 { margin: 0; font: var(--font-h-56); }
  .ContactUsForm_dialog p { margin: var(--spacer-32) 0 0; font: var(--font-h-32); }
  .ContactUsForm_close { position: absolute; top: var(--spacer-32); right: var(--spacer-32); width: 16px; height: 16px;
    padding: 0; border: 0; background: none; cursor: pointer; }
  .ContactUsForm_close svg { display: block; width: 16px; height: 16px; fill: var(--color-text-primary); }

  .ContactUsForm_ContactUsFormContent_form { display: flex; flex-direction: column; gap: var(--spacer-16); padding: var(--spacer-32) 0 0; margin: 0; }
  .ContactUsForm_ContactUsFormContent_form label { pointer-events: none; }
  .FormField_inputs_inputVariables { --color-border-primary: var(--color-contrast); --color-border-pale: rgb(var(--color-contrast-base) / 20%);
    --color-invalid: var(--red); --padding: 16px; --border-radius: 4px; }
  .FormField_inputs_input { display: flex; flex-direction: column; gap: 8px; color: var(--color-text-primary); }
  .FormField_inputs_fieldWrapper { position: relative; }
  .FormField_inputs_input .react-aria-Label { position: absolute; left: var(--padding); top: var(--padding); z-index: 1;
    font: var(--font-eyebrow); font-size: 12px; text-transform: uppercase; translate: 0 calc(var(--padding) / -2); transition: translate .1s, font .1s;
    color: var(--black); }
  .FormField_inputs_input:not(.is-filled) .FormField_inputs_fieldWrapper:not(:has(> :focus-visible)) .react-aria-Label { font: var(--font-p-18); text-transform: none; translate: 0; }
  .FormField_inputs_input .FormField_inputs_fieldWrapper:not(:has(> :focus-visible, > :hover)) .react-aria-Label { color: var(--color-text-secondary); }
  .FormField_inputs_input[data-required] .react-aria-Label::after { content: "*"; }
  .FormField_inputs_dropdown .react-aria-Label::after { content: none !important; }

  .FormField_inputs_textField .react-aria-Input,
  .FormField_inputs_textField .react-aria-TextArea { display: block; width: 100%; margin: 0;
    border: 1px solid var(--color-border-pale); border-radius: var(--border-radius); outline: 0;
    font: var(--font-p-18); padding: 28px var(--padding) 8px; background: var(--white); color: var(--black); }
  .FormField_inputs_textField .react-aria-Input { height: 56px; }
  .FormField_inputs_textField .react-aria-TextArea { height: 156px; resize: none; }
  .FormField_inputs_textField .react-aria-Input:not(:focus-visible):not(:hover),
  .FormField_inputs_textField .react-aria-TextArea:not(:focus-visible):not(:hover) { color: var(--color-text-primary); background: none; }
  .FormField_inputs_textField[data-invalid] .react-aria-Input,
  .FormField_inputs_textField[data-invalid] .react-aria-TextArea { border-color: var(--color-invalid); }

  .FormField_inputs_dropdown { font: var(--font-p-18); }
  .FormField_inputs_dropdown button { position: relative; display: flex; justify-content: space-between; width: 100%; height: 56px;
    padding: 28px var(--padding) 8px calc(var(--padding) - 1px); line-height: 1; text-align: left; cursor: pointer;
    font: inherit; line-height: 1; border: 1px solid var(--color-border-pale); border-radius: var(--border-radius); outline: 0;
    background: var(--white); color: var(--black); }
  .FormField_inputs_dropdown button:not(:focus-visible):not(:hover) { color: var(--color-text-primary); background: none; }
  .FormField_inputs_dropdown[data-invalid] button { border-color: var(--color-invalid); }
  .FormField_inputs_dropdown svg { position: absolute; right: var(--padding); top: calc(50% - 8px); width: 16px; height: 16px; fill: currentColor; }
  .FormField_inputs_dropdownList { position: absolute; left: 0; right: 0; top: calc(100% + 4px); z-index: 2; margin: 0; padding: 4px; list-style: none;
    border: 1px solid rgb(209, 212, 215); border-radius: var(--border-radius); background: var(--white);
    box-shadow: 0 1px 8px 0 rgb(var(--black-base) / 16%), 0 4px 8px 0 rgb(var(--black-base) / 16%); }
  .FormField_inputs_dropdownList:not([hidden]) { display: flex; flex-direction: column; gap: var(--spacer-4); }
  .FormField_inputs_dropdownList[hidden] { display: none; }
  .FormField_inputs_dropdownList > li { padding: 8px 12px; border-radius: var(--border-radius); font: var(--font-p-18); color: var(--black); cursor: pointer; }
  .FormField_inputs_dropdownList > li:hover:not([aria-selected="true"]), .FormField_inputs_dropdownList > li.is-active:not([aria-selected="true"]) { background: var(--light-gray); }
  .FormField_inputs_dropdownList > li[aria-selected="true"] { background: var(--black); color: var(--white); }

  .ContactUsForm_dialog .cta { align-self: flex-start; }
  html.ContactUsForm_lock { overflow: hidden; }
  `;

  const CHEVRON = '<svg aria-hidden="true" viewBox="0 0 16 16"><path d="M8 11.54 1.99 5.52l.71-.71 5.3 5.3 5.3-5.3.71.71L8 11.53Z"></path></svg>';
  const CLOSE = '<svg aria-hidden="true" viewBox="0 0 16 16"><path d="m8.71 8 6.65 6.65-.71.71L8 8.71l-6.65 6.64-.71-.71 6.65-6.65L.65 1.35l.71-.71 6.65 6.65L14.65.65l.71.71-6.65 6.65Z"></path></svg>';
  const SUBJECTS = [['GENERAL', 'General inquiries'], ['BUSINESS', 'New business'], ['MEDIA', 'Media inquiries'], ['JOBS', 'Join the team']];
  const field = (name, label, type, required) => `
        <div class="FormField_inputs_textField FormField_inputs_input FormField_inputs_inputVariables"${required ? ' data-required="true"' : ''}>
          <div class="FormField_inputs_fieldWrapper"><label class="react-aria-Label" for="cf_${name}">${label}</label>${
            type === 'textarea' ? `<textarea class="react-aria-TextArea" id="cf_${name}" name="${name}"${required ? ' required' : ''}></textarea>`
                                : `<input class="react-aria-Input" id="cf_${name}" type="${type}" name="${name}"${required ? ' required' : ''}>`}</div>
        </div>`;
  const HTML = `
  <div class="ContactUsForm_contactFormOverlay" aria-hidden="true"></div>
  <div class="ContactUsForm_overlay" hidden>
    <div class="ContactUsForm_popover">
      <section class="ContactUsForm_dialog theme-light theme-lightGray" role="dialog" aria-modal="true" aria-label="Connect with us." tabindex="-1">
        <button class="ContactUsForm_close" type="button" aria-label="Close">${CLOSE}</button>
        <div><h2>Connect with us</h2></div>
        <form class="ContactUsForm_ContactUsFormContent_form" novalidate>
          <div class="FormField_inputs_dropdown FormField_inputs_input FormField_inputs_inputVariables is-filled" data-required="true">
            <div class="FormField_inputs_fieldWrapper"><span class="react-aria-Label" id="cf_subject_label">Subject</span>
              <button type="button" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="cf_subject_label cf_subject_value">
                <span id="cf_subject_value">How can we help you?</span>${CHEVRON}</button>
              <ul class="FormField_inputs_dropdownList" role="listbox" aria-labelledby="cf_subject_label" hidden>
                ${SUBJECTS.map(([v, t]) => `<li role="option" data-value="${v}" aria-selected="false">${t}</li>`).join('')}
              </ul>
              <input type="hidden" name="subject" value="">
            </div>
          </div>${field('name', 'Name', 'text', true)}${field('email', 'Email', 'email', false)}${field('business_name', 'Business name', 'text', false)}${field('message', 'Message', 'textarea', true)}
          <button class="cta" type="submit"><span class="cta__clip"><span class="cta__roll"><span>Submit</span><span aria-hidden="true">Submit</span></span></span></button>
        </form>
      </section>
    </div>
  </div>`;

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.className = 'contact-panel';
  root.innerHTML = HTML;
  document.body.appendChild(root);

  const veil = root.querySelector('.ContactUsForm_contactFormOverlay');
  const overlay = root.querySelector('.ContactUsForm_overlay');
  const popover = root.querySelector('.ContactUsForm_popover');
  const dialog = root.querySelector('.ContactUsForm_dialog');
  const form = root.querySelector('form');
  const formHTML = form.innerHTML;
  let opener = null, open = false, hideT = 0;
  const done = () => {
    clearTimeout(hideT);
    if (open || overlay.hidden) return;
    overlay.hidden = true; popover.removeAttribute('data-exiting');
    document.documentElement.classList.remove('ContactUsForm_lock');
    if (form.dataset.sent) { form.innerHTML = formHTML; delete form.dataset.sent; wire(); }
  };

  const show = () => {
    if (open) return;
    open = true; opener = document.activeElement; clearTimeout(hideT);
    overlay.hidden = false;
    popover.removeAttribute('data-exiting');
    popover.setAttribute('data-entering', '');
    veil.classList.add('ContactUsForm_isOpen');
    document.documentElement.classList.add('ContactUsForm_lock');
    dialog.focus({ preventScroll: true });
  };
  const hide = () => {
    if (!open) return;
    open = false;
    popover.removeAttribute('data-entering');
    popover.setAttribute('data-exiting', '');
    veil.classList.remove('ContactUsForm_isOpen');
    // put away once it has slid out (the timer in case animationend never comes)
    clearTimeout(hideT);
    hideT = setTimeout(done, 400);
    popover.addEventListener('animationend', done, { once: true });
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  };

  // the triggers: by their label, so every page's nav, menu and CTAs need no markup change
  const TRIGGER = /^\s*(get connected|start a conversation)\s*$/i;
  document.addEventListener('click', (e) => {
    const t = e.target.closest('a, button');
    if (!t || root.contains(t)) return;
    const label = (t.querySelector('.cta__roll > span:first-child') || t).textContent;
    if (!TRIGGER.test(label)) return;
    e.preventDefault();
    show();
  });
  // the white side outside the panel closes it, as the live site's
  overlay.addEventListener('click', (e) => { if (!popover.contains(e.target)) hide(); });
  root.querySelector('.ContactUsForm_close').addEventListener('click', hide);
  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') { const l = form.querySelector('[role=listbox]'); if (l && !l.hidden) return; hide(); }
    if (e.key === 'Tab') {   // focus stays inside the panel
      const f = [...dialog.querySelectorAll('button, input:not([type=hidden]), textarea, [tabindex="0"]')].filter(x => x.offsetParent);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  function wire() {
    // labels float up while a field holds text (the live page reads the value attribute)
    form.querySelectorAll('.FormField_inputs_textField').forEach(w => {
      const el = w.querySelector('input, textarea');
      el.addEventListener('input', () => { w.classList.toggle('is-filled', !!el.value); w.removeAttribute('data-invalid'); });
    });
    // the subject's list: react-aria's Select, by hand
    const dd = form.querySelector('.FormField_inputs_dropdown');
    const btn = dd.querySelector('button'), list = dd.querySelector('[role=listbox]');
    const opts = [...list.children], val = dd.querySelector('input[type=hidden]'), shown = dd.querySelector('#cf_subject_value');
    let act = -1;
    const mark = i => { act = i; opts.forEach((o, j) => o.classList.toggle('is-active', j === i)); };
    const setList = on => { list.hidden = !on; btn.setAttribute('aria-expanded', String(on)); if (on) mark(Math.max(0, opts.findIndex(o => o.getAttribute('aria-selected') === 'true'))); };
    const pick = o => {
      opts.forEach(x => x.setAttribute('aria-selected', String(x === o)));
      val.value = o.dataset.value; shown.textContent = o.textContent;
      dd.removeAttribute('data-invalid'); setList(false); btn.focus();
    };
    btn.addEventListener('click', () => setList(list.hidden));
    btn.addEventListener('keydown', e => {
      if (list.hidden) { if (/^(ArrowDown|ArrowUp|Enter| )$/.test(e.key)) { e.preventDefault(); setList(true); } return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); mark(Math.min(opts.length - 1, act + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); mark(Math.max(0, act - 1)); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(opts[act]); }
      else if (e.key === 'Escape' || e.key === 'Tab') setList(false);
    });
    opts.forEach(o => o.addEventListener('click', () => pick(o)));
    dialog.addEventListener('click', e => { if (!dd.contains(e.target)) setList(false); });
    // Submit: the required fields, else the thanks
    form.addEventListener('submit', e => {
      e.preventDefault();
      let bad = null;
      if (!val.value) { dd.setAttribute('data-invalid', ''); bad = bad || btn; }
      form.querySelectorAll('[required]').forEach(el => {
        if (!el.checkValidity()) { el.closest('.FormField_inputs_input').setAttribute('data-invalid', ''); bad = bad || el; }
      });
      const em = form.querySelector('[name=email]');
      if (em.value && !em.checkValidity()) { em.closest('.FormField_inputs_input').setAttribute('data-invalid', ''); bad = bad || em; }
      if (bad) { bad.focus(); return; }
      form.dataset.sent = '1';
      form.innerHTML = '<p>Thank you. We’ll be in touch soon.</p>';
    });
  }
  wire();
})();
