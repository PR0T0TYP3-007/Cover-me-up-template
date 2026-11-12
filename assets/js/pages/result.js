/* Screen 5 — Result: verdict card -> desk script -> HMO call bar -> "Start 1-hour timer".
   Answer first: the one-sentence headline is the first thing on the screen.
   ?case=<id> shows a case; ?error=<code> shows the error state. */
(function () {
  if (!CM.boot()) return;
  const err = CM.qs('error');
  const id = CM.qs('case') || (CM.store.lastResult() && CM.store.lastResult().caseId);
  let c = null;

  /* ---------- Error state ---------- */
  function renderError() {
    CM.$('#loading').hidden = true; CM.$('#error').hidden = false;
    CM.$('#err-call').innerHTML = CM.callBar(CM.profileHmo());
    CM.icons.hydrate(CM.$('#err-call'));
  }
  CM.$('#retry').addEventListener('click', function () { if (CM.store.pending()) location.href = 'checking.html'; else location.href = 'home.html'; });
  CM.$$('#error .chip').forEach(function (b) {
    b.addEventListener('click', function () { CM.store.setPending({ text: CM.t(b.dataset.key), issueHint: b.dataset.hint, source: 'chip' }); location.href = 'checking.html'; });
  });

  /* ---------- Answer ---------- */
  function render() {
    const script = CM.L(c.script);
    const html = [];

    if (c.emergency) {
      html.push('<div class="banner banner-danger" role="alert">' + CM.icon('octagon') + '<span><strong>' + CM.esc(CM.t('emg.title')) + '</strong>' +
        '<a href="tel:112" class="btn btn-danger" style="margin-top:8px">' + CM.icon('phone') + CM.esc(CM.t('emg.call')) + '</a></span></div>');
    }

    // 1. Verdict card (status badge + headline + confirm banner + proof)
    html.push('<section class="verdict fade-up" data-verdict="' + c.verdict + '" aria-labelledby="headline">' +
      '<div>' + CM.badge.verdict(c.verdict) + '</div>' +
      '<h1 class="headline" id="headline" tabindex="-1">' + CM.esc(CM.L(c.headline)) + '</h1>' +
      (c.confirmWithHmo && c.verdict !== 'confirm_with_hmo'
        ? '<div class="banner banner-amber">' + CM.icon('help') + '<span><strong>' + CM.esc(CM.t('result.confirm.title')) + '</strong>' + CM.esc(CM.t('result.confirm.body')) + '</span></div>'
        : c.verdict === 'confirm_with_hmo' ? '<div class="banner banner-amber">' + CM.icon('help') + '<span>' + CM.esc(CM.t('result.confirm.body')) + '</span></div>' : '') +
      '<div class="stack"><span class="eyebrow">' + CM.esc(CM.t('result.proof')) + '</span><div class="chips">' +
      c.citations.map(function (ct) { return '<button type="button" class="citation" data-rule="' + ct.ruleId + '">' + CM.icon('file') + '<span>' + CM.esc(CM.L(ct.title)) + '</span><span class="rid">' + ct.ruleId + '</span></button>'; }).join('') +
      '</div></div></section>');

    // What we heard (transcript, editable)
    html.push('<div class="heard">' + CM.icon(c.source === 'voice' ? 'mic' : 'message') + '<div class="stack" style="gap:2px"><span class="small muted">' + CM.esc(CM.t('check.heard')) + '</span>' +
      '<q>' + CM.esc(c.transcript) + '</q><a class="small" href="home.html?prefill=' + encodeURIComponent(c.transcript) + '">' + CM.esc(CM.t('result.heardEdit')) + '</a></div></div>');

    // 2. Desk script card
    html.push('<section class="script-card" aria-labelledby="script-title">' +
      '<h2 id="script-title" class="eyebrow">' + CM.esc(CM.t('result.script')) + '</h2>' +
      '<p class="script-text" id="script-text">' + CM.esc(script) + '</p>' +
      '<div class="script-actions">' +
      '<button type="button" class="btn btn-tint" id="copy-btn">' + CM.icon('copy') + '<span>' + CM.esc(CM.t('common.copy')) + '</span></button>' +
      '<button type="button" class="btn btn-tint" id="read-btn" aria-pressed="false">' + CM.icon('volume') + '<span>' + CM.esc(CM.t('result.read')) + '</span></button>' +
      '<button type="button" class="btn btn-tint" id="desk-btn">' + CM.icon('maximize') + '<span>' + CM.esc(CM.t('result.show')) + '</span></button>' +
      '</div></section>');

    // 3. HMO call bar
    html.push(CM.callBar(c.hmo && c.hmo.tel ? c.hmo : CM.profileHmo(), c.askFor));

    // Timer explainer
    if (c.timerMinutes && !c.timer) html.push('<div class="banner banner-info">' + CM.icon('timer') + '<span>' + CM.esc(CM.t('result.timerWhy')) + '</span></div>');

    html.push('<div class="row" style="justify-content:space-between;flex-wrap:wrap">' +
      '<a class="link-btn" href="complaint.html?case=' + encodeURIComponent(c.caseId) + '">' + CM.esc(CM.t('result.complain')) + '</a>' +
      '<a class="link-btn" href="home.html">' + CM.esc(CM.t('result.newQ')) + '</a></div>');
    html.push('<p class="disclaimer">' + CM.icon('info') + '<span>' + CM.esc(CM.t('result.disclaimer')) + '</span></p>');

    CM.$('#answer').innerHTML = html.join('');
    CM.$('#loading').hidden = true; CM.$('#answer').hidden = false;

    // 4. Primary action in the thumb zone
    const act = CM.$('#actions'); act.hidden = false;
    if (c.timer) act.innerHTML = '<a class="btn btn-primary btn-lg btn-block" href="timer.html?case=' + encodeURIComponent(c.caseId) + '">' + CM.icon('timer') + '<span>' + CM.esc(CM.t('result.viewTimer')) + '</span></a>';
    else if (c.timerMinutes) act.innerHTML = '<button type="button" class="btn btn-primary btn-lg btn-block" id="start-timer">' + CM.icon('timer') + '<span>' + CM.esc(CM.t('result.startTimer')) + '</span></button>';
    else {
      const h = c.hmo && c.hmo.tel ? c.hmo : CM.profileHmo();
      act.innerHTML = h
        ? '<a class="btn btn-primary btn-lg btn-block" href="tel:' + CM.esc(h.tel) + '">' + CM.icon('phone') + '<span>' + CM.esc(CM.t('result.call') + ' ' + h.name) + '</span></a>'
        : '<a class="btn btn-primary btn-lg btn-block" href="complaint.html?case=' + encodeURIComponent(c.caseId) + '">' + CM.icon('file') + '<span>' + CM.esc(CM.t('result.complain')) + '</span></a>';
    }

    // Wire up
    CM.$$('.citation').forEach(function (b) { b.addEventListener('click', function () { CM.ui.ruleSheet(b.dataset.rule); }); });
    CM.$('#copy-btn').addEventListener('click', function () { CM.ui.copy(script); });
    const read = CM.$('#read-btn');
    read.addEventListener('click', function () {
      if (CM.ui.speaking) { CM.ui.stopSpeaking(); setRead(false); return; }
      if (CM.ui.speak(script, function () { setRead(false); })) setRead(true);
    });
    function setRead(on) { read.setAttribute('aria-pressed', String(on)); read.innerHTML = CM.icon(on ? 'square' : 'volume') + '<span>' + CM.esc(CM.t(on ? 'result.stop' : 'result.read')) + '</span>'; }
    CM.$('#desk-btn').addEventListener('click', function () {
      const h = c.hmo && c.hmo.tel ? c.hmo : CM.profileHmo();
      CM.ui.deskMode(script, h ? (h.name + ' · ' + h.phone + ' · ' + CM.t('result.askFor') + ' ' + CM.L(c.askFor)) : CM.L(c.askFor));
    });
    const st = CM.$('#start-timer');
    if (st) st.addEventListener('click', function () {
      CM.api.startTimer(c.caseId).then(function () { location.href = 'timer.html?case=' + encodeURIComponent(c.caseId); });
    });
  }

  if (err) renderError();
  else if (!id) location.replace('home.html');
  else CM.api.getCase(id).then(function (x) {
    if (!x) { location.replace('home.html'); return; }
    c = x;
    render();
    const h = CM.$('#headline'); if (h) h.focus({ preventScroll: true });
  });
  document.addEventListener('cm:lang', function () { CM.ui.stopSpeaking(); if (c) render(); else if (err) renderError(); });
  window.addEventListener('pagehide', function () { CM.ui.stopSpeaking(); });
})();
