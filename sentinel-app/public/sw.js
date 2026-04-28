const CACHE_NAME = 'sentinel-core-v3.5';

// Core assets to cache immediately
const PRECACHE_URLS = [
  '/',
  '/index.html'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Strategy: Cache First, Network Fallback
  // Targeted for CDN libraries and TensorFlow models (heavy assets)
  if (
    url.hostname.includes('esm.sh') || 
    url.hostname.includes('tailwindcss.com') ||
    url.hostname.includes('storage.googleapis.com') || // TFJS Models
    url.hostname.includes('tfhub.dev') ||
    url.hostname.includes('jsdelivr.net')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'cors' && response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return response;
          })
          .catch((err) => {
            console.warn('Fetch failed (offline):', event.request.url);
          });
      })
    );
  } else {
    // Strategy: Stale-While-Revalidate for local app files
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          try {
             if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, responseToCache);
                });
             }
          } catch (e) {
             console.warn('Cache put failed:', e);
          }
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      })
    );
  }
});
