/* Rule detail (/rights/:ruleId) — the full rule, where it applies, its source and date,
   share as an image, and related rules on the same topic. */
(function () {
  if (!CM.boot()) return;
  const esc = CM.esc;
  const r = CM.api.rule(CM.qs('id'));

  function render() {
    if (!r) {
      CM.$('#rule').innerHTML = '<div class="empty">' + CM.illus.search + '<p>' + esc(CM.t('rule.notFound')) + '</p><a class="btn btn-primary" href="rights.html">' + esc(CM.t('rule.all')) + '</a></div>';
      CM.$('#related').innerHTML = '';
      return;
    }
    document.title = 'CoverMe — ' + CM.L(r.title);
    const plans = r.universal ? CM.t('plan.nhia_formal') + ', ' + CM.t('plan.state') + ', ' + CM.t('plan.private') : CM.t('setup.plan.nhia');
    CM.$('#rule').innerHTML =
      '<article class="verdict" aria-labelledby="rule-h">' +
        '<div class="row-between"><span class="rid" style="font:700 .875rem/1 var(--font-mono);background:var(--brand-700);color:var(--on-brand);padding:7px 10px;border-radius:8px">' + esc(r.id) + '</span>' +
        (r.confidence === 'low' ? '<span class="badge badge-amber">' + CM.icon('help') + esc(CM.t('rights.lowConf')) + '</span>' : '<span class="eyebrow">' + esc(CM.t('topic.' + r.topic)) + '</span>') + '</div>' +
        '<h1 class="headline" id="rule-h">' + esc(CM.L(r.title)) + '</h1>' +
        '<p class="rule-says" style="font:400 1.1875rem/1.6 var(--font-display)">' + esc(CM.L(r.says)) + '</p>' +
        (r.confidence === 'low' ? '<div class="banner banner-amber">' + CM.icon('help') + '<span>' + esc(CM.t('sheet.lowConf')) + '</span></div>' : '') +
        '<dl class="meta-list"><dt>' + esc(CM.t('setup.plan.title').replace(/\?$/, '')) + '</dt><dd>' + esc(plans) + '</dd>' +
        '<dt>' + esc(CM.t('sheet.source')) + '</dt><dd>' + esc(r.sourceName) + '</dd>' +
        '<dt>' + esc(CM.t('sheet.date')) + '</dt><dd>' + esc(CM.fmt.date(r.sourceDate)) + '</dd></dl>' +
        '<div class="btn-row"><a class="btn btn-secondary" href="' + esc(r.sourceUrl) + '" target="_blank" rel="noopener">' + CM.icon('external') + '<span>' + esc(CM.t('sheet.open')) + '</span></a>' +
        '<button type="button" class="btn btn-primary" id="share">' + CM.icon('share') + '<span>' + esc(CM.t('rule.shareImg')) + '</span></button></div>' +
      '</article>' +
      '<p class="disclaimer">' + CM.icon('info') + '<span>' + esc(CM.t('result.disclaimer')) + '</span></p>';
    CM.$('#share').addEventListener('click', function () { CM.shareRule(r); });
    const related = CM.mock.rules.filter(function (x) { return x.id !== r.id && (x.topic === r.topic || x.issueType === r.issueType); }).slice(0, 4);
    CM.$('#related').innerHTML = related.map(function (x) {
      return '<a class="case-item" href="rule.html?id=' + encodeURIComponent(x.id) + '"><span class="ic" style="font:700 .8125rem/1 var(--font-mono)">' + esc(x.id) + '</span>' +
        '<span class="grow"><span class="title">' + esc(CM.L(x.title)) + '</span><span class="meta">' + esc(CM.L(x.says)) + '</span></span>' + CM.icon('chevron-right', 'chev') + '</a>';
    }).join('');
  }
  render();
  document.addEventListener('cm:lang', render);
})();
