/* CoverMe — shared UI: app shell, formatting, status meta, bottom sheet,
   dialogs, toasts, emergency takeover, show-to-desk mode, offline banner,
   overdue watcher and PWA registration. Loaded on every page. */
window.CM = window.CM || {};
(function () {
  const $ = function (s, r) { return (r || document).querySelector(s); };
  const esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  CM.$ = $; CM.$$ = function (s, r) { return Array.from((r || document).querySelectorAll(s)); };
  CM.esc = esc;
  CM.qs = function (k) { return new URLSearchParams(location.search).get(k); };

  /* ---------- Formatting ---------- */
  const locale = function () { return 'en-NG'; };
  CM.fmt = {
    time(iso) { return new Date(iso).toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit' }); },
    dateTime(iso) { const d = new Date(iso); return d.toLocaleDateString(locale(), { day: 'numeric', month: 'short' }) + ', ' + CM.fmt.time(iso); },
    date(iso) { return new Date(iso).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' }); },
    rel(iso) {
      const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
      if (m < 1) return CM.t('time.justNow');
      if (m < 60) return CM.t('time.min', { n: m });
      if (m < 1440) return CM.t('time.hour', { n: Math.round(m / 60) });
      return CM.t('time.day', { n: Math.round(m / 1440) });
    },
    naira(n) { return Number(n || 0).toLocaleString('en-NG'); },
    clock(ms) { ms = Math.max(0, ms); const s = Math.floor(ms / 1000); const m = Math.floor(s / 60); return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
  };

  /* ---------- Status, verdict and issue metadata (colour + icon + word) ---------- */
  CM.meta = {
    status: {
      open: { cls: 'brand', icon: 'circle-dot' }, waiting_hmo: { cls: 'amber', icon: 'hourglass' },
      overdue: { cls: 'danger', icon: 'alert' }, escalated: { cls: 'brand', icon: 'flag' },
      resolved: { cls: 'success', icon: 'check-circle' }, refunded: { cls: 'success', icon: 'banknote' }
    },
    verdict: {
      likely_covered: { cls: 'success', icon: 'check-circle' }, rule_applies: { cls: 'brand', icon: 'shield-check' },
      legit_charge: { cls: 'neutral', icon: 'info' }, confirm_with_hmo: { cls: 'amber', icon: 'help' }
    },
    issue: { drug_not_covered: 'pill', cash_demanded: 'banknote', auth_delay: 'hourglass', referral_delay: 'referral', other: 'message' },
    event: {
      message: { icon: 'message', cls: '' }, verdict: { icon: 'shield-check', cls: '' }, emergency: { icon: 'octagon', cls: 'danger' },
      timer_started: { icon: 'timer', cls: 'amber' }, hmo_responded: { icon: 'phone', cls: '' }, hmo_called: { icon: 'phone', cls: '' },
      code_received: { icon: 'check', cls: 'success' }, paid: { icon: 'banknote', cls: 'amber' }, overdue: { icon: 'alert', cls: 'danger' },
      escalated: { icon: 'flag', cls: '' }, resolved: { icon: 'check-circle', cls: 'success' }, refunded: { icon: 'banknote', cls: 'success' },
      refused: { icon: 'x', cls: 'danger' }, note: { icon: 'pencil', cls: '' }
    }
  };
  CM.badge = {
    status(s) { const m = CM.meta.status[s] || CM.meta.status.open; return '<span class="badge badge-' + m.cls + '">' + CM.icon(m.icon) + esc(CM.t('status.' + s)) + '</span>'; },
    verdict(v) { const m = CM.meta.verdict[v] || CM.meta.verdict.confirm_with_hmo; return '<span class="badge badge-' + m.cls + '">' + CM.icon(m.icon) + esc(CM.t('verdict.' + v)) + '</span>'; },
    /* The verdict as an inked rubber stamp (result screen) */
    stamp(v, animate) { const m = CM.meta.verdict[v] || CM.meta.verdict.confirm_with_hmo; return '<span class="stamp stamp-' + m.cls + (animate ? ' in' : '') + '">' + CM.icon(m.icon) + esc(CM.t('verdict.' + v)) + '</span>'; }
  };
  CM.eventLabel = function (e) {
    const r = e.recipient ? CM.t(e.recipient === 'hmo' ? 'recipient.hmoInline' : 'recipient.' + e.recipient) : '';
    return CM.t('event.' + e.type, { amount: CM.fmt.naira(e.amount), r });
  };
  CM.renderTimeline = function (events) {
    return '<ol class="timeline">' + events.map(function (e) {
      const m = CM.meta.event[e.type] || CM.meta.event.note;
      let note = '';
      if (e.type === 'message' && e.note) note = '“' + esc(e.note) + '”';
      else if (e.type === 'verdict') note = esc(CM.t('verdict.' + e.note));
      else if (e.note) note = esc(e.note);
      if (e.code) note = (note ? note + ' · ' : '') + 'Code: ' + esc(e.code);
      return '<li><span class="dot ' + m.cls + '">' + CM.icon(m.icon) + '</span><div class="body"><div class="what">' + esc(CM.eventLabel(e)) + '</div>' +
        (note ? '<div class="note">' + note + '</div>' : '') + '<time datetime="' + e.at + '">' + CM.fmt.dateTime(e.at) + '</time></div></li>';
    }).join('') + '</ol>';
  };
  CM.avatar = function (name, cls) {
    return '<span class="avatar' + (cls ? ' ' + cls : '') + '" style="background:' + CM.mock.colorFor(name) + '" aria-hidden="true">' + esc(CM.mock.initials(name)) + '</span>';
  };
  CM.caseItem = function (c) {
    const title = CM.t('issue.' + c.issueType);
    const sub = CM.L(c.headline);
    return '<a class="case-item" data-status="' + esc(c.status) + '" href="case.html?id=' + encodeURIComponent(c.caseId) + '">' +
      '<span class="ic">' + CM.icon(CM.meta.issue[c.issueType] || 'message') + '</span>' +
      '<span class="grow"><span class="row-between"><span class="title">' + esc(title) + '</span></span>' +
      '<span class="meta">' + esc(sub) + '</span>' +
      '<span class="row" style="flex-wrap:wrap">' + CM.badge.status(c.status) + '<span class="meta">' + esc(CM.fmt.rel(c.createdAt)) + '</span></span></span>' +
      CM.icon('chevron-right', 'chev') + '</a>';
  };

  /* HMO call bar: one-tap call. Shown even when everything else fails. */
  CM.callBar = function (hmo, askFor) {
    if (!hmo || !hmo.tel) {
      return '<a class="call-bar" href="setup.html?edit=1">' + '<span class="avatar" style="background:var(--paper-2);color:var(--brand-700)">' + CM.icon('plus') + '</span>' +
        '<span class="grow"><span class="name">' + esc(CM.t('home.setHmo')) + '</span><br><span class="ask">' + esc(CM.t('result.hmoLabel')) + '</span></span>' + CM.icon('chevron-right') + '</a>';
    }
    // "Ask for" gets its own full-width row so it never gets squeezed beside the Call button on phones
    return '<div class="call-bar">' + CM.avatar(hmo.name) + '<span class="grow"><span class="name">' + esc(hmo.name) + '</span><br><span class="phone">' + esc(hmo.phone) + '</span></span>' +
      '<a href="tel:' + esc(hmo.tel) + '" aria-label="' + esc(CM.t('result.call') + ' ' + hmo.name + ', ' + hmo.phone) + '">' + CM.icon('phone') + '<span>' + esc(CM.t('result.call')) + '</span></a>' +
      (askFor ? '<span class="ask-row ask">' + CM.icon('file') + '<span>' + esc(CM.t('result.askFor')) + ' <strong>' + esc(CM.L(askFor)) + '</strong></span></span>' : '') + '</div>';
  };
  CM.profileHmo = function () {
    const h = CM.store.profile().hmoId && CM.api.hmo(CM.store.profile().hmoId);
    return h ? { id: h.id, name: h.name, phone: h.phone, tel: h.phoneTel, email: h.email } : null;
  };

  /* ---------- Shell: top bar + bottom nav ---------- */
  function renderShell() {
    const b = document.body;
    const top = $('#topbar');
    if (top) {
      const back = b.dataset.back;
      const titleKey = b.dataset.title;
      top.className = 'topbar';
      top.innerHTML =
        (back
          ? '<a class="icon-btn back" href="' + esc(back) + '" data-i18n-attr="aria-label:common.back" data-back>' + CM.icon('arrow-left') + '</a>' +
            '<span class="topbar-title" ' + (titleKey ? 'data-i18n="' + titleKey + '"' : '') + '></span>'
          : '<a class="logo" href="home.html" aria-label="CoverMe home">' + CM.logoSvg() + '<span>Cover<span class="me">Me</span></span></a><span class="topbar-spacer"></span>') +
        '<div class="segmented" role="group" data-i18n-attr="aria-label:lang.switch" id="lang-toggle">' +
        '<button type="button" data-lang="en" aria-pressed="false">EN</button><button type="button" data-lang="pcm" aria-pressed="false" data-i18n="lang.pcm"></button></div>' +
        (b.dataset.noSos ? '' : '<button type="button" class="icon-btn sos-btn" id="sos-btn" data-i18n-attr="aria-label:common.emergency;title:common.emergency">' + CM.icon('octagon') + '</button>');
      top.querySelectorAll('[data-lang]').forEach(function (btn) {
        btn.addEventListener('click', function () { CM.i18n.set(btn.dataset.lang); syncLang(); });
      });
      const backA = top.querySelector('[data-back]');
      if (backA) backA.addEventListener('click', function (e) {
        if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1 && !b.dataset.hardBack) { e.preventDefault(); history.back(); }
      });
      const sos = $('#sos-btn');
      if (sos) sos.addEventListener('click', function () { CM.ui.emergency({}); });
      window.addEventListener('scroll', function () { top.classList.toggle('scrolled', window.scrollY > 4); }, { passive: true });
    }
    const items = [['home', 'home.html', 'home', 'nav.home'], ['cases', 'cases.html', 'folder', 'nav.cases'], ['rights', 'rights.html', 'book', 'nav.rights'], ['settings', 'settings.html', 'settings', 'nav.settings']];
    // Which nav section a page belongs to (sub-screens highlight their parent)
    const SECTION = { home: 'home', checking: 'home', result: 'home', cases: 'cases', case: 'cases', timer: 'cases', complaint: 'cases', rights: 'rights', settings: 'settings', privacy: 'settings' };
    const active = b.dataset.nav || SECTION[b.dataset.page];
    const navLinks = function () {
      return items.map(function (it) {
        return '<a href="' + it[1] + '"' + (it[0] === active ? ' aria-current="page"' : '') + '>' + CM.icon(it[2]) + '<span data-i18n="' + it[3] + '"></span>' +
          (it[0] === 'cases' ? '<span class="badge-dot overdue-count" hidden></span>' : '') + '</a>';
      }).join('');
    };
    const nav = $('#bottomnav');
    if (nav) {
      nav.className = 'bottomnav';
      nav.setAttribute('aria-label', 'Main');
      nav.innerHTML = navLinks();
      b.classList.add('has-nav');
    }

    // Desktop sidebar (CSS shows it from 1024px). Onboarding screens stay full-bleed.
    const app = $('.app');
    if (app && ['welcome', 'setup', 'offline'].includes(b.dataset.page)) app.classList.add('no-side');
    else if (app) {
      const h = CM.profileHmo();
      const side = document.createElement('aside');
      side.className = 'sidenav';
      side.setAttribute('aria-label', 'CoverMe');
      side.innerHTML =
        '<a class="logo" href="home.html" aria-label="CoverMe home">' + CM.logoSvg() + '<span>Cover<span class="me">Me</span></span></a>' +
        '<a class="new-case" href="home.html#ask"><span class="plus">' + CM.icon('plus') + '</span><span class="lbl" data-i18n="cases.new"></span>' + CM.icon('mic', 'mic') + '</a>' +
        '<nav aria-label="Main">' + navLinks() + '</nav>' +
        '<div class="side-card"><span class="eyebrow" data-i18n="result.hmoLabel"></span>' +
        (h ? '<a class="hmo" href="setup.html?edit=1">' + CM.avatar(h.name) + '<span>' + esc(h.name) + '</span></a>' +
             '<a class="tel" href="tel:' + esc(h.tel) + '">' + CM.icon('phone', 'icon-sm') + esc(h.phone) + '</a>'
           : '<a class="hmo" href="setup.html?edit=1">' + CM.icon('plus') + '<span data-i18n="home.setHmo"></span></a>') +
        '</div>' +
        '<div class="spacer"></div>' +
        '<div class="segmented full" role="group" data-i18n-attr="aria-label:lang.switch">' +
        '<button type="button" data-lang="en" aria-pressed="false">English</button><button type="button" data-lang="pcm" aria-pressed="false">Pidgin</button></div>' +
        '<button type="button" class="sos">' + CM.icon('octagon') + '<span data-i18n="common.emergency"></span></button>';
      app.prepend(side);
      side.querySelectorAll('[data-lang]').forEach(function (btn) { btn.addEventListener('click', function () { CM.i18n.set(btn.dataset.lang); syncLang(); }); });
      side.querySelector('.sos').addEventListener('click', function () { CM.ui.emergency({}); });
    }
    updateOverdueBadge();
    // Reserve space under the content for the sticky primary action (its height varies by screen)
    const bars = CM.$$('.action-bar');
    if (bars.length) {
      b.classList.add('has-action');
      const measure = function () {
        const h = Math.max.apply(null, bars.map(function (x) { return x.hidden ? 0 : x.offsetHeight; }));
        document.documentElement.style.setProperty('--action-h', h + 'px');
      };
      if ('ResizeObserver' in window) { const ro = new ResizeObserver(measure); bars.forEach(function (x) { ro.observe(x); }); }
      new MutationObserver(measure).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
      measure();
    }
    syncLang();
  }
  function syncLang() {
    CM.$$('#lang-toggle [data-lang], .sidenav [data-lang]').forEach(function (btn) { btn.setAttribute('aria-pressed', String(btn.dataset.lang === CM.i18n.lang)); });
  }
  function updateOverdueBadge() {
    const n = CM.store.cases().filter(function (c) { return c.status === 'overdue'; }).length;
    CM.$$('.overdue-count').forEach(function (el) {
      el.hidden = !n; el.textContent = n;
      if (n) el.setAttribute('aria-label', n + ' ' + CM.t('status.overdue'));
    });
  }

  /* ---------- Toast ---------- */
  function toast(msg, icon) {
    let host = $('.toast-host');
    if (!host) { host = document.createElement('div'); host.className = 'toast-host'; host.setAttribute('role', 'status'); host.setAttribute('aria-live', 'polite'); document.body.appendChild(host); }
    const t = document.createElement('div'); t.className = 'toast';
    t.innerHTML = CM.icon(icon || 'check-circle') + '<span>' + esc(msg) + '</span>';
    host.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }

  /* ---------- Bottom sheet ---------- */
  function sheet(html, opts) {
    opts = opts || {};
    const prev = document.activeElement;
    const bd = document.createElement('div'); bd.className = 'backdrop';
    const sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true');
    if (opts.label) sh.setAttribute('aria-label', opts.label);
    sh.innerHTML = '<div class="grab" aria-hidden="true"></div>' + html;
    document.body.append(bd, sh);
    CM.icons.hydrate(sh); CM.i18n.apply(sh);
    requestAnimationFrame(function () { bd.classList.add('open'); sh.classList.add('open'); });
    const focusable = sh.querySelector('button, a, input, textarea, select');
    setTimeout(function () { (focusable || sh).focus(); }, 50);
    function close() {
      bd.classList.remove('open'); sh.classList.remove('open');
      document.removeEventListener('keydown', onKey);
      setTimeout(function () { bd.remove(); sh.remove(); if (prev) prev.focus(); }, 230);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    bd.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    sh.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) close(); });
    return { el: sh, close };
  }

  /* Citation chip -> rule bottom sheet */
  function ruleSheet(ruleId) {
    const r = CM.api.rule(ruleId); if (!r) return;
    const s = sheet(
      '<div class="row-between"><span class="eyebrow">' + esc(CM.t('sheet.rule')) + ' ' + esc(r.id) + '</span>' +
      '<button class="icon-btn" data-close data-i18n-attr="aria-label:common.close">' + CM.icon('x') + '</button></div>' +
      '<h2 id="sheet-title">' + esc(CM.L(r.title)) + '</h2>' +
      (r.confidence === 'low' ? '<div class="banner banner-amber">' + CM.icon('help') + '<span>' + esc(CM.t('sheet.lowConf')) + '</span></div>' : '') +
      '<p class="rule-says">' + esc(CM.L(r.says)) + '</p>' +
      '<div class="src"><span><strong>' + esc(CM.t('sheet.source')) + ':</strong> ' + esc(r.sourceName) + '</span><span><strong>' + esc(CM.t('sheet.date')) + ':</strong> ' + esc(CM.fmt.date(r.sourceDate)) + '</span></div>' +
      '<a class="btn btn-secondary btn-block" href="' + esc(r.sourceUrl) + '" target="_blank" rel="noopener">' + CM.icon('external') + '<span>' + esc(CM.t('sheet.open')) + '</span></a>',
      { label: CM.L(r.title) });
    return s;
  }

  /* ---------- Dialogs ---------- */
  /* Resolves from the form's submit (not the dialog 'close' event, which some
     browsers delay until the next frame) so the answer is never lost. */
  function dialog(html, onDone) {
    const d = document.createElement('dialog'); d.className = 'dialog';
    d.innerHTML = '<form method="dialog" class="dialog-body">' + html + '</form>';
    document.body.appendChild(d);
    CM.icons.hydrate(d); CM.i18n.apply(d);
    let settled = false;
    function finish(value) { if (settled) return; settled = true; if (d.open) d.close(); d.remove(); onDone(value); }
    d.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); finish(e.submitter ? e.submitter.value : 'ok'); });
    d.addEventListener('cancel', function (e) { e.preventDefault(); finish('cancel'); });
    d.addEventListener('click', function (e) { if (e.target === d) finish('cancel'); }); // backdrop tap
    return d;
  }
  function confirmDialog(o) {
    return new Promise(function (resolve) {
      const d = dialog(
        (o.danger ? '<span class="dialog-icon">' + CM.icon(o.icon || 'trash') + '</span>' : '') +
        '<h2>' + esc(o.title) + '</h2><p class="muted">' + esc(o.body) + '</p>' +
        '<div class="stack"><button value="ok" class="btn btn-block ' + (o.danger ? 'btn-danger' : 'btn-primary') + '">' + esc(o.confirm) + '</button>' +
        '<button value="cancel" class="btn btn-block btn-secondary">' + esc(CM.t('common.cancel')) + '</button></div>',
        function (v) { resolve(v === 'ok'); });
      d.showModal();
    });
  }
  function promptDialog(o) {
    return new Promise(function (resolve) {
      const id = 'pd-' + Math.random().toString(36).slice(2, 6);
      const input = o.multiline
        ? '<textarea id="' + id + '" class="textarea" rows="3" placeholder="' + esc(o.placeholder || '') + '"></textarea>'
        : '<input id="' + id + '" class="input" type="' + (o.type || 'text') + '" inputmode="' + (o.type === 'number' ? 'numeric' : 'text') + '" placeholder="' + esc(o.placeholder || '') + '" ' + (o.type === 'number' ? 'min="0"' : '') + '>';
      const d = dialog('<h2>' + esc(o.title) + '</h2><div class="field"><label for="' + id + '">' + esc(o.label) + '</label>' + input + '</div>' +
        '<div class="stack"><button value="ok" class="btn btn-block btn-primary">' + esc(o.confirm || CM.t('common.save')) + '</button>' +
        '<button value="cancel" formnovalidate class="btn btn-block btn-secondary">' + esc(CM.t('common.cancel')) + '</button></div>',
        function (v) { resolve(v === 'ok' ? field.value.trim() : null); });
      const field = d.querySelector('#' + id);
      d.showModal(); field.focus();
    });
  }

  /* ---------- Emergency takeover (can appear over any screen) ---------- */
  function emergency(o) {
    o = o || {};
    if ($('.emergency')) return;
    const prev = document.activeElement;
    const el = document.createElement('div');
    el.className = 'emergency'; el.setAttribute('role', 'alertdialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'emg-title');
    el.innerHTML = '<div class="inner">' +
      '<span class="big-ic">' + CM.icon('octagon') + '</span>' +
      '<h1 id="emg-title" data-i18n="emg.title"></h1><p data-i18n="emg.body"></p>' +
      '<p class="note" data-i18n="emg.signs"></p><div class="grow"></div>' +
      '<a class="btn btn-block call-112" href="tel:112">' + CM.icon('phone') + '<span data-i18n="emg.call"></span></a>' +
      '<p class="note" data-i18n="emg.note"></p>' +
      '<button type="button" class="btn btn-block ghost-light" data-dismiss>' + CM.icon(o.onRest ? 'arrow-right' : 'x') + '<span data-i18n="' + (o.onRest ? 'emg.rest' : 'emg.close') + '"></span></button>' +
      '</div>';
    document.body.appendChild(el);
    document.body.style.overflow = 'hidden';
    CM.i18n.apply(el);
    el.querySelector('.call-112').focus();
    el.querySelector('[data-dismiss]').addEventListener('click', function () {
      el.remove(); document.body.style.overflow = '';
      if (prev && prev.focus) prev.focus();
      if (o.onRest) o.onRest();
    });
  }

  /* ---------- Show-to-desk mode: full-screen, high-contrast ---------- */
  function deskMode(text, meta) {
    const el = document.createElement('div');
    el.className = 'desk-mode'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', CM.t('desk.title'));
    el.innerHTML = '<div class="bar"><button class="icon-btn" data-x aria-label="' + esc(CM.t('desk.close')) + '">' + CM.icon('x') + '</button>' +
      '<strong>' + esc(CM.t('desk.title')) + '</strong>' +
      '<button class="icon-btn" data-rot aria-label="' + esc(CM.t('desk.rotate')) + '">' + CM.icon('rotate') + '</button></div>' +
      '<div class="stage"><div class="stage-inner"><p class="desk-text">' + esc(text) + '</p>' + (meta ? '<p class="desk-meta">' + esc(meta) + '</p>' : '') + '</div></div>';
    document.body.appendChild(el);
    const close = function () {
      if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
      el.remove();
    };
    el.querySelector('[data-x]').addEventListener('click', close);
    el.querySelector('[data-rot]').addEventListener('click', function () { el.classList.toggle('rotated'); });
    document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', k); } });
    if (el.requestFullscreen) {
      el.requestFullscreen().then(function () {
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {});
      }).catch(function () {});
    }
    el.querySelector('[data-x]').focus();
  }

  /* ---------- Read aloud ---------- */
  let speaking = false;
  function speak(text, onEnd) {
    if (!('speechSynthesis' in window)) { toast('Read aloud is not supported on this phone', 'info'); return false; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-NG'; u.rate = 0.95;
    const v = speechSynthesis.getVoices().find(function (x) { return /en-NG/i.test(x.lang); }) || speechSynthesis.getVoices().find(function (x) { return /^en/i.test(x.lang); });
    if (v) u.voice = v;
    u.onend = u.onerror = function () { speaking = false; if (onEnd) onEnd(); };
    speaking = true; speechSynthesis.speak(u);
    return true;
  }
  function stopSpeaking() { if ('speechSynthesis' in window) speechSynthesis.cancel(); speaking = false; }

  /* ---------- Clipboard ---------- */
  function copy(text) {
    const done = function () { toast(CM.t('common.copied'), 'copy'); };
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(done);
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} ta.remove();
    return Promise.resolve();
  }

  /* ---------- Offline banner ---------- */
  function offlineBanner() {
    let el = $('#offline-banner');
    if (navigator.onLine) { if (el) el.remove(); document.dispatchEvent(new Event('cm:online')); return; }
    if (el) return;
    el = document.createElement('div');
    el.id = 'offline-banner'; el.className = 'banner banner-amber offline-banner'; el.setAttribute('role', 'status');
    el.innerHTML = CM.icon('wifi-off') + '<span><strong data-i18n="offline.title"></strong><span data-i18n="' + (document.body.dataset.page === 'home' ? 'offline.body' : 'offline.bodyGeneric') + '"></span></span>';
    const top = $('#topbar'); if (top) top.after(el); else document.body.prepend(el);
    CM.i18n.apply(el);
    document.dispatchEvent(new Event('cm:offline'));
  }

  /* ---------- Overdue watcher: marks cases overdue and sends the alert ---------- */
  function notifyOverdue(c) {
    const s = CM.store.settings();
    if (!s.notifications || !('Notification' in window) || Notification.permission !== 'granted') return;
    const opts = { body: CM.t('timer.overdueNotif'), tag: 'overdue-' + c.caseId, icon: 'assets/img/icon.svg', data: { url: 'timer.html?case=' + c.caseId } };
    if (navigator.serviceWorker && navigator.serviceWorker.controller) navigator.serviceWorker.ready.then(function (r) { r.showNotification(CM.t('timer.overdueTitle'), opts); });
    else try { new Notification(CM.t('timer.overdueTitle'), opts); } catch (e) {}
  }
  function watchOverdue() {
    CM.store.cases().forEach(function (c) {
      if (c.status === 'waiting_hmo' && c.timer && !c.timer.stoppedAt && CM.api.timerState(c).remaining <= 0) {
        CM.api.getCase(c.caseId).then(function (x) { if (x && x.status === 'overdue') { notifyOverdue(x); updateOverdueBadge(); document.dispatchEvent(new CustomEvent('cm:overdue', { detail: x })); } });
      }
    });
  }

  /* ---------- Theme ---------- */
  function applyTheme() {
    const t = CM.store.settings().theme;
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  }

  CM.ui = { toast, sheet, ruleSheet, confirm: confirmDialog, prompt: promptDialog, emergency, deskMode, speak, stopSpeaking, copy, applyTheme, updateOverdueBadge, notifyOverdue, get speaking() { return speaking; } };

  /* ---------- Boot ---------- */
  CM.boot = function () {
    const page = document.body.dataset.page;
    // Consent gate: every screen except welcome + privacy needs the consent tap first
    if (!['welcome', 'privacy', 'notfound'].includes(page) && !CM.store.consent()) { location.replace('index.html'); return false; }
    applyTheme();
    renderShell();
    CM.icons.hydrate(document);
    CM.i18n.apply(document);
    offlineBanner();
    window.addEventListener('online', offlineBanner);
    window.addEventListener('offline', offlineBanner);
    document.addEventListener('cm:lang', function () { syncLang(); });
    watchOverdue(); setInterval(watchOverdue, 5000);
    // Service worker: off on localhost so edits show on reload (add ?sw=1 to test offline locally)
    const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    if ('serviceWorker' in navigator && location.protocol.startsWith('http') && (!local || CM.qs('sw') === '1')) navigator.serviceWorker.register('sw.js').catch(function () {});
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); CM.installPrompt = e; document.dispatchEvent(new Event('cm:installable')); });
    return true;
  };
})();
