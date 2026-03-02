// Service Worker para PWA - GymRats
// IMPORTANTE: Esta versão é atualizada automaticamente pelo script sync-version.js
// Para alterar, edite apenas o package.json e execute: npm run version:sync
const CACHE_VERSION = "33.0.0";
const CACHE_NAME = `gymrats-${CACHE_VERSION}`;
const RUNTIME_CACHE = `gymrats-runtime-${CACHE_VERSION}`;

// Arquivos estáticos para cache
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
  // Força ativação imediata do novo service worker
  self.skipWaiting();
});

// ============================================
// ATIVAÇÃO
// ============================================

// Verificação periódica de lembretes (a cada hora)
let reminderCheckInterval = null;

self.addEventListener("activate", (event) => {
  console.log("[SW] Ativando Service Worker...", CACHE_VERSION);
  event.waitUntil(
    Promise.all([
      // Limpa caches antigos
      caches.keys().then((cacheNames) => {
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
            }),
        );
      }),
      // Assume controle imediato
      self.clients.claim(),
    ])
      .then(() => {
        // Notifica todos os clientes sobre a atualização
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "SW_UPDATED",
              version: CACHE_VERSION,
            });
          });
        });
      })
      .then(() => {
        // Iniciar verificação de lembretes
        checkReminders();
        reminderCheckInterval = setInterval(checkReminders, 60 * 60 * 1000); // 1 hora
      }),
  );
});

// ============================================
// CACHE DE REQUISIÇÕES
// ============================================

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cache API só suporta http/https - ignora chrome-extension, blob, data, etc.
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return;
  }

  // Ignora requisições não-GET para APIs (tratadas diretamente pelo app/HTTP)
  if (request.method !== "GET") {
    // Para requisições POST/PUT/PATCH/DELETE, deixa passar normalmente
    return;
  }

  // Ignora requisições de analytics e outras APIs externas
  if (
    url.hostname.includes("vercel.app") ||
    url.hostname.includes("google-analytics") ||
    url.hostname.includes("googletagmanager")
  ) {
    return;
  }

  // Para rotas de navegação (páginas do Next.js), sempre deixa passar para o servidor
  // O Next.js já tem seu próprio sistema de cache e routing
  // Interceptar navegação causa problemas de 404 quando o app é reaberto
  if (request.mode === "navigate") {
    // Não intercepta: deixa o Next.js cuidar do routing
    return;
  }

  // Ignora arquivos do Next.js (_next/static, _next/image, etc.)
  // O Next.js já tem seu próprio sistema de cache e otimização
  if (url.pathname.startsWith("/_next/")) {
    return;
  }

  // Estratégia: Network First para APIs, Cache First para assets estáticos
  if (url.pathname.startsWith("/api/")) {
    // APIs: Network First com fallback para cache
    event.respondWith(networkFirstStrategy(request));
  } else if (
    // Assets estáticos: apenas para arquivos com extensões conhecidas da pasta /public
    url.pathname.match(
      /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json)$/i,
    ) &&
    !url.pathname.startsWith("/_next/")
  ) {
    // Assets estáticos: Cache First
    event.respondWith(cacheFirstStrategy(request));
  } else {
    // Outras requisições: deixa passar normalmente (Next.js cuida)
    return;
  }
});

