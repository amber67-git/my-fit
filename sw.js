// My Fit service worker: app shell offline + updates on reload
const VERSION = 'v0.21.2';
const SHELL = 'myfit-shell-' + VERSION;
const RUNTIME = 'myfit-runtime';
const SHELL_FILES = ['./', './index.html', './firebase-config.js?v=20261019b', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('myfit-shell-') && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Firebase / Google auth and Firestore traffic: never intercept
  if (/googleapis\.com|firebaseapp\.com|firebaseio\.com|google\.com|gstatic\.com\/firebasejs/.test(url.host + url.pathname) && !/gstatic\.com\/firebasejs/.test(url.href)) return;
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
