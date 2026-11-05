const CACHE_NAME = 'math-dojo-v7'; // Sube este número si haces cambios gigantes

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './signos.html',
  './algebra.html',
  './notables.html',
  './factor.html',
  './balanza.html',
  './fracciones.html',
  './rectas.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Borrando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// NUEVA ESTRATEGIA: "Network First" (Red primero, caché después)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Si hay internet y responde bien, actualizamos la caché "en silencio" con la versión nueva
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // Si falla (estamos offline), sacamos la versión de la caché
        return caches.match(event.request);
      })
  );
});