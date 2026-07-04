/**
 * Service Worker для PWA "Система частиц"
 * Кэширует основные файлы при установке для работы офлайн.
 */

const CACHE_NAME = 'particles-v1';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/script.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
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
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Берём управление всеми открытыми страницами
  self.clients.claim();
});

// Перехват запросов — сначала кэш, потом сеть
self.addEventListener('fetch', (event) => {
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