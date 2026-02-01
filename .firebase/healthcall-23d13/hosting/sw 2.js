const CACHE_NAME = 'healthcall-v2.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/healthcall-icon.png',
  '/healthcall-logo.png',
];

// Instalar o Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((error) => {
        console.warn('Falha ao fazer cache de alguns recursos:', error);
      });
    })
  );
  self.skipWaiting();
});

// Ativar o Service Worker
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

// Estratégia de cache: network first, fall back to cache
self.addEventListener('fetch', (event) => {
  // Pular requisições não-GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Não fazer cache de requisições não-sucesso
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Fazer cache de respostas bem-sucedidas
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // Retornar do cache se a rede falhar
        return caches.match(event.request).then((response) => {
          return response || new Response('Offline - recurso não disponível', { status: 503 });
        });
      })
  );
});

