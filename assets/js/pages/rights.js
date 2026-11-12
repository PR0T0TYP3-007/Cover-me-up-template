/* Screen 9 — Know your rights: searchable rule cards by topic. Each card opens the
   rule detail page and can be shared as an image (1080x1080 PNG) for social media. */
(function () {
  if (!CM.boot()) return;
  let rules = null, topic = 'all';
  const q = CM.$('#q');

  function card(r) {
    return '<article class="card rule-card" data-rule="' + r.id + '">' +
      '<div class="top"><span class="rid">' + r.id + '</span>' +
      (r.confidence === 'low' ? '<span class="badge badge-amber">' + CM.icon('help') + CM.esc(CM.t('rights.lowConf')) + '</span>' : '<span class="small muted">' + CM.esc(CM.t('topic.' + r.topic)) + '</span>') + '</div>' +
      '<h2 style="font-size:var(--fs-18)">' + CM.esc(CM.L(r.title)) + '</h2>' +
      '<p class="says">' + CM.esc(CM.L(r.says)) + '</p>' +
      '<div class="foot"><button type="button" class="link-btn small" data-open style="padding:0;min-height:40px">' + CM.esc(CM.t('rights.source')) + ' · ' + CM.esc(CM.fmt.date(r.sourceDate)) + '</button>' +
      '<button type="button" class="btn btn-tint" data-share>' + CM.icon('share', 'icon-sm') + '<span>' + CM.esc(CM.t('rights.share')) + '</span></button></div>' +
      '</article>';
  }
  function render() {
    if (!rules) return;
    const term = q.value.trim().toLowerCase();
    const list = rules.filter(function (r) {
      if (topic !== 'all' && r.topic !== topic) return false;
      if (!term) return true;
      return [r.id, r.title.en, r.title.pcm, r.says.en, r.says.pcm].join(' ').toLowerCase().includes(term);
    });
    CM.$('#sub').textContent = CM.t('rights.sub', { n: rules.length });
    CM.$('#list').innerHTML = list.length ? list.map(card).join('')
      : '<div class="empty">' + CM.illus.search + '<p>' + CM.esc(CM.t('rights.none', { q: q.value.trim() || CM.t('topic.' + topic) })) + '</p></div>';
  }

  CM.$('#list').addEventListener('click', function (e) {
    const art = e.target.closest('[data-rule]'); if (!art) return;
    if (e.target.closest('[data-share]')) return CM.shareRule(CM.api.rule(art.dataset.rule));
    location.href = 'rule.html?id=' + encodeURIComponent(art.dataset.rule); // rule detail (/rights/:ruleId)
  });
  CM.$$('#topics [data-topic]').forEach(function (b) {
    b.addEventListener('click', function () {
      topic = b.dataset.topic;
      CM.$$('#topics [data-topic]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      render();
    });
  });
  let deb; q.addEventListener('input', function () { clearTimeout(deb); deb = setTimeout(render, 100); });

  CM.api.rules().then(function (r) { rules = r; render(); });
  document.addEventListener('cm:lang', render);
})();
