/* CoverMe — tiny client store.
   Template only: cases are kept in localStorage so every screen works offline
   without a backend. In production the API owns cases; the client keeps only
   language, theme, consent and the last answer (offline cache). */
window.CM = window.CM || {};
CM.store = (function () {
  const P = 'cm.';
  function get(k, def) {
    try { const v = localStorage.getItem(P + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; }
  }
  function set(k, v) { try { localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) {} }
  function remove(k) { try { localStorage.removeItem(P + k); } catch (e) {} }

  return {
    get, set, remove,
    consent() { return get('consent', false); },
    setConsent(v) { set('consent', v); },
    profile() { return get('profile', { hmoId: null, planType: null, hospital: '' }); },
    setProfile(p) { set('profile', Object.assign(this.profile(), p)); },
    settings() { return Object.assign({ theme: 'system', notifications: false, demoMode: false, simError: false }, get('settings', {})); },
    setSettings(p) { set('settings', Object.assign(this.settings(), p)); },
    recentHmos() { return get('recentHmos', []); },
    pushRecentHmo(id) { const r = this.recentHmos().filter(function (x) { return x !== id; }); r.unshift(id); set('recentHmos', r.slice(0, 3)); },
    cases() { return get('cases', []); },
    saveCases(list) { set('cases', list); },
    lastResult() { return get('lastResult', null); },
    setLastResult(c) { set('lastResult', c); },
    /* One-shot hand-off between screens (home -> checking) */
    pending() { try { return JSON.parse(sessionStorage.getItem(P + 'pending')); } catch (e) { return null; } },
    setPending(p) { try { sessionStorage.setItem(P + 'pending', JSON.stringify(p)); } catch (e) {} },
    clearPending() { try { sessionStorage.removeItem(P + 'pending'); } catch (e) {} },
    clearAll() {
      try {
        Object.keys(localStorage).filter(function (k) { return k.startsWith(P) && k !== P + 'lang'; }).forEach(function (k) { localStorage.removeItem(k); });
        sessionStorage.clear();
      } catch (e) {}
    }
  };
})();
