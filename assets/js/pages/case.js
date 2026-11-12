/* Screen 8b — Case detail: the evidence trail until the case is resolved or refunded.
   - Patient, HMO, plan, hospital and "how sure we are" (editable per case; verdicts re-run)
   - One mini verdict per issue; the timeline (it prints into the complaint)
   - Follow-up nudges (24 h / 48 h after a complaint; day 10 / 25 at the regulator), labelled as our suggestion
   - Log "HMO replied" (may confirm enrolment), "HMO called", "paid ₦X", notes; evidence photos
   - Mark resolved / refunded; Download case PDF (cases live only on this phone for now)
   Template: evidence photos are downscaled and kept in localStorage; production uploads them
   to a private bucket (POST /cases/:id/evidence) and deletes them with the case. */
(function () {
  if (!CM.boot()) return;
  const id = CM.qs('id');
  let c = null;
  const CLOSED = ['resolved', 'refunded'];
  const esc = CM.esc;

  function notFound() {
    CM.$('#content').innerHTML = '<div class="empty">' + CM.illus.search + '<p>' + esc(CM.t('case.notFound')) + '</p><a class="btn btn-primary" href="cases.html">' + esc(CM.t('cases.title')) + '</a></div>';
    CM.$('#actions').hidden = true;
  }

  function nudgeHtml() {
    const n = CM.api.nudge(c); if (!n) return '';
    const hmoName = c.hmo ? c.hmo.name : 'HMO', reg = CM.regulatorName(c);
    const t = function (k) { return CM.t('nudge.' + k, { hmo: hmoName, r: reg }); };
    let actions = '';
    if (n.kind === 'reply_check') actions = '<button type="button" class="btn btn-primary" data-nudge="replied">' + esc(t('yes')) + '</button><button type="button" class="btn btn-secondary" data-nudge="dismiss">' + esc(CM.t('common.dismiss')) + '</button>';
    if (n.kind === 'escalate') actions = '<a class="btn btn-primary" href="complaint.html?case=' + encodeURIComponent(c.caseId) + '&to=regulator">' + CM.icon('flag') + esc(t('escalate', {})) + '</a><button type="button" class="btn btn-secondary" data-nudge="replied">' + esc(t('yes')) + '</button>';
    if (n.kind.indexOf('regulator') === 0 && c.complaints.length) {
      const regObj = CM.api.regulatorFor(c);
      if (regObj.tel) actions = '<a class="btn btn-secondary" href="tel:' + esc(regObj.tel) + '">' + CM.icon('phone') + esc(CM.t('result.call') + ' ' + regObj.name) + '</a>';
    }
    return '<div class="banner banner-amber nudge" role="status">' + CM.icon(n.kind === 'escalate' ? 'flag' : 'clock') +
      '<span class="stack" style="gap:8px"><strong>' + esc(t(n.kind)) + '</strong><span>' + esc(t(n.kind + '.body')) + '</span>' +
      (n.kind === 'reply_check' || n.kind === 'escalate' ? '<span class="ours">' + esc(t('ours')) + '</span>' : '') +
      (actions ? '<span class="actions">' + actions + '</span>' : '') + '</span></div>';
  }

  function render() {
    const enc = encodeURIComponent(c.caseId);
    const closed = CLOSED.includes(c.status);
    const ts = CM.api.timerState(c);
    const timerOn = ts && !ts.timer.stoppedAt && ['waiting_hmo', 'overdue'].includes(c.status);
    let timerLine = '';
    if (timerOn) {
      timerLine = '<a class="banner ' + (ts.remaining <= 0 ? 'banner-danger' : 'banner-amber') + '" href="timer.html?case=' + enc + '" style="text-decoration:none;color:inherit">' +
        CM.icon(ts.remaining <= 0 ? 'alert' : 'timer') + '<span class="grow"><strong>' + esc(ts.remaining <= 0 ? CM.t('timer.overdue', { m: Math.floor(-ts.remaining / 60000) }) : CM.fmt.clock(ts.remaining) + ' ' + CM.t('timer.left')) + '</strong>' +
        esc(CM.t('case.openTimer')) + '</span>' + CM.icon('chevron-right') + '</a>';
    }
    const rel = c.patientRelation ? CM.t('rel.' + c.patientRelation) : '—';
    const evidence = '<section class="card stack-2" aria-labelledby="ev-h"><div class="stack" style="gap:4px"><h2 id="ev-h" class="eyebrow">' + esc(CM.t('case.evidence')) + '</h2><p class="small muted">' + esc(CM.t('case.evidence.hint')) + '</p></div>' +
      '<div class="evidence-grid">' + c.evidence.map(function (e) {
        return '<div class="evidence-item"><img src="' + esc(e.dataUrl) + '" alt="' + esc(CM.t('case.evidence.' + e.kind)) + '"><span class="kind">' + esc(CM.t('case.evidence.' + e.kind)) + '</span>' +
          '<button type="button" class="rm" data-rm="' + esc(e.id) + '" aria-label="' + esc(CM.t('case.evidence.remove')) + '">' + CM.icon('x') + '</button></div>';
      }).join('') +
      (closed ? '' : '<label class="evidence-add" for="ev-file">' + CM.icon('camera') + '<span>' + esc(CM.t('case.evidence.add')) + '</span></label>') + '</div>' +
      '<input type="file" id="ev-file" accept="image/jpeg,image/png" capture="environment" class="sr-only" tabindex="-1"></section>';

    CM.$('#content').innerHTML = '<div class="cols"><div class="col-main">' +
      '<section class="card stack-2" aria-labelledby="case-h">' +
        '<div class="row" style="gap:12px"><span class="avatar" style="background:var(--brand-50);color:var(--brand-700)">' + CM.icon(CM.meta.issue[c.issues[0].type] || 'message') + '</span>' +
        '<div class="grow" style="flex:1;min-width:0"><h1 id="case-h" style="font-size:var(--fs-22)">' + esc(CM.caseTitle(c)) + '</h1>' +
        '<span class="small muted">' + esc(CM.t('case.started', { t: CM.fmt.dateTime(c.createdAt) })) + '</span></div></div>' +
        '<div class="row" style="flex-wrap:wrap;gap:8px">' + CM.badge.status(c.status, c) + CM.badge.verification(c.verification) + '</div>' +
        (c.flags && c.flags.notEnrollee ? '<div class="banner banner-danger">' + CM.icon('alert') + '<span>' + esc(CM.t('case.notEnrollee')) + '</span></div>' : '') +
        '<dl class="meta-list">' +
          '<dt>' + esc(CM.t('case.patient')) + '</dt><dd>' + esc(rel) + '</dd>' +
          '<dt>' + esc(CM.t('result.hmoLabel')) + '</dt><dd>' + esc(c.hmo ? c.hmo.name : CM.t('settings.noHmo')) + '</dd>' +
          '<dt>' + esc(CM.t('setup.plan.title').replace(/\?$/, '')) + '</dt><dd>' + esc(CM.t('plan.' + c.planType)) + '</dd>' +
          '<dt>' + esc(CM.t('setup.hosp.label')) + '</dt><dd>' + esc(c.facility ? c.facility.name + (c.facility.level ? ' · ' + CM.t('level.' + c.facility.level) : '') : '—') + '</dd>' +
        '</dl>' +
        (closed ? '' : '<button type="button" class="link-btn small" id="edit-case" style="align-self:flex-start">' + CM.icon('pencil', 'icon-sm') + esc(CM.t('case.edit')) + '</button>') +
        (c.paidNaira ? '<p class="small">' + CM.icon('banknote', 'icon-sm') + ' ' + esc(CM.t('case.paidTotal', { amount: CM.fmt.naira(c.paidNaira) })) + '</p>' : '') +
        (c.status === 'refunded' ? '<p class="small" style="color:var(--success-600);font-weight:600">' + esc(CM.t('case.refundTotal', { amount: CM.fmt.naira(c.refundNaira) })) + '</p>' : '') +
      '</section>' +
      nudgeHtml() + timerLine +
      '<section class="card" aria-labelledby="iss-h"><h2 id="iss-h" class="eyebrow" style="margin-bottom:12px">' + esc(CM.t('case.issues')) + '</h2>' +
        c.issues.map(function (iss) { return '<div class="issue-mini"><div class="row-between"><strong>' + esc(CM.t('issue.' + iss.type)) + '</strong>' + CM.badge.verdict(iss.verdict) + '</div><p>' + esc(CM.L(iss.headline)) + '</p></div>'; }).join('') +
        '<div class="btn-row" style="margin-top:12px"><a class="btn btn-secondary" href="result.html?case=' + enc + '">' + CM.icon('shield-check') + '<span>' + esc(CM.t('case.viewAnswer')) + '</span></a>' +
        (!closed ? '<a class="btn btn-secondary" href="complaint.html?case=' + enc + '">' + CM.icon('file') + '<span>' + esc(CM.t('case.complain')) + '</span></a>' : '') + '</div>' +
      '</section>' +
      (!closed ? '<section class="stack" aria-labelledby="add-h"><h2 id="add-h" class="eyebrow">' + esc(CM.t('case.add')) + '</h2><div class="chips">' +
        (c.complaints.length ? '<button type="button" class="chip" data-add="hmo_replied">' + CM.icon('message') + '<span>' + esc(CM.t('case.add.reply')) + '</span></button>' : '') +
        '<button type="button" class="chip" data-add="hmo_called">' + CM.icon('phone') + '<span>' + esc(CM.t('case.add.called')) + '</span></button>' +
        '<button type="button" class="chip" data-add="code_received">' + CM.icon('check') + '<span>' + esc(CM.t('case.add.code')) + '</span></button>' +
        '<button type="button" class="chip" data-add="paid">' + CM.icon('banknote') + '<span>' + esc(CM.t('case.add.paid')) + '</span></button>' +
        '<button type="button" class="chip" data-add="note">' + CM.icon('pencil') + '<span>' + esc(CM.t('case.add.note')) + '</span></button>' +
        '</div></section>' : '') +
      evidence +
      '</div><div class="col-side">' +
      '<section class="card stack-2" aria-labelledby="tl-h"><h2 id="tl-h" class="eyebrow">' + esc(CM.t('case.timeline')) + '</h2>' + CM.renderTimeline(c.events) + '</section>' +
      '<button type="button" class="btn btn-secondary btn-block" id="pdf">' + CM.icon('download') + '<span>' + esc(CM.t('case.pdf')) + '</span></button>' +
      '<p class="small muted">' + esc(CM.t('settings.backup')) + '</p>' +
      '<button type="button" class="btn btn-ghost" id="del" style="color:var(--danger-600);align-self:center">' + CM.icon('trash') + '<span>' + esc(CM.t('case.delete')) + '</span></button>' +
      '</div></div>' + printSheet();

    CM.$('#actions').hidden = closed;
    CM.$('#actions').innerHTML = closed ? '' :
      '<div class="btn-row"><button type="button" class="btn btn-secondary btn-lg" id="resolve">' + CM.icon('check-circle') + '<span>' + esc(CM.t('case.markResolved')) + '</span></button>' +
      '<button type="button" class="btn btn-primary btn-lg" id="refund">' + CM.icon('banknote') + '<span>' + esc(CM.t('case.markRefunded')) + '</span></button></div>';
    wire();
  }

  /* Printable case summary ("Download case PDF": the browser's Save as PDF) */
  function printSheet() {
    const p = CM.store.profile();
    return '<section class="print-sheet" aria-hidden="true"><h1>CoverMe case summary</h1><p class="ref">Case ref ' + esc(c.caseId) + ' · printed ' + esc(CM.fmt.dateTime(new Date().toISOString())) + '</p>' +
      '<table><tr><th>Patient</th><td>' + esc(c.patientRelation === 'me' || !c.patientRelation ? 'The enrollee' : CM.t('rel.' + c.patientRelation)) + '</td></tr>' +
      '<tr><th>HMO</th><td>' + esc(c.hmo ? c.hmo.name : '—') + (p.enrolleeId ? ' · Enrollee ID ' + esc(CM.maskId(p.enrolleeId)) : '') + '</td></tr>' +
      '<tr><th>Plan</th><td>' + esc(CM.t('plan.' + c.planType)) + ' · ' + esc(CM.t('verif.' + (c.verification || 'self_reported'))) + '</td></tr>' +
      '<tr><th>Hospital</th><td>' + esc(c.facility ? c.facility.name : '—') + '</td></tr>' +
      '<tr><th>Status</th><td>' + esc(CM.statusLabel(c.status, c)) + '</td></tr></table>' +
      '<h2>What happened</h2><p>“' + esc(c.transcript) + '”</p>' +
      '<h2>What the rules say</h2><table>' + c.issues.map(function (i) { return '<tr><th>' + esc(CM.t('issue.' + i.type)) + '</th><td>' + esc(CM.L(i.headline)) + '<br><span class="ref">' + esc(i.citations.map(function (x) { return x.ruleId; }).join(', ') || 'Confirm with HMO') + '</span></td></tr>'; }).join('') + '</table>' +
      '<h2>Timeline</h2><table>' + c.events.map(function (e) { return '<tr><td style="white-space:nowrap">' + esc(CM.fmt.dateTime(e.at)) + '</td><td>' + esc(CM.eventLabel(e)) + (e.code ? ' (code ' + esc(e.code) + ')' : '') + '</td></tr>'; }).join('') + '</table>' +
      (c.complaints.length ? '<h2>Complaints</h2><table>' + c.complaints.map(function (x) { return '<tr><td>' + esc(CM.fmt.dateTime(x.sentAt)) + '</td><td>' + esc(x.recipientName) + ' · ' + esc(x.mode === 'coverme_sent' ? 'sent by CoverMe' : 'sent by you') + (x.deliveredAt ? ' · delivered' : '') + (x.repliedAt ? ' · replied' : '') + '</td></tr>'; }).join('') + '</table>' : '') +
      '<p class="ref" style="margin-top:16px">Information about insurance rights, not medical advice.</p></section>';
  }

  /* Downscale a photo (max 1024 px, JPEG) — drops EXIF/GPS too, as the doc requires */
  function shrink(file) {
    return new Promise(function (resolve, reject) {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        const k = Math.min(1, 1024 / Math.max(img.width, img.height));
        const cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url); resolve(cv.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = reject; img.src = url;
    });
  }

  function editDetails() {
    const agencies = CM.api.stateAgencies();
    const rels = ['me', 'child', 'spouse', 'parent', 'other'];
    const plans = ['nhia_formal', 'nhia_gifship', 'nhia_other', 'state', 'private', 'unsure'];
    const sh = CM.ui.sheet(
      '<div class="row-between"><h2>' + esc(CM.t('case.edit.title')) + '</h2><button class="icon-btn" data-close aria-label="' + esc(CM.t('common.close')) + '">' + CM.icon('x') + '</button></div>' +
      '<p class="small muted">' + esc(CM.t('case.edit.hint')) + '</p>' +
      '<div class="field"><label for="e-rel">' + esc(CM.t('case.patient')) + '</label><select id="e-rel" class="input select">' + rels.map(function (r) { return '<option value="' + r + '"' + (r === c.patientRelation ? ' selected' : '') + '>' + esc(CM.t('rel.' + r)) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="e-hmo">' + esc(CM.t('result.hmoLabel')) + '</label><select id="e-hmo" class="input select">' + CM.mock.hmos.map(function (h) { return '<option value="' + h.id + '"' + (c.hmo && c.hmo.id === h.id ? ' selected' : '') + '>' + esc(h.name) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="e-plan">' + esc(CM.t('setup.plan.title').replace(/\?$/, '')) + '</label><select id="e-plan" class="input select">' + plans.map(function (p) { return '<option value="' + p + '"' + (p === c.planType ? ' selected' : '') + '>' + esc(CM.t('plan.' + p)) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field" id="e-ag-wrap"><label for="e-ag">' + esc(CM.t('setup.plan.agency')) + '</label><select id="e-ag" class="input select">' + agencies.map(function (a) { return '<option value="' + a.id + '"' + (a.id === c.stateScheme ? ' selected' : '') + '>' + esc(a.name) + '</option>'; }).join('') + '</select></div>' +
      '<button type="button" class="btn btn-primary btn-block" id="e-save">' + esc(CM.t('common.save')) + '</button>', { label: CM.t('case.edit.title') });
    const plan = CM.$('#e-plan', sh.el), agWrap = CM.$('#e-ag-wrap', sh.el);
    const syncAg = function () { agWrap.hidden = plan.value !== 'state'; };
    plan.addEventListener('change', syncAg); syncAg();
    CM.$('#e-save', sh.el).addEventListener('click', function () {
      const d = { patientRelation: CM.$('#e-rel', sh.el).value, planType: plan.value, stateScheme: plan.value === 'state' ? CM.$('#e-ag', sh.el).value : null };
      if (!c.hmo || CM.$('#e-hmo', sh.el).value !== c.hmo.id) d.hmoId = CM.$('#e-hmo', sh.el).value;
      CM.api.updateCaseDetails(c.caseId, d).then(function (x) { c = x; sh.close(); render(); CM.ui.toast(CM.t('event.details_changed'), 'pencil'); });
    });
  }

  function replied() {
    const sh = CM.ui.sheet(
      '<div class="row-between"><h2>' + esc(CM.t('case.reply.title')) + '</h2><button class="icon-btn" data-close aria-label="' + esc(CM.t('common.close')) + '">' + CM.icon('x') + '</button></div>' +
      '<div class="field"><label for="r-note">' + esc(CM.t('case.reply.note')) + '</label><textarea id="r-note" class="textarea" rows="2"></textarea></div>' +
      '<button type="button" class="choice" data-en="confirmed"><span class="ic">' + CM.icon('shield-check') + '</span><span class="grow title">' + esc(CM.t('case.reply.confirmed')) + '</span></button>' +
      '<button type="button" class="choice" data-en="not_enrollee"><span class="ic">' + CM.icon('x') + '</span><span class="grow title">' + esc(CM.t('case.reply.not')) + '</span></button>' +
      '<button type="button" class="choice" data-en="other"><span class="ic">' + CM.icon('message') + '</span><span class="grow title">' + esc(CM.t('case.reply.other')) + '</span></button>', { label: CM.t('case.reply.title') });
    sh.el.addEventListener('click', function (e) {
      const b = e.target.closest('[data-en]'); if (!b) return;
      CM.api.addEvent(c.caseId, { type: 'hmo_replied', enrollee: b.dataset.en, note: CM.$('#r-note', sh.el).value.trim() || undefined }).then(function (x) { c = x; sh.close(); render(); CM.ui.toast(CM.t('event.hmo_replied'), 'message'); });
    });
  }

  function wire() {
    const edit = CM.$('#edit-case'); if (edit) edit.addEventListener('click', editDetails);
    CM.$$('[data-nudge]').forEach(function (b) {
      b.addEventListener('click', function () { if (b.dataset.nudge === 'replied') replied(); else b.closest('.nudge').remove(); });
    });
    CM.$$('[data-add]').forEach(function (b) {
      b.addEventListener('click', function () {
        const type = b.dataset.add;
        if (type === 'hmo_replied') return replied();
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
    const file = CM.$('#ev-file');
    if (file) file.addEventListener('change', function () {
      const f = file.files && file.files[0]; if (!f) return;
      if (!/^image\/(jpeg|png)$/.test(f.type) || f.size > 3 * 1024 * 1024) { CM.ui.toast('JPEG or PNG, up to 3 MB', 'alert'); file.value = ''; return; }
      const kinds = ['receipt', 'sms', 'other'];
      const sh = CM.ui.sheet('<div class="row-between"><h2>' + esc(CM.t('case.evidence.kind')) + '</h2><button class="icon-btn" data-close aria-label="' + esc(CM.t('common.close')) + '">' + CM.icon('x') + '</button></div>' +
        kinds.map(function (k) { return '<button type="button" class="choice" data-kind="' + k + '"><span class="ic">' + CM.icon(k === 'receipt' ? 'banknote' : k === 'sms' ? 'message' : 'image') + '</span><span class="grow title">' + esc(CM.t('case.evidence.' + k)) + '</span></button>'; }).join(''), { label: CM.t('case.evidence.kind') });
      sh.el.addEventListener('click', function (e) {
        const b = e.target.closest('[data-kind]'); if (!b) return;
        sh.close();
        shrink(f).then(function (dataUrl) { return CM.api.addEvidence(c.caseId, { kind: b.dataset.kind, dataUrl }); }).then(function (x) { c = x; render(); CM.ui.toast(CM.t('event.evidence'), 'image'); });
        file.value = '';
      });
    });
    CM.$$('[data-rm]').forEach(function (b) { b.addEventListener('click', function () { CM.api.removeEvidence(c.caseId, b.dataset.rm).then(function (x) { c = x; render(); }); }); });
    CM.$('#pdf').addEventListener('click', function () { window.print(); }); // production: GET /cases/:id/case.pdf
    const res = CM.$('#resolve'), ref = CM.$('#refund');
    if (res) res.addEventListener('click', function () { CM.api.updateCase(c.caseId, { status: 'resolved' }).then(function (x) { c = x; render(); CM.ui.toast(CM.statusLabel('resolved', c)); }); });
    if (ref) ref.addEventListener('click', function () {
      CM.ui.prompt({ title: CM.t('case.markRefunded'), label: CM.t('case.amountRefund'), type: 'number', placeholder: String(c.paidNaira || 5000) }).then(function (v) {
        if (v === null) return;
        CM.api.updateCase(c.caseId, { status: 'refunded', refundNaira: Number(v || 0) }).then(function (x) { c = x; render(); CM.ui.toast(CM.statusLabel('refunded', c), 'banknote'); });
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
  // Refresh for timer, Mode B "delivered" events and nudges, unless a sheet or dialog is open
  setInterval(function () {
    if (!c || document.querySelector('dialog[open], .sheet.open')) return;
    const x = CM.api.getCaseSync(c.caseId); if (!x) return;
    const running = CM.api.timerState(x) && !CM.api.timerState(x).timer.stoppedAt;
    if (x.events.length !== c.events.length || running || CM.api.nudge(x)) { c = x; render(); }
  }, 15000);
})();
