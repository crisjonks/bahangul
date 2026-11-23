// Service worker. The build step fills in the file list and version.
const V = 'bh-__VERSION__', PRE = __PRECACHE__;
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(['./', ...PRE])).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('bh-') && ![V, 'bh-audio', 'bh-meta', 'bh-fonts'].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const first = async (name, req) => { const c = await caches.open(name), m = await c.match(req); if (m) return m; const r = await fetch(req); if (r.ok) c.put(req, r.clone()); return r; };
const swr = async (name, req) => { const c = await caches.open(name), m = await c.match(req), n = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => m); return m || n; };
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) { if (/fonts\.(googleapis|gstatic)\.com/.test(u.host)) e.respondWith(swr('bh-fonts', r)); return; }
  if (r.mode === 'navigate') { e.respondWith(fetch(r).catch(() => caches.match('./'))); return; }
  if (u.pathname.includes('/audio/')) { e.respondWith(first('bh-audio', r)); return; }
  e.respondWith(caches.match(r).then(m => m || fetch(r)));
});
async function meta() { const c = await caches.open('bh-meta'), r = await c.match('meta.json'); return r ? r.json() : {}; }
async function updateWidget() {
  if (!self.widgets) return;
  const m = await meta(), t = await (await fetch('widgets/streak-template.json')).text();
  await self.widgets.updateByTag('streak', { template: t, data: JSON.stringify({ streak: m.streak || 0, today: m.today || 0, goal: m.goal || 50, status: m.last === new Date().toLocaleDateString('en-CA') ? 'Done for today' : 'Study today to keep your streak' }) });
}
self.addEventListener('widgetinstall', e => e.waitUntil(updateWidget()));
self.addEventListener('widgetresume', e => e.waitUntil(updateWidget()));
self.addEventListener('widgetclick', e => { if (e.action === 'open') e.waitUntil(self.clients.openWindow('./')); });
self.addEventListener('message', e => { if (e.data && e.data.type === 'meta') e.waitUntil(updateWidget()); });
self.addEventListener('periodicsync', e => {
  if (e.tag !== 'bh-reminder') return;
  e.waitUntil((async () => {
    const m = await meta(); if (!m.rem || !m.rem.on) return;
    const n = new Date(), [h, mi] = m.rem.t.split(':').map(Number);
    if (m.last === n.toLocaleDateString('en-CA') || n.getHours() * 60 + n.getMinutes() < h * 60 + mi) return;
    if ((await self.registration.getNotifications({ tag: 'bh-reminder' })).length) return;
    await self.registration.showNotification('Keep your streak alive', { body: 'A 5-minute lesson keeps your ' + (m.streak || 0) + '-day streak going.', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'bh-reminder' });
  })());
});
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(self.clients.matchAll({ type: 'window' }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./'))); });
