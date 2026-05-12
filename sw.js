const CACHE = 'festates-v5';
const BASE = '';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  // NO skipWaiting — wait for all tabs to close before activating new SW
  // This prevents the SW from interrupting active Firebase sessions
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  // NO clients.claim() — don't forcibly take over existing tabs
  // Existing tabs keep their current SW; new tabs get the new SW
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Never intercept Firebase, Google APIs, or weather requests
  if (url.includes('firebase') || url.includes('googleapis') || url.includes('gstatic') || url.includes('open-meteo') || url.includes('firebaseapp') || url.includes('firebasestorage')) return;

  if (e.request.mode === 'navigate') {
    // Network-first for HTML pages — always get latest version
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Network-first for everything else
  e.respondWith(
    fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
