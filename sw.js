const CACHE_NAME = 'radio-sudo-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json'
];

// Installation : mise en cache du shell de l'app (pas les mp3/mp4, trop lourds pour le cache)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Stratégie : cache d'abord pour le shell, réseau direct pour les médias (audio/vidéo)
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  const isMedia = /\.(mp3|mp4)$/i.test(url);

  if (isMedia) {
    // Médias : toujours depuis le réseau, pas de mise en cache (trop volumineux)
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        // Mise en cache des nouvelles ressources du shell (icônes, css, etc.)
        if (response && response.status === 200 && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
