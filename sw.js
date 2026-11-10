// My Fit service worker: app shell offline + updates on reload
const VERSION = 'v0.31.0';
const SHELL = 'myfit-shell-' + VERSION;
const RUNTIME = 'myfit-runtime';
const SHELL_FILES = ['./', './index.html', './firebase-config.js?v=20261019b', './manifest.webmanifest?v=0.31.0', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];
// cache: 'reload' skips the browser's HTTP cache, so a new version never stores an older copy of a shell file
self.addEventListener('install', e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('myfit-shell-') && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Firebase / Google auth and Firestore traffic: never intercept
  if (/googleapis\.com|firebaseapp\.com|firebaseio\.com|google\.com|gstatic\.com\/firebasejs/.test(url.host + url.pathname) && !/gstatic\.com\/firebasejs/.test(url.href)) return;
  if (url.origin === location.origin && url.pathname.endsWith('/manifest.webmanifest')) {
    // the manifest decides how the app installs (its id): always network first, cache only as an offline fallback
    const net = fetch(req, { cache: 'no-store' }).then(r => ({ r, copy: r && r.ok ? r.clone() : null }));
    e.respondWith(net.then(x => x.r).catch(() => caches.match(req, { ignoreSearch: true })));
    // keep the worker alive until the fresh copy is stored for offline use
    e.waitUntil(net.then(x => x.copy && caches.open(SHELL).then(c => c.put(req, x.copy))).catch(() => {}));
    return;
  }
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    // network first so updates arrive; fall back to the cached shell offline
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(SHELL).then(c => c.put('./index.html', copy)); return r; }).catch(() => caches.match('./index.html')));
    return;
  }
  if (url.origin === location.origin || /gstatic\.com\/firebasejs|fonts\.(googleapis|gstatic)\.com/.test(url.href)) {
    // cache first, refresh in the background
    e.respondWith(caches.match(req).then(hit => { const net = fetch(req).then(r => { if (r && r.ok) caches.open(url.origin === location.origin ? SHELL : RUNTIME).then(c => c.put(req, r.clone())); return r; }).catch(() => hit); return hit || net; }));
  }
});
