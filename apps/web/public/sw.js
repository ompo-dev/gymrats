// Service Worker para PWA - GymRats
// IMPORTANTE: Esta versão é atualizada automaticamente pelo script sync-version.js
// Para alterar, edite apenas o package.json e execute: npm run version:sync
const CACHE_VERSION = "33.0.0";
const CACHE_NAME = `gymrats-${CACHE_VERSION}`;

// Arquivos estáticos para cache (apenas assets do PWA)
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-icon-180.png",
  "/apple-icon.png",
];

// ============================================
// INSTALAÇÃO
// ============================================

self.addEventListener("install", (event) => {
  console.log("[SW] Instalando Service Worker...", CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

// ============================================
// ATIVAÇÃO
// ============================================

let reminderCheckInterval = null;

self.addEventListener("activate", (event) => {
  console.log("[SW] Ativando Service Worker...", CACHE_VERSION);
  event.waitUntil(
    Promise.all([
      // Limpa todos os caches antigos (incluindo runtime cache de API)
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith("gymrats-") && name !== CACHE_NAME)
            .map((name) => {
              console.log("[SW] Removendo cache antigo:", name);
              return caches.delete(name);
            }),
        );
      }),
      self.clients.claim(),
    ])
      .then(() => {
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: "SW_UPDATED", version: CACHE_VERSION });
          });
        });
      })
      .then(() => {
        checkReminders();
        reminderCheckInterval = setInterval(checkReminders, 60 * 60 * 1000);
      }),
  );
});

// ============================================
// FETCH — apenas assets estáticos do PWA
// Chamadas de API passam direto para a rede (sem cache)
// ============================================

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Apenas http/https
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // Não intercepta navegação (Next.js cuida)
  if (request.mode === "navigate") return;

  // Não intercepta API — dados vêm sempre da rede
  if (url.pathname.startsWith("/api/")) return;

  // Não intercepta assets do Next.js
  if (url.pathname.startsWith("/_next/")) return;

  // Assets estáticos conhecidos: Cache First
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json)$/i) &&
    !url.pathname.startsWith("/_next/")
  ) {
    event.respondWith(cacheFirstStrategy(request));
  }
});

/**
 * Cache First Strategy — apenas para assets estáticos do PWA
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const response = await fetch(request);
    if (response.ok) {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      } catch (cacheErr) {
        console.warn("[SW] Não foi possível cachear:", request.url, cacheErr.message);
      }
    }
    return response;
  } catch (error) {
    throw error;
  }
}

// ============================================
// COMUNICAÇÃO COM O CLIENTE
// ============================================

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  } else if (event.data && event.data.type === "CHECK_REMINDERS_NOW") {
    checkReminders();
  }
});

// ============================================
// SISTEMA DE LEMBRETES AUTOMÁTICOS
// (IndexedDB apenas para tracking de notificações já enviadas)
// ============================================

const REMINDERS_DB = "reminders-db";
const NOTIFICATIONS_STORE = "sent-notifications";

async function checkReminders() {
  // Lembretes agendados são configurados pelo app via Notification API diretamente.
  // O SW apenas verifica se há notificações a enviar com base em dados passados pelo cliente.
  // Sem IndexedDB de preferências — o cliente passa os dados ao registrar.
}

// Exibir notificação
async function showReminderNotification(notif) {
  const options = {
    body: notif.body,
    icon: notif.icon || "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: notif.url },
    tag: notif.tag,
    requireInteraction: false,
  };
  await self.registration.showNotification(notif.title, options);
  await markNotificationSent(notif.tag);
}

// Clique na notificação
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(url.split("?")[0]) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      }),
  );
});

// ============================================
// IndexedDB — Apenas para tracking de notificações enviadas (evitar duplicatas)
// ============================================

async function openNotificationsDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(REMINDERS_DB, 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(NOTIFICATIONS_STORE)) {
        const store = db.createObjectStore(NOTIFICATIONS_STORE, { keyPath: "tag" });
        store.createIndex("date", "date", { unique: false });
      }
    };
  });
}

async function wasNotificationSent(tag) {
  try {
    const db = await openNotificationsDB();
    const transaction = db.transaction([NOTIFICATIONS_STORE], "readonly");
    const store = transaction.objectStore(NOTIFICATIONS_STORE);
    const request = store.get(tag);
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const result = request.result;
        if (!result) { resolve(false); return; }
        const today = new Date().toISOString().split("T")[0];
        const sentDate = new Date(result.date).toISOString().split("T")[0];
        resolve(sentDate === today);
      };
      request.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

async function markNotificationSent(tag) {
  try {
    const db = await openNotificationsDB();
    const transaction = db.transaction([NOTIFICATIONS_STORE], "readwrite");
    const store = transaction.objectStore(NOTIFICATIONS_STORE);
    await new Promise((resolve, reject) => {
      const request = store.put({ tag, date: new Date().toISOString() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[SW] Erro ao marcar notificação como enviada:", error);
  }
}

// Limpar notificações antigas (mais de 7 dias)
async function cleanupOldNotifications() {
  try {
    const db = await openNotificationsDB();
    const transaction = db.transaction([NOTIFICATIONS_STORE], "readwrite");
    const store = transaction.objectStore(NOTIFICATIONS_STORE);
    const index = store.index("date");
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const range = IDBKeyRange.upperBound(sevenDaysAgo.toISOString());
    const request = index.openCursor(range);
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) { cursor.delete(); cursor.continue(); }
    };
  } catch (error) {
    console.error("[SW] Erro ao limpar notificações antigas:", error);
  }
}

setInterval(cleanupOldNotifications, 24 * 60 * 60 * 1000);
