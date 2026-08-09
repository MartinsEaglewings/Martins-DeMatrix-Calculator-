// Change version number whenever you update your static files
const CACHE_NAME = 'static-site-v1';

// List every static asset your website needs to render offline
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './favicon.ico',
  './logo.png'
];

// 1. INSTALL: Pre-cache all essential static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Force active state immediately without waiting for page refresh
  self.skipWaiting();
});

// 2. ACTIVATE: Clean up old cache versions automatically
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. FETCH: Serve cached static assets & handle network fallbacks
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests (e.g., forms/POST requests)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached file if found
      if (cachedResponse) {
        return cachedResponse;
      }

      // If missing from cache, fetch from network and save a copy dynamically
      return fetch(event.request)
        .then((networkResponse) => {
          // Verify valid response before saving
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            return networkResponse;
          }

          const responseToClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToClone);
          });

          return networkResponse;
        })
        .catch(() => {
          // Offline Fallback for page navigation
          if (event.request.mode === 'navigate') {
            return caches.match('./') || caches.match('./index.html');
          }
        });
    })
  );
});
