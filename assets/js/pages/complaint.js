/* Screen 7 — Complaint: name + phone (with "why we need this"), paper-style letter
   preview built from the case timeline, send via email / WhatsApp / PDF.
   Escalation: HMO first, then NHIA call centre, then NHIA Enforcement. */
(function () {
  if (!CM.boot()) return;
  const id = CM.qs('case');
  const c = id && CM.api.getCaseSync(id);
  if (!c) { location.replace('cases.html'); return; }
  CM.$('#topbar .back').href = 'case.html?id=' + encodeURIComponent(id);

  const LADDER = ['hmo', 'nhia_call', 'nhia_enf'];
  const stepIdx = Math.min(c.complaints.length, 2);
  const recipient = CM.qs('to') && LADDER.includes(CM.qs('to')) ? CM.qs('to') : LADDER[stepIdx];
  const rIdx = LADDER.indexOf(recipient);
  const hmo = c.hmo && c.hmo.tel ? c.hmo : (CM.profileHmo() || { name: 'my HMO' });
  const profile = CM.store.profile();

  /* Details: kept on this device for the template; the API encrypts them (AES-256-GCM). */
  const saved = CM.store.get('complainant', {});
  const f = { name: CM.$('#name'), phone: CM.$('#phone'), enrollee: CM.$('#enrollee') };
  Object.keys(f).forEach(function (k) { f[k].value = saved[k] || ''; f[k].addEventListener('input', function () { persist(); renderLetter(); }); });
  function persist() { CM.store.set('complainant', { name: f.name.value.trim(), phone: f.phone.value.trim(), enrollee: f.enrollee.value.trim() }); }

  function ladder() {
    CM.$$('#ladder .rung').forEach(function (r, i) { r.className = 'rung' + (i < rIdx ? ' done' : i === rIdx ? ' current' : ''); });
    CM.$('#step-of').textContent = CM.t('complaint.step', { n: rIdx + 1 });
    CM.$('#to-title').textContent = CM.t('complaint.to', { r: recipient === 'hmo' ? hmo.name : CM.t('recipient.' + recipient) });
    CM.$('#next-step').textContent = rIdx < 2 ? CM.t('complaint.next', { r: CM.t('recipient.' + LADDER[rIdx + 1]) }) : CM.t('complaint.final');
  }

  /* ---------- Letter (always English: it is read by the HMO and NHIA) ---------- */
  const PLAN = { nhia: 'NHIA formal sector', state: 'state health scheme', private: 'private', unsure: 'health insurance' };
  const ISSUE = {
    drug_not_covered: { subj: 'Enrollee asked to buy a prescribed drug outside the facility', what: 'being asked to buy a prescribed drug outside the facility', ask: 'ensure the drug is supplied under my plan, and refund any amount I paid for it' },
    cash_demanded: { subj: 'Cash payment demanded for covered services', what: 'being asked to pay cash for services covered by my plan', ask: 'stop the cash demand, settle the bill with the facility, and refund any amount I paid' },
    auth_delay: { subj: 'Authorisation code not issued within 1 hour', what: 'a delay in issuing the authorisation code for my care', ask: 'explain the delay, issue the authorisation code immediately, and refund any amount I paid because of the delay' },
    referral_delay: { subj: 'Referral code not issued within 1 hour', what: 'a delay in approving my referral', ask: 'explain the delay, issue the referral code immediately, and refund any amount I paid because of the delay' },
    other: { subj: 'Complaint about my HMO cover', what: 'a problem with my cover at the facility', ask: 'confirm in writing what my plan covers and resolve the issue' }
  };
  const TO = {
    hmo: function () { return 'The Complaints Officer<br>' + CM.esc(hmo.name); },
    nhia_call: function () { return 'NHIA Call Centre<br>National Health Insurance Authority'; },
    nhia_enf: function () { return 'The Head, Enforcement Department<br>National Health Insurance Authority'; }
  };
  function fld(v, placeholder) { return '<span class="fld' + (v ? ' filled' : '') + '">' + CM.esc(v || placeholder) + '</span>'; }
  function eventLine(e) {
    const en = { message: 'I described the problem', verdict: 'CoverMe checked the NHIA rules', timer_started: 'The hospital was asked to request authorisation; 1-hour timer started',
      hmo_responded: 'HMO responded', code_received: 'Authorisation code received', hmo_called: 'HMO called back but did not resolve the issue', paid: 'I paid ₦' + CM.fmt.naira(e.amount),
      overdue: 'The 1-hour deadline passed without a response', escalated: 'Complaint sent to ' + (e.recipient === 'hmo' ? hmo.name : e.recipient === 'nhia_call' ? 'NHIA call centre' : 'NHIA Enforcement'),
      resolved: 'Marked resolved', refunded: 'Refunded ₦' + CM.fmt.naira(e.amount), emergency: 'Emergency card shown', refused: 'HMO refused or did not answer', note: 'Note' };
    if (e.type === 'verdict') return null;
    return '<li><strong>' + CM.fmt.dateTime(e.at) + '</strong> — ' + CM.esc(en[e.type] || e.type) + (e.note && e.type !== 'message' ? ': ' + CM.esc(e.note) : '') + (e.code ? ' (code ' + CM.esc(e.code) + ')' : '') + '</li>';
  }
  function letterParts() {
    const v = { name: f.name.value.trim(), phone: f.phone.value.trim(), enrollee: f.enrollee.value.trim() };
    const I = ISSUE[c.issueType] || ISSUE.other;
    const hospital = c.hospital || profile.hospital;
    const rules = c.citations.map(function (ct) { const r = CM.api.rule(ct.ruleId); return r ? r.title.en + ' (' + r.id + ')' : ct.ruleId; });
    const first = c.citations[0] && CM.api.rule(c.citations[0].ruleId);
    const firstHmo = c.complaints.find(function (x) { return x.recipient === 'hmo'; });
    const paid = c.paidNaira || c.amountNaira;
    return { v, I, hospital, rules, first, firstHmo, paid };
  }
  function renderLetter() {
    const p = letterParts();
    const lines = c.events.map(eventLine).filter(Boolean).join('');
    CM.$('#letter').innerHTML =
      '<p>' + CM.fmt.date(new Date().toISOString()) + '</p>' +
      '<p>' + TO[recipient]() + '</p>' +
      '<p><strong>Subject: ' + CM.esc(p.I.subj) + (p.hospital ? ' at ' + CM.esc(p.hospital) : '') + '</strong></p>' +
      '<p>Dear Sir/Madam,</p>' +
      '<p>I am an enrollee of ' + CM.esc(hmo.name) + ' (Enrollee ID: ' + fld(p.v.enrollee, 'not provided') + ') on the ' + CM.esc(PLAN[c.planType] || 'health insurance') + ' plan. ' +
      'I am writing to complain about ' + CM.esc(p.I.what) + ' at ' + fld(p.hospital, 'the hospital') + ' on ' + CM.fmt.date(c.createdAt) + '.</p>' +
      '<p>What happened:</p><ol>' + lines + '</ol>' +
      (p.first ? '<p>Under ' + CM.esc(p.rules.join('; ')) + ': ' + CM.esc(p.first.says.en) + '</p>' : '') +
      (recipient !== 'hmo' && p.firstHmo ? '<p>I first reported this to ' + CM.esc(hmo.name) + ' on ' + CM.fmt.date(p.firstHmo.sentAt) + ' and have not received a satisfactory response.</p>' : '') +
      '<p>I request that you ' + CM.esc(p.I.ask) + (p.paid ? ' (₦' + CM.fmt.naira(p.paid) + ')' : '') + '.</p>' +
      '<p class="sig">Yours faithfully,<br>' + fld(p.v.name, 'Your full name') + '<br>' + fld(p.v.phone, 'Your phone number') + '</p>' +
      '<p class="small" style="color:#5E6A65;font-family:var(--font-body)">Case ref ' + CM.esc(c.caseId) + ' · prepared with CoverMe</p>';
    syncLinks();
  }
  function letterText() {
    const el = CM.$('#letter').cloneNode(true);
    el.querySelectorAll('li').forEach(function (li, i) { li.prepend((i + 1) + '. '); });
    el.querySelectorAll('br').forEach(function (b) { b.replaceWith('\n'); });
    el.querySelectorAll('p, li').forEach(function (n) { n.append('\n'); });
    return el.textContent.replace(/\n{3,}/g, '\n\n').trim();
  }
  function valid() {
    const ok = f.name.value.trim().length > 1 && f.phone.value.replace(/\D/g, '').length >= 10;
    CM.$('#required').hidden = ok;
    if (!ok) (f.name.value.trim().length > 1 ? f.phone : f.name).focus();
    return ok;
  }
  function syncLinks() {
    const subject = (ISSUE[c.issueType] || ISSUE.other).subj;
    const to = recipient === 'hmo' && hmo.email ? hmo.email : '';
    CM.$('#send-email').href = 'mailto:' + encodeURIComponent(to) + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(letterText());
    CM.$('#send-wa').href = 'https://wa.me/?text=' + encodeURIComponent(letterText());
  }

  let channel = null;
  function guard(e, ch) { if (!valid()) { e.preventDefault(); return false; } channel = ch; return true; }
  CM.$('#send-email').addEventListener('click', function (e) { guard(e, 'email'); });
  CM.$('#send-wa').addEventListener('click', function (e) { guard(e, 'whatsapp'); });
  CM.$('#send-pdf').addEventListener('click', function (e) { if (guard(e, 'pdf')) window.print(); }); // production: GET /cases/:id/complaint.pdf
  CM.$('#send-copy').addEventListener('click', function (e) { if (guard(e, 'copy')) CM.ui.copy(letterText()); });

  CM.$('#mark-sent').addEventListener('click', function () {
    if (!valid()) return;
    persist();
    CM.api.createComplaint(id, { recipient, channel: channel || 'manual' }).then(function () {
      CM.ui.toast(CM.t('complaint.sent', { r: recipient === 'hmo' ? hmo.name : CM.t('recipient.' + recipient) }), 'flag');
      setTimeout(function () { location.href = 'case.html?id=' + encodeURIComponent(id); }, 700);
    });
  });

  document.addEventListener('cm:lang', ladder);
  ladder(); renderLetter();
})();
