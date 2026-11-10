// Eduardo Hair Gestão — service worker: abre rápido e recebe notificações com o app fechado
const CACHE = "edu-gestao-v7";
const ARQUIVOS = ["./", "app.css", "app.js", "loja.js", "catalogo.js", "catalogo.json", "qr.js", "pix.js", "divisao.js", "extras.js", "manifest.json", "icone-192.png", "../icone-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("edu-gestao") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Rede primeiro (dados sempre atualizados); cache só se estiver sem internet
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then((r) => { const c = r.clone(); caches.open(CACHE).then((k) => k.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data.json(); } catch { d = { titulo: "Eduardo Hair", corpo: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.titulo || "Eduardo Hair Gestão", {
    body: d.corpo || "",
    icon: "icone-192.png",
    badge: "icone-192.png",
    tag: d.agendamento || d.aviso || undefined,
    renotify: true,
    vibrate: [120, 60, 120],
    data: { agendamento: d.agendamento || null, tipo: d.tipo || null },
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const ag = e.notification.data && e.notification.data.agendamento;
  const tipo = e.notification.data && e.notification.data.tipo;
  const alvo = new URL(ag ? "./#ag=" + ag : tipo === "pedido" ? "./#pedidos" : "./", self.registration.scope).href;
  e.waitUntil((async () => {
    const abertas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of abertas) {
      if (c.url.startsWith(self.registration.scope)) {
        await c.focus();
        c.postMessage(ag ? { agendamento: ag } : { abrir: "avisos" });
        return;
      }
    }
    await self.clients.openWindow(alvo);
  })());
});
