const CACHE = "word-bank-v2";
const PRECACHE = [
  "/word-bank/",
  "/word-bank/index.html",
  "/word-bank/styles.css",
  "/word-bank/script.js",
  "/word-bank/admin.html",
  "/word-bank/admin.css",
  "/word-bank/admin.js",
  "/word-bank/favicon.png",
  "/word-bank/apple-touch-icon.png",
  "/word-bank/icons/icon-192.png",
  "/word-bank/icons/icon-512.png",
  "/word-bank/manifest.json",
  "/word-bank/admin.webmanifest",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // Always fetch data files fresh; serve everything else from cache with network fallback
  if (url.pathname.includes("/data/")) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
  } else {
    e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
      const clone = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, clone));
      return res;
    })));
  }
});
