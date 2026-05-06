const CACHE_NAME = 'hiaos-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Install Event - Caching App Shell
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Activate Event - Cleaning old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-While-Revalidate Strategy
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Skip API requests (handled by axios interceptors & indexDB)
  if (event.request.url.includes('/api/')) return;

  const isNavigation = event.request.mode === 'navigate';
  const isAsset = ['script', 'style', 'worker'].includes(event.request.destination);

  if (isNavigation || isAsset) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => cachedResponse || fetch(event.request))
  );
});

// Background Sync - For offline form submissions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  // Logic to pull from IndexedDB and push to API
  console.log('[SW] Attempting to sync offline data...');
  // This would typically involve a call to your local database (Dexie/idb)
}

// Push Notifications
self.addEventListener('push', event => {
  const data = event.data?.json() || { title: 'HIAOS Alert', body: 'New operational update available.' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/logo192.png',
      badge: '/badge.png'
    })
  );
});
