/* Screen 1 — Welcome (3 swipe cards) + consent */
(function () {
  if (CM.store.consent() && CM.qs('replay') !== '1') { location.replace(CM.store.profile().hmoId ? 'home.html' : 'setup.html'); return; }
  if (!CM.boot()) return;

  CM.$$('[data-illus]').forEach(function (el) { el.outerHTML = CM.illus[el.dataset.illus]; });
  CM.$('#consent-logo').outerHTML = CM.logoSvg();

  const slides = CM.$('#slides'), dots = CM.$('#dots'), next = CM.$('#next-btn');
  const n = slides.children.length;
  let idx = 0;
  dots.innerHTML = Array.from({ length: n }, function (_, i) { return '<button type="button" role="tab" aria-label="' + CM.t('welcome.slide', { n: i + 1 }) + '"></button>'; }).join('');

  function sync() {
    CM.$$('button', dots).forEach(function (d, i) { d.classList.toggle('on', i === idx); d.setAttribute('aria-selected', String(i === idx)); });
    next.querySelector('span').textContent = CM.t(idx === n - 1 ? 'welcome.start' : 'welcome.next');
    next.querySelector('span').dataset.i18n = idx === n - 1 ? 'welcome.start' : 'welcome.next';
  }
  function go(i) { slides.scrollTo({ left: slides.clientWidth * i, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); idx = i; sync(); }
  slides.addEventListener('scroll', function () { const i = Math.round(slides.scrollLeft / slides.clientWidth); if (i !== idx) { idx = i; sync(); } }, { passive: true });
  CM.$$('button', dots).forEach(function (d, i) { d.addEventListener('click', function () { go(i); }); });

  function showConsent() {
    CM.$('#intro').hidden = true; CM.$('#intro-actions').hidden = true;
    CM.$('#consent').hidden = false; CM.$('#consent-actions').hidden = false;
    CM.$('#consent-title').focus && CM.$('#consent-title').setAttribute('tabindex', '-1');
    CM.$('#consent-title').focus();
  }
  next.addEventListener('click', function () { if (idx < n - 1) go(idx + 1); else showConsent(); });
  CM.$('#skip-btn').addEventListener('click', showConsent);

  CM.$('#agree-btn').addEventListener('click', function () {
    CM.store.setConsent(true);
    CM.api.session().then(function () { location.href = CM.store.profile().hmoId ? 'home.html' : 'setup.html'; });
  });

  document.addEventListener('cm:lang', sync);
  sync();
})();
