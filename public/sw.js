// Service Worker para PWA - GymRats
// IMPORTANTE: Esta versão é atualizada automaticamente pelo script sync-version.js
// Para alterar, edite apenas o package.json e execute: npm run version:sync
const CACHE_VERSION = "v12.5.5";
const CACHE_NAME = `gymrats-${CACHE_VERSION}`;
const RUNTIME_CACHE = `gymrats-runtime-${CACHE_VERSION}`;
const OFFLINE_QUEUE_DB = 'offline-queue';
const COMMAND_LOGS_DB = 'command-logs';

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
    ]).then(() => {
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
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json)$/i) &&
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
          console.log(`[SW] Aguardando ${delay}ms antes de tentar item ${item.id} (retry ${item.retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Tenta enviar requisição
        const response = await fetch(item.url, {
          method: item.method,
          headers: {
            ...item.headers,
            'X-Idempotency-Key': item.idempotencyKey,
          },
          body: item.method !== 'GET' ? item.body : undefined,
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Sucesso: remove da fila
        await removeFromQueue(item.id);
        
        // Atualiza status do comando se existir
        const commandId = item.headers['X-Command-Id'];
        if (commandId) {
          await updateCommandStatusInSW(commandId, 'synced');
        }
        
        synced++;
        console.log(`[SW] ✅ Sincronizado: ${item.url} (ID: ${item.id})`);
      } catch (error) {
        // Erro: incrementa retries
        const newRetries = await incrementRetriesInSW(item.id);
        
        if (newRetries >= 5) {
          // Muitas tentativas: move para failed
          await moveToFailedInSW(item, error.message || 'Erro ao sincronizar');
          
          // Atualiza status do comando se existir
          const commandId = item.headers['X-Command-Id'];
          if (commandId) {
            await updateCommandStatusInSW(commandId, 'failed', error);
          }
          
          failed++;
          console.error(`[SW] ❌ Falhou após 5 tentativas: ${item.url} (ID: ${item.id})`);
        } else {
          console.warn(`[SW] ⚠️ Erro ao sincronizar (tentativa ${newRetries}/5): ${item.url} (ID: ${item.id})`, error);
          
          // Reagenda sync se ainda houver tentativas
          if ('sync' in self.registration) {
            try {
              await self.registration.sync.register('sync-queue');
            } catch (syncError) {
              console.warn('[SW] Erro ao reagendar sync:', syncError);
            }
          }
        }
      }
    }
    
    console.log(`[SW] Sincronização concluída: ${synced} sincronizados, ${failed} falhados`);
    
    // Notifica clientes sobre o resultado
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        synced,
        failed,
        total: items.length,
      });
    });
  } catch (error) {
    console.error('[SW] Erro ao sincronizar fila:', error);
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
      
      if (!db.objectStoreNames.contains('queue')) {
        const queueStore = db.createObjectStore('queue', { keyPath: 'id' });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        queueStore.createIndex('priority', 'priority', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('failed')) {
        const failedStore = db.createObjectStore('failed', { keyPath: 'id' });
        failedStore.createIndex('timestamp', 'timestamp', { unique: false });
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
    const transaction = db.transaction(['queue'], 'readonly');
    const store = transaction.objectStore('queue');
    return await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[SW] Erro ao obter itens da fila:', error);
    return [];
  }
}

/**
 * Remove item da fila
 */
async function removeFromQueue(id) {
  try {
    const db = await openQueueDB();
    const transaction = db.transaction(['queue'], 'readwrite');
    const store = transaction.objectStore('queue');
    await new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[SW] Erro ao remover da fila:', error);
  }
}

/**
 * Incrementa retries de um item
 */
async function incrementRetriesInSW(id) {
  try {
    const db = await openQueueDB();
    const transaction = db.transaction(['queue'], 'readwrite');
    const store = transaction.objectStore('queue');
    
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
    console.error('[SW] Erro ao incrementar retries:', error);
    return 0;
  }
}

/**
 * Move item para fila de falhados
 */
async function moveToFailedInSW(item, error) {
  try {
    const db = await openQueueDB();
    const transaction = db.transaction(['queue', 'failed'], 'readwrite');
    const queueStore = transaction.objectStore('queue');
    const failedStore = transaction.objectStore('failed');
    
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
    console.error('[SW] Erro ao mover para falhados:', error);
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
      
      if (!db.objectStoreNames.contains('commands')) {
        const store = db.createObjectStore('commands', { keyPath: 'id' });
        store.createIndex('logged', 'loggedAt', { unique: false });
        store.createIndex('status', 'command.status', { unique: false });
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
    const transaction = db.transaction(['commands'], 'readwrite');
    const store = transaction.objectStore('commands');
    
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
    console.error('[SW] Erro ao atualizar status do comando:', error);
  }
}
