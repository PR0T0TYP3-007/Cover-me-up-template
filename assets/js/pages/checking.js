/* Screen 4 — Checking: pipeline steps tick in while POST /cases runs.
   - Voice notes pause after "Understanding" to show the transcript ("Is this right?").
   - Back asks "Stop checking?"; typed text is kept as a draft on Home.
   - Speed (logic review gap 9): as soon as the rules engine answers we go to Result, which shows
     the headline + rule cards straight away and streams the script in ("Writing your script").
   - Emergency: the takeover shows first; it closes only via "I'm getting help now" or
     "This isn't an emergency", the choice is logged, and the normal result shows underneath. */
(function () {
  if (!CM.boot()) return;
  const pending = CM.store.pending();
  if (!pending) { location.replace('home.html'); return; }

  const isVoice = pending.source === 'voice';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STEP_MS = reduced ? 250 : 750;
  if (!isVoice) CM.$('[data-step="listening"]').remove();
  CM.$('[data-step="writing"]').remove(); // the script is written on the Result screen, after the headline
  const order = CM.$$('#steps .step');
  const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  let leaving = false;
  let result = null, failure = null; // declared first: the emergency check and Stop dialog read them

  function activate(i) {
    order.forEach(function (s, j) { s.classList.toggle('active', j === i); if (j < i) s.classList.add('done'); });
    if (order[i]) CM.$('#announce').textContent = order[i].textContent.trim();
  }
  function doneUpTo(i) { order.forEach(function (s, j) { s.classList.remove('active'); if (j <= i) s.classList.add('done'); }); }

  /* ---- "Stop checking?" (back button / browser back) ---- */
  function askStop() {
    CM.ui.confirm({ title: CM.t('check.stop.title'), body: CM.t('check.stop.body'), confirm: CM.t('check.stop.yes'), icon: 'x' }).then(function (ok) {
      if (!ok) { history.pushState({ checking: 1 }, ''); return; }
      leaving = true;
      if (pending.source === 'text') CM.store.set('draft', pending.text);
      CM.store.clearPending();
      if (result) CM.api.removeCase(result.caseId);
      location.replace('home.html');
    });
  }
  const back = CM.$('#topbar .back');
  if (back) back.addEventListener('click', function (e) { e.preventDefault(); e.stopImmediatePropagation(); askStop(); }, true);
  history.pushState({ checking: 1 }, '');
  window.addEventListener('popstate', function () { if (!leaving) askStop(); });

  // Emergency keywords are checked before anything else, on the client too, so the card shows instantly.
  let emergencyOpen = false, emergencyChoice = null, onChoice = null;
  function showEmergency() {
    if (emergencyOpen || emergencyChoice) return;
    emergencyOpen = true;
    CM.ui.emergency({
      caseId: result && result.caseId,
      onChoice: function (choice) { emergencyOpen = false; emergencyChoice = choice; if (onChoice) onChoice(choice); }
    });
  }
  if (CM.api.emergencyCheck(pending.text)) showEmergency();

  const request = CM.api.createCase({ text: pending.text, issueHint: pending.issueHint, audio: isVoice, durationSec: pending.durationSec });
  request.then(function (c) { result = c; }, function (e) { failure = e; });

  function goResult() {
    if (leaving) return;
    leaving = true;
    CM.store.clearPending();
    location.replace('result.html?case=' + encodeURIComponent(result.caseId) + '&fresh=1');
  }
  function goError() { leaving = true; location.replace('result.html?error=' + encodeURIComponent(failure.code || 'check_failed')); }

  async function run() {
    let i = 0;
    if (isVoice) { activate(i++); await sleep(STEP_MS * 1.2); }
    activate(i); // Understanding
    await Promise.all([request.catch(function () {}), sleep(STEP_MS)]);
    if (leaving) return;
    if (failure) return goError();

    if (isVoice) {
      // The user can fix a misheard voice note before the verdict.
      doneUpTo(i);
      CM.$('#heard-text').textContent = result.transcript;
      CM.$('#heard').hidden = false;
      CM.$('#steps').hidden = true;
      CM.$('#heard-ok').focus();
      await new Promise(function (resolve) {
        CM.$('#heard-ok').addEventListener('click', resolve, { once: true });
        CM.$('#heard-edit').addEventListener('click', function () {
          leaving = true;
          CM.api.removeCase(result.caseId);
          CM.store.clearPending();
          location.replace('home.html?prefill=' + encodeURIComponent(result.transcript));
        }, { once: true });
      });
      CM.$('#heard').hidden = true; CM.$('#steps').hidden = false;
    }
    i++;
    activate(i); await sleep(STEP_MS); // Checking NHIA rules
    doneUpTo(i); CM.$('#checking').setAttribute('aria-busy', 'false');
    await sleep(reduced ? 50 : 250);

    if (result.emergency) {
      if (emergencyChoice) {
        CM.api.addEvent(result.caseId, { type: emergencyChoice === 'help' ? 'emergency_help' : 'emergency_dismissed' });
        goResult();
      } else if (emergencyOpen) {
        // Opened before the case existed: log the choice here once it's made
        onChoice = function (choice) { CM.api.addEvent(result.caseId, { type: choice === 'help' ? 'emergency_help' : 'emergency_dismissed' }).then(goResult); };
      } else {
        onChoice = goResult; // opened now, with the case id: the overlay logs the choice itself
        showEmergency();
      }
    } else goResult();
  }
  run();
})();
