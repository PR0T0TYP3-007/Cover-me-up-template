/* CoverMe — MOCK API.
   Mirrors the REST contract in the build plan (/api/v1). Every method returns a Promise shaped
   like the real response, so wiring the backend means replacing each method body with fetch().

     POST /session                      -> api.session()
     PATCH /me, DELETE /me              -> api.updateMe(profile), api.deleteMe()
     POST /me/card-scan                 -> api.cardScan(file)
     GET /hmos?q=, /drugs?q=, /rules    -> api.hmos(q), api.drugs(q), api.rules()
     GET /facilities?state=&lga=&q=     -> api.facilities({ state, lga, q })
     GET /facilities?lat=&lng=          -> api.nearestFacilities({ lat, lng })
     POST /cases, POST /cases/voice     -> api.createCase({ text } | { audio })
     GET /cases, GET /cases/:id         -> api.cases(), api.getCase(id)
     POST /cases/:id/events             -> api.addEvent(id, event)
     PATCH /cases/:id                   -> api.updateCase(id, patch), api.updateCaseDetails(id, details)
     POST /cases/:id/complaint          -> api.createComplaint(id, details)        (Mode A: user sends)
     POST /cases/:id/complaint/send     -> api.createComplaint(id, { mode: 'coverme_sent', consent: true })
     POST /cases/:id/evidence           -> api.addEvidence(id, { kind, dataUrl })
     POST /push/subscribe               -> api.subscribePush()

   Case shape (matches the doc's mock JSON):
     { caseId, emergency, transcript, planType, verification, hmo{name,phone,complaintEmail},
       facility{name,level}, issues[{ type, verdict, headline, citations[], confirmWithHmo, script,
       askFor, timer{approvalRequestedAt,deadlineAt,approximate}|null }], status, serverTime }
   Template extras: headline/script/askFor are { en, pcm } so the language toggle works offline.

   The verdict logic below imitates the server's rules engine so the template behaves
   realistically. In production it lives ONLY on the server: the AI reads and writes,
   the rules engine decides. */
