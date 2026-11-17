// Offline support: serve the saved copy instantly, refresh it in the background.
// Bump VERSION when you change files so iPads pick up the update.
const VERSION = "super-sounds-v11";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./words.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./sounds/flush.mp3",
  "./sounds/whoosh.mp3",
  "./sounds/camera.mp3",
  "./sounds/static.mp3",
  "./sounds/dog.mp3",
  "./sounds/cat.mp3",
  "./sounds/cow.mp3",
  "./sounds/duck.mp3",
  "./sounds/sheep.mp3",
  "./sounds/horse.mp3",
  "./sounds/rooster.mp3",
  "./sounds/owl.mp3",
  "./sounds/bird.mp3",
  "./sounds/frog.mp3",
  "./sounds/train.mp3",
  "./sounds/carhorn.mp3",
  "./sounds/bikebell.mp3",
  "./sounds/siren.mp3",
  "./sounds/ship.mp3",
  "./sounds/plane.mp3",
  "./sounds/helicopter.mp3",
];

self.addEventListener("install", (e) => {
  // cache: "reload" skips the browser's own cache so every file is the new version.
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: "reload" })))));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const fresh = fetch(req)
        .then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      if (cached) {
        e.waitUntil(fresh);
        return cached;
      }
      return fresh;
    })
  );
});
