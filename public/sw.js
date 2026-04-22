const CACHE_NAME = 'healthcall-static-v3.1.0';
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
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }

          return new Response('Recurso indisponível offline', { status: 503 });
        });
    })
  );
});
