/**
 * 字旅手帳 — 極簡 Service Worker
 * 僅快取站內靜態檔案，不呼叫任何外部 API，離線時仍可開啟 App 操作已匯入的卡片。
 */

const CACHE_NAME = 'zilv-cache-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/srs.js',
  './js/storage.js',
  './js/tts.js',
  './js/data/packs.js',
  './manifest.webmanifest',
  './icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached);
    })
  );
});
