/* Offline support: network first (so updates show up immediately), cache as fallback. Pages are cached as they are visited. */
const CACHE = 'collage-studio-__VERSION__';
const ASSETS = ['./', 'css/style.css', 'js/i18n.js', 'js/data.js', 'js/app.js', 'vendor/konva.min.js', 'vendor/jspdf.umd.min.js', 'icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r, { cache: 'no-cache' }).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); } return res; }).catch(() => caches.match(r, { ignoreSearch: true })));
});
