const V = 'aurora-20261120-164547';
const CORE = ['./', './index.html', './manifest.json', './js/art.js', './js/world.js', './js/pixel.js', './js/sprites.js', './js/modern.js', './js/rooms.js', './js/audio.js', './js/engine.js',
  './story/c1.js', './story/c2.js', './story/c3.js', './story/c4.js', './story/c5.js', './story/c6.js', './story/c7.js', './story/c8.js', './story/c9.js', './story/cinematics.js'];
const EXTRA = ['./icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png',
  ...['lutece','libellula','rust','garden','market','cathedral','storm','silence','akatsuki','throne','dawn','aurora'].map(n => './cine/' + n + '.jpg')];
const FILES = [...CORE, ...EXTRA];
// scarica ignorando la cache HTTP (evita copie vecchie dalla CDN) con alcuni tentativi
async function grab(c, f, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(new Request(f, { cache: 'reload' })); if (r.ok) { await c.put(f, r); return true; } } catch (e) { }
    await new Promise(r => setTimeout(r, 400 * (i + 1)));
  }
  return false;
}
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    const core = await Promise.all(CORE.map(f => grab(c, f)));
    if (core.includes(false)) throw new Error('file essenziali non scaricati'); // il vecchio SW resta attivo
    await Promise.all(EXTRA.map(f => grab(c, f)));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('aurora-') && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('message', async e => {
  if (e.data !== 'status') return;
  const c = await caches.open(V); const have = await Promise.all(FILES.map(f => c.match(f)));
  const missing = FILES.filter((f, i) => !have[i]);
  if (missing.length) { await Promise.all(missing.map(f => grab(c, f, 2))); }
  const now = await Promise.all(FILES.map(f => c.match(f)));
  e.source && e.source.postMessage({ type: 'status', version: V, total: FILES.length, cached: now.filter(Boolean).length });
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await caches.match('./index.html') : null);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(req, cp)); }
      return res;
    } catch (err) {
      return new Response('', { status: 504, statusText: 'offline' });
    }
  })());
});
