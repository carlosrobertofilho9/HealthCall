const CACHE_NAME = 'healthcall-static-v3.2.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/healthcall-icon.png',
  '/healthcall-logo.png',
  '/healthcall-logo-header.png',
];

const STATIC_EXTENSIONS = [
  '.js',
  '.css',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.webp',
  '.ico',
  '.woff',
  '.woff2',
];

function isSupabaseDynamicPath(pathname) {
  return (
    pathname.startsWith('/rest/v1') ||
    pathname.startsWith('/auth/v1') ||
    pathname.startsWith('/realtime/v1') ||
    pathname.startsWith('/storage/v1') ||
    pathname.startsWith('/functions/v1')
  );
}

function isCacheableStaticRequest(request) {
  if (request.method !== 'GET') return false;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return false;
  if (isSupabaseDynamicPath(url.pathname)) return false;

  if (request.mode === 'navigate') return true;

  return STATIC_EXTENSIONS.some((extension) => url.pathname.endsWith(extension));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (!isCacheableStaticRequest(event.request)) {
    return;
  }

  const url = new URL(event.request.url);
  const isNavigation = event.request.mode === 'navigate' || 
                       url.pathname === '/index.html' || 
                       url.pathname === '/';

  // Estratégia Network First para navegação e HTML principal
  // Isso garante que o usuário sempre receba a versão mais recente se estiver online
  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Se falhar a rede (offline), busca no cache
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Estratégia Cache First para outros recursos estáticos (JS, CSS, Imagens)
  // Como o Vite gera nomes de arquivos com hashes únicos, o cache aqui é seguro
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }

          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return response;
        })
        .catch(() => {
          return new Response('Recurso indisponível offline', { status: 503 });
        });
    })
  );
});

