/* Screen 6 — Timer: circular countdown green -> amber (last 15 min) -> red "Overdue by N min",
   case timeline so far, "HMO responded" / "Escalate". Demo mode runs at 60x. */
(function () {
  if (!CM.boot()) return;
  const id = CM.qs('case');
  let c = id && CM.api.getCaseSync(id);
  if (!c) { location.replace('cases.html'); return; }
  CM.$('#topbar .back').href = 'case.html?id=' + encodeURIComponent(id);
  CM.$('#escalate').href = 'complaint.html?case=' + encodeURIComponent(id);

  const R = 104, CIRC = 2 * Math.PI * R;
  const bar = CM.$('#bar'), ring = CM.$('#ring'), timeEl = CM.$('#time');
  bar.style.strokeDasharray = CIRC;
  let lastAnnounced = null, tickId = 0;

  function load() { c = CM.api.getCaseSync(id); }

  function renderStatic() {
    CM.$('#call').innerHTML = CM.callBar(c.hmo && c.hmo.tel ? c.hmo : CM.profileHmo(), c.askFor);
    CM.$('#timeline').innerHTML = CM.renderTimeline(c.events);
  }

  function tick() {
    if (!c.timer) {
      ring.dataset.phase = 'ok'; bar.style.strokeDashoffset = CIRC; timeEl.textContent = '60:00';
      CM.$('#timer-status').textContent = CM.t('timer.none'); CM.$('#deadline').textContent = '';
      CM.$('#responded').hidden = true;
      const esc = CM.$('#escalate');
      esc.innerHTML = CM.icon('timer') + '<span>' + CM.esc(CM.t('timer.start')) + '</span>';
      esc.onclick = function (e) { e.preventDefault(); CM.api.startTimer(id).then(function () { load(); init(); }); };
      return;
    }
    const s = CM.api.timerState(c);
    const stopped = !!c.timer.stoppedAt;
    const rem = stopped ? CM.api.timerState(c, Date.parse(c.timer.stoppedAt)).remaining : s.remaining;
    CM.$('#demo-pill').hidden = s.scale === 1;
    CM.$('#deadline').textContent = CM.t('timer.deadline', { t: CM.fmt.time(s.deadlineAt.toISOString()) });

    if (stopped) {
      ring.dataset.phase = 'ok'; bar.style.stroke = 'var(--success-600)';
      bar.style.strokeDashoffset = 0;
      timeEl.innerHTML = CM.icon('check', 'done-ic');
      CM.$('#time-label').textContent = '';
      CM.$('#timer-status').textContent = CM.t(c.status === 'escalated' ? 'status.escalated' : c.status === 'resolved' || c.status === 'refunded' ? 'status.' + c.status : 'timer.stopped');
      CM.$('#overdue-banner').hidden = true;
      // Closed or approved: no "Escalate" unless the case is mid-escalation (next step is NHIA)
      if (c.status !== 'escalated') {
        const esc = CM.$('#escalate');
        esc.className = 'btn btn-secondary btn-lg';
        esc.href = 'case.html?id=' + encodeURIComponent(id);
        esc.onclick = null;
        esc.innerHTML = CM.icon('folder') + '<span>' + CM.esc(CM.t('timer.backToCase')) + '</span>';
      }
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

  function init() {
    renderStatic(); tick();
    clearInterval(tickId);
    if (c.timer && !c.timer.stoppedAt) tickId = setInterval(tick, (c.timer.scale || 1) > 1 ? 200 : 1000);
    CM.$('#responded').hidden = !c.timer || !!c.timer.stoppedAt;
  }
  document.addEventListener('cm:lang', function () { renderStatic(); tick(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { load(); init(); } });
  init();
})();
