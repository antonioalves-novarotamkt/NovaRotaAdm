// Minimal service worker — exists only so the browser considers this app
// installable. It intentionally does not cache anything: every request
// still goes straight to the network, so dashboard data is never stale.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // no-op: let the browser handle the request normally
});
