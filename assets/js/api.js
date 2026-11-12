/* CoverMe — MOCK API.
   Mirrors the REST contract in the build plan (/api/v1). Every method returns a
   Promise shaped like the real response, so wiring the backend means replacing
   the body of each method with a fetch() call — screens don't change.

     POST /session            -> api.session()
     PATCH /me                -> api.updateMe(profile)
     DELETE /me               -> api.deleteMe()
     GET /hmos?q=             -> api.hmos(q)
     GET /drugs?q=            -> api.drugs(q)
     GET /rules               -> api.rules()
     POST /cases              -> api.createCase({ text })
     POST /cases/voice        -> api.createCase({ audio, durationSec })
     GET /cases, /cases/:id   -> api.cases(), api.getCase(id)
     POST /cases/:id/events   -> api.addEvent(id, event)
     POST /cases/:id/complaint-> api.createComplaint(id, details)
     PATCH /cases/:id         -> api.updateCase(id, patch)
     POST /push/subscribe     -> api.subscribePush()

   The verdict decision below imitates the server's rules engine so the template
   behaves realistically. In production it lives ONLY on the server: the AI reads
   and writes, the rules engine decides. */
window.CM = window.CM || {};
CM.api = (function () {
  const M = CM.mock;
  const wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  const uid = function (p) { return p + '_' + Math.random().toString(36).slice(2, 8); };
  const now = function () { return new Date().toISOString(); };
  const TIMER_MIN = 60;

  /* ---- Step 2: emergency check (keywords, English + Pidgin) ---- */
  const EMERGENCY = ['unconscious', 'not breathing', "can't breathe", 'cannot breathe', 'no dey breathe', 'no fit breathe', 'heavy bleeding',
    'bleeding heavily', 'plenty blood', 'convulsion', 'seizure', 'accident', 'labour', 'labor', 'in labour', 'collapsed', 'faint', 'no dey wake', 'unresponsive', 'stroke', 'heart attack'];
  function emergencyCheck(text) {
    const t = (text || '').toLowerCase();
    return EMERGENCY.some(function (k) { return t.includes(k); });
  }

  /* ---- Step 3: "understand" (Gemini in production; heuristics here) ---- */
  function trigrams(s) { s = '  ' + s.toLowerCase() + ' '; const g = new Set(); for (let i = 0; i < s.length - 2; i++) g.add(s.slice(i, i + 3)); return g; }
  function similarity(a, b) { const A = trigrams(a), B = trigrams(b); let n = 0; A.forEach(function (x) { if (B.has(x)) n++; }); return n / (A.size + B.size - n); }
  const STOP = new Set(['the', 'drug', 'drugs', 'medicine', 'medicines', 'it', 'am', 'this', 'that', 'some', 'outside', 'one', 'una', 'from', 'pharmacy']);

  function understand(text, hint) {
    const t = (text || '').toLowerCase();
    const language = /\b(dem|dey|wetin|abeg|make we|una|don|never|na|sabi|oga)\b/.test(t) ? 'pcm' : 'en';
    const has = function (re) { return re.test(t); };
    const isReferral = has(/referr?al|refer\b|transfer/);
    const isAuth = has(/approv|authori[sz]|\bcode\b|waiting|wait for|dey wait|hmo never|no answer/);
    const isDrug = has(/buy .*(outside|pharmacy|chemist)|buy (the )?drug|go buy|buy am|drug.*outside|outside.*drug|prescri/);
    const isCash = has(/pay|cash|money|deposit|naira|₦|\bn\d|bill/);
    let issueType = hint || (isReferral ? 'referral_delay' : isAuth ? 'auth_delay' : isDrug ? 'drug_not_covered' : isCash ? 'cash_demanded' : 'other');

    // Drugs: exact contains, then fuzzy (pg_trgm similarity >= 0.4 on the server)
    const found = [], unknown = [];
    M.drugs.forEach(function (d) { if (t.includes(d.name.toLowerCase().split(' ')[0])) found.push(d); });
    if (!found.length) {
      (t.match(/[a-z]{5,}/g) || []).forEach(function (w) {
        if (STOP.has(w)) return;
        let best = null, score = 0;
        M.drugs.forEach(function (d) { const s = similarity(w, d.name.split(' ')[0]); if (s > score) { score = s; best = d; } });
        if (best && score >= 0.4 && !found.includes(best)) found.push(best);
      });
    }
    const m = t.match(/buy\s+(?:the\s+|dis\s+|this\s+)?([a-z][a-z-]{3,})/);
    if (m && !STOP.has(m[1]) && !found.some(function (d) { return d.name.toLowerCase().startsWith(m[1]); })) unknown.push(m[1][0].toUpperCase() + m[1].slice(1));
    if (found.length || unknown.length) { if (!hint && issueType === 'other') issueType = 'drug_not_covered'; }

    const amt = t.match(/(?:₦|n|naira\s*)?\s?(\d{1,3}(?:,\d{3})+|\d{3,})/);
    return {
      transcript: text, language, issueType,
      drugs: found.map(function (d) { return d.name; }), unknownDrugs: unknown,
      services: [], amountNaira: amt ? Number(amt[1].replace(/,/g, '')) : null,
      emergency: emergencyCheck(text), confidence: issueType === 'other' ? 0.4 : 0.85
    };
  }

  /* ---- Step 4: rules engine (server-only in production; no AI) ---- */
  function rule(id) { return M.rules.find(function (r) { return r.id === id; }); }
  function decide(facts, profile) {
    const hmoId = profile.hmoId;
    let verdict = 'confirm_with_hmo', ruleIds = [], timerMinutes = null;
    switch (facts.issueType) {
      case 'drug_not_covered':
        if (hmoId === 'h06') { verdict = 'legit_charge'; ruleIds = ['R05', 'R04']; }
        else if (facts.unknownDrugs.length && !facts.drugs.length) { verdict = 'confirm_with_hmo'; ruleIds = ['R02']; }
        else if (facts.drugs.length) { verdict = 'likely_covered'; ruleIds = ['R01']; timerMinutes = TIMER_MIN; }
        else { verdict = 'rule_applies'; ruleIds = ['R01', 'R02']; timerMinutes = TIMER_MIN; }
        break;
      case 'cash_demanded': verdict = 'rule_applies'; ruleIds = ['R03', 'R04']; break;
      case 'auth_delay': verdict = 'rule_applies'; ruleIds = ['R07']; timerMinutes = TIMER_MIN; break;
      case 'referral_delay': verdict = 'rule_applies'; ruleIds = ['R08', 'R07']; timerMinutes = TIMER_MIN; break;
      default: verdict = 'confirm_with_hmo'; ruleIds = ['R12', 'R11'];
    }
    if (facts.emergency) { ruleIds = ['R10'].concat(ruleIds.filter(function (r) { return r !== 'R10'; })); }
    const lowConf = ruleIds.some(function (id) { const r = rule(id); return r && r.confidence === 'low'; });
    return { verdict, ruleIds, timerMinutes, confirmWithHmo: verdict === 'confirm_with_hmo' || lowConf };
  }

  /* ---- Step 5: "write" (Gemini in production). These are the fixed
     templates the safety filter falls back to, in EN + Pidgin. ---- */
  function partOfDay() { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; }
  function write(facts, d, hmo) {
    const H = hmo.name, drug = facts.drugs[0] || facts.unknownDrugs[0];
    const g = 'Good ' + partOfDay() + '.';
    const mine = { en: 'My HMO is ' + H + '.', pcm: 'My HMO na ' + H + '.' };
    let headline, script, askFor;
    const k = facts.issueType + ':' + d.verdict;
    if (facts.emergency) {
      headline = { en: 'Get treatment now. The HMO can be sorted out later.', pcm: 'Collect treatment now. HMO matter fit wait.' };
      script = { en: 'This is an emergency. Please treat the patient now. ' + mine.en + ' Please contact them for authorisation once the patient is stable.', pcm: 'This na emergency. Abeg treat the patient now. ' + mine.pcm + ' Abeg call dem for authorisation when the patient don stable.' };
      askFor = { en: 'Treatment now, authorisation later', pcm: 'Treatment now, approval later' };
    } else if (k === 'drug_not_covered:likely_covered') {
      headline = { en: drug + ' is on the NHIA list. The hospital should supply it.', pcm: drug + ' dey NHIA list. Na hospital suppose give am.' };
      script = { en: g + ' ' + mine.en + ' ' + drug + ' is on the NHIA medicines list, so it should be supplied here. Please request authorisation from ' + H + ' instead of sending me outside to buy it. Thank you.', pcm: g + ' ' + mine.pcm + ' ' + drug + ' dey NHIA medicine list, so na here una suppose give am. Abeg collect authorisation from ' + H + ', no send me go buy am outside. Thank you.' };
      askFor = { en: 'Authorisation for ' + drug, pcm: 'Authorisation for ' + drug };
    } else if (k === 'drug_not_covered:rule_applies') {
      headline = { en: 'If the drug is on the NHIA list, the hospital should supply it.', pcm: 'If the drug dey NHIA list, na hospital suppose give am.' };
      script = { en: g + ' ' + mine.en + ' If this drug is on the NHIA medicines list, it should be supplied here. Please check, and request authorisation from ' + H + ' before I buy anything outside. Thank you.', pcm: g + ' ' + mine.pcm + ' If this drug dey NHIA medicine list, na here una suppose give am. Abeg check am, and collect authorisation from ' + H + ' before I go buy anything outside. Thank you.' };
      askFor = { en: 'The drug name, and authorisation for it', pcm: 'The drug name, and authorisation for am' };
    } else if (k === 'drug_not_covered:legit_charge') {
      headline = { en: 'Under your plan you pay only 10% of the drug cost.', pcm: 'For your plan, na only 10% of the drug money you go pay.' };
      script = { en: g + ' ' + mine.en + ' I understand I pay a 10% co-payment for drugs. Please show me the 10% amount on an itemised bill and send the rest to ' + H + '. Thank you.', pcm: g + ' ' + mine.pcm + ' I know say na 10% of drug money I go pay. Abeg show me the 10% for itemised bill, and send the rest to ' + H + '. Thank you.' };
      askFor = { en: 'Itemised bill showing your 10% share', pcm: 'Itemised bill wey show your 10%' };
    } else if (facts.issueType === 'drug_not_covered') {
      headline = { en: "We couldn't find " + (drug || 'this drug') + ' on the NHIA list. Confirm with your HMO before you pay.', pcm: 'We no see ' + (drug || 'this drug') + ' for NHIA list. Confirm with your HMO before you pay.' };
      script = { en: g + ' ' + mine.en + ' Before I pay, please call ' + H + ' to confirm whether ' + (drug || 'this drug') + ' is covered under my plan. Thank you.', pcm: g + ' ' + mine.pcm + ' Before I pay, abeg call ' + H + ' make dem confirm whether ' + (drug || 'this drug') + ' dey covered for my plan. Thank you.' };
      askFor = { en: 'Confirmation that ' + (drug || 'the drug') + ' is covered', pcm: 'Confirm say ' + (drug || 'the drug') + ' dey covered' };
    } else if (facts.issueType === 'cash_demanded') {
      headline = { en: "You don't have to pay cash for covered services. Here's what to say.", pcm: 'You no suppose pay cash for service wey dey covered. Talk am like this.' };
      script = { en: g + ' ' + mine.en + ' This service is covered by my plan, so please bill ' + H + ' directly. If anything is outside my plan, please show me in writing. Thank you.', pcm: g + ' ' + mine.pcm + ' My plan cover this service, so abeg bill ' + H + ' direct. If anything no dey covered, abeg show me for paper. Thank you.' };
      askFor = { en: 'Bill sent to your HMO, not to you', pcm: 'Make dem send the bill to your HMO, no be you' };
    } else if (facts.issueType === 'auth_delay') {
      headline = { en: 'Your HMO must give the approval code within 1 hour.', pcm: 'Your HMO suppose give approval code inside 1 hour.' };
      script = { en: g + ' ' + mine.en + ' Please request the authorisation code now. Under the NHIA Enrollee Charter they must respond within 1 hour. Please note the time you call. Thank you.', pcm: g + ' ' + mine.pcm + ' Abeg request the authorisation code now. NHIA Enrollee Charter talk say dem must answer inside 1 hour. Abeg write the time wey you call. Thank you.' };
      askFor = { en: 'Authorisation code', pcm: 'Authorisation code' };
    } else if (facts.issueType === 'referral_delay') {
      headline = { en: 'Your HMO should approve the referral within 1 hour.', pcm: 'Your HMO suppose approve the referral inside 1 hour.' };
      script = { en: g + ' ' + mine.en + ' Please request the referral code from ' + H + ' now. They should respond within 1 hour. Please note the time you call. Thank you.', pcm: g + ' ' + mine.pcm + ' Abeg request referral code from ' + H + ' now. Dem suppose answer inside 1 hour. Abeg write the time wey you call. Thank you.' };
      askFor = { en: 'Referral code', pcm: 'Referral code' };
    } else {
      headline = { en: "We don't have a rule for this yet. Call your HMO to confirm.", pcm: 'We never get rule for this one. Call your HMO make dem confirm.' };
      script = { en: g + ' ' + mine.en + ' Please call them to confirm what my plan covers for this. Could you note the time and the name of the person you speak to? Thank you.', pcm: g + ' ' + mine.pcm + ' Abeg call dem make dem confirm wetin my plan cover for this one. Abeg write the time and the name of the person wey you talk to. Thank you.' };
      askFor = { en: 'Confirmation of what your plan covers', pcm: 'Confirm wetin your plan cover' };
    }
    return { headline, script, askFor };
  }

  /* ---- Step 6: safety filter (illustrative copy of the server check) ---- */
  const UNSAFE = [/\b\d+\s?(mg|ml|mcg|tablets?|capsules?)\b/i, /\bnot covered\b/i, /\b(diagnos|you have|take \d)/i];
  function safetyFilter(text, allowedRuleIds) {
    const cited = (text.match(/\bR\d{2}\b/g) || []);
    return !UNSAFE.some(function (re) { return re.test(text); }) && cited.every(function (id) { return allowedRuleIds.includes(id); }) && text.split(/\s+/).length <= 70;
  }

  /* ---- Case persistence + status ---- */
  function all() { return CM.store.cases(); }
  function save(list) { CM.store.saveCases(list); }
  function hmoFor(profile) {
    const h = M.hmos.find(function (x) { return x.id === profile.hmoId; });
    return h ? { id: h.id, name: h.name, phone: h.phone, tel: h.phoneTel, email: h.email } : { id: null, name: 'your HMO', phone: null, tel: null };
  }
  function event(type, extra) { return Object.assign({ id: uid('e'), type, at: now() }, extra || {}); }
  function timerState(c, at) {
    if (!c.timer) return null;
    const scale = c.timer.scale || 1;
    const total = c.timer.minutes * 60000;
    const elapsed = ((at || Date.now()) - Date.parse(c.timer.startedAt)) * scale;
    return { total, elapsed, remaining: total - elapsed, scale, deadlineAt: new Date(Date.parse(c.timer.startedAt) + total / scale) };
  }
  function refresh(c) {
    if (c.timer && !c.timer.stoppedAt && c.status === 'waiting_hmo' && timerState(c).remaining <= 0) {
      c.status = 'overdue';
      c.events.push(Object.assign(event('overdue'), { at: timerState(c).deadlineAt.toISOString() }));
    }
    return c;
  }
  function update(id, fn) {
    const list = all(); const i = list.findIndex(function (c) { return c.caseId === id; });
    if (i < 0) return null;
    fn(list[i]); refresh(list[i]); save(list);
    return list[i];
  }

  function fail(code) { const e = new Error(code); e.code = code; return Promise.reject(e); }

  const api = {
    emergencyCheck, timerState,

    session() { return Promise.resolve({ ok: true }); },
    updateMe(profile) { CM.store.setProfile(profile); return wait(150).then(function () { return CM.store.profile(); }); },
    deleteMe() { CM.store.clearAll(); return wait(400).then(function () { return { deleted: true }; }); },

    hmos(q) {
      q = (q || '').trim().toLowerCase();
      const list = M.hmos.filter(function (h) { return !q || h.name.toLowerCase().includes(q) || h.nhiaCode.toLowerCase().includes(q); });
      return wait(80).then(function () { return list; });
    },
    hmo(id) { return M.hmos.find(function (h) { return h.id === id; }) || null; },
    drugs(q) { q = (q || '').toLowerCase(); return wait(80).then(function () { return M.drugs.filter(function (d) { return d.name.toLowerCase().includes(q); }); }); },
    rules() { return wait(250).then(function () { return M.rules.slice(); }); },
    rule,

    /* POST /cases and /cases/voice. Returns the shared verdict shape (+ local fields). */
    createCase(input) {
      const s = CM.store.settings();
      if (s.simError) { CM.store.setSettings({ simError: false }); return wait(1500).then(function () { return fail('check_failed'); }); }
      if (!navigator.onLine) return wait(300).then(function () { return fail('offline'); });
      const profile = CM.store.profile();
      const text = String(input.text || '').slice(0, 1000);
      return wait(input.audio ? 1400 : 900).then(function () {
        const facts = understand(text, input.issueHint);
        facts.emergency = facts.emergency || emergencyCheck(text);
        const d = decide(facts, profile);
        const hmo = hmoFor(profile);
        let w = write(facts, d, hmo);
        if (!safetyFilter(w.script.en, d.ruleIds)) w = write(Object.assign({}, facts, { issueType: 'other' }), d, hmo); // template fallback
        const c = {
          caseId: uid('c'), createdAt: now(), status: 'open', source: input.audio ? 'voice' : input.issueHint ? 'chip' : 'text',
          message: text, transcript: facts.transcript, language: facts.language,
          emergency: facts.emergency, issueType: facts.issueType, verdict: d.verdict,
          headline: w.headline, script: w.script, askFor: w.askFor,
          citations: d.ruleIds.map(function (id) { const r = rule(id); return { ruleId: id, title: r.title, url: r.sourceUrl }; }),
          confirmWithHmo: d.confirmWithHmo, hmo, hospital: profile.hospital || '', planType: profile.planType,
          timerMinutes: d.timerMinutes, timer: null, amountNaira: facts.amountNaira,
          events: [], complaints: [], paidNaira: 0, refundNaira: 0
        };
        c.events.push(event('message', { note: text }));
        if (c.emergency) c.events.push(event('emergency'));
        c.events.push(event('verdict', { note: c.verdict }));
        const list = all(); list.unshift(c); save(list);
        CM.store.setLastResult(c);
        return wait(500).then(function () { return c; });
      });
    },

    cases() { const list = all().map(refresh); save(list); return wait(200).then(function () { return list; }); },
    getCase(id) {
      const list = all(); const c = list.find(function (x) { return x.caseId === id; });
      if (c) { refresh(c); save(list); }
      return Promise.resolve(c || null);
    },
    getCaseSync(id) { return all().find(function (x) { return x.caseId === id; }) || null; },
    removeCase(id) { save(all().filter(function (c) { return c.caseId !== id; })); return Promise.resolve(true); },

    startTimer(id) {
      const scale = CM.store.settings().demoMode ? 60 : 1;
      return Promise.resolve(update(id, function (c) {
        if (c.timer) return;
        c.timer = { startedAt: now(), minutes: c.timerMinutes || TIMER_MIN, scale };
        c.timer.deadlineAt = timerState(c).deadlineAt.toISOString();
        c.status = 'waiting_hmo';
        c.events.push(event('timer_started'));
      }));
    },
    addEvent(id, ev) {
      return Promise.resolve(update(id, function (c) {
        const e = event(ev.type, ev);
        c.events.push(e);
        if (ev.type === 'paid') c.paidNaira += Number(ev.amount || 0);
        if (ev.type === 'code_received' && c.timer) { c.timer.stoppedAt = now(); if (c.status === 'waiting_hmo' || c.status === 'overdue') c.status = 'open'; }
      }));
    },
    updateCase(id, patch) {
      return Promise.resolve(update(id, function (c) {
        if (patch.status === 'resolved') { c.status = 'resolved'; c.resolvedAt = now(); c.events.push(event('resolved')); if (c.timer) c.timer.stoppedAt = c.timer.stoppedAt || now(); }
        if (patch.status === 'refunded') { c.status = 'refunded'; c.refundNaira = Number(patch.refundNaira || 0); c.resolvedAt = now(); c.events.push(event('refunded', { amount: c.refundNaira })); if (c.timer) c.timer.stoppedAt = c.timer.stoppedAt || now(); }
      }));
    },
    createComplaint(id, details) {
      return wait(300).then(function () {
        return update(id, function (c) {
          c.complaints.push({ id: uid('cp'), recipient: details.recipient, sentAt: now(), channel: details.channel });
          c.status = 'escalated';
          if (c.timer) c.timer.stoppedAt = c.timer.stoppedAt || now();
          c.events.push(event('escalated', { recipient: details.recipient }));
        });
      });
    },
    subscribePush() {
      if (!('Notification' in window)) return Promise.resolve('unsupported');
      return Notification.requestPermission();
    },

    /* Demo mode: a ready case whose timer is 50 minutes in, so overdue happens on stage */
    seedDemoCase() {
      const profile = CM.store.profile();
      if (!profile.hmoId) CM.store.setProfile({ hmoId: 'h03', planType: 'nhia', hospital: profile.hospital || 'General Hospital, Ikeja' });
      CM.store.setSettings({ demoMode: true });
      return api.createCase({ text: 'Dem say make we buy the drug outside, and the referral never approve.' }).then(function (c) {
        return update(c.caseId, function (x) {
          x.source = 'voice';
          x.timer = { startedAt: new Date(Date.now() - 50 * 1000).toISOString(), minutes: 60, scale: 60 };
          x.timer.deadlineAt = timerState(x).deadlineAt.toISOString();
          x.status = 'waiting_hmo';
          x.events.push(event('timer_started', { at: x.timer.startedAt }));
        });
      });
    }
  };
  return api;
})();
