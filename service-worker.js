// service-worker.js — Expense Tracker
const CACHE_VERSION = 'v6.2.0'; // bump this every time we deploy new UI
const CACHE_NAME = `expense-tracker-${CACHE_VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json'
];

// Install: cache basic shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: clean old caches
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
// ✅ Skip caching Firestore POST requests
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Do NOT cache POST or Firestore requests
  if (req.method !== 'GET' ||
      req.url.includes('firestore.googleapis.com')) {
    return;
  }

  // For navigation: always serve cached shell fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((cached) =>
        cached || fetch(req).catch(() => caches.match('./index.html'))
      )
    );
    return;
  }

  // Static assets: network first with fallback
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
