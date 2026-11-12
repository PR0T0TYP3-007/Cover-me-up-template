/* Screen 8b — Case detail: status, verdict, timeline (the evidence), add events
   ("HMO called back", "paid 5,000"), mark resolved / refunded. */
(function () {
  if (!CM.boot()) return;
  const id = CM.qs('id');
  let c = null;
  const CLOSED = ['resolved', 'refunded'];

  function notFound() {
    CM.$('#content').innerHTML = '<div class="empty">' + CM.illus.search + '<p>' + CM.esc(CM.t('case.notFound')) + '</p><a class="btn btn-primary" href="cases.html">' + CM.esc(CM.t('cases.title')) + '</a></div>';
    CM.$('#actions').hidden = true;
  }

  function render() {
    const enc = encodeURIComponent(c.caseId);
    const closed = CLOSED.includes(c.status);
    const timerOn = c.timer && !c.timer.stoppedAt && ['waiting_hmo', 'overdue'].includes(c.status);
    let timerLine = '';
    if (timerOn) {
      const s = CM.api.timerState(c);
      timerLine = '<a class="banner ' + (s.remaining <= 0 ? 'banner-danger' : 'banner-amber') + '" href="timer.html?case=' + enc + '" style="text-decoration:none;color:inherit">' +
        CM.icon(s.remaining <= 0 ? 'alert' : 'timer') + '<span class="grow"><strong>' + CM.esc(s.remaining <= 0 ? CM.t('timer.overdue', { m: Math.floor(-s.remaining / 60000) }) : CM.fmt.clock(s.remaining) + ' ' + CM.t('timer.left')) + '</strong>' +
        CM.esc(CM.t('case.openTimer')) + '</span>' + CM.icon('chevron-right') + '</a>';
    }
    CM.$('#content').innerHTML = '<div class="cols"><div class="col-main">' +
      '<section class="card stack" aria-labelledby="case-h">' +
        '<div class="row" style="gap:12px"><span class="avatar" style="background:var(--brand-50);color:var(--brand-700)">' + CM.icon(CM.meta.issue[c.issueType] || 'message') + '</span>' +
        '<div class="grow" style="flex:1;min-width:0"><h1 id="case-h" style="font-size:var(--fs-22)">' + CM.esc(CM.t('issue.' + c.issueType)) + '</h1>' +
        '<span class="small muted">' + CM.esc(CM.t('case.started', { t: CM.fmt.dateTime(c.createdAt) })) + (c.hospital ? ' · ' + CM.esc(c.hospital) : '') + '</span></div></div>' +
        '<div class="row" style="flex-wrap:wrap;gap:12px">' + CM.badge.status(c.status) + CM.badge.stamp(c.verdict) + '</div>' +
        '<p style="font-weight:600">' + CM.esc(CM.L(c.headline)) + '</p>' +
        (c.paidNaira ? '<p class="small">' + CM.icon('banknote', 'icon-sm') + ' ' + CM.esc(CM.t('case.paidTotal', { amount: CM.fmt.naira(c.paidNaira) })) + '</p>' : '') +
        (c.status === 'refunded' ? '<p class="small" style="color:var(--success-600);font-weight:600">' + CM.esc(CM.t('case.refundTotal', { amount: CM.fmt.naira(c.refundNaira) })) + '</p>' : '') +
        '<div class="btn-row"><a class="btn btn-secondary" href="result.html?case=' + enc + '">' + CM.icon('shield-check') + '<span>' + CM.esc(CM.t('case.viewAnswer')) + '</span></a>' +
        (!closed ? '<a class="btn btn-secondary" href="complaint.html?case=' + enc + '">' + CM.icon('file') + '<span>' + CM.esc(CM.t('case.complain')) + '</span></a>' : '') + '</div>' +
      '</section>' +
      timerLine +
      (!closed ? '<section class="stack" aria-labelledby="add-h"><h2 id="add-h" class="eyebrow">' + CM.esc(CM.t('case.add')) + '</h2><div class="chips">' +
        '<button type="button" class="chip" data-add="hmo_called">' + CM.icon('phone') + '<span>' + CM.esc(CM.t('case.add.called')) + '</span></button>' +
        '<button type="button" class="chip" data-add="code_received">' + CM.icon('check') + '<span>' + CM.esc(CM.t('case.add.code')) + '</span></button>' +
        '<button type="button" class="chip" data-add="paid">' + CM.icon('banknote') + '<span>' + CM.esc(CM.t('case.add.paid')) + '</span></button>' +
        '<button type="button" class="chip" data-add="note">' + CM.icon('pencil') + '<span>' + CM.esc(CM.t('case.add.note')) + '</span></button>' +
        '</div></section>' : '') +
      '</div><div class="col-side">' +
      '<section class="card stack-2" aria-labelledby="tl-h"><h2 id="tl-h" class="eyebrow">' + CM.esc(CM.t('case.timeline')) + '</h2>' + CM.renderTimeline(c.events) + '</section>' +
      '<button type="button" class="btn btn-ghost" id="del" style="color:var(--danger-600);align-self:center">' + CM.icon('trash') + '<span>' + CM.esc(CM.t('case.delete')) + '</span></button></div></div>';

    CM.$('#actions').hidden = closed;
    CM.$('#actions').innerHTML = closed ? '' :
      '<div class="btn-row"><button type="button" class="btn btn-secondary btn-lg" id="resolve">' + CM.icon('check-circle') + '<span>' + CM.esc(CM.t('case.markResolved')) + '</span></button>' +
      '<button type="button" class="btn btn-primary btn-lg" id="refund">' + CM.icon('banknote') + '<span>' + CM.esc(CM.t('case.markRefunded')) + '</span></button></div>';
    wire();
  }

  function wire() {
    CM.$$('[data-add]').forEach(function (b) {
      b.addEventListener('click', function () {
        const type = b.dataset.add;
        let ask = Promise.resolve({});
        if (type === 'paid') ask = CM.ui.prompt({ title: CM.t('case.add.paid'), label: CM.t('case.amountPaid'), type: 'number', placeholder: '5000' }).then(function (v) { return v ? { amount: Number(v) } : null; });
        if (type === 'note') ask = CM.ui.prompt({ title: CM.t('case.add.note'), label: CM.t('event.note'), multiline: true, placeholder: CM.t('case.note.placeholder') }).then(function (v) { return v ? { note: v } : null; });
        if (type === 'code_received') ask = CM.ui.prompt({ title: CM.t('case.add.code'), label: CM.t('timer.code') }).then(function (v) { return v === null ? null : { code: v || undefined }; });
        ask.then(function (extra) {
          if (!extra) return;
          CM.api.addEvent(c.caseId, Object.assign({ type }, extra)).then(function (x) { c = x; render(); CM.ui.toast(CM.eventLabel(x.events[x.events.length - 1])); });
        });
      });
    });
    const res = CM.$('#resolve'), ref = CM.$('#refund');
    if (res) res.addEventListener('click', function () { CM.api.updateCase(c.caseId, { status: 'resolved' }).then(function (x) { c = x; render(); CM.ui.toast(CM.t('status.resolved')); }); });
    if (ref) ref.addEventListener('click', function () {
      CM.ui.prompt({ title: CM.t('case.markRefunded'), label: CM.t('case.amountRefund'), type: 'number', placeholder: String(c.paidNaira || 5000) }).then(function (v) {
        if (v === null) return;
        CM.api.updateCase(c.caseId, { status: 'refunded', refundNaira: Number(v || 0) }).then(function (x) { c = x; render(); CM.ui.toast(CM.t('status.refunded'), 'banknote'); });
      });
    });
    CM.$('#del').addEventListener('click', function () {
      CM.ui.confirm({ title: CM.t('case.delete') + '?', body: CM.t('delete.body', { n: 1 }), confirm: CM.t('case.delete'), danger: true }).then(function (ok) {
        if (!ok) return;
        CM.api.removeCase(c.caseId).then(function () { CM.ui.toast(CM.t('case.deleted'), 'trash'); setTimeout(function () { location.href = 'cases.html'; }, 500); });
      });
    });
  }

  CM.api.getCase(id).then(function (x) { if (!x) return notFound(); c = x; render(); });
  document.addEventListener('cm:lang', function () { if (c) render(); });
  document.addEventListener('cm:overdue', function (e) { if (c && e.detail.caseId === c.caseId) { c = e.detail; render(); } });
  setInterval(function () { if (c && c.timer && !c.timer.stoppedAt && ['waiting_hmo', 'overdue'].includes(c.status) && !document.querySelector('dialog[open]')) { c = CM.api.getCaseSync(c.caseId); render(); } }, 30000);
})();
