/* Screen 4 — Checking: the pipeline steps tick in one by one while
   POST /cases runs, so 5-10 s feels fast. Voice notes pause after
   "Understanding" to show the transcript ("Is this right?"). */
(function () {
  if (!CM.boot()) return;
  const pending = CM.store.pending();
  if (!pending) { location.replace('home.html'); return; }

  const isVoice = pending.source === 'voice';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STEP_MS = reduced ? 250 : 750;
  const steps = CM.$$('#steps .step');
  if (!isVoice) CM.$('[data-step="listening"]').remove();
  const order = CM.$$('#steps .step');
  const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  function activate(i) {
    order.forEach(function (s, j) { s.classList.toggle('active', j === i); if (j < i) s.classList.add('done'); });
    if (order[i]) CM.$('#announce').textContent = order[i].textContent.trim();
  }
  function doneAll() { order.forEach(function (s) { s.classList.remove('active'); s.classList.add('done'); }); }

  // Emergency keywords are checked before anything else, on the client too, so the card shows instantly.
  let emergencyShown = false;
  function showEmergency(onRest) { if (emergencyShown) return; emergencyShown = true; CM.ui.emergency({ onRest }); }
  if (CM.api.emergencyCheck(pending.text)) showEmergency(null);

  const request = CM.api.createCase({ text: pending.text, issueHint: pending.issueHint, audio: isVoice, durationSec: pending.durationSec });
  let result = null, failure = null;
  request.then(function (c) { result = c; }, function (e) { failure = e; });

  function goResult() {
    CM.store.clearPending();
    location.replace('result.html?case=' + encodeURIComponent(result.caseId));
  }
  function goError() { location.replace('result.html?error=' + encodeURIComponent(failure.code || 'check_failed')); }

  async function run() {
    let i = 0;
    if (isVoice) { activate(i++); await sleep(STEP_MS * 1.2); }
    activate(i); // Understanding
    await Promise.all([request.catch(function () {}), sleep(STEP_MS)]);
    if (failure) return goError();

    if (isVoice) {
      // Show the transcript; the user can fix a misheard voice note before the verdict.
      doneAllUpTo(i);
      CM.$('#heard-text').textContent = result.transcript;
      CM.$('#heard').hidden = false;
      CM.$('#steps').hidden = true;
      CM.$('#heard-ok').focus();
      await new Promise(function (resolve) {
        CM.$('#heard-ok').addEventListener('click', resolve, { once: true });
        CM.$('#heard-edit').addEventListener('click', function () {
          CM.api.removeCase(result.caseId);
          CM.store.clearPending();
          location.replace('home.html?prefill=' + encodeURIComponent(result.transcript));
        }, { once: true });
      });
      CM.$('#heard').hidden = true; CM.$('#steps').hidden = false;
    }
    i++;
    activate(i++); await sleep(STEP_MS); // Checking NHIA rules
    activate(i++); await sleep(STEP_MS); // Writing your script
    doneAll(); CM.$('#checking').setAttribute('aria-busy', 'false');
    await sleep(reduced ? 50 : 350);
    if (result.emergency) {
      // Keep the takeover up (or show it now) and let "Show the rest of my answer" continue.
      const open = CM.$('.emergency');
      if (open) open.remove();
      if (open || !emergencyShown) { emergencyShown = false; showEmergency(goResult); } else goResult();
    } else goResult();
  }
  function doneAllUpTo(i) { order.forEach(function (s, j) { s.classList.remove('active'); if (j <= i) s.classList.add('done'); }); }

  run();
})();
