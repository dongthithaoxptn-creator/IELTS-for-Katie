/* Offline cache for IELTS Studio (network-first for app files so updates arrive; API calls are never cached) */
const CACHE = 'ielts-studio-v10';
const FILES = ['./', 'index.html', 'css/app.css', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'js/core.js', 'js/dict.js', 'js/ai.js', 'js/media.js', 'js/main.js',
  'js/data/vocab.js', 'js/data/phrases.js', 'js/data/reading.js', 'js/data/books.js', 'js/data/writing.js', 'js/data/speaking.js',
  'js/views/questions.js', 'js/views/home.js', 'js/views/vocab.js', 'js/views/quiz.js', 'js/views/reading.js', 'js/views/listening.js', 'js/views/writing.js', 'js/views/speaking.js', 'js/views/progress.js', 'js/views/settings.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
