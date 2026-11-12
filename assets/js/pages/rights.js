/* Screen 9 — Know your rights: searchable rule cards by topic. Each card opens
   the rule sheet and can be shared as an image (1080x1080 PNG) for social media. */
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
    if (e.target.closest('[data-share]')) return share(CM.api.rule(art.dataset.rule));
    CM.ui.ruleSheet(art.dataset.rule);
  });
  CM.$$('#topics [data-topic]').forEach(function (b) {
    b.addEventListener('click', function () {
      topic = b.dataset.topic;
      CM.$$('#topics [data-topic]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      render();
    });
  });
  let deb; q.addEventListener('input', function () { clearTimeout(deb); deb = setTimeout(render, 100); });

  /* ---- Share as image (canvas -> PNG -> Web Share, or download) ---- */
  function wrap(ctx, text, maxW) {
    const words = text.split(' '), lines = []; let line = '';
    words.forEach(function (w) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    if (line) lines.push(line); return lines;
  }
  function share(r) {
    const S = 1080, cv = document.createElement('canvas'); cv.width = cv.height = S;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#0B5D4B'; ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = '#FAF7F2'; if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(64, 64, S - 128, S - 128, 40); ctx.fill(); } else ctx.fillRect(64, 64, S - 128, S - 128);
    ctx.fillStyle = '#12876B'; ctx.font = '700 34px "Plus Jakarta Sans", sans-serif'; ctx.fillText(CM.t('rights.title').toUpperCase(), 128, 170);
    ctx.fillStyle = '#1B1F1D'; ctx.font = '800 64px "Plus Jakarta Sans", sans-serif';
    let y = 270; wrap(ctx, CM.L(r.title), S - 256).forEach(function (l) { ctx.fillText(l, 128, y); y += 78; });
    y += 30; ctx.fillStyle = '#1B1F1D'; ctx.font = '500 40px Inter, sans-serif';
    wrap(ctx, CM.L(r.says), S - 256).forEach(function (l) { ctx.fillText(l, 128, y); y += 58; });
    ctx.fillStyle = '#5E6A65'; ctx.font = '500 28px Inter, sans-serif';
    ctx.fillText(r.id + ' · ' + r.sourceName + ' · ' + CM.fmt.date(r.sourceDate), 128, S - 200);
    ctx.fillStyle = '#0B5D4B'; ctx.font = '800 48px "Plus Jakarta Sans", sans-serif'; ctx.fillText('Cover', 128, S - 120);
    const w = ctx.measureText('Cover').width; ctx.fillStyle = '#12876B'; ctx.fillText('Me', 128 + w, S - 120);
    cv.toBlob(function (blob) {
      const file = new File([blob], 'coverme-' + r.id.toLowerCase() + '.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: CM.L(r.title), text: CM.L(r.title) + ' — CoverMe' }).catch(function () {});
      } else {
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
        CM.ui.toast(CM.t('rights.shared'), 'download');
      }
    }, 'image/png');
  }

  CM.api.rules().then(function (r) { rules = r; render(); });
  document.addEventListener('cm:lang', render);
})();
