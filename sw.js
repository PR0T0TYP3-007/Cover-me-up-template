/* CoverMe service worker: offline shell + timer-overdue notification clicks.
   Network-first for our pages and assets (fresh after every deploy), cache-first for fonts.
   Bump VERSION whenever shell files change. */
const VERSION = 'coverme-v4';
const SHELL = [
  './', 'index.html', 'setup.html', 'home.html', 'checking.html', 'result.html', 'timer.html', 'complaint.html',
  'cases.html', 'case.html', 'rights.html', 'settings.html', 'privacy.html', 'offline.html',
  'manifest.webmanifest', 'assets/css/styles.css', 'assets/img/icon.svg',
  'assets/js/icons.js', 'assets/js/i18n.js', 'assets/js/mock-data.js', 'assets/js/store.js', 'assets/js/api.js',
  'assets/js/ui.js', 'assets/js/illustrations.js', 'assets/js/voice.js',
  'assets/js/pages/welcome.js', 'assets/js/pages/setup.js', 'assets/js/pages/home.js', 'assets/js/pages/checking.js',
  'assets/js/pages/result.js', 'assets/js/pages/timer.js', 'assets/js/pages/complaint.js', 'assets/js/pages/cases.js',
  'assets/js/pages/case.js', 'assets/js/pages/rights.js', 'assets/js/pages/settings.js', 'assets/js/pages/privacy.js',
  '404.html', 'assets/js/pages/notfound.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.includes('/api/')) return; // never cache API responses with personal data
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); } return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('offline.html')))
    );
    return;
  }
  const save = (res) => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); } return res; };
  // Our own CSS/JS: network first, so a new deploy shows up on the next visit; cache when offline.
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(save).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  // Fonts never change: cache first.
  if (url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com')) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then(save)));
  }
});

/* Production: the API's pg-boss job sends a Web Push at the deadline. */
self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(data.title || 'Your HMO is late', {
    body: data.body || 'The 1-hour deadline has passed. Tap to escalate.',
    icon: 'assets/img/icon.svg', tag: data.tag, data: { url: data.url || 'cases.html' }
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || 'cases.html';
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((wins) => {
    const w = wins.find((x) => 'focus' in x);
    if (w) { w.navigate(url); return w.focus(); }
    return self.clients.openWindow(url);
  }));
});
