const CACHE = 'basij-letter-v2';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c =>
    Promise.all(SHELL.map(u => c.add(u).catch(() => {})))
  ).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = /(fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com)$/.test(url.hostname);

  if (url.origin === location.origin) {
    // برنامه: ابتدا کش، سپس شبکه (و به‌روزرسانی کش)
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => {
      const net = fetch(req).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
        return res;
      }).catch(() => hit || caches.match('./index.html'));
      return hit || net;
    }));
  } else if (isFont) {
    // فونت‌ها: نمایش از کش و به‌روزرسانی در پس‌زمینه
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(res => { c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
  }
});
