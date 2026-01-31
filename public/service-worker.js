// Service Worker for Push Notifications

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push event with no data');
    return;
  }

  try {
    const options = event.data.json();
    
    // Default notification options
    const notificationOptions = {
      badge: options.badge || '🔔',
      icon: options.icon || '/favicon.ico',
      tag: options.tag || 'notification',
      requireInteraction: options.requireInteraction || false,
      data: options.data || {},
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'open',
          title: 'View',
          icon: '/icons/open.png'
        },
        {
          action: 'close',
          title: 'Dismiss',
          icon: '/icons/close.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(
        options.title || 'Notification',
        notificationOptions
      )
    );
  } catch (e) {
    console.error('Error handling push notification:', e);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // If not, open a new window/tab with the target URL
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification dismissal
self.addEventListener('notificationclose', (event) => {
  console.log('Notification dismissed:', event.notification.tag);
});

// Periodic sync for notifications (background sync)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(
      fetch('/api/sync-notifications')
        .then(response => response.json())
        .then(data => {
          if (data.notifications) {
            data.notifications.forEach(notification => {
              self.registration.showNotification(notification.title, {
                body: notification.body,
                icon: notification.icon,
                tag: notification.tag
              });
            });
          }
        })
        .catch(error => console.error('Sync failed:', error))
    );
  }
});