/**
 * Network First Strategy - Tenta rede primeiro, fallback para cache
 */
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);

    // Se sucesso, cacheia a resposta (apenas para http/https)
    if (response.status === 200 && (request.url.startsWith("http:") || request.url.startsWith("https:"))) {
      try {
        const cache = await caches.open(RUNTIME_CACHE);
        await cache.put(request, response.clone());
      } catch (cacheErr) {
        console.warn("[SW] Não foi possível cachear:", request.url, cacheErr.message);
      }
    }

    return response;
  } catch (error) {
    // Offline: tenta cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

/**
 * Cache First Strategy - Tenta cache primeiro, fallback para rede
 * Usado apenas para assets estáticos (JS, CSS, imagens, etc.)
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);

    // Cacheia resposta válida (apenas http/https - Cache API não suporta chrome-extension, etc.)
    if (response.ok && (request.url.startsWith("http:") || request.url.startsWith("https:"))) {
      try {
        const cache = await caches.open(RUNTIME_CACHE);
        await cache.put(request, response.clone());
      } catch (cacheErr) {
        console.warn("[SW] Não foi possível cachear:", request.url, cacheErr.message);
      }
    }

    return response;
  } catch (error) {
    // Se falhar ao buscar asset, retorna erro
    // Não tenta fallback para evitar problemas de 404
    throw error;
  }
}

// (Background Sync e fila offline removidos: o Service Worker
//  fica responsável apenas por cache e lembretes, sem sincronização de dados.)

// ============================================
// COMUNICAÇÃO COM O CLIENTE (atualização + lembretes)
// ============================================

// Escuta mensagens do cliente
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  } else if (event.data && event.data.type === "UPDATE_REMINDER_PREFERENCES") {
    saveReminderPreferences(event.data.preferences);
  } else if (event.data && event.data.type === "UPDATE_APP_DATA") {
    saveAppData(event.data.data);
  } else if (event.data && event.data.type === "CHECK_REMINDERS_NOW") {
    checkReminders();
  }
});

// ============================================
// SISTEMA DE LEMBRETES AUTOMÁTICOS
// ============================================

const REMINDERS_DB = "reminders-db";
const REMINDERS_STORE = "reminders";
const NOTIFICATIONS_STORE = "sent-notifications";

// Função para verificar e enviar lembretes
async function checkReminders() {
  try {
    // Buscar preferências do IndexedDB
    const prefs = await getReminderPreferences();
    if (!prefs || !prefs.enabled) return;

    // Buscar dados do app do IndexedDB
    const appData = await getAppData();

    // Verificar regras e enviar notificações
    const notifications = await checkReminderRules(prefs, appData);

    // Enviar cada notificação
    for (const notif of notifications) {
      await showReminderNotification(notif);
    }
  } catch (error) {
    console.error("[SW] Erro ao verificar lembretes:", error);
  }
}

// Verificar regras de negócio
async function checkReminderRules(prefs, appData) {
  const notifications = [];
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
  const today = now.toISOString().split("T")[0]; // YYYY-MM-DD

  // GYMRATS APP: Verificar treinos e refeições
  // Suporta tanto 'nutrition' quanto 'dailyNutrition' para compatibilidade
  const nutritionData = appData.nutrition || appData.dailyNutrition;
  const hasNutrition = !!nutritionData;

  // Verificar se nutritionData é do dia atual
  const nutritionDate = nutritionData?.date;
  const isNutritionToday =
    !nutritionDate ||
    (typeof nutritionDate === "string" &&
      nutritionDate.split("T")[0] === today) ||
    (nutritionDate instanceof Date &&
      nutritionDate.toISOString().split("T")[0] === today);

  if (appData.workouts || hasNutrition || appData.workoutHistory) {
    // Verificar treino
    if (prefs.workoutReminders) {
      const workoutTime = prefs.reminderTimes.workouts || "18:00";
      if (currentTime >= workoutTime) {
        // Verificar se há workout hoje no histórico
        // A data pode vir como Date, string ISO, ou string YYYY-MM-DD
        const workoutToday = appData.workoutHistory?.some((w) => {
          if (!w || !w.date) return false;

          let workoutDateStr;
          if (typeof w.date === "string") {
            // Se já é string, pegar apenas a parte da data (YYYY-MM-DD)
            workoutDateStr = w.date.split("T")[0];
          } else if (w.date instanceof Date) {
            // Se é Date, converter para ISO e pegar apenas a data
            workoutDateStr = w.date.toISOString().split("T")[0];
          } else {
            // Tentar converter para Date
            try {
              const workoutDate = new Date(w.date);
              workoutDateStr = workoutDate.toISOString().split("T")[0];
            } catch (e) {
              return false;
            }
          }

          return workoutDateStr === today;
        });

        if (!workoutToday) {
          const tag = `workout-${today}`;
          const alreadySent = await wasNotificationSent(tag);

          if (!alreadySent) {
            notifications.push({
              title: "Lembrete de Treino",
              body: "Não se esqueça de treinar hoje!",
              url: "/student?tab=learn",
              tag: tag,
              icon: "/icon-192.png",
            });
          }
        }
      }
    }

    // Verificar refeições - APENAS se os dados de nutrição são do dia atual
    if (prefs.mealReminders && hasNutrition && isNutritionToday) {
      const mealTimes = prefs.reminderTimes.meals || {};
      const meals = nutritionData.meals || [];

      // Café da manhã
      if (mealTimes.breakfast && currentTime >= mealTimes.breakfast) {
        const breakfast = meals.find(
          (m) =>
            m &&
            (m.type === "breakfast" || m.type === "café da manhã") &&
            m.completed === true,
        );
        if (!breakfast) {
          const tag = `meal-breakfast-${today}`;
          const alreadySent = await wasNotificationSent(tag);

          if (!alreadySent) {
            notifications.push({
              title: "Lembrete de Refeição",
              body: "Você ainda não tomou café da manhã",
              url: "/student?tab=diet",
              tag: tag,
              icon: "/icon-192.png",
            });
          }
        }
      }

      // Almoço
      if (mealTimes.lunch && currentTime >= mealTimes.lunch) {
        const lunch = meals.find(
          (m) =>
            m &&
            (m.type === "lunch" || m.type === "almoço") &&
            m.completed === true,
        );
        if (!lunch) {
          const tag = `meal-lunch-${today}`;
          const alreadySent = await wasNotificationSent(tag);

          if (!alreadySent) {
            notifications.push({
              title: "Lembrete de Refeição",
              body: "Você ainda não almoçou",
              url: "/student?tab=diet",
              tag: tag,
              icon: "/icon-192.png",
            });
          }
        }
      }

      // Jantar
      if (mealTimes.dinner && currentTime >= mealTimes.dinner) {
        const dinner = meals.find(
          (m) =>
            m &&
            (m.type === "dinner" || m.type === "jantar") &&
            m.completed === true,
        );
        if (!dinner) {
          const tag = `meal-dinner-${today}`;
          const alreadySent = await wasNotificationSent(tag);

          if (!alreadySent) {
            notifications.push({
              title: "Lembrete de Refeição",
              body: "Você ainda não jantou",
              url: "/student?tab=diet",
              tag: tag,
              icon: "/icon-192.png",
            });
          }
        }
      }
    }
  }

  return notifications;
}

// Exibir notificação
async function showReminderNotification(notif) {
  const options = {
    body: notif.body,
    icon: notif.icon || "/icon-192.png",
    badge: "/icon-192.png",
    data: {
      url: notif.url,
    },
    tag: notif.tag,
    requireInteraction: false,
  };

  await self.registration.showNotification(notif.title, options);

  // Marcar como enviada no IndexedDB
  await markNotificationSent(notif.tag);
}

// Event listener para cliques na notificação
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
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      }),
  );
});

// ============================================
// IndexedDB Helpers para Lembretes
// ============================================

async function openRemindersDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(REMINDERS_DB, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(REMINDERS_STORE)) {
        db.createObjectStore(REMINDERS_STORE, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(NOTIFICATIONS_STORE)) {
        const store = db.createObjectStore(NOTIFICATIONS_STORE, {
          keyPath: "tag",
        });
        store.createIndex("date", "date", { unique: false });
      }
    };
  });
}

async function getReminderPreferences() {
  try {
    const db = await openRemindersDB();
    const transaction = db.transaction([REMINDERS_STORE], "readonly");
    const store = transaction.objectStore(REMINDERS_STORE);
    const request = store.get("preferences");

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[SW] Erro ao buscar preferências:", error);
    return null;
  }
}

async function getAppData() {
  try {
    const db = await openRemindersDB();
    const transaction = db.transaction([REMINDERS_STORE], "readonly");
    const store = transaction.objectStore(REMINDERS_STORE);
    const request = store.get("app-data");

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result?.data || {});
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[SW] Erro ao buscar dados do app:", error);
    return {};
  }
}

async function wasNotificationSent(tag) {
  try {
    const db = await openRemindersDB();
    const transaction = db.transaction([NOTIFICATIONS_STORE], "readonly");
    const store = transaction.objectStore(NOTIFICATIONS_STORE);
    const request = store.get(tag);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(false);
          return;
        }

        // Verificar se foi enviada hoje
        const today = new Date().toISOString().split("T")[0];
        const sentDate = new Date(result.date).toISOString().split("T")[0];
        resolve(sentDate === today);
      };
      request.onerror = () => resolve(false);
    });
  } catch (error) {
    return false;
  }
}

async function markNotificationSent(tag) {
  try {
    const db = await openRemindersDB();
    const transaction = db.transaction([NOTIFICATIONS_STORE], "readwrite");
    const store = transaction.objectStore(NOTIFICATIONS_STORE);

    await new Promise((resolve, reject) => {
      const request = store.put({
        tag: tag,
        date: new Date().toISOString(),
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[SW] Erro ao marcar notificação como enviada:", error);
  }
}

async function saveReminderPreferences(prefs) {
  try {
    const db = await openRemindersDB();
    const transaction = db.transaction([REMINDERS_STORE], "readwrite");
    const store = transaction.objectStore(REMINDERS_STORE);

    await new Promise((resolve, reject) => {
      const request = store.put({
        id: "preferences",
        data: prefs,
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[SW] Erro ao salvar preferências:", error);
  }
}

async function saveAppData(data) {
  try {
    const db = await openRemindersDB();
    const transaction = db.transaction([REMINDERS_STORE], "readwrite");
    const store = transaction.objectStore(REMINDERS_STORE);

    await new Promise((resolve, reject) => {
      const request = store.put({
        id: "app-data",
        data: data,
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[SW] Erro ao salvar dados do app:", error);
  }
}

// Limpar notificações antigas (mais de 7 dias)
async function cleanupOldNotifications() {
  try {
    const db = await openRemindersDB();
    const transaction = db.transaction([NOTIFICATIONS_STORE], "readwrite");
    const store = transaction.objectStore(NOTIFICATIONS_STORE);
    const index = store.index("date");
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const range = IDBKeyRange.upperBound(sevenDaysAgo.toISOString());
    const request = index.openCursor(range);

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  } catch (error) {
    console.error("[SW] Erro ao limpar notificações antigas:", error);
  }
}

// Limpar a cada 24 horas
setInterval(cleanupOldNotifications, 24 * 60 * 60 * 1000);
