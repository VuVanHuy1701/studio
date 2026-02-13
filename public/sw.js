
const CACHE_NAME = 'task-compass-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Task Update';
  const options = {
    body: data.body || 'You have a new update in Task Compass.',
    icon: 'https://picsum.photos/seed/taskicon192/192/192',
    badge: 'https://picsum.photos/seed/taskbadge/96/96',
    requireInteraction: true,
    data: data.url || '/'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through for now to ensure online functionality
  return;
});
