/* Screen 8a — My cases: list with status chips, filter, empty state */
(function () {
  if (!CM.boot()) return;
  let filter = 'all', cases = null;
  const CLOSED = ['resolved', 'refunded'];
  function render() {
    if (!cases) return;
    const list = cases.filter(function (c) { return filter === 'all' || (filter === 'closed') === CLOSED.includes(c.status); });
    CM.$('#count').textContent = CM.t('cases.count', { n: cases.length });
    CM.$('#list').innerHTML = list.length ? list.map(CM.caseItem).join('')
      : '<div class="empty">' + CM.illus.family + '<h2>' + CM.esc(CM.t('home.empty.title')) + '</h2><p>' + CM.esc(CM.t('home.empty.body')) + '</p></div>';
  }
  CM.$$('#filter button').forEach(function (b) {
    b.addEventListener('click', function () {
      filter = b.dataset.f;
      CM.$$('#filter button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      render();
    });
  });
  CM.api.cases().then(function (l) { cases = l; render(); });
  document.addEventListener('cm:lang', render);
  document.addEventListener('cm:overdue', function () { CM.api.cases().then(function (l) { cases = l; render(); }); });
})();
