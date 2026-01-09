// Service Worker para PWA - GymRats
// IMPORTANTE: Esta versão é atualizada automaticamente pelo script sync-version.js
// Para alterar, edite apenas o package.json e execute: npm run version:sync
const CACHE_VERSION = "v15.5.1";
const CACHE_NAME = `gymrats-${CACHE_VERSION}`;
const RUNTIME_CACHE = `gymrats-runtime-${CACHE_VERSION}`;
const OFFLINE_QUEUE_DB = "offline-queue";
const COMMAND_LOGS_DB = "command-logs";

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
    })
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
            })
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
      })
  );
});

// ============================================
// CACHE DE REQUISIÇÕES
// ============================================

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições não-GET para APIs (são gerenciadas pela fila offline)
  if (request.method !== "GET") {
    // Para requisições POST/PUT/PATCH/DELETE, deixa passar normalmente
    // A fila offline cuida delas
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
      /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json)$/i
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

    // Se sucesso, cacheia a resposta
    if (response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
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

    // Cacheia resposta válida (status 200-299)
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Se falhar ao buscar asset, retorna erro
    // Não tenta fallback para evitar problemas de 404
    throw error;
  }
}

// ============================================
// BACKGROUND SYNC
// ============================================

self.addEventListener("sync", (event) => {
  console.log("[SW] Background Sync acionado:", event.tag);

  if (event.tag === "sync-queue") {
    event.waitUntil(syncOfflineQueue());
  }
});

/**
 * Sincroniza a fila offline com retry exponencial
 */
