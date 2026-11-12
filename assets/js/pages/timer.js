/* Screen 6 — Timer: circular countdown green -> amber (last 15 min) -> red "Overdue by N min",
   case timeline so far, "HMO responded" / "Escalate". Demo mode runs at 60x.
   - The clock runs from when the hospital asked the HMO; "approximate" when the user didn't know.
   - The server owns deadline_at (CM.api.serverOffset corrects the phone clock).
   - Add-to-home-screen prompt: on iPhone the overdue push only arrives for the home-screen app.
   - Back returns to Home (navigation rules); the case stays in My cases. */
(function () {
  if (!CM.boot()) return;
  const id = CM.qs('case');
  let c = id && CM.api.getCaseSync(id);
  if (!c) { location.replace('cases.html'); return; }
  CM.$('#escalate').href = 'complaint.html?case=' + encodeURIComponent(id);

  const R = 104, CIRC = 2 * Math.PI * R;
  const bar = CM.$('#bar'), ring = CM.$('#ring'), timeEl = CM.$('#time');
  const esc = CM.esc;
  bar.style.strokeDasharray = CIRC;
  let lastAnnounced = null, tickId = 0;

  function load() { c = CM.api.getCaseSync(id); }
  function T() { return CM.api.timerState(c); }

  function renderStatic() {
    const iss = CM.api.timerIssue(c) || c.issues[0];
    CM.$('#call').innerHTML = CM.callBar(c.hmo && c.hmo.tel ? c.hmo : CM.profileHmo(), iss.askFor, { caseId: c.caseId, caseObj: c });
    CM.$('#timeline').innerHTML = CM.renderTimeline(c.events);
  }

  function backToCase() {
    const b = CM.$('#escalate');
    b.className = 'btn btn-secondary btn-lg';
    b.href = 'case.html?id=' + encodeURIComponent(id);
    b.onclick = null;
    b.innerHTML = CM.icon('folder') + '<span>' + esc(CM.t('timer.backToCase')) + '</span>';
  }

  function tick() {
    const s = T();
    CM.$('#approx').hidden = !(s && s.approximate);
    if (!s) {
      ring.dataset.phase = 'ok'; bar.style.strokeDashoffset = CIRC; timeEl.textContent = '60:00';
      CM.$('#timer-status').textContent = CM.t('timer.none'); CM.$('#deadline').textContent = '';
      CM.$('#responded').hidden = true;
      if (CM.api.timerIssue(c)) { // approval issue, timer not started yet: ask when the hospital asked
        const b = CM.$('#escalate');
        b.innerHTML = CM.icon('timer') + '<span>' + esc(CM.t('timer.start')) + '</span>';
        b.onclick = function (e) { e.preventDefault(); CM.ui.askTimerStart(id, function () { load(); init(); }); };
      } else backToCase();
      return;
    }
    const stopped = !!s.timer.stoppedAt;
    const rem = stopped ? CM.api.timerState(c, Date.parse(s.timer.stoppedAt)).remaining : s.remaining;
    CM.$('#demo-pill').hidden = s.scale === 1;
    CM.$('#deadline').textContent = CM.t('timer.deadline', { t: CM.fmt.time(s.deadlineAt.toISOString()) });

    if (stopped) {
      ring.dataset.phase = 'ok'; bar.style.stroke = 'var(--success-600)';
      bar.style.strokeDashoffset = 0;
      timeEl.innerHTML = CM.icon('check', 'done-ic');
      CM.$('#time-label').textContent = '';
      CM.$('#timer-status').textContent = ['open', 'waiting_hmo', 'overdue'].includes(c.status) ? CM.t('timer.stopped') : CM.statusLabel(c.status, c);
      CM.$('#overdue-banner').hidden = true;
      // Closed or approved: no "Escalate" unless the case is mid-escalation (next stop: the regulator)
      if (c.status !== 'complaint_hmo') backToCase();
      CM.$('#responded').hidden = true;
      clearInterval(tickId);
      return;
    }
    if (rem <= 0) {
      if (c.status === 'waiting_hmo') { CM.api.getCase(id).then(function (x) { c = x; renderStatic(); CM.ui.notifyOverdue(c); CM.ui.updateOverdueBadge(); }); }
      const over = Math.floor(-rem / 60000);
      ring.dataset.phase = 'overdue'; bar.style.strokeDashoffset = 0;
      timeEl.textContent = '+' + CM.fmt.clock(-rem);
      CM.$('#time-label').textContent = CM.t('status.overdue');
      CM.$('#timer-status').textContent = CM.t('timer.overdue', { m: over });
      CM.$('#overdue-banner').hidden = false;
      CM.$('#escalate').classList.replace('btn-primary', 'btn-danger');
    } else {
      const warn = rem <= 15 * 60000;
      ring.dataset.phase = warn ? 'warn' : 'ok';
      bar.style.strokeDashoffset = CIRC * (1 - rem / s.total);
      timeEl.textContent = CM.fmt.clock(rem);
      CM.$('#time-label').textContent = CM.t('timer.left');
      CM.$('#timer-status').textContent = CM.t(warn ? 'timer.warn' : 'timer.running');
      CM.$('#overdue-banner').hidden = true;
      // Screen readers: announce every 5 minutes of timer time
      const mins = Math.ceil(rem / 60000);
      if (mins % 5 === 0 && mins !== lastAnnounced) { lastAnnounced = mins; CM.$('#announce').textContent = CM.t('timer.announce', { m: mins }); }
    }
  }

  /* HMO responded -> what did they say? */
  CM.$('#responded').addEventListener('click', function () {
    const s = CM.ui.sheet(
      '<div class="row-between"><h2 data-i18n="timer.respondedTitle"></h2><button class="icon-btn" data-close data-i18n-attr="aria-label:common.close">' + CM.icon('x') + '</button></div>' +
      '<div class="field"><label for="code" data-i18n="timer.code"></label><input id="code" class="input" autocomplete="off" inputmode="text"></div>' +
      '<button type="button" class="choice" data-r="code_received"><span class="ic">' + CM.icon('check') + '</span><span class="grow title" data-i18n="timer.gotCode"></span></button>' +
      '<button type="button" class="choice" data-r="hmo_called"><span class="ic">' + CM.icon('phone') + '</span><span class="grow title" data-i18n="timer.calledBack"></span></button>' +
      '<button type="button" class="choice" data-r="refused"><span class="ic">' + CM.icon('x') + '</span><span class="grow title" data-i18n="timer.refused"></span></button>',
      { label: CM.t('timer.respondedTitle') });
    s.el.addEventListener('click', function (e) {
      const b = e.target.closest('[data-r]'); if (!b) return;
      const code = CM.$('#code', s.el).value.trim();
      CM.api.addEvent(id, { type: b.dataset.r, code: b.dataset.r === 'code_received' && code ? code : undefined }).then(function (x) {
        c = x; s.close(); renderStatic(); tick();
        CM.ui.toast(CM.eventLabel(x.events[x.events.length - 1]));
        if (b.dataset.r === 'refused') CM.$('#escalate').focus();
      });
    });
  });

  /* Add-to-home-screen prompt (logic review gap 12): the in-app timer is the main alert; push is a bonus */
  function installPrompt() {
    const box = CM.$('#install-prompt');
    const show = CM.install && !CM.install.standalone && (CM.install.isMobile || CM.qs('install'));
    box.hidden = !show;
    if (!show) return;
    CM.$('#install-body').textContent = CM.t(CM.install.isIOS ? 'timer.install.ios' : 'timer.install.android');
  }
  CM.$('#install-go').addEventListener('click', function () {
    if (CM.install.isIOS) CM.install.show('ios', { reason: CM.t('install.timer') });
    else if (CM.install.canPrompt) CM.install.prompt();
    else CM.install.show('android', { reason: CM.t('install.timer') });
  });
  CM.$('#install-x').addEventListener('click', function () { CM.$('#install-prompt').hidden = true; });

  function init() {
    renderStatic(); tick(); installPrompt();
    clearInterval(tickId);
    const s = T();
    if (s && !s.timer.stoppedAt) tickId = setInterval(tick, s.scale > 1 ? 200 : 1000);
    CM.$('#responded').hidden = !s || !!s.timer.stoppedAt;
  }
  document.addEventListener('cm:lang', function () { renderStatic(); tick(); installPrompt(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { load(); init(); } });
  init();
})();
