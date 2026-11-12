/* Screen 2 — Setup (under 2 minutes, never blocks someone who needs help now):
   1 who it's for -> 2 insurance (scan the card, or pick HMO + enrollee ID) -> 3 plan type -> 4 hospital.
   "Skip for now" works from step 2. ?edit=1 opens it from Settings / Home and returns there.
   Template: the card scan and facility search are mocked in api.js. */
(function () {
  if (!CM.boot()) return;
  const editing = CM.qs('edit') === '1';
  const p = CM.store.profile();
  const draft = {
    patientRelation: p.patientRelation, hmoId: p.hmoId, enrolleeId: p.enrolleeId || '', memberName: p.memberName || '',
    cardExpiry: p.cardExpiry || null, verification: p.verification || null, planType: p.planType, stateScheme: p.stateScheme,
    state: p.state || 'Lagos', lga: p.lga || '', facilityId: p.facilityId || null, hospital: p.hospital || ''
  };
  let step = 1, insMode = draft.hmoId ? (draft.verification === 'card_scanned' ? 'confirm' : 'type') : 'choose';
  const cont = CM.$('#continue');
  const $ = CM.$, esc = CM.esc;

  /* ---------- Step 1: who is this for? ---------- */
  function syncWho() {
    const fam = draft.patientRelation && draft.patientRelation !== 'me';
    CM.$$('#who [data-who]').forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.who === (draft.patientRelation ? (fam ? 'family' : 'me') : ''))); });
    $('#relation').hidden = !fam && draft.patientRelation !== 'family';
    CM.$$('#relation [data-rel]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.rel === draft.patientRelation)); });
  }
  CM.$$('#who [data-who]').forEach(function (b) {
    b.addEventListener('click', function () { draft.patientRelation = b.dataset.who === 'me' ? 'me' : (draft.patientRelation && draft.patientRelation !== 'me' ? draft.patientRelation : 'family'); syncWho(); sync(); });
  });
  CM.$$('#relation [data-rel]').forEach(function (b) { b.addEventListener('click', function () { draft.patientRelation = b.dataset.rel; syncWho(); sync(); }); });

  /* ---------- Step 2: insurance ---------- */
  function showIns(mode) {
    insMode = mode;
    $('#ins-choose').hidden = mode !== 'choose';
    $('#ins-scanning').hidden = mode !== 'scanning';
    $('#ins-confirm').hidden = mode !== 'confirm';
    $('#ins-type').hidden = mode !== 'type';
    if (mode === 'type') renderHmos();
    if (mode === 'confirm') fillConfirm();
    sync();
  }
  $('#type-it').addEventListener('click', function () { showIns('type'); $('#hmo-search').focus(); });
  $('#card-file').addEventListener('change', function (e) {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    showIns('scanning');
    CM.api.cardScan(file).then(function (r) {
      e.target.value = ''; // the image is discarded; nothing is saved until the user continues
      Object.assign(draft, { hmoId: r.hmoId, enrolleeId: r.enrolleeId, memberName: r.memberName, cardExpiry: r.expiry, verification: 'card_scanned', _scan: r });
      if (r.facilityId) { const f = CM.api.facility(r.facilityId); draft.facilityId = f.id; draft.state = f.state; draft.lga = f.lga; draft.hospital = f.name; }
      if (r.planType && r.planType !== 'unsure') draft.planType = r.planType;
      showIns('confirm');
    });
  });
  function fillConfirm() {
    const sel = $('#c-hmo');
    sel.innerHTML = CM.mock.hmos.map(function (h) { return '<option value="' + h.id + '"' + (h.id === draft.hmoId ? ' selected' : '') + '>' + esc(h.name) + '</option>'; }).join('');
    $('#c-id').value = draft.enrolleeId; $('#c-name').value = draft.memberName; $('#c-exp').value = draft.cardExpiry || '';
    const scan = draft._scan || {};
    $('#c-plan').textContent = scan.planName || (draft.planType ? CM.t('plan.' + draft.planType) : '—');
    $('#c-fac').textContent = draft.hospital || '—';
    checkExpiry();
  }
  function checkExpiry() { $('#expired').hidden = !(draft.cardExpiry && Date.parse(draft.cardExpiry) < Date.now()); }
  $('#c-hmo').addEventListener('change', function (e) { draft.hmoId = e.target.value; });
  $('#c-id').addEventListener('input', function (e) { draft.enrolleeId = e.target.value.trim(); });
  $('#c-name').addEventListener('input', function (e) { draft.memberName = e.target.value.trim(); });
  $('#c-exp').addEventListener('change', function (e) { draft.cardExpiry = e.target.value || null; checkExpiry(); });

  // Type it: searchable HMO list (recent + popular first) + enrollee ID
  const list = $('#hmo-list'), search = $('#hmo-search');
  function row(h) {
    const sel = h.id === draft.hmoId;
    return '<button type="button" class="list-item" role="option" aria-selected="' + sel + '" data-id="' + h.id + '">' +
      CM.avatar(h.name) + '<span class="grow"><span class="title">' + esc(h.name) + '</span><br><span class="sub">' + esc(h.nhiaCode) + '</span></span>' +
      CM.icon(sel ? 'check-circle' : 'chevron-right', 'chev') + '</button>';
  }
  function renderHmos() {
    const q = search.value.trim();
    CM.api.hmos(q).then(function (all) {
      if (!all.length) { list.innerHTML = '<div class="empty">' + CM.illus.search + '<p>' + esc(CM.t('setup.hmo.none', { q })) + '</p></div>'; return; }
      let html = '';
      if (!q) {
        const recent = CM.store.recentHmos().map(function (id) { return CM.api.hmo(id); }).filter(Boolean);
        const popular = all.filter(function (h) { return h.popular && !recent.includes(h); });
        const rest = all.filter(function (h) { return !h.popular && !recent.includes(h); });
        if (recent.length) html += '<div class="group-label">' + esc(CM.t('setup.hmo.recent')) + '</div>' + recent.map(row).join('');
        html += '<div class="group-label">' + esc(CM.t('setup.hmo.popular')) + '</div>' + popular.map(row).join('');
        html += '<div class="group-label">' + esc(CM.t('setup.hmo.all')) + '</div>' + rest.map(row).join('');
      } else html = all.map(row).join('');
      list.innerHTML = html;
    });
  }
  list.addEventListener('click', function (e) {
    const b = e.target.closest('[data-id]'); if (!b) return;
    draft.hmoId = b.dataset.id; draft.verification = 'self_reported';
    CM.store.pushRecentHmo(draft.hmoId);
    renderHmos(); checkId(); sync();
    $('#t-id').focus();
  });
  let deb; search.addEventListener('input', function () { clearTimeout(deb); deb = setTimeout(renderHmos, 120); });
  // Enrollee ID: flag an ID that doesn't fit the HMO's known format, without blocking
  function checkId() {
    const r = CM.api.checkEnrolleeId(draft.hmoId, draft.enrolleeId);
    const h = CM.api.hmo(draft.hmoId);
    $('#id-warn').hidden = r.ok;
    if (!r.ok) $('#id-warn').textContent = CM.t('setup.idFormat', { hmo: h.name, ex: r.example });
  }
  $('#t-id').value = draft.enrolleeId;
  $('#t-id').addEventListener('input', function (e) { draft.enrolleeId = e.target.value.trim(); checkId(); });

  /* ---------- Step 3: plan type ---------- */
  $('#agency').innerHTML = CM.api.stateAgencies().map(function (a) { return '<option value="' + a.id + '">' + esc(a.name + ' — ' + a.longName) + '</option>'; }).join('');
  function planKind() { const t = draft.planType; return !t ? '' : t.indexOf('nhia') === 0 ? 'nhia' : t; }
  function syncPlan() {
    const k = planKind();
    CM.$$('#plans [data-plan]').forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.plan === k)); b.tabIndex = (b.dataset.plan === (k || 'nhia')) ? 0 : -1; });
    $('#nhia-sub').hidden = k !== 'nhia';
    CM.$$('#nhia-sub [data-sub]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.sub === draft.planType)); });
    $('#state-sub').hidden = k !== 'state';
    if (k === 'state') { if (!draft.stateScheme) draft.stateScheme = $('#agency').value; $('#agency').value = draft.stateScheme; }
  }
  CM.$$('#plans [data-plan]').forEach(function (b) {
    b.addEventListener('click', function () {
      draft.planType = b.dataset.plan === 'nhia' ? (planKind() === 'nhia' ? draft.planType : 'nhia_formal') : b.dataset.plan;
      syncPlan(); sync();
    });
  });
  CM.$$('#nhia-sub [data-sub]').forEach(function (b) { b.addEventListener('click', function () { draft.planType = b.dataset.sub; syncPlan(); }); });
  $('#agency').addEventListener('change', function (e) { draft.stateScheme = e.target.value; });

  /* ---------- Step 4: hospital ---------- */
  const hState = $('#h-state'), hLga = $('#h-lga'), hQ = $('#h-q'), hRes = $('#h-results');
  hState.innerHTML = CM.api.states().map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('') + '<option value="">' + esc(CM.t('setup.hosp.otherState')) + '</option>';
  function fillLgas() {
    hLga.innerHTML = '<option value="">' + esc(CM.t('setup.hosp.anyLga')) + '</option>' + CM.api.lgas(hState.value).map(function (l) { return '<option' + (l === draft.lga ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('');
    hLga.disabled = !hState.value;
  }
  function facRow(f) {
    return '<button type="button" class="list-item" role="option" data-fid="' + f.id + '">' + CM.icon('hospital') +
      '<span class="grow"><span class="title">' + esc(f.name) + '</span><br><span class="sub"><span>' + esc(f.lga + ', ' + f.state) + '</span><span class="level-tag">' + esc(CM.t('level.' + f.level)) + '</span>' +
      (f.km != null ? '<span>' + esc(CM.t('setup.hosp.km', { km: f.km.toFixed(1) })) + '</span>' : '') + '</span></span>' + CM.icon('chevron-right', 'chev') + '</button>';
  }
  function showResults(arr) {
    hRes.hidden = false;
    hRes.innerHTML = arr.length ? arr.map(facRow).join('') : '<div class="empty"><p>' + esc(CM.t('setup.hosp.none')) + '</p></div>';
  }
  function searchFac() {
    const q = hQ.value.trim();
    if (!hState.value) { hRes.hidden = true; $('#free-wrap').open = true; return; }
    if (q.length && q.length < 2) return;
    CM.api.facilities({ state: hState.value, lga: hLga.value, q }).then(showResults);
  }
  hState.value = draft.state || 'Lagos'; fillLgas();
  hState.addEventListener('change', function () { draft.state = hState.value; draft.lga = ''; fillLgas(); searchFac(); });
  hLga.addEventListener('change', function () { draft.lga = hLga.value; searchFac(); });
  let deb2; hQ.addEventListener('input', function () { clearTimeout(deb2); deb2 = setTimeout(searchFac, 140); });
  hRes.addEventListener('click', function (e) {
    const b = e.target.closest('[data-fid]'); if (!b) return;
    const f = CM.api.facility(b.dataset.fid);
    Object.assign(draft, { facilityId: f.id, hospital: f.name, state: f.state, lga: f.lga });
    renderPicked();
  });
  $('#near').addEventListener('click', function () {
    if (!navigator.geolocation) { CM.ui.toast(CM.t('setup.hosp.locDenied'), 'pin'); return; }
    const btn = $('#near'); btn.disabled = true;
    navigator.geolocation.getCurrentPosition(function (pos) {
      btn.disabled = false;
      CM.api.nearestFacilities({ lat: pos.coords.latitude, lng: pos.coords.longitude }).then(showResults);
    }, function () { btn.disabled = false; CM.ui.toast(CM.t('setup.hosp.locDenied'), 'pin'); }, { timeout: 8000, maximumAge: 600000 });
  });
  const free = $('#hospital');
  free.addEventListener('input', function () { draft.hospital = free.value.trim(); draft.facilityId = null; });
  function renderPicked() {
    const f = draft.facilityId && CM.api.facility(draft.facilityId);
    $('#picked').hidden = !f; $('#finder').hidden = !!f;
    if (f) {
      $('#picked').innerHTML = CM.icon('hospital') + '<span class="grow"><span class="title">' + esc(f.name) + '</span><br><span class="small muted">' + esc(f.lga + ', ' + f.state) + ' · ' + esc(CM.t('level.' + f.level)) + '</span>' +
        (draft._scan && draft._scan.facilityId === f.id ? '<br><span class="from-card">' + CM.icon('file', 'icon-sm') + esc(CM.t('setup.fromCard')) + '</span>' : '') + '</span>' +
        '<button type="button" class="link-btn small" id="change-fac">' + esc(CM.t('settings.change')) + '</button>';
      $('#change-fac').addEventListener('click', function () { draft.facilityId = null; renderPicked(); hQ.focus(); });
    } else { free.value = draft.facilityId ? '' : draft.hospital; }
  }

  /* ---------- Navigation ---------- */
  function finish() {
    const out = Object.assign({}, draft); delete out._scan;
    if (!out.hmoId) out.verification = null;
    if (planKind() !== 'state') out.stateScheme = null; // only state schemes have an agency
    CM.api.updateMe(out).then(function () {
      if (editing) { CM.ui.toast(CM.t('setup.saved')); setTimeout(function () { history.length > 1 ? history.back() : (location.href = 'settings.html'); }, 500); }
      else location.href = 'home.html';
    });
  }
  function go(n) {
    step = n;
    CM.$$('[data-step]').forEach(function (s) { s.hidden = Number(s.dataset.step) !== n; });
    if (n === 2) showIns(insMode);
    if (n === 4) { renderPicked(); if (!draft.facilityId) searchFac(); }
    const h = $('[data-step="' + n + '"] h1'); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    sync();
  }
  function canContinue() {
    if (step === 1) return !!draft.patientRelation && draft.patientRelation !== 'family';
    if (step === 2) return (insMode === 'confirm' || insMode === 'type') && !!draft.hmoId;
    if (step === 3) return !!draft.planType && (planKind() !== 'state' || !!draft.stateScheme);
    return true;
  }
  function sync() {
    CM.$$('#progress span').forEach(function (d, i) { d.className = i + 1 === step ? 'on' : i + 1 < step ? 'done' : ''; });
    $('#step-label').textContent = CM.t('setup.step', { n: step });
    $('#step-back').style.visibility = step > 1 || editing || (step === 2 && insMode !== 'choose') ? 'visible' : 'hidden';
    const label = cont.querySelector('span');
    label.dataset.i18n = step === 4 ? 'setup.finish' : 'common.continue';
    label.textContent = CM.t(label.dataset.i18n);
    cont.disabled = !canContinue();
    cont.hidden = step === 2 && (insMode === 'choose' || insMode === 'scanning');
    $('#skip').hidden = step === 1; // "Skip for now" works from step 2
  }
  cont.addEventListener('click', function () { if (step < 4) go(step + 1); else finish(); });
  $('#skip').addEventListener('click', finish);
  $('#step-back').addEventListener('click', function () {
    if (step === 2 && (insMode === 'type' || insMode === 'confirm')) { showIns('choose'); return; }
    if (step > 1) go(step - 1); else history.back();
  });
  document.addEventListener('cm:lang', function () { if (insMode === 'type') renderHmos(); fillLgas(); if (step === 4 && !draft.facilityId && !hRes.hidden) searchFac(); renderPicked(); sync(); });

  syncWho(); syncPlan(); go(editing ? 2 : 1);
})();