async function syncOfflineQueue() {
  try {
    console.log("[SW] Iniciando sincronização da fila offline...");

    const items = await getQueueItems();

    if (items.length === 0) {
      console.log("[SW] Nenhum item na fila para sincronizar");
      return;
    }

    console.log(`[SW] Sincronizando ${items.length} itens...`);

    let synced = 0;
    let failed = 0;

    // Ordena por prioridade e timestamp
    const sortedItems = items.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 2;
      const bPriority = priorityOrder[b.priority] || 2;

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      return a.timestamp - b.timestamp;
    });

    for (const item of sortedItems) {
      try {
        // Calcula delay exponencial baseado em retries
        const delay = calculateExponentialBackoff(item.retries);

        if (delay > 0) {
          console.log(
            `[SW] Aguardando ${delay}ms antes de tentar item ${item.id} (retry ${item.retries})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        // Tenta enviar requisição
        const response = await fetch(item.url, {
          method: item.method,
          headers: {
            ...item.headers,
            "X-Idempotency-Key": item.idempotencyKey,
          },
          body: item.method !== "GET" ? item.body : undefined,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Sucesso: remove da fila
        await removeFromQueue(item.id);

        // Atualiza status do comando se existir
        const commandId = item.headers["X-Command-Id"];
        if (commandId) {
          await updateCommandStatusInSW(commandId, "synced");
        }

        synced++;
        console.log(`[SW] ✅ Sincronizado: ${item.url} (ID: ${item.id})`);
      } catch (error) {
        // Erro: incrementa retries
        const newRetries = await incrementRetriesInSW(item.id);

        if (newRetries >= 5) {
          // Muitas tentativas: move para failed
          await moveToFailedInSW(item, error.message || "Erro ao sincronizar");

          // Atualiza status do comando se existir
          const commandId = item.headers["X-Command-Id"];
          if (commandId) {
            await updateCommandStatusInSW(commandId, "failed", error);
          }

          failed++;
          console.error(
            `[SW] ❌ Falhou após 5 tentativas: ${item.url} (ID: ${item.id})`
          );
        } else {
          console.warn(
            `[SW] ⚠️ Erro ao sincronizar (tentativa ${newRetries}/5): ${item.url} (ID: ${item.id})`,
            error
          );

          // Reagenda sync se ainda houver tentativas
          if ("sync" in self.registration) {
            try {
              await self.registration.sync.register("sync-queue");
            } catch (syncError) {
              console.warn("[SW] Erro ao reagendar sync:", syncError);
            }
          }
        }
      }
    }

    console.log(
      `[SW] Sincronização concluída: ${synced} sincronizados, ${failed} falhados`
    );

    // Notifica clientes sobre o resultado
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_COMPLETE",
        synced,
        failed,
        total: items.length,
      });
    });
  } catch (error) {
    console.error("[SW] Erro ao sincronizar fila:", error);
  }
}

/**
 * Calcula delay exponencial para retry
 * Retorna delay em milissegundos
 */
function calculateExponentialBackoff(retries) {
  // Base: 1 segundo, máximo: 30 segundos
  const baseDelay = 1000;
  const maxDelay = 30000;
  const delay = Math.min(baseDelay * Math.pow(2, retries), maxDelay);

  // Adiciona jitter aleatório (0-30% do delay)
  const jitter = delay * 0.3 * Math.random();
  return Math.floor(delay + jitter);
}

// ============================================
// FALLBACK: Sincronização Manual (se Background Sync não existir)
// ============================================

// Escuta mensagens do cliente para sincronização manual
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  } else if (event.data && event.data.type === "SYNC_NOW") {
    // Sincronização manual solicitada pelo cliente
    event.waitUntil(syncOfflineQueue());
  } else if (event.data && event.data.type === "UPDATE_REMINDER_PREFERENCES") {
    // Salvar preferências no IndexedDB
    saveReminderPreferences(event.data.preferences);
  } else if (event.data && event.data.type === "UPDATE_APP_DATA") {
    // Salvar dados do app no IndexedDB
    saveAppData(event.data.data);
  } else if (event.data && event.data.type === "CHECK_REMINDERS_NOW") {
    // Verificar lembretes imediatamente (para testes)
    checkReminders();
  }
});

// ============================================
// FUNÇÕES AUXILIARES - IndexedDB
// ============================================

/**
 * Abre conexão com IndexedDB da fila offline
 */
async function openQueueDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_QUEUE_DB, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("queue")) {
        const queueStore = db.createObjectStore("queue", { keyPath: "id" });
        queueStore.createIndex("timestamp", "timestamp", { unique: false });
        queueStore.createIndex("priority", "priority", { unique: false });
      }

      if (!db.objectStoreNames.contains("failed")) {
        const failedStore = db.createObjectStore("failed", { keyPath: "id" });
        failedStore.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

/**
 * Obtém todos os itens da fila
 */
async function getQueueItems() {
  try {
    const db = await openQueueDB();
    const transaction = db.transaction(["queue"], "readonly");
    const store = transaction.objectStore("queue");
    return await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[SW] Erro ao obter itens da fila:", error);
    return [];
  }
}

/**
 * Remove item da fila
 */
async function removeFromQueue(id) {
  try {
    const db = await openQueueDB();
    const transaction = db.transaction(["queue"], "readwrite");
    const store = transaction.objectStore("queue");
    await new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[SW] Erro ao remover da fila:", error);
  }
}

/**
 * Incrementa retries de um item
 */
async function incrementRetriesInSW(id) {
  try {
    const db = await openQueueDB();
    const transaction = db.transaction(["queue"], "readwrite");
    const store = transaction.objectStore("queue");

    return await new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => {
        const item = request.result;
        if (item) {
          item.retries = (item.retries || 0) + 1;
          const putRequest = store.put(item);
          putRequest.onsuccess = () => resolve(item.retries);
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve(0);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[SW] Erro ao incrementar retries:", error);
    return 0;
  }
}

/**
 * Move item para fila de falhados
 */
async function moveToFailedInSW(item, error) {
  try {
    const db = await openQueueDB();
    const transaction = db.transaction(["queue", "failed"], "readwrite");
    const queueStore = transaction.objectStore("queue");
    const failedStore = transaction.objectStore("failed");

    await new Promise((resolve, reject) => {
      // Remove da fila principal
      const deleteRequest = queueStore.delete(item.id);
      deleteRequest.onsuccess = () => {
        // Adiciona na fila de falhados
        const addRequest = failedStore.add({
          ...item,
          error,
          failedAt: Date.now(),
        });
        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => reject(addRequest.error);
      };
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });
  } catch (error) {
    console.error("[SW] Erro ao mover para falhados:", error);
  }
}

// ============================================
// INTEGRAÇÃO COM COMMAND LOGGER
// ============================================

/**
 * Abre conexão com IndexedDB de command logs
 */
async function openCommandLogsDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(COMMAND_LOGS_DB, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("commands")) {
        const store = db.createObjectStore("commands", { keyPath: "id" });
        store.createIndex("logged", "loggedAt", { unique: false });
        store.createIndex("status", "command.status", { unique: false });
      }
    };
  });
}

/**
 * Atualiza status de comando no command logger
 */
async function updateCommandStatusInSW(commandId, status, error) {
  try {
    const db = await openCommandLogsDB();
    const transaction = db.transaction(["commands"], "readwrite");
    const store = transaction.objectStore("commands");

    return await new Promise((resolve, reject) => {
      const request = store.get(commandId);
      request.onsuccess = () => {
        const existing = request.result;
        if (existing) {
          existing.command.status = status;
          if (error) {
            existing.command.error = error.message || String(error);
            existing.command.errorDetails = {
              message: error.message || String(error),
              stack: error.stack,
              code: error.code,
            };
          }

          const putRequest = store.put(existing);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[SW] Erro ao atualizar status do comando:", error);
  }
}

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
            m.completed === true
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
            m.completed === true
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
            m.completed === true
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
      })
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
