// Service Worker para PWA - GymRats
// IMPORTANTE: Alterar a versão do cache quando houver atualizações significativas
// Esta versão deve ser mantida sincronizada com lib/constants/version.ts
const CACHE_VERSION = "v1.0.0";
const CACHE_NAME = `gymrats-${CACHE_VERSION}`;
const RUNTIME_CACHE = `gymrats-runtime-${CACHE_VERSION}`;

// Arquivos estáticos para cache
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-light-32x32.png",
  "/icon-dark-32x32.png",
  "/apple-icon-180.png",
  "/apple-icon.png",
];

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  console.log("[SW] Instalando Service Worker...", CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Força ativação imediata do novo service worker
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener("activate", (event) => {
  console.log("[SW] Ativando Service Worker...", CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Deleta todos os caches antigos que não correspondem à versão atual
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name.startsWith("gymrats-") &&
              name !== CACHE_NAME &&
              name !== RUNTIME_CACHE
            );
          })
          .map((name) => {
            console.log("[SW] Removendo cache antigo:", name);
            return caches.delete(name);
          })
      );
    })
  );
  // Assume controle imediato de todas as páginas
  return self.clients.claim().then(() => {
    // Notifica todos os clientes sobre a atualização
    return self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: "SW_UPDATED",
          version: CACHE_VERSION,
        });
      });
    });
  });
});

// Estratégia: Network First, fallback para Cache
self.addEventListener("fetch", (event) => {
  // Ignora requisições não-GET
  if (event.request.method !== "GET") return;

  // Ignora requisições de analytics e outras APIs externas
  if (
    event.request.url.includes("vercel.app") ||
    event.request.url.includes("google-analytics") ||
    event.request.url.includes("googletagmanager")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clona a resposta para cache
        const responseToCache = response.clone();

        // Cache apenas respostas válidas
        if (response.status === 200) {
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      })
      .catch(() => {
        // Fallback para cache se offline
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Fallback para página inicial se for navegação
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
        });
      })
  );
});

// Mensagem para atualizar cache
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
