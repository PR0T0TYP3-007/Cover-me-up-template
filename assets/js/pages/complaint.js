/* Screen 7 — Complaint: name, phone and enrollee ID (asked only here, with "why we need this"),
   paper-style letter built from the case timeline (one paragraph per issue), then send:
   - Mode A (prototype): the user sends it by email, WhatsApp, a call, or a PDF, then taps "I've sent it".
   - Mode B (final build): "Let CoverMe send it" with the consent checkbox; refused without consent + enrollee ID.
   Escalation: HMO first, then the plan's regulator (NHIA for NHIA programmes and private plans,
   the state agency for state schemes). After sending it returns to Case detail. */
(function () {
  if (!CM.boot()) return;
  const id = CM.qs('case');
  const c = id && CM.api.getCaseSync(id);
  if (!c) { location.replace('cases.html'); return; }
  const esc = CM.esc;

  const reg = CM.api.regulatorFor(c);
  const sentToHmo = c.complaints.some(function (x) { return x.recipient === 'hmo'; });
  const recipient = CM.qs('to') === 'regulator' || (sentToHmo && CM.qs('to') !== 'hmo') ? 'regulator' : 'hmo';
  const hmo = c.hmo && c.hmo.tel ? c.hmo : (CM.profileHmo() || { name: 'my HMO' });
  const toName = recipient === 'hmo' ? hmo.name : reg.name;
  const toEmail = recipient === 'hmo' ? (hmo.complaintEmail || '') : (reg.email || '');
  const toTel = recipient === 'hmo' ? hmo.tel : reg.tel;
  const profile = CM.store.profile();

  /* Details: kept on this device for the template; the API encrypts them (AES-256-GCM). */
  const saved = CM.store.get('complainant', {});
  const f = { name: CM.$('#name'), phone: CM.$('#phone'), enrollee: CM.$('#enrollee') };
  f.name.value = saved.name || profile.memberName || '';
  f.phone.value = saved.phone || '';
  f.enrollee.value = saved.enrollee || profile.enrolleeId || '';
  Object.keys(f).forEach(function (k) { f[k].addEventListener('input', function () { persist(); renderLetter(); syncB(); }); });
  function persist() { CM.store.set('complainant', { name: f.name.value.trim(), phone: f.phone.value.trim(), enrollee: f.enrollee.value.trim() }); }

  function ladder() {
    const i = recipient === 'hmo' ? 0 : 1;
    CM.$('#rung-hmo').textContent = hmo.name; CM.$('#rung-reg').textContent = reg.name;
    CM.$$('#ladder .rung').forEach(function (r, j) { r.className = 'rung' + (j < i ? ' done' : j === i ? ' current' : ''); });
    CM.$('#step-of').textContent = CM.t('complaint.step', { n: i + 1, t: 2 });
    CM.$('#to-title').textContent = CM.t('complaint.to', { r: toName });
    CM.$('#timing').hidden = !(recipient === 'regulator' && reg.kind === 'nhia');
    CM.$('#next-step').textContent = i === 0 ? CM.t('complaint.next', { r: reg.name }) : CM.t('complaint.final', { r: reg.name });
    CM.$('#consent-text').textContent = CM.t('complaint.consent', { r: toName });
  }

  /* ---------- Letter (always English: it is read by the HMO and the regulator) ---------- */
  const PLAN = { nhia_formal: 'NHIA formal sector', nhia_gifship: 'NHIA GIFSHIP', nhia_other: 'NHIA', state: 'state health scheme', private: 'private HMO', unsure: 'health insurance' };
  const ISSUE = {
    drug_refused: { subj: 'Prescribed drug not supplied', what: 'being asked to buy a prescribed drug outside the facility', ask: 'ensure the drug is supplied under my plan, and refund any amount I paid for it' },
    drug_unavailable: { subj: 'Prescribed drug out of stock', what: 'a prescribed drug being out of stock, with no arrangement offered to get it under my plan', ask: 'tell me how to get the drug under my plan, and refund any amount I paid for it' },
    cash_demanded: { subj: 'Cash payment demanded', what: 'being asked to pay cash at the point of care', ask: 'explain any charge in writing, settle covered costs with the facility, and refund any amount I paid that my plan covers' },
    auth_delay: { subj: 'Authorisation code not issued within 1 hour', what: 'a delay in issuing the authorisation code for my care', ask: 'explain the delay, issue the authorisation code immediately, and refund any amount I paid because of the delay' },
    referral_delay: { subj: 'Referral code not issued within 1 hour', what: 'a delay in approving my referral', ask: 'explain the delay, issue the referral code immediately, and refund any amount I paid because of the delay' },
    other: { subj: 'Complaint about my HMO cover', what: 'a problem with my cover at the facility', ask: 'confirm in writing what my plan covers and resolve the issue' }
  };
  const REL = { me: '', child: 'my child', spouse: 'my spouse', parent: 'my parent', other: 'a family member' };
  function fld(v, placeholder) { return '<span class="fld' + (v ? ' filled' : '') + '">' + esc(v || placeholder) + '</span>'; }
  function eventLine(e) {
    const en = { message: 'I described the problem', timer_started: 'The hospital asked my HMO for authorisation; the 1-hour clock started' + (e.approximate ? ' (approximate time)' : ''),
      hmo_responded: 'HMO responded', code_received: 'Authorisation code received', hmo_called: 'HMO called back but did not resolve the issue', paid: 'I paid ₦' + CM.fmt.naira(e.amount),
      overdue: 'The 1-hour deadline passed without a response', escalated: 'Complaint sent to ' + (e.recipientName || 'the HMO'), delivered: 'Delivered to ' + (e.recipientName || ''),
      hmo_replied: 'HMO replied', resolved: 'Marked resolved', refunded: 'Refunded ₦' + CM.fmt.naira(e.amount), emergency: 'Emergency card shown', refused: 'HMO refused or did not answer',
      bad_number: 'The HMO phone number did not work', evidence: 'Photo evidence added', note: 'Note' };
    if (['verdict', 'details_changed', 'emergency_help', 'emergency_dismissed'].includes(e.type)) return null;
    return '<li><strong>' + CM.fmt.dateTime(e.at) + '</strong> — ' + esc(en[e.type] || e.type) + (e.note && e.type !== 'message' ? ': ' + esc(e.note) : '') + (e.code ? ' (code ' + esc(e.code) + ')' : '') + '</li>';
  }
  function renderLetter() {
    const v = { name: f.name.value.trim(), phone: f.phone.value.trim(), enrollee: f.enrollee.value.trim() };
    const hospital = c.facility ? c.facility.name : profile.hospital;
    const first = ISSUE[c.issues[0].type] || ISSUE.other;
    const subject = first.subj + (c.issues.length > 1 ? ' (and ' + (c.issues.length - 1) + ' other issue' + (c.issues.length > 2 ? 's' : '') + ')' : '');
    const firstHmo = c.complaints.find(function (x) { return x.recipient === 'hmo'; });
    const paid = c.paidNaira || c.amountNaira;
    const patient = REL[c.patientRelation] ? ' I am writing on behalf of ' + REL[c.patientRelation] + ', who is the patient.' : '';
    const toBlock = recipient === 'hmo' ? 'The Complaints Officer<br>' + esc(hmo.name) : esc(reg.longName || reg.name);
    const issues = c.issues.map(function (iss) {
      const I = ISSUE[iss.type] || ISSUE.other;
      const rule = iss.citations[0] && CM.api.rule(iss.citations[0].ruleId);
      return '<li>' + esc(I.what.charAt(0).toUpperCase() + I.what.slice(1)) + '.' + (rule ? ' Under ' + esc(rule.title.en + ' (' + rule.id + ')') + ': ' + esc(rule.says.en) : '') + ' I request that you ' + esc(I.ask) + '.</li>';
    }).join('');
    CM.$('#letter').innerHTML =
      '<p>' + CM.fmt.date(new Date().toISOString()) + '</p>' +
      '<p>' + toBlock + '</p>' +
      '<p><strong>Subject: ' + esc(subject) + (hospital ? ' at ' + esc(hospital) : '') + '</strong></p>' +
      '<p>Dear Sir/Madam,</p>' +
      '<p>I am an enrollee of ' + esc(hmo.name) + ' (Enrollee ID: ' + fld(v.enrollee, 'enrollee ID needed') + ') on the ' + esc(PLAN[c.planType] || 'health insurance') + ' plan.' + esc(patient) +
      ' I am writing about what happened at ' + fld(hospital, 'the hospital') + ' on ' + CM.fmt.date(c.createdAt) + '.</p>' +
      '<p>The problem' + (c.issues.length > 1 ? 's' : '') + ':</p><ol>' + issues + '</ol>' +
      '<p>What happened:</p><ol>' + c.events.map(eventLine).filter(Boolean).join('') + '</ol>' +
      (recipient === 'regulator' && firstHmo ? '<p>I first reported this to ' + esc(hmo.name) + ' on ' + CM.fmt.date(firstHmo.sentAt) + ' and have not received a satisfactory response.</p>' : '') +
      (paid ? '<p>Amount paid so far: ₦' + CM.fmt.naira(paid) + '.</p>' : '') +
      '<p class="sig">Yours faithfully,<br>' + fld(v.name, 'Your full name') + '<br>' + fld(v.phone, 'Your phone number') + '</p>' +
      '<p class="small" style="color:#5E6A65;font-family:var(--font-body)">Case ref ' + esc(c.caseId) + ' · prepared with CoverMe</p>';
    syncLinks();
  }
  function letterText() {
    const el = CM.$('#letter').cloneNode(true);
    el.querySelectorAll('ol').forEach(function (ol) { ol.querySelectorAll('li').forEach(function (li, i) { li.prepend((i + 1) + '. '); }); });
    el.querySelectorAll('br').forEach(function (b) { b.replaceWith('\n'); });
    el.querySelectorAll('p, li').forEach(function (n) { n.append('\n'); });
    return el.textContent.replace(/\n{3,}/g, '\n\n').trim();
  }
  /* Name, phone and enrollee ID are required to send (the HMO checks the ID) */
  function valid() {
    const missing = f.name.value.trim().length < 2 ? f.name : f.phone.value.replace(/\D/g, '').length < 10 ? f.phone : !f.enrollee.value.trim() ? f.enrollee : null;
    const req = CM.$('#required');
    req.hidden = !missing;
    if (missing) { req.textContent = CM.t(missing === f.enrollee ? 'complaint.needId' : 'complaint.required'); missing.focus(); }
    return !missing;
  }
  function syncLinks() {
    const subject = (ISSUE[c.issues[0].type] || ISSUE.other).subj;
    CM.$('#send-email').href = 'mailto:' + encodeURIComponent(toEmail) + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(letterText());
    CM.$('#send-wa').href = 'https://wa.me/?text=' + encodeURIComponent(letterText());
    const call = CM.$('#send-call');
    call.hidden = !toTel; if (toTel) call.href = 'tel:' + toTel;
  }

  let channel = null;
  function guard(e, ch) { if (!valid()) { e.preventDefault(); return false; } channel = ch; return true; }
  CM.$('#send-email').addEventListener('click', function (e) { guard(e, 'email'); });
  CM.$('#send-wa').addEventListener('click', function (e) { guard(e, 'whatsapp'); });
  CM.$('#send-call').addEventListener('click', function (e) { guard(e, 'call'); });
  CM.$('#send-pdf').addEventListener('click', function (e) { if (guard(e, 'pdf')) window.print(); }); // production: GET /cases/:id/complaint.pdf
  CM.$('#send-copy').addEventListener('click', function (e) { if (guard(e, 'copy')) CM.ui.copy(letterText()); });

  function done(msg) {
    CM.ui.toast(msg, 'flag');
    setTimeout(function () { location.href = 'case.html?id=' + encodeURIComponent(id); }, 900);
  }
  /* Mode A: the user sent it themselves */
  CM.$('#mark-sent').addEventListener('click', function () {
    if (!valid()) return;
    persist();
    CM.api.createComplaint(id, { recipient, mode: 'user_sent', channel: channel || 'manual' }).then(function () { done(CM.t('complaint.sent', { r: toName })); });
  });
  /* Mode B: CoverMe sends it, only with explicit consent on this complaint */
  const consent = CM.$('#consent'), sendB = CM.$('#send-b');
  function syncB() { sendB.disabled = !consent.checked; }
  consent.addEventListener('change', syncB);
  sendB.addEventListener('click', function () {
    if (!valid() || !consent.checked) return;
    persist();
    sendB.disabled = true;
    CM.api.createComplaint(id, { recipient, mode: 'coverme_sent', channel: 'email', consent: true, enrolleeId: f.enrollee.value.trim() })
      .then(function () { done(CM.t('complaint.sentB', { r: toName })); })
      .catch(function () { sendB.disabled = false; valid(); });
  });

  document.addEventListener('cm:lang', ladder);
  ladder(); renderLetter(); syncB();
})();
