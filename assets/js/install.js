/* CoverMe — "Add to home screen" card (same pattern as the Supernova project).
   Android / Chrome: a real install button, using the beforeinstallprompt event.
   iOS: there is no install API, so it shows the Share -> Add to Home Screen -> Add steps.

   - Never shown once installed (standalone), on desktop, or on Welcome / Setup / Checking / Timer / Complaint.
   - "Not now" (or ✕) keeps it away for a week.
   - The Timer screen has its own inline prompt (the overdue alert needs the home-screen app on iPhone).
   - Preview anywhere with ?install=ios or ?install=android.
   Loaded after ui.js; exposes CM.install.show(mode, { reason }) and keeps CM.installPrompt for Settings. */
window.CM = window.CM || {};
CM.install = (function () {
  const KEY = 'cm.install.later';
  const WEEK = 7 * 864e5;
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isIPhone = /iphone|ipod/i.test(ua);
  const isMobile = isIOS || /android|mobi/i.test(ua);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const force = new URLSearchParams(location.search).get('install');
  const page = document.body.dataset.page;
  // Quiet on onboarding/checking, and on Timer/Complaint, which have their own inline prompt or primary action
  const quietPage = ['welcome', 'setup', 'checking', 'notfound', 'timer', 'complaint'].includes(page);

  const snoozed = function () { try { return Date.now() - Number(localStorage.getItem(KEY) || 0) < WEEK; } catch (e) { return false; } };
  const snooze = function () { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} };

  let deferred = null, card = null, timer = null;

  function hide(remember) {
    if (remember) snooze();
    if (!card) return;
    const c = card; card = null;
    c.classList.add('is-leaving');
    setTimeout(function () { c.remove(); }, 260);
  }

  function show(mode, opts) {
    opts = opts || {};
    if (card || (standalone && !force)) return;
    const t = CM.t, esc = CM.esc;
    const reason = opts.reason ? '<p class="install__sub">' + esc(opts.reason) + '</p>' : '<p class="install__sub">' + esc(t('install.sub')) + '</p>';
    let body;
    if (mode === 'ios') {
      body = '<ol class="install__steps">' +
        '<li><span class="install__n">1</span><span>' + esc(t('install.ios.1')) + '</span><span class="install__glyph">' + CM.icon('ios-share') + '</span></li>' +
        '<li><span class="install__n">2</span><span>' + esc(t('install.ios.2')) + '</span><span class="install__glyph">' + CM.icon('plussq') + '</span></li>' +
        '<li><span class="install__n">3</span><span>' + esc(t('install.ios.3')) + '</span></li></ol>' +
        '<button type="button" class="btn btn-primary btn-block" data-later>' + esc(t('install.gotIt')) + '</button>';
    } else {
      body = '<div class="install__acts"><button type="button" class="btn btn-secondary" data-later>' + esc(t('install.later')) + '</button>' +
        '<button type="button" class="btn btn-primary" data-go>' + CM.icon('plussq') + '<span>' + esc(t('install.btn')) + '</span></button></div>';
    }
    card = document.createElement('div');
    card.className = 'install install--' + mode;
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-labelledby', 'install-t');
    card.innerHTML = '<button type="button" class="icon-btn install__x" data-later aria-label="' + esc(t('common.close')) + '">' + CM.icon('x') + '</button>' +
      '<div class="install__head"><img class="install__icon" src="assets/icons/icon-192.png" alt="" width="56" height="56">' +
      '<div><p class="install__title" id="install-t">' + esc(t('install.title')) + '</p>' + reason + '</div></div>' + body +
      (mode === 'ios' && isIPhone ? '<span class="install__arrow" aria-hidden="true"></span>' : '');
    card.addEventListener('click', function (e) {
      if (e.target.closest('[data-later]')) hide(true);
      if (e.target.closest('[data-go]')) install();
    });
    document.body.appendChild(card);
  }

  function install() {
    if (!deferred) { // Preview mode, or a browser without the prompt: point to the menu.
      CM.ui.toast(CM.t('install.menu'), 'info');
      hide(false);
      return;
    }
    deferred.prompt();
    deferred.userChoice.catch(function () { return { outcome: 'dismissed' }; }).then(function (r) {
      deferred = null; CM.installPrompt = null;
      hide(r.outcome !== 'accepted');
      if (r.outcome === 'accepted') CM.ui.toast(CM.t('install.done'), 'check-circle');
    });
  }

  function schedule(mode) {
    if (timer || card || standalone || quietPage || snoozed()) return;
    timer = setTimeout(function () { show(mode); }, 4000);
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e; CM.installPrompt = e;
    document.dispatchEvent(new Event('cm:installable'));
    if (isMobile) schedule('android');
  });
  window.addEventListener('appinstalled', function () { deferred = null; CM.installPrompt = null; hide(true); });

  if (force === 'ios' || force === 'android') window.addEventListener('load', function () { show(force); });
  else if (isIOS) schedule('ios');

  return {
    get standalone() { return standalone; },
    get canPrompt() { return !!deferred; },
    get isIOS() { return isIOS; },
    get isMobile() { return isMobile; },
    show: function (mode, opts) { show(mode || (isIOS ? 'ios' : 'android'), opts); },
    prompt: install
  };
})();
