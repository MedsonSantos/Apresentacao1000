// sw.js — Service Worker para Jantinha Nota 1000
const CACHE_NAME = 'jantinha-v1';
const urlsToCache = [
  '/',
  '/apresentacao.html',
  '/style.css',
  '/logo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.10.2/lottie.min.js'
];

// Instalação: cache inicial
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache aberto:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativação: limpeza de caches antigos
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[SW] Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch: strategy cache-first (ótimo para conteúdo estático)
self.addEventListener('fetch', event => {
  // Não interceptar embeds externos (Instagram, Facebook etc.)
  if (
    event.request.url.includes('instagram.com') ||
    event.request.url.includes('facebook.com') ||
    event.request.url.includes('google.com') ||
    event.request.url.includes('lottiefiles.com')
  ) {
    return; // deixa passar direto
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit → retorna resposta do cache
        if (response) {
          return response;
        }
        // Senão, busca na rede
        return fetch(event.request).then(
          networkResponse => {
            // Só cacheia respostas 2xx e de tipo 'basic' (não cross-origin)
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clonar resposta para armazenar e retornar
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache));

            return networkResponse;
          }
        );
      })
  );
});