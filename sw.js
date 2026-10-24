const CACHE_NAME = 'promptflow-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './dist/parsers.bundle.js',
  './js/parsers.js',
  './js/app.js',
  './manifest.json',
  './icons/icon.svg',
  './sample/sample-talk.md',
  './sample/sample-talk.txt'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

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
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache external requests if successful and standard http(s)
        if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith('http')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If offline and request is for page, return cached index
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
