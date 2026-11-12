/* Screen 5 — Result: one verdict card + desk script PER ISSUE -> HMO call bar -> "Start 1-hour timer".
   Answer first: the one-sentence headline is the first thing on the screen.
   ?case=<id> shows a case; ?error=<code> shows the error state. */
(function () {
  if (!CM.boot()) return;
  const err = CM.qs('error');
  const id = CM.qs('case') || (CM.store.lastResult() && CM.store.lastResult().caseId);
  let c = null, firstRender = true;

  /* ---------- Error state: never a dead end ---------- */
  function renderError() {
    CM.$('#loading').hidden = true; CM.$('#error').hidden = false;
    CM.$('#err-call').innerHTML = CM.callBar(CM.profileHmo());
    CM.icons.hydrate(CM.$('#err-call'));
  }
  CM.$('#retry').addEventListener('click', function () { if (CM.store.pending()) location.href = 'checking.html'; else location.href = 'home.html'; });
  CM.$$('#error .chip').forEach(function (b) {
    b.addEventListener('click', function () { CM.store.setPending({ text: CM.t(b.dataset.key), issueHint: b.dataset.hint, source: 'chip' }); location.href = 'checking.html'; });
  });

  /* ---------- Answer: one verdict card + one desk script per issue ---------- */
  const fresh = CM.qs('fresh') === '1';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let streamed = !fresh; // first view after Checking streams the scripts in, after the headlines
  const esc = CM.esc;

  function issueCard(iss, i, n) {
    const banner = iss.verdict === 'confirm_with_hmo'
      ? '<div class="banner banner-amber">' + CM.icon('help') + '<span>' + esc(CM.t('result.confirm.body')) + '</span></div>'
      : iss.confirmWithHmo ? '<div class="banner banner-amber">' + CM.icon('help') + '<span><strong>' + esc(CM.t('result.confirm.title')) + '</strong>' + esc(CM.t('result.confirm.body')) + '</span></div>' : '';
    return '<section class="verdict fade-up" data-verdict="' + iss.verdict + '" aria-labelledby="h-' + i + '">' +
      '<div class="row-between"><span class="stack" style="gap:4px">' + (n > 1 ? '<span class="issue-n">' + esc(CM.t('result.issueN', { n: i + 1, t: n })) + '</span>' : '') +
      '<span class="eyebrow">' + esc(CM.t('issue.' + iss.type)) + '</span></span>' + CM.badge.stamp(iss.verdict, firstRender) + '</div>' +
      '<h1 class="headline" id="h-' + i + '" tabindex="-1">' + esc(CM.L(iss.headline)) + '</h1>' + banner +
      (iss.citations.length ? '<div class="stack"><span class="eyebrow">' + esc(CM.t('result.proof')) + '</span><div class="citations">' +
        iss.citations.map(function (ct) { return '<button type="button" class="citation" data-rule="' + ct.ruleId + '"><span class="rid">' + ct.ruleId + '</span><span class="ct">' + esc(CM.L(ct.title)) + CM.icon('chevron-right') + '</span></button>'; }).join('') +
        '</div></div>' : '') +
      '</section>' +
      '<section class="script-card fade-up d1" aria-labelledby="st-' + i + '">' +
      '<h2 id="st-' + i + '" class="eyebrow">' + esc(CM.t('result.script')) + '</h2>' +
      (streamed ? '<p class="script-text">' + esc(CM.L(iss.script)) + '</p>'
        : '<div class="script-wait" data-wait="' + i + '"><span class="lbl">' + esc(CM.t('result.writing')) + '</span><span class="bar" style="width:92%"></span><span class="bar" style="width:78%"></span><span class="bar" style="width:55%"></span></div><p class="script-text" data-stream="' + i + '" hidden></p>') +
      '<div class="script-actions">' +
      '<button type="button" class="btn" data-act="copy" data-i="' + i + '">' + CM.icon('copy') + '<span>' + esc(CM.t('common.copy')) + '</span></button>' +
      '<button type="button" class="btn" data-act="read" data-i="' + i + '" aria-pressed="false">' + CM.icon('volume') + '<span>' + esc(CM.t('result.read')) + '</span></button>' +
      '<button type="button" class="btn" data-act="desk" data-i="' + i + '">' + CM.icon('maximize') + '<span>' + esc(CM.t('result.show')) + '</span></button>' +
      '</div></section>';
  }

  function render() {
    const main = [], side = [];
    const enc = encodeURIComponent(c.caseId);
    const n = c.issues.length;
    const tIss = CM.api.timerIssue(c);
    const hmo = c.hmo && c.hmo.tel ? c.hmo : CM.profileHmo();

    if (c.emergency) {
      main.push('<div class="banner banner-danger" role="alert">' + CM.icon('octagon') + '<span><strong>' + esc(CM.t('emg.title')) + '</strong>' +
        '<a href="tel:112" class="btn btn-danger" style="margin-top:10px">' + CM.icon('phone') + esc(CM.t('emg.call')) + '</a></span></div>');
    }
    // Transcript with "Is this right?" edit
    main.push('<div class="heard">' + CM.icon(c.source === 'voice' ? 'mic' : 'message') + '<div class="stack" style="gap:2px"><span class="eyebrow">' + esc(CM.t('check.heard')) + '</span>' +
      '<q>' + esc(c.transcript) + '</q><a class="small" href="home.html?prefill=' + encodeURIComponent(c.transcript) + '">' + esc(CM.t('result.heardEdit')) + '</a></div></div>');
    // Answers are always worded conditionally, with how sure we are about the insurance
    main.push('<div class="cond">' + (c.hmo
      ? '<div class="row" style="flex-wrap:wrap">' + CM.badge.verification(c.verification) + (n > 1 ? '<span class="badge badge-neutral">' + CM.icon('alert') + esc(CM.t('result.issues', { n })) + '</span>' : '') + '</div>' +
        '<p>' + esc(CM.t('result.conditional', { hmo: c.hmo.name, plan: CM.t('plan.' + c.planType) })) + '</p>'
      : '<p>' + esc(CM.t('result.noHmo')) + '</p>') + '</div>');
    c.issues.forEach(function (iss, i) { main.push(issueCard(iss, i, n)); });

    // HMO call bar + timer explainer (sticky side column on desktop)
    side.push(CM.callBar(hmo, (tIss || c.issues[0]).askFor, { caseId: c.caseId, caseObj: c }));
    if (tIss && !tIss.timer) side.push('<div class="banner banner-info">' + CM.icon('timer') + '<span>' + esc(CM.t('result.timerWhy')) + '</span></div>');
    side.push('<div class="list">' +
      '<a class="list-item" href="complaint.html?case=' + enc + '">' + CM.icon('file') + '<span class="grow title">' + esc(CM.t('result.complain')) + '</span>' + CM.icon('chevron-right', 'chev') + '</a>' +
      '<a class="list-item" href="case.html?id=' + enc + '">' + CM.icon('folder') + '<span class="grow title">' + esc(CM.t('case.timeline')) + '</span>' + CM.icon('chevron-right', 'chev') + '</a>' +
      '<a class="list-item" href="home.html">' + CM.icon('plus') + '<span class="grow title">' + esc(CM.t('result.newQ')) + '</span>' + CM.icon('chevron-right', 'chev') + '</a></div>');
    side.push('<p class="disclaimer">' + CM.icon('info') + '<span>' + esc(CM.t('result.disclaimer')) + '</span></p>');

    CM.$('#answer').innerHTML = '<div class="cols"><div class="col-main">' + main.join('') + '</div><div class="col-side sticky">' + side.join('') + '</div></div>';
    CM.$('#loading').hidden = true; CM.$('#answer').hidden = false;
    if (!streamed) stream();
    firstRender = false;

    // One primary action, at the bottom. The timer is only for approval issues.
    const act = CM.$('#actions'); act.hidden = false;
    if (tIss && tIss.timer) act.innerHTML = '<a class="btn btn-primary btn-lg btn-block" href="timer.html?case=' + enc + '">' + CM.icon('timer') + '<span>' + esc(CM.t('result.viewTimer')) + '</span></a>';
    else if (tIss) act.innerHTML = '<button type="button" class="btn btn-primary btn-lg btn-block" id="start-timer">' + CM.icon('timer') + '<span>' + esc(CM.t('result.startTimer')) + '</span></button>';
    else act.innerHTML = hmo
      ? '<a class="btn btn-primary btn-lg btn-block" href="tel:' + esc(hmo.tel) + '">' + CM.icon('phone') + '<span>' + esc(CM.t('result.call') + ' ' + hmo.name) + '</span></a>'
      : '<a class="btn btn-primary btn-lg btn-block" href="complaint.html?case=' + enc + '">' + CM.icon('file') + '<span>' + esc(CM.t('result.complain')) + '</span></a>';
    const st = CM.$('#start-timer');
    if (st) st.addEventListener('click', askStart);
  }

  /* Headline + rule cards first, then the script "streams" in (logic review gap 9) */
  function stream() {
    streamed = true;
    c.issues.forEach(function (iss, i) {
      const text = CM.L(iss.script);
      setTimeout(function () {
        const wait = CM.$('[data-wait="' + i + '"]'), p = CM.$('[data-stream="' + i + '"]');
        if (!p) return;
        wait.remove(); p.hidden = false;
        if (reduced) { p.textContent = text; return; }
        const words = text.split(' '); let k = 0;
        p.classList.add('typing');
        (function tick() {
          k += 2; p.textContent = words.slice(0, k).join(' ');
          if (k < words.length) setTimeout(tick, 45); else p.classList.remove('typing');
        })();
      }, (reduced ? 0 : 700) + i * 500);
    });
  }

  function askStart() { CM.ui.askTimerStart(c.caseId, function () { location.href = 'timer.html?case=' + encodeURIComponent(c.caseId); }); }

  /* Script actions (delegated: there is one script per issue) */
  CM.$('#answer').addEventListener('click', function (e) {
    const cit = e.target.closest('.citation'); if (cit) { CM.ui.ruleSheet(cit.dataset.rule); return; }
    const b = e.target.closest('[data-act]'); if (!b || !c) return;
    const iss = c.issues[Number(b.dataset.i)], text = CM.L(iss.script);
    if (b.dataset.act === 'copy') CM.ui.copy(text);
    if (b.dataset.act === 'desk') {
      const h = c.hmo && c.hmo.tel ? c.hmo : CM.profileHmo();
      CM.ui.deskMode(text, h ? (h.name + ' · ' + h.phone + ' · ' + CM.t('result.askFor') + ' ' + CM.L(iss.askFor)) : CM.L(iss.askFor));
    }
    if (b.dataset.act === 'read') {
      const setRead = function (btn, on) { btn.setAttribute('aria-pressed', String(on)); btn.innerHTML = CM.icon(on ? 'square' : 'volume') + '<span>' + esc(CM.t(on ? 'result.stop' : 'result.read')) + '</span>'; };
      const wasOn = b.getAttribute('aria-pressed') === 'true';
      CM.ui.stopSpeaking(); CM.$$('[data-act="read"]').forEach(function (x) { setRead(x, false); });
      if (!wasOn && CM.ui.speak(text, function () { setRead(b, false); })) setRead(b, true);
    }
  });

  if (err) renderError();
  else if (!id) location.replace('home.html');
  else CM.api.getCase(id).then(function (x) {
    if (!x) { location.replace('home.html'); return; }
    c = x;
    render();
    const h = CM.$('#h-0'); if (h) h.focus({ preventScroll: true });
  });
  document.addEventListener('cm:lang', function () { CM.ui.stopSpeaking(); if (c) render(); else if (err) renderError(); });
  window.addEventListener('pagehide', function () { CM.ui.stopSpeaking(); });
})();
