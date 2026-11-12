/* 404 — GitHub Pages serves this for any missing path. No consent gate: it's just a way back. */
(function () {
  if (!CM.boot()) return;
  CM.$('#nf-logo').innerHTML = CM.logoSvg();
})();
