/* Screen 3 — Home: greeting, voice button, text field, quick picks, open cases. */
(function () {
  if (!CM.boot()) return;

  function greet() {
    const h = new Date().getHours();
    CM.$('#greeting').textContent = CM.t(h < 12 ? 'home.greet.morning' : h < 17 ? 'home.greet.afternoon' : 'home.greet.evening') + '.';
    CM.$('#today').textContent = new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' });
    const p = CM.store.profile(); const h2 = p.hmoId && CM.api.hmo(p.hmoId);
    CM.$('#hmo-pill').innerHTML = h2
      ? CM.avatar(h2.name) + '<span class="name">' + CM.esc(h2.name) + '</span>' + CM.icon('pencil', 'icon-sm')
      : CM.icon('plus', 'icon-sm') + '<span class="name">' + CM.esc(CM.t('home.setHmo')) + '</span>';
  }

  /* Hand a message to the Checking screen */
  function submit(p) {
    CM.store.setPending(p);
    location.href = 'checking.html';
  }

  /* ---- Text composer ---- */
  const ta = CM.$('#message'), send = CM.$('#send-btn'), counter = CM.$('#counter');
  function grow() { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'; }
  function syncText() { counter.textContent = ta.value.length + ' / 1000'; send.disabled = !ta.value.trim(); grow(); }
  ta.addEventListener('input', syncText);
  ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !matchMedia('(pointer: coarse)').matches) { e.preventDefault(); CM.$('#composer-form').requestSubmit(); } });
  CM.$('#composer-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const text = ta.value.trim(); if (!text) return;
    submit({ text, source: 'text' });
  });
  const prefill = CM.qs('prefill');
  if (prefill) { ta.value = prefill; syncText(); ta.focus(); history.replaceState(null, '', 'home.html'); }

  /* ---- Quick-pick chips ---- */
  CM.$$('[data-hint]').forEach(function (b) {
    b.addEventListener('click', function () { submit({ text: CM.t(b.dataset.key), issueHint: b.dataset.hint, source: 'chip' }); });
  });

  /* ---- Voice ---- */
  CM.voice.init({
    wrap: CM.$('#voice-wrap'), button: CM.$('#voice-btn'), panel: CM.$('#rec-panel'), idle: CM.$('#voice-idle'),
    canvas: CM.$('#waveform'), time: CM.$('#rec-time'), cancel: CM.$('#slide-cancel'), cancelBtn: CM.$('#rec-cancel'),
    onDone: function (rec) {
      /* Production: POST /cases/voice with FormData(audio=rec.blob). Template: the mock
         API returns a canned transcript, then the blob is dropped (never stored). */
      const transcript = CM.i18n.lang === 'pcm'
        ? 'Dem say make we buy the drug outside, and the referral never approve.'
        : 'They told us to buy the drug outside, and the referral has not been approved.';
      submit({ text: transcript, source: 'voice', durationSec: rec.durationSec, mimeType: rec.mimeType });
    },
    onDenied: function () { ta.focus(); }
  });

  /* ---- Open cases ---- */
  function renderCases() {
    CM.api.cases().then(function (list) {
      const open = list.filter(function (c) { return !['resolved', 'refunded'].includes(c.status); }).slice(0, 3);
      CM.$('#open-cases').innerHTML = open.length
        ? open.map(CM.caseItem).join('')
        : '<div class="empty card card-flat">' + CM.illus.family + '<h3>' + CM.esc(CM.t('home.empty.title')) + '</h3><p>' + CM.esc(CM.t('home.empty.body')) + '</p></div>';
    });
  }

  /* ---- Offline: show the cached last answer ---- */
  function lastScript() {
    const c = CM.store.lastResult();
    const show = !navigator.onLine && c;
    CM.$('#last-script').hidden = !show;
    if (!show) return;
    CM.$('#last-text').textContent = CM.L(c.script);
    CM.$('#last-badge').innerHTML = CM.badge.verdict(c.verdict);
    CM.$('#last-open').href = 'result.html?case=' + encodeURIComponent(c.caseId);
  }
  document.addEventListener('cm:offline', lastScript);
  document.addEventListener('cm:online', lastScript);
  document.addEventListener('cm:overdue', renderCases);
  document.addEventListener('cm:lang', function () { greet(); renderCases(); lastScript(); });

  greet(); syncText(); renderCases(); lastScript();
})();
