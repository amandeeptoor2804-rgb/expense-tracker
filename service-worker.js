// service-worker.js — Expense Tracker
const CACHE_VERSION = 'v3.0.0';
const CACHE_NAME = `expense-tracker-${CACHE_VERSION}`;
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json'
];

// Install: cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('expense-tracker-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - For navigations (HTML pages): try cache first, then network fallback.
// - For others: network first, fallback to cache if offline.
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Navigation requests (address bar / link clicks)
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((cached) =>
        cached ||
        fetch(req).catch(() => caches.match('./index.html'))
      )
    );
    return;
  }

  // Static assets & runtime requests
  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
