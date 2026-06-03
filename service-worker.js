// Service Worker — Sweetie Cake POS
// Membuat aplikasi bisa dibuka offline setelah sekali dimuat.
const CACHE = "sweetiecake-pos-v1";
const SHELL = [
  "./",
  "index.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c =>
      // tambahkan satu per satu agar 1 gagal tidak membatalkan semua
      Promise.allSettled(SHELL.map(u => c.add(u).catch(() => {})))
    )
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  // strategi: cache dulu, lalu jaringan; hasil jaringan disimpan untuk offline berikutnya
  e.respondWith(
    caches.match(req).then(cached => {
      const net = fetch(req).then(res => {
        try {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        } catch (err) {}
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
