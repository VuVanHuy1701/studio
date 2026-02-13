const CACHE_NAME = 'task-compass-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  'https://picsum.photos/seed/taskicon192/192/192'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: 'https://picsum.photos/seed/taskicon192/192/192',
    badge: 'https://picsum.photos/seed/taskicon192/192/192',
    requireInteraction: true,
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
