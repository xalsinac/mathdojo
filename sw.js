const CACHE_NAME = 'math-dojo-v4';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './signos.html',
  './algebra.html',
  './notables.html',
  './factor.html',
  './balanza.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalación: guarda todos los archivos y salta la espera
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activación: limpia las cachés de versiones anteriores automáticamente
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

// Fetch: sirve desde la caché si existe, o busca en la red si hay conexión
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});