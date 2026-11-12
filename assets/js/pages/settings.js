/* Screen 10 — Settings + privacy: language, appearance, HMO details, timer alerts,
   privacy notice, demo tools, and "Delete all my data" (DELETE /me) with confirm. */
(function () {
  if (!CM.boot()) return;

  function seg(sel, current, onPick) {
    CM.$$(sel + ' [data-v]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.v === current));
      b.onclick = function () { onPick(b.dataset.v); };
    });
  }
  function sync() {
    const s = CM.store.settings();
    seg('#lang', CM.i18n.lang, function (v) { CM.i18n.set(v); sync(); });
    seg('#theme', s.theme, function (v) { CM.store.setSettings({ theme: v }); CM.ui.applyTheme(); sync(); });

    const p = CM.store.profile(); const h = p.hmoId && CM.api.hmo(p.hmoId);
    const plan = p.planType ? CM.t('setup.plan.' + p.planType) : '';
    CM.$('#hmo-row').innerHTML = (h ? CM.avatar(h.name) : '<span class="avatar" style="background:var(--line);color:var(--muted)">' + CM.icon('plus') + '</span>') +
      '<span class="grow"><span class="title">' + CM.esc(h ? h.name : CM.t('settings.noHmo')) + '</span><br><span class="sub">' +
      CM.esc([plan, p.hospital].filter(Boolean).join(' · ') || CM.t('setup.hmo.hint')) + '</span></span>' +
      '<span class="small" style="color:var(--brand-700);font-weight:600">' + CM.esc(CM.t('settings.change')) + '</span>';

    const granted = 'Notification' in window && Notification.permission === 'granted';
    const denied = 'Notification' in window && Notification.permission === 'denied';
    CM.$('#notif').checked = s.notifications && granted;
    CM.$('#notif').disabled = denied || !('Notification' in window);
    CM.$('#notif-sub').textContent = CM.t(denied ? 'settings.notif.denied' : 'settings.notif.sub');
    CM.$('#demo').checked = s.demoMode;
    CM.$('#simerr').checked = s.simError;
  }

  CM.$('#notif').addEventListener('change', function (e) {
    if (!e.target.checked) { CM.store.setSettings({ notifications: false }); return sync(); }
    CM.api.subscribePush().then(function (perm) { CM.store.setSettings({ notifications: perm === 'granted' }); sync(); });
  });
  CM.$('#demo').addEventListener('change', function (e) { CM.store.setSettings({ demoMode: e.target.checked }); });
  CM.$('#simerr').addEventListener('change', function (e) { CM.store.setSettings({ simError: e.target.checked }); });
  CM.$('#seed').addEventListener('click', function () {
    CM.store.setSettings({ simError: false });
    CM.api.seedDemoCase().then(function (c) { CM.ui.toast(CM.t('settings.seeded'), 'sparkle'); setTimeout(function () { location.href = 'timer.html?case=' + encodeURIComponent(c.caseId); }, 600); });
  });

  /* PWA install */
  function installable() { CM.$('#install').hidden = !CM.installPrompt; }
  document.addEventListener('cm:installable', installable);
  CM.$('#install').addEventListener('click', function () {
    if (!CM.installPrompt) return;
    CM.installPrompt.prompt();
    CM.installPrompt.userChoice.finally(function () { CM.installPrompt = null; installable(); });
  });

  /* Delete all my data — one tap + confirm */
  CM.$('#delete').addEventListener('click', function () {
    const n = CM.store.cases().length;
    CM.ui.confirm({ title: CM.t('delete.title'), body: CM.t('delete.body', { n }), confirm: CM.t('delete.confirm'), danger: true }).then(function (ok) {
      if (!ok) return;
      CM.api.deleteMe().then(function () {
        CM.ui.applyTheme();
        CM.ui.toast(CM.t('delete.done'), 'trash');
        setTimeout(function () { location.href = 'index.html'; }, 900);
      });
    });
  });

  document.addEventListener('cm:lang', sync);
  sync(); installable();
})();