window.CM = window.CM || {};
CM.api = (function () {
  const M = CM.mock;
  const wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  const uid = function (p) { return p + '_' + Math.random().toString(36).slice(2, 8); };
  const now = function () { return new Date().toISOString(); };
  const TIMER_MIN = 60;
  const APPROVAL = ['auth_delay', 'referral_delay'];
  const LEVEL = { primary: 1, secondary: 2, tertiary: 3 };

  /* ---------- Plans and where complaints go ---------- */
  function planGroup(planType) {
    if (!planType || planType === 'unsure') return 'unsure';
    if (planType.indexOf('nhia') === 0) return 'nhia';
    return planType; // 'state' | 'private'
  }
  /* NHIA programmes -> HMO -> NHIA; state schemes -> HMO -> state agency; private -> HMO -> NHIA (RD to confirm) */
  function regulatorFor(c) {
    if (planGroup(c.planType) === 'state') {
      const a = M.stateAgencies.find(function (x) { return x.id === c.stateScheme; }) ||
        M.stateAgencies.find(function (x) { return c.facility && x.state === c.facility.state; });
      if (a) return Object.assign({ kind: 'state' }, a);
      return { kind: 'state', id: 'state', name: 'your state health insurance agency', longName: 'State health insurance agency', phone: null, tel: null, email: '' };
    }
    return Object.assign({ kind: 'nhia' }, M.nhia);
  }

  /* ---------- Step 2: emergency check (keywords, English + Pidgin) ---------- */
  const EMERGENCY = ['unconscious', 'not breathing', "can't breathe", 'cannot breathe', 'no dey breathe', 'no fit breathe', 'heavy bleeding',
    'bleeding heavily', 'plenty blood', 'convulsion', 'seizure', 'accident', 'labour', 'labor', 'collapsed', 'faint', 'no dey wake', 'unresponsive', 'stroke', 'heart attack'];
  function emergencyCheck(text) { const t = (text || '').toLowerCase(); return EMERGENCY.some(function (k) { return t.includes(k); }); }

  /* ---------- Step 3: "understand" (Gemini in production) -> issues[] ---------- */
  function trigrams(s) { s = '  ' + s.toLowerCase() + ' '; const g = new Set(); for (let i = 0; i < s.length - 2; i++) g.add(s.slice(i, i + 3)); return g; }
  function similarity(a, b) { const A = trigrams(a), B = trigrams(b); let n = 0; A.forEach(function (x) { if (B.has(x)) n++; }); return n / (A.size + B.size - n); }
  const STOP = new Set(['the', 'drug', 'drugs', 'medicine', 'medicines', 'it', 'am', 'this', 'that', 'some', 'outside', 'one', 'una', 'from', 'pharmacy', 'before', 'there']);

  function findDrugs(t) {
    const found = [], unknown = [];
    M.drugs.forEach(function (d) { if (t.includes(d.name.toLowerCase().split(' ')[0])) found.push(d); });
    if (!found.length) {
      (t.match(/[a-z]{5,}/g) || []).forEach(function (w) {
        if (STOP.has(w)) return;
        let best = null, score = 0;
        M.drugs.forEach(function (d) { const s = similarity(w, d.name.split(' ')[0]); if (s > score) { score = s; best = d; } });
        if (best && score >= 0.4 && !found.includes(best)) found.push(best); // pg_trgm similarity >= 0.4 on the server
      });
    }
    const m = t.match(/buy\s+(?:the\s+|dis\s+|this\s+)?([a-z][a-z-]{3,})/);
    if (m && !STOP.has(m[1]) && !found.some(function (d) { return d.name.toLowerCase().startsWith(m[1]); })) unknown.push(m[1][0].toUpperCase() + m[1].slice(1));
    return { found, unknown };
  }

  function understand(text, hint) {
    const t = (text || '').toLowerCase();
    const has = function (re) { return re.test(t); };
    const language = /\b(dem|dey|wetin|abeg|make we|una|don|never|na|sabi|oga)\b/.test(t) ? 'pcm' : 'en';
    const drugs = findDrugs(t);
    const mentionsDrug = drugs.found.length || drugs.unknown.length || has(/\bdrugs?\b|medicine|tablet|injection/);
    const types = [];
    if (hint) types.push(hint);
    else {
      if (mentionsDrug && has(/out of stock|no stock|finish|not available|unavailable|no dey (for )?(pharmacy|store)|dem no get/)) types.push('drug_unavailable');
      else if (has(/buy .*(outside|pharmacy|chemist)|go buy|buy am|buy (the )?(drug|medicine)|drug.*outside|outside.*drug|prescri/) || (drugs.found.length && !has(/pay|cash/))) types.push('drug_refused');
      if (has(/\bpay\b|cash|money|deposit|naira|₦|\bbill\b/)) types.push('cash_demanded');
      if (has(/referr?al|\brefer\b|transfer/)) types.push('referral_delay');
      else if (has(/approv|authori[sz]|\bcode\b|waiting|wait for|dey wait|hmo never|no answer/)) types.push('auth_delay');
      if (!types.length) types.push('other');
    }
    const amt = t.match(/(?:₦|naira\s*)?\s?(\d{1,3}(?:,\d{3})+|\d{3,})/);
    const ago = t.match(/(\d+)\s*(min|mins|minutes|hour|hours|hr|hrs)\s*(ago|now)?/);
    const facts = types.map(function (type, i) {
      return {
        id: 'i' + (i + 1), type,
        drugs: type.indexOf('drug') === 0 || type === 'cash_demanded' ? drugs.found.map(function (d) { return d.name; }) : [],
        unknownDrugs: type.indexOf('drug') === 0 ? drugs.unknown : [],
        coPayHint: type === 'cash_demanded' && !!mentionsDrug,
        amountNaira: type === 'cash_demanded' && amt ? Number(amt[1].replace(/,/g, '')) : null,
        confidence: type === 'other' ? 0.4 : 0.85
      };
    });
    return {
      transcript: text, language, emergency: emergencyCheck(text), issues: facts,
      approvalAgoMinutes: ago ? Number(ago[1]) * (/h/.test(ago[2]) ? 60 : 1) : null
    };
  }

  /* ---------- Step 4: rules engine (server-only in production; no AI) ---------- */
  function rule(id) { return M.rules.find(function (r) { return r.id === id; }); }
  function decide(f, ctx) {
    const group = planGroup(ctx.planType);
    const isPolice = ctx.hmoId === 'h06';
    const facilityLevel = ctx.facility ? LEVEL[ctx.facility.level] : null;
    let d;
    // Plan type: NHIA package rules only apply to NHIA programmes. Private and state-scheme plans
    // get the universal rules (emergency, right to complain); everything else is "confirm with your HMO".
    if ((group === 'state' || group === 'private') && f.type !== 'other') {
      d = { variant: 'plan_other', verdict: 'confirm_with_hmo', ruleIds: ['R11'] };
    } else switch (f.type) {
      case 'drug_refused': {
        const drug = M.drugs.find(function (x) { return x.name === f.drugs[0]; });
        if (isPolice) d = { variant: 'drug_police', verdict: 'legit_charge', ruleIds: ['R05', 'R04'] };
        else if (f.unknownDrugs.length && !f.drugs.length) d = { variant: 'drug_unknown', verdict: 'confirm_with_hmo', ruleIds: ['R02'] };
        else if (drug && facilityLevel && LEVEL[drug.level] > facilityLevel) d = { variant: 'drug_referral', verdict: 'rule_applies', ruleIds: ['R14', 'R01'] }; // level-of-care gap
        else if (drug) d = { variant: 'drug_covered', verdict: 'likely_covered', ruleIds: ['R01'] };
        else d = { variant: 'drug_generic', verdict: 'rule_applies', ruleIds: ['R01', 'R02'] };
        break;
      }
      case 'drug_unavailable': d = { variant: 'drug_unavailable', verdict: 'confirm_with_hmo', ruleIds: [] }; break; // rule pending research
      case 'cash_demanded':
        if (isPolice && f.coPayHint) d = { variant: 'cash_police', verdict: 'legit_charge', ruleIds: ['R05', 'R04'] };
        else if (f.coPayHint) d = { variant: 'cash_copay', verdict: 'confirm_with_hmo', ruleIds: ['R06', 'R04'] }; // never "illegal"
        else d = { variant: 'cash_rule', verdict: 'rule_applies', ruleIds: ['R03', 'R04'] };
        break;
      case 'auth_delay': d = { variant: 'auth', verdict: 'rule_applies', ruleIds: ['R07'] }; break;
      case 'referral_delay': d = { variant: 'referral', verdict: 'rule_applies', ruleIds: ['R08', 'R07'] }; break;
      default: d = { variant: 'other', verdict: 'confirm_with_hmo', ruleIds: group === 'nhia' ? ['R12', 'R11'] : ['R11'] };
    }
    const lowConf = d.ruleIds.some(function (id) { const r = rule(id); return r && r.confidence === 'low'; });
    d.confirmWithHmo = d.verdict === 'confirm_with_hmo' || lowConf || group === 'unsure';
    d.timerEligible = APPROVAL.includes(f.type) && d.variant !== 'plan_other'; // timer only for approval issues
    return d;
  }

  /* ---------- Step 5: "write" (Gemini in production). Fixed EN + Pidgin templates the safety filter falls back to. ---------- */
  function partOfDay() { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; }
  function write(f, d, ctx) {
    const H = ctx.hmo ? ctx.hmo.name : 'my HMO';
    const drug = f.drugs[0] || f.unknownDrugs[0];
    const g = 'Good ' + partOfDay() + '.';
    const mine = ctx.hmo ? { en: 'My HMO is ' + H + '.', pcm: 'My HMO na ' + H + '.' } : { en: '', pcm: '' };
    const s = function (en, pcm) { return { en: (g + ' ' + mine.en + ' ' + en).replace(/\s+/g, ' ').trim(), pcm: (g + ' ' + mine.pcm + ' ' + pcm).replace(/\s+/g, ' ').trim() }; };
    const T = {
      drug_covered: [
        { en: drug + ' is on the NHIA list. The hospital should supply it.', pcm: drug + ' dey NHIA list. Na hospital suppose give am.' },
        s(drug + ' is on the NHIA medicines list, so it should be supplied here. Please request authorisation from ' + H + ' instead of sending me outside to buy it. Thank you.',
          drug + ' dey NHIA medicine list, so na here una suppose give am. Abeg collect authorisation from ' + H + ', no send me go buy am outside. Thank you.'),
        { en: 'Authorisation for ' + drug, pcm: 'Authorisation for ' + drug }],
      drug_referral: [
        { en: drug + ' is covered, but this facility may not be able to give it. Ask for a referral.', pcm: drug + ' dey covered, but this hospital fit no get am. Ask for referral.' },
        s(drug + ' is on the NHIA list but is given at a higher level facility. Please contact ' + H + ' for a referral to a facility that can give it. Thank you.',
          drug + ' dey NHIA list but na bigger hospital dey give am. Abeg call ' + H + ' make dem refer me go hospital wey fit give am. Thank you.'),
        { en: 'A referral to a facility that can give ' + drug, pcm: 'Referral go hospital wey fit give ' + drug }],
      drug_generic: [
        { en: 'If the drug is on the NHIA list, the hospital should supply it.', pcm: 'If the drug dey NHIA list, na hospital suppose give am.' },
        s('If this drug is on the NHIA medicines list, it should be supplied here. Please check, and request authorisation from ' + H + ' before I buy anything outside. Thank you.',
          'If this drug dey NHIA medicine list, na here una suppose give am. Abeg check am, and collect authorisation from ' + H + ' before I go buy anything outside. Thank you.'),
        { en: 'The drug name, and authorisation for it', pcm: 'The drug name, and authorisation for am' }],
      drug_police: [
        { en: 'Under your plan you pay only 10% of the drug cost.', pcm: 'For your plan, na only 10% of the drug money you go pay.' },
        s('I understand I pay a 10% co-payment for drugs. Please show me the 10% amount on an itemised bill and send the rest to ' + H + '. Thank you.',
          'I know say na 10% of drug money I go pay. Abeg show me the 10% for itemised bill, and send the rest to ' + H + '. Thank you.'),
        { en: 'Itemised bill showing your 10% share', pcm: 'Itemised bill wey show your 10%' }],
      drug_unknown: [
        { en: "This drug wasn't found on NHIA's online list, which has gaps. Ask your HMO to confirm before you pay.", pcm: 'We no see this drug for NHIA online list, and the list get gap. Ask your HMO make dem confirm before you pay.' },
        s('Please can you confirm with ' + H + ' whether ' + (drug || 'this drug') + ' is covered before I buy it outside? Thank you.',
          'Abeg confirm with ' + H + ' whether ' + (drug || 'this drug') + ' dey covered before I go buy am outside. Thank you.'),
        { en: 'Confirmation that the drug is covered', pcm: 'Confirm say the drug dey covered' }],
      drug_unavailable: [
        { en: 'If a covered drug is out of stock here, your HMO should tell you what happens next. Ask before you buy it outside.', pcm: 'If drug wey dey covered finish for here, your HMO suppose tell you wetin go happen. Ask before you buy am outside.' },
        s('The pharmacy says ' + (drug || 'the drug') + ' is out of stock. Please call ' + H + ' to ask how I can get it under my plan, and note the time you call. Thank you.',
          'Pharmacy talk say ' + (drug || 'the drug') + ' don finish. Abeg call ' + H + ' make dem talk how I go get am for my plan, and write the time wey you call. Thank you.'),
        { en: 'Where to get the drug under your plan', pcm: 'Where you go get the drug for your plan' }],
      cash_rule: [
        { en: "You don't have to pay cash for covered services. Here's what to say.", pcm: 'You no suppose pay cash for service wey dey covered. Talk am like this.' },
        s('This service is covered by my plan, so please bill ' + H + ' directly. If anything is outside my plan, please show me in writing. Thank you.',
          'My plan cover this service, so abeg bill ' + H + ' direct. If anything no dey my plan, abeg show me for paper. Thank you.'),
        { en: 'Bill sent to your HMO, not to you', pcm: 'Make dem send the bill to your HMO, no be you' }],
      cash_copay: [
        { en: "This may be a co-pay. Ask how much it is and what it's for.", pcm: 'This one fit be co-pay. Ask how much and wetin e be for.' },
        s('Before I pay, please tell me how much this charge is and what it is for. If it is a co-payment under my plan, please show it on an itemised bill. Thank you.',
          'Before I pay, abeg tell me how much this charge be and wetin e be for. If na co-pay for my plan, abeg show am for itemised bill. Thank you.'),
        { en: 'The amount and what it is for, on an itemised bill', pcm: 'How much and wetin e be for, for itemised bill' }],
      cash_police: [
        { en: 'Under your plan you pay only 10% of the drug cost. Ask to see it on the bill.', pcm: 'For your plan, na only 10% of drug money you go pay. Ask make dem show am for bill.' },
        s('I understand I pay a 10% co-payment for drugs. Please show me that amount on an itemised bill and send the rest to ' + H + '. Thank you.',
          'I know say na 10% of drug money I go pay. Abeg show me that amount for itemised bill, and send the rest to ' + H + '. Thank you.'),
        { en: 'Itemised bill showing your 10% share', pcm: 'Itemised bill wey show your 10%' }],
      auth: [
        { en: 'Your HMO must give the approval code within 1 hour.', pcm: 'Your HMO suppose give approval code inside 1 hour.' },
        s('Please request the authorisation code now. Under the NHIA Enrollee Charter they must respond within 1 hour. Please note the time you call. Thank you.',
          'Abeg request the authorisation code now. NHIA Enrollee Charter talk say dem must answer inside 1 hour. Abeg write the time wey you call. Thank you.'),
        { en: 'Authorisation code', pcm: 'Authorisation code' }],
      referral: [
        { en: 'Your HMO should approve the referral within 1 hour.', pcm: 'Your HMO suppose approve the referral inside 1 hour.' },
        s('Please request the referral code from ' + H + ' now. They should respond within 1 hour. Please note the time you call. Thank you.',
          'Abeg request referral code from ' + H + ' now. Dem suppose answer inside 1 hour. Abeg write the time wey you call. Thank you.'),
        { en: 'Referral code', pcm: 'Referral code' }],
      plan_other: [
        { en: "Your plan's own rules decide this. Confirm with your HMO, and you can still complain.", pcm: 'Na your plan rules go decide this one. Confirm with your HMO, and you fit still complain.' },
        s('Please call ' + H + ' to confirm what my plan covers for this, and note the time and the name of the person you speak to. Thank you.',
          'Abeg call ' + H + ' make dem confirm wetin my plan cover for this one, and write the time and the name of the person wey you talk to. Thank you.'),
        { en: 'Confirmation of what your plan covers', pcm: 'Confirm wetin your plan cover' }],
      other: [
        { en: "We don't have a rule for this yet. Call your HMO to confirm.", pcm: 'We never get rule for this one. Call your HMO make dem confirm.' },
        s('Please call ' + H + ' to confirm what my plan covers for this. Could you note the time and the name of the person you speak to? Thank you.',
          'Abeg call ' + H + ' make dem confirm wetin my plan cover for this one. Abeg write the time and the name of the person wey you talk to. Thank you.'),
        { en: 'Confirmation of what your plan covers', pcm: 'Confirm wetin your plan cover' }]
    };
    const x = T[d.variant] || T.other;
    return { headline: x[0], script: x[1], askFor: x[2] };
  }

  /* ---------- Step 6: safety filter (illustrative copy of the server check, EN + Pidgin word lists) ---------- */
  const UNSAFE = [/\b\d+\s?(mg|ml|mcg|tablets?|capsules?)\b/i, /\bnot covered\b/i, /\bno dey covered\b/i, /\b(diagnos|you have|take \d|drink am \d)/i];
  function safe(text, allowed) {
    const cited = text.match(/\bR\d{2}\b/g) || [];
    return !UNSAFE.some(function (re) { return re.test(text); }) && cited.every(function (id) { return allowed.includes(id); }) && text.split(/\s+/).length <= 70;
  }

  /* ---------- Build issues for a case (re-run when plan/HMO/facility change) ---------- */
  function buildIssue(f, ctx, emergency, first) {
    const d = decide(f, ctx);
    let w = write(f, d, ctx);
    if (!safe(w.script.en, d.ruleIds) || !safe(w.script.pcm, d.ruleIds)) w = write(f, { variant: 'other' }, ctx); // fixed template fallback
    let ids = d.ruleIds.slice();
    if (emergency && first && !ids.includes('R10')) ids = ['R10'].concat(ids);
    return {
      id: f.id, type: f.type, facts: f, verdict: d.verdict,
      headline: w.headline, script: w.script, askFor: w.askFor,
      citations: ids.map(function (id) { const r = rule(id); return { ruleId: id, title: r.title, url: r.sourceUrl }; }),
      confirmWithHmo: d.confirmWithHmo, timerEligible: d.timerEligible, timer: null
    };
  }
  function ctxOf(c) { return { planType: c.planType, hmoId: c.hmo && c.hmo.id, hmo: c.hmo, facility: c.facility }; }
  function rebuildIssues(c) {
    c.issues = c.issues.map(function (old, i) {
      const n = buildIssue(old.facts, ctxOf(c), c.emergency, i === 0);
      n.timer = old.timer; if (n.timer) n.timerEligible = true;
      return n;
    });
  }

  /* ---------- Persistence, lifecycle, timer ---------- */
  // Cases from the old single-verdict template have no issues[]; drop them.
  function all() { return CM.store.cases().filter(function (c) { return Array.isArray(c.issues); }); }
  function save(list) { CM.store.saveCases(list); }
  function hmoById(id) {
    const h = M.hmos.find(function (x) { return x.id === id; });
    return h ? { id: h.id, name: h.name, phone: h.phone, tel: h.phoneTel, complaintEmail: h.complaintEmail } : null;
  }
  function facilityOf(p) {
    const f = p.facilityId && M.facilities.find(function (x) { return x.id === p.facilityId; });
    if (f) return { id: f.id, name: f.name, level: f.level, state: f.state, lga: f.lga };
    return p.hospital ? { id: null, name: p.hospital, level: null, state: p.state || null, lga: p.lga || null } : null;
  }
  function event(type, extra) { return Object.assign({ id: uid('e'), type, at: now() }, extra || {}); }
  function timerIssue(c) { return c.issues.find(function (i) { return i.timer; }) || c.issues.find(function (i) { return i.timerEligible; }) || null; }
  function timerState(c, at) {
    const iss = timerIssue(c); const t = iss && iss.timer; if (!t) return null;
    const scale = t.scale || 1, total = t.minutes * 60000;
    const elapsed = ((at || Date.now() + api.serverOffset) - Date.parse(t.approvalRequestedAt)) * scale;
    return { issue: iss, timer: t, total, elapsed, remaining: total - elapsed, scale, deadlineAt: new Date(t.deadlineAt), approximate: !!t.approximate };
  }
  function refresh(c) {
    const s = timerState(c);
    if (s && !s.timer.stoppedAt && c.status === 'waiting_hmo' && s.remaining <= 0) {
      c.status = 'overdue';
      c.events.push(event('overdue', { at: s.deadlineAt.toISOString() }));
    }
    (c.complaints || []).forEach(function (cp) {
      if (cp.deliverAfter && !cp.deliveredAt && Date.now() >= cp.deliverAfter) {
        cp.deliveredAt = new Date(cp.deliverAfter).toISOString();
        c.events.push(event('delivered', { recipientName: cp.recipientName, at: cp.deliveredAt }));
      }
    });
    c.serverTime = now();
    return c;
  }
  function stopTimer(c) { const s = timerState(c); if (s && !s.timer.stoppedAt) s.timer.stoppedAt = now(); }
  function update(id, fn) {
    const list = all(); const i = list.findIndex(function (c) { return c.caseId === id; });
    if (i < 0) return null;
    fn(list[i]); refresh(list[i]); save(list);
    return list[i];
  }
  function fail(code) { const e = new Error(code); e.code = code; return Promise.reject(e); }
  function distanceKm(a, b) {
    const R = 6371, rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  const api = {
    serverOffset: 0, // client clock correction: the server owns deadline_at and sends serverTime
    emergencyCheck, timerState, timerIssue, planGroup, regulatorFor, rule,

    session() { return Promise.resolve({ ok: true }); },
    updateMe(profile) { CM.store.setProfile(profile); return wait(150).then(function () { return CM.store.profile(); }); },
    deleteMe() { CM.store.clearAll(); return wait(400).then(function () { return { deleted: true }; }); },

    /* POST /me/card-scan: image read in memory by Gemini and discarded; nothing saved until confirmed */
    cardScan(file) {
      return wait(1400).then(function () {
        const r = Object.assign({}, M.cardScanResult);
        const h = M.hmos.slice().sort(function (a, b) { return similarity(b.name, r.hmoName) - similarity(a.name, r.hmoName); })[0];
        const f = M.facilities.find(function (x) { return similarity(x.name, r.primaryFacility) > 0.5; });
        return Object.assign(r, { hmoId: h ? h.id : null, facilityId: f ? f.id : null, planType: /formal/i.test(r.planName) ? 'nhia_formal' : 'unsure', expired: Date.parse(r.expiry) < Date.now() });
      });
    },
    checkEnrolleeId(hmoId, id) {
      const h = M.hmos.find(function (x) { return x.id === hmoId; });
      if (!h || !h.idFormat || !id) return { ok: true };
      return h.idFormat.test(id.trim().toUpperCase()) ? { ok: true } : { ok: false, example: h.idExample };
    },

    hmos(q) {
      q = (q || '').trim().toLowerCase();
      return wait(80).then(function () { return M.hmos.filter(function (h) { return !q || h.name.toLowerCase().includes(q) || h.nhiaCode.toLowerCase().includes(q); }); });
    },
    hmo(id) { return M.hmos.find(function (h) { return h.id === id; }) || null; },
    hmoById,
    drugs(q) { q = (q || '').toLowerCase(); return wait(80).then(function () { return M.drugs.filter(function (d) { return d.name.toLowerCase().includes(q); }); }); },
    rules() { return wait(250).then(function () { return M.rules.slice(); }); },
    states() { return Object.keys(M.states); },
    lgas(state) { return M.states[state] || []; },
    stateAgencies() { return M.stateAgencies.slice(); },
    facility(id) { return M.facilities.find(function (f) { return f.id === id; }) || null; },
    facilities(o) {
      const q = (o.q || '').trim().toLowerCase();
      return wait(60).then(function () {
        return M.facilities.filter(function (f) {
          return (!o.state || f.state === o.state) && (!o.lga || f.lga === o.lga) && (!q || f.name.toLowerCase().includes(q));
        });
      });
    },
    nearestFacilities(pos) {
      return wait(200).then(function () {
        return M.facilities.map(function (f) { return Object.assign({ km: distanceKm(pos, f) }, f); })
          .sort(function (a, b) { return a.km - b.km; }).slice(0, 10);
      });
    },

    /* POST /cases and /cases/voice */
    createCase(input) {
      const s = CM.store.settings();
      if (s.simError) { CM.store.setSettings({ simError: false }); return wait(1500).then(function () { return fail('check_failed'); }); }
      if (!navigator.onLine) return wait(300).then(function () { return fail('offline'); });
      const p = CM.store.profile();
      const text = String(input.text || '').slice(0, 1000);
      return wait(input.audio ? 1400 : 900).then(function () {
        const u = understand(text, input.issueHint);
        const c = {
          caseId: uid('c'), createdAt: now(), source: input.audio ? 'voice' : input.issueHint ? 'chip' : 'text',
          message: text, transcript: u.transcript, language: u.language, emergency: u.emergency || emergencyCheck(text),
          patientRelation: p.patientRelation || 'me', planType: p.planType || 'unsure', stateScheme: p.stateScheme || null,
          verification: p.hmoId ? (p.verification || 'self_reported') : null,
          hmo: hmoById(p.hmoId), facility: facilityOf(p), approvalAgoMinutes: u.approvalAgoMinutes,
          issues: [], status: 'open', events: [], complaints: [], evidence: [], paidNaira: 0, refundNaira: 0, flags: {}
        };
        c.issues = u.issues.map(function (f, i) { return buildIssue(f, ctxOf(c), c.emergency, i === 0); });
        c.amountNaira = (u.issues.find(function (f) { return f.amountNaira; }) || {}).amountNaira || null;
        c.events.push(event('message', { note: text }));
        if (c.emergency) c.events.push(event('emergency'));
        c.events.push(event('verdict', { note: c.issues.map(function (i) { return i.verdict; }).join(',') }));
        refresh(c);
        const list = all(); list.unshift(c); save(list);
        CM.store.setLastResult(c);
        return c;
      });
    },

    cases() { const list = all().map(refresh); save(list); return wait(200).then(function () { return list; }); },
    getCase(id) { const list = all(); const c = list.find(function (x) { return x.caseId === id; }); if (c) { refresh(c); save(list); } return Promise.resolve(c || null); },
    getCaseSync(id) { return all().find(function (x) { return x.caseId === id; }) || null; },
    removeCase(id) { save(all().filter(function (c) { return c.caseId !== id; })); return Promise.resolve(true); },

    /* Start the 1-hour clock from when the HOSPITAL asked the HMO (not when the app opened).
       agoMinutes: 0 just now / 30 / 61 over an hour / null don't know (start now, approximate). */
    startTimer(id, o) {
      o = o || {};
      const scale = CM.store.settings().demoMode ? 60 : 1;
      return Promise.resolve(update(id, function (c) {
        const iss = c.issues.find(function (i) { return i.timerEligible; });
        if (!iss || iss.timer) return;
        const ago = o.agoMinutes == null ? 0 : o.agoMinutes;
        const req = Date.now() - (ago * 60000) / scale;
        iss.timer = { approvalRequestedAt: new Date(req).toISOString(), deadlineAt: new Date(req + (TIMER_MIN * 60000) / scale).toISOString(), approximate: o.agoMinutes == null || !!o.approximate, minutes: TIMER_MIN, scale };
        c.status = 'waiting_hmo';
        c.events.push(event('timer_started', { approximate: iss.timer.approximate, agoMinutes: o.agoMinutes }));
      }));
    },
    addEvent(id, ev) {
      return Promise.resolve(update(id, function (c) {
        c.events.push(event(ev.type, ev));
        if (ev.type === 'paid') c.paidNaira += Number(ev.amount || 0);
        if (ev.type === 'code_received') { stopTimer(c); if (['waiting_hmo', 'overdue'].includes(c.status)) c.status = 'open'; }
        if (ev.type === 'hmo_replied') {
          const last = c.complaints[c.complaints.length - 1]; if (last && !last.repliedAt) last.repliedAt = now();
          if (ev.enrollee === 'confirmed') c.verification = 'hmo_confirmed';
          if (ev.enrollee === 'not_enrollee') c.flags.notEnrollee = true;
        }
      }));
    },
    /* Lifecycle: open -> waiting_hmo -> overdue -> complaint_hmo -> complaint_regulator -> resolved | refunded */
    updateCase(id, patch) {
      return Promise.resolve(update(id, function (c) {
        if (patch.status === 'resolved' || patch.status === 'refunded') {
          c.status = patch.status; c.resolvedAt = now(); stopTimer(c);
          if (patch.status === 'refunded') c.refundNaira = Number(patch.refundNaira || 0);
          c.events.push(event(patch.status, { amount: c.refundNaira || undefined }));
        }
      }));
    },
    /* HMO, plan, patient and hospital can be changed per case; verdicts are re-run */
    updateCaseDetails(id, d) {
      return Promise.resolve(update(id, function (c) {
        if ('hmoId' in d) { c.hmo = hmoById(d.hmoId); c.verification = c.hmo ? 'self_reported' : null; }
        if ('planType' in d) c.planType = d.planType;
        if ('stateScheme' in d) c.stateScheme = d.stateScheme;
        if ('patientRelation' in d) c.patientRelation = d.patientRelation;
        if ('facilityId' in d) c.facility = facilityOf({ facilityId: d.facilityId });
        rebuildIssues(c);
        c.events.push(event('details_changed'));
      }));
    },
    /* Mode A (user_sent): the user sends it and taps "I've sent it".
       Mode B (coverme_sent): CoverMe emails it; refused without consent and an enrollee ID. */
    createComplaint(id, d) {
      if (d.mode === 'coverme_sent' && (!d.consent || !d.enrolleeId)) return fail('consent_required');
      return wait(d.mode === 'coverme_sent' ? 900 : 300).then(function () {
        const c = update(id, function (c) {
          const reg = regulatorFor(c);
          c.complaints.push({ id: uid('cp'), recipient: d.recipient, recipientName: d.recipient === 'hmo' ? (c.hmo ? c.hmo.name : 'HMO') : reg.name,
            mode: d.mode || 'user_sent', channel: d.channel || 'manual', consentAt: d.consent ? now() : null, sentAt: now(), deliveredAt: null, repliedAt: null,
            // Mode B: the email provider's "delivered" webhook arrives a moment later (simulated on the next read)
            deliverAfter: d.mode === 'coverme_sent' ? Date.now() + 2500 : null });
          c.status = d.recipient === 'hmo' ? 'complaint_hmo' : 'complaint_regulator';
          stopTimer(c);
          c.events.push(event('escalated', { recipient: d.recipient, recipientName: c.complaints[c.complaints.length - 1].recipientName, mode: d.mode || 'user_sent' }));
        });
        return c;
      });
    },
    /* Follow-up nudges (our suggestion, not a rule): 24 h "Did the HMO reply?", 48 h "Escalate?";
       regulator stage reminders at day 10 and day 25 (NHIA's reported 10-25 day window). */
    nudge(c) {
      const cp = c.complaints[c.complaints.length - 1];
      if (!cp || cp.repliedAt || ['resolved', 'refunded'].includes(c.status)) return null;
      const speed = CM.store.settings().demoMode ? 60 : 1; // demo: 1 minute = 1 hour
      const hours = (Date.now() - Date.parse(cp.sentAt)) * speed / 3600000;
      if (cp.recipient === 'hmo') return hours >= 48 ? { kind: 'escalate', hours } : hours >= 24 ? { kind: 'reply_check', hours } : null;
      const days = hours / 24;
      return days >= 25 ? { kind: 'regulator_25', days } : days >= 10 ? { kind: 'regulator_10', days } : null;
    },
    addEvidence(id, ev) {
      return Promise.resolve(update(id, function (c) {
        c.evidence.push({ id: uid('ev'), kind: ev.kind, dataUrl: ev.dataUrl, at: now() });
        c.events.push(event('evidence', { kind: ev.kind }));
      }));
    },
    removeEvidence(id, evId) { return Promise.resolve(update(id, function (c) { c.evidence = c.evidence.filter(function (e) { return e.id !== evId; }); })); },
    subscribePush() { if (!('Notification' in window)) return Promise.resolve('unsupported'); return Notification.requestPermission(); },

    /* Demo mode: the 90-second demo line, two issues, approval asked 50 minutes ago, so overdue happens on stage */
    seedDemoCase() {
      const p = CM.store.profile();
      if (!p.hmoId) CM.store.setProfile({ hmoId: 'h03', enrolleeId: 'RHL/2048/7731', verification: 'card_scanned', planType: 'nhia_formal', state: 'Lagos', lga: 'Lagos Island', facilityId: 'f03', hospital: 'General Hospital, Lagos Island', patientRelation: 'child' });
      CM.store.setSettings({ demoMode: true });
      return api.createCase({ text: 'Dem say make we buy the drug outside, and the referral never approve.' }).then(function (c) {
        return api.startTimer(c.caseId, { agoMinutes: 50 }).then(function () {
          return update(c.caseId, function (x) { x.source = 'voice'; });
        });
      });
    }
  };
  return api;
})();
