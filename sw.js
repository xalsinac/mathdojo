const CACHE_NAME = 'math-dojo-v10'; // Emblemas en vectores puros y cápsulas de cinturón centradas

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './signos.html',
  './algebra.html',
  './notables.html',
  './factor.html',
  './ronin.html',
  './balanza.html',
  './fracciones.html',
  './rectas.html',
  './dojo-audio.js',
  './dojo-stats.js',
  './dojo-theme.css',
  './crests/sensei-algebra.svg',
  './crests/ninja-signos.svg',
  './crests/katana-binomios.svg',
  './crests/maestro-factor.svg',
  './crests/ronin-potencias.svg',
  './crests/balanza-monje.svg',
  './crests/shuriken-fracciones.svg',
  './crests/dragon-rectas.svg',
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

// ESTRATEGIA: Network First (Red primero con fallback a caché offline)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
