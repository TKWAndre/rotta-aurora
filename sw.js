const V = 'aurora-v3';
const FILES = ['./', './index.html', './manifest.json', './js/art.js', './js/world.js', './js/pixel.js', './js/rooms.js', './js/audio.js', './js/engine.js',
  './story/c1.js', './story/c2.js', './story/c3.js', './story/c4.js', './story/c5.js', './story/c6.js', './story/c7.js', './story/c8.js', './story/c9.js', './story/cinematics.js',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png',
  ...['lutece','libellula','rust','garden','market','cathedral','storm','silence','akatsuki','throne','dawn','aurora'].map(n => './cine/' + n + '.jpg')];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => null)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(res => { if (!res.ok) return res; const cp = res.clone(); caches.open(V).then(c => c.put(e.request, cp)); return res; })));
});
