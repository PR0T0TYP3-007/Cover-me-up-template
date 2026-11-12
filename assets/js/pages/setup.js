/* Screen 2 — Setup: HMO picker -> plan type -> hospital. Progress dots; skippable.
   ?edit=1 opens it from Settings / Home and returns there afterwards. */
(function () {
  if (!CM.boot()) return;
  const editing = CM.qs('edit') === '1';
  const profile = CM.store.profile();
  const draft = { hmoId: profile.hmoId, planType: profile.planType, hospital: profile.hospital || '' };
  let step = 1;

  const list = CM.$('#hmo-list'), search = CM.$('#hmo-search'), cont = CM.$('#continue');

  /* ---- Step 1: searchable HMO list, recent + popular first ---- */
  function row(h) {
    const sel = h.id === draft.hmoId;
    return '<button type="button" class="list-item" role="option" aria-selected="' + sel + '" data-id="' + h.id + '">' +
      CM.avatar(h.name) + '<span class="grow"><span class="title">' + CM.esc(h.name) + '</span><br><span class="sub">' + CM.esc(h.nhiaCode) + '</span></span>' +
      CM.icon(sel ? 'check-circle' : 'chevron-right', 'chev') + '</button>';
  }
  function renderHmos() {
    const q = search.value.trim();
    CM.api.hmos(q).then(function (all) {
      if (!all.length) {
        list.innerHTML = '<div class="empty">' + CM.illus.search + '<p>' + CM.esc(CM.t('setup.hmo.none', { q })) + '</p></div>';
        return;
      }
      let html = '';
      if (!q) {
        const recent = CM.store.recentHmos().map(function (id) { return CM.api.hmo(id); }).filter(Boolean);
        const popular = all.filter(function (h) { return h.popular && !recent.includes(h); });
        const rest = all.filter(function (h) { return !h.popular && !recent.includes(h); });
        if (recent.length) html += '<div class="group-label">' + CM.esc(CM.t('setup.hmo.recent')) + '</div>' + recent.map(row).join('');
        html += '<div class="group-label">' + CM.esc(CM.t('setup.hmo.popular')) + '</div>' + popular.map(row).join('');
        html += '<div class="group-label">' + CM.esc(CM.t('setup.hmo.all')) + '</div>' + rest.map(row).join('');
      } else html = all.map(row).join('');
      list.innerHTML = html;
    });
  }
  list.addEventListener('click', function (e) {
    const b = e.target.closest('[data-id]'); if (!b) return;
    draft.hmoId = b.dataset.id;
    CM.store.pushRecentHmo(draft.hmoId);
    renderHmos(); sync();
    setTimeout(function () { go(2); }, 220);
  });
  let deb; search.addEventListener('input', function () { clearTimeout(deb); deb = setTimeout(renderHmos, 120); });
  CM.$('#hmo-unsure').addEventListener('click', function () { draft.hmoId = null; go(2); });

  /* ---- Step 2: plan type ---- */
  CM.$$('#plans [data-plan]').forEach(function (b) {
    b.addEventListener('click', function () { draft.planType = b.dataset.plan; sync(); });
  });
  CM.$('#plans').addEventListener('keydown', function (e) {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
    const items = CM.$$('#plans [data-plan]'); const i = items.indexOf(document.activeElement);
    const n = items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length];
    n.focus(); n.click(); e.preventDefault();
  });

  /* ---- Step 3: hospital ---- */
  const hosp = CM.$('#hospital');
  hosp.value = draft.hospital;
  hosp.addEventListener('input', function () { draft.hospital = hosp.value; });

  /* ---- Navigation ---- */
  function finish() {
    CM.api.updateMe({ hmoId: draft.hmoId, planType: draft.planType, hospital: draft.hospital.trim() }).then(function () {
      if (editing) { CM.ui.toast(CM.t('setup.saved')); setTimeout(function () { history.length > 1 ? history.back() : (location.href = 'settings.html'); }, 500); }
      else location.href = 'home.html';
    });
  }
  function go(n) {
    step = n;
    CM.$$('[data-step]').forEach(function (s) { s.hidden = Number(s.dataset.step) !== n; });
    const h = CM.$('[data-step="' + n + '"] h1'); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    sync();
  }
  function sync() {
    CM.$$('#progress span').forEach(function (d, i) { d.className = i + 1 === step ? 'on' : i + 1 < step ? 'done' : ''; });
    CM.$('#step-label').textContent = CM.t('setup.step', { n: step });
    CM.$('#step-back').style.visibility = step > 1 || editing ? 'visible' : 'hidden';
    CM.$$('#plans [data-plan]').forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.plan === draft.planType)); b.tabIndex = (b.dataset.plan === draft.planType || (!draft.planType && b.dataset.plan === 'nhia')) ? 0 : -1; });
    const label = cont.querySelector('span');
    label.dataset.i18n = step === 3 ? 'setup.finish' : 'common.continue';
    label.textContent = CM.t(label.dataset.i18n);
    cont.disabled = (step === 1 && !draft.hmoId) || (step === 2 && !draft.planType);
    CM.$('#skip').textContent = CM.t(step === 3 ? 'setup.skip' : 'common.skip');
  }
  cont.addEventListener('click', function () { if (step < 3) go(step + 1); else finish(); });
  CM.$('#skip').addEventListener('click', function () { if (step < 3) go(step + 1); else finish(); });
  CM.$('#step-back').addEventListener('click', function () { if (step > 1) go(step - 1); else history.back(); });
  document.addEventListener('cm:lang', function () { renderHmos(); sync(); });

  renderHmos(); go(1);
  CM.$('#hmo-title').blur();
})();
