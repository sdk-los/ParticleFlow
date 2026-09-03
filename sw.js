/**
 * Service Worker для PWA "ParticleFlow"
 * Кэширует основные файлы при установке для работы офлайн.
 */

// GitHub Actions подставляет SHA коммита перед публикацией. Благодаря этому
// каждый деплой получает отдельный кэш, а уже установленная PWA замечает
// обновлённый Service Worker.
const CACHE_NAME = 'particleflow-__BUILD_ID__';
const BASE_PATH = new URL('./', self.location.href);

const ASSETS_TO_CACHE = [
  new URL('./', self.location.href).href,
  new URL('./index.html', self.location.href).href,
  new URL('./css/style.css', self.location.href).href,
  new URL('./js/constants.js', self.location.href).href,
  new URL('./js/config.js', self.location.href).href,
  new URL('./js/utils.js', self.location.href).href,
  new URL('./js/particle.js', self.location.href).href,
  new URL('./js/renderer.js', self.location.href).href,
  new URL('./js/pointer.js', self.location.href).href,
  new URL('./js/settings.js', self.location.href).href,
  new URL('./js/animation.js', self.location.href).href,
  new URL('./js/main.js', self.location.href).href,
  new URL('./manifest.json', self.location.href).href,
  new URL('./icons/icon-192.png', self.location.href).href,
  new URL('./icons/icon-512.png', self.location.href).href,
];

// Установка — кэшируем основные файлы
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Активируем сразу, не ждём закрытия страницы
  self.skipWaiting();
});

// Активация — удаляем старые кэши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('particleflow-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Берём управление всеми открытыми страницами
  self.clients.claim();
});

// Перехват запросов — сначала кэш, потом сеть
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Если есть в кэше — возвращаем
      if (cachedResponse) {
        return cachedResponse;
      }
      // Иначе — запрашиваем из сети
      return fetch(event.request).then((networkResponse) => {
        // Не кэшируем ответы, которые не OK
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        // Кэшируем новый запрос
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      });
    })
  );
});
