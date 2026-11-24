// Service worker mínimo de FarmaImport.
// Solo cachea assets estáticos (JS/CSS con hash e íconos); las páginas y la
// API siempre van a la red para no servir datos viejos ni saltarse el RLS.

const CACHE = "farmaimport-v1";
const ES_ESTATICO = /\/_next\/static\/|\/icons\//;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;

  if (peticion.method !== "GET") return;

  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return;
  if (!ES_ESTATICO.test(url.pathname)) return;

  evento.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const guardado = await cache.match(peticion);
      if (guardado) return guardado;

      const respuesta = await fetch(peticion);
      if (respuesta.ok) cache.put(peticion, respuesta.clone());
      return respuesta;
    }),
  );
});
