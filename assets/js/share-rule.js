/* CoverMe — share a rule as a 1080x1080 image (canvas -> PNG -> Web Share, or download).
   Used by the Know-your-rights list and the rule detail page; also feeds social posts. */
window.CM = window.CM || {};
CM.shareRule = (function () {
  function wrap(ctx, text, maxW) {
    const words = text.split(' '), lines = []; let line = '';
    words.forEach(function (w) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    if (line) lines.push(line); return lines;
  }
  return function share(r) {
    const S = 1080, cv = document.createElement('canvas'); cv.width = cv.height = S;
    const ctx = cv.getContext('2d');
    const draw = function () {
      ctx.fillStyle = '#0B5D4B'; ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#F7F1E6'; if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(64, 64, S - 128, S - 128, 40); ctx.fill(); } else ctx.fillRect(64, 64, S - 128, S - 128);
      ctx.fillStyle = '#12876B'; ctx.font = '600 30px "JetBrains Mono", monospace'; ctx.fillText(CM.t('rights.title').toUpperCase() + ' · ' + r.id, 128, 170);
      ctx.fillStyle = '#17201C'; ctx.font = '600 66px Fraunces, Georgia, serif';
      let y = 270; wrap(ctx, CM.L(r.title), S - 256).forEach(function (l) { ctx.fillText(l, 128, y); y += 78; });
      y += 30; ctx.font = '500 40px "Instrument Sans", sans-serif';
      wrap(ctx, CM.L(r.says), S - 256).forEach(function (l) { ctx.fillText(l, 128, y); y += 58; });
      ctx.fillStyle = '#58625D'; ctx.font = '500 26px "JetBrains Mono", monospace';
      ctx.fillText(r.sourceName + ' · ' + CM.fmt.date(r.sourceDate), 128, S - 200);
      ctx.fillStyle = '#0B5D4B'; ctx.font = '600 52px Fraunces, Georgia, serif'; ctx.fillText('Cover', 128, S - 120);
      const w = ctx.measureText('Cover').width; ctx.fillStyle = '#12876B'; ctx.font = 'italic 600 52px Fraunces, Georgia, serif'; ctx.fillText('Me', 128 + w, S - 120);
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
    };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(draw);
  };
})();
