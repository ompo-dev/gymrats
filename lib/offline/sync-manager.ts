/**
 * SyncManager - Gerenciador de Sincronização Offline/Online
 *
 * Gerencia automaticamente requisições HTTP adaptando-se ao estado da rede:
 * - Detecta se está online/offline
 * - Se online: envia para API imediatamente
 * - Se offline: salva na fila para sincronizar depois
 * - Registra Background Sync quando offline
 *
 * Uso:
 * const result = await syncManager({
 *   url: '/api/students/progress',
 *   method: 'PUT',
 *   body: { totalXP: 1500 },
 *   headers: { Authorization: 'Bearer token' }
 * });
 */

import {
  addToQueue,
  removeFromQueue,
  incrementRetries,
  moveToFailed,
  type OfflineQueueItem,
} from "./offline-queue";
import { apiClient } from "@/lib/api/client";
import { logCommand, updateCommandStatus } from "./command-logger";

// ============================================
// TIPOS
// ============================================

export interface SyncManagerOptions {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  priority?: "high" | "normal" | "low";
  /**
   * Idempotency Key - OBRIGATÓRIO para operações que modificam dados
   * Se não fornecido, será gerado automaticamente
   * Garante que a mesma ação não seja executada duas vezes
   */
  idempotencyKey?: string;
  retries?: number;
  /**
   * Command ID - ID do comando para integração com command-logger
   */
  commandId?: string;
}

export interface SyncManagerResult {
  success: boolean;
  queued: boolean;
  queueId?: string;
  data?: any;
  error?: Error;
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Verifica se está online
 */
function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

/**
 * Gera idempotency key único
 */
export function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Agenda sincronização manual (fallback quando Background Sync não está disponível)
 */
function scheduleManualSync(registration: ServiceWorkerRegistration): void {
  // Escuta eventos online para sincronizar automaticamente
  const handleOnline = () => {
    if (registration.active) {
      registration.active.postMessage({ type: "SYNC_NOW" });
    }
    window.removeEventListener("online", handleOnline);
  };

  window.addEventListener("online", handleOnline);

  // Se já está online, tenta sincronizar imediatamente
  if (navigator.onLine && registration.active) {
    registration.active.postMessage({ type: "SYNC_NOW" });
  }
}

/**
 * Registra Background Sync
 * Se não disponível, agenda sincronização manual
 */
async function registerBackgroundSync(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Tenta registrar Background Sync
    if ("sync" in registration && registration.sync) {
      await (registration.sync as any).register("sync-queue");
      console.log("[syncManager] ✅ Background Sync registrado");
    } else {
      // Fallback: agenda sincronização manual quando online
      console.warn(
        "[syncManager] ⚠️ Background Sync não disponível, usando fallback"
      );
      scheduleManualSync(registration);
    }
  } catch (error) {
    console.warn("[syncManager] Erro ao registrar Background Sync:", error);

    // Fallback: tenta sincronização manual
    try {
      const registration = await navigator.serviceWorker.ready;
      scheduleManualSync(registration);
    } catch (fallbackError) {
      console.error(
        "[syncManager] Erro no fallback de sincronização:",
        fallbackError
      );
    }
  }
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

/**
 * SyncManager - Gerencia offline/online automaticamente
 *
 * @param options - Opções da requisição
 * @returns Resultado da operação
 */
export async function syncManager(
  options: SyncManagerOptions
): Promise<SyncManagerResult> {
  const {
    url,
    method,
    body,
    headers = {},
    priority = "normal",
    idempotencyKey,
    retries = 0,
  } = options;

  // IdempotencyKey é OBRIGATÓRIO para métodos que modificam dados
  // Gera automaticamente se não fornecido
  const key = idempotencyKey || generateIdempotencyKey();

  // Para métodos que modificam dados, sempre gerar key se não fornecido
  const requiresIdempotency = ["POST", "PUT", "PATCH", "DELETE"].includes(
    method
  );
  if (requiresIdempotency && !idempotencyKey) {
    console.warn(
      `[syncManager] ⚠️ IdempotencyKey não fornecido para ${method} ${url}. Gerando automaticamente.`
    );
  }

  // Se estiver online, tenta enviar imediatamente
  if (isOnline()) {
    try {
      // Adiciona idempotency key aos headers
      const requestHeaders = {
        ...headers,
        "X-Idempotency-Key": key,
      };

      // Faz requisição
      let response;
      switch (method) {
        case "GET":
          response = await apiClient.get(url, { headers: requestHeaders });
          break;
        case "POST":
          response = await apiClient.post(url, body, {
            headers: requestHeaders,
          });
          break;
        case "PUT":
          response = await apiClient.put(url, body, {
            headers: requestHeaders,
          });
          break;
        case "PATCH":
          response = await apiClient.patch(url, body, {
            headers: requestHeaders,
          });
          break;
        case "DELETE":
          response = await apiClient.delete(url, { headers: requestHeaders });
          break;
      }

      // Log comando como sincronizado
      if (options.commandId) {
        await updateCommandStatus(options.commandId, "synced");
      }

      return {
        success: true,
        queued: false,
        data: response.data,
      };
    } catch (error: any) {
      // Se erro e for erro de rede, salva na fila
      if (
        error.code === "ECONNABORTED" ||
        error.message?.includes("Network Error") ||
        !isOnline()
      ) {
        // Agora está offline, salva na fila
        return await queueRequest(options, key);
      }

      // Erro não relacionado a rede, retorna erro
      // Log comando como falhado
      if (options.commandId) {
        await updateCommandStatus(options.commandId, "failed", error);
      }

      return {
        success: false,
        queued: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  // Está offline, salva na fila
  return await queueRequest(options, key);
}

/**
 * Salva requisição na fila offline
 */
async function queueRequest(
  options: SyncManagerOptions,
  idempotencyKey: string
): Promise<SyncManagerResult> {
  try {
    const queueId = await addToQueue({
      url: options.url,
      method: options.method,
      headers: options.headers || {},
      body: JSON.stringify(options.body || {}),
      idempotencyKey,
      priority: options.priority || "normal",
    });

    // Registra Background Sync
    await registerBackgroundSync();

    // Log comando como enfileirado
    if (options.commandId) {
      await updateCommandStatus(options.commandId, "pending");
    }

    console.log(`[syncManager] ✅ Ação salva na fila offline (ID: ${queueId})`);

    return {
      success: true,
      queued: true,
      queueId,
    };
  } catch (error) {
    console.error("[syncManager] Erro ao salvar na fila:", error);
    return {
      success: false,
      queued: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// ============================================
// SINCRONIZAÇÃO DA FILA
// ============================================

/**
 * Sincroniza fila quando volta online
 * (Chamado pelo Service Worker ou manualmente)
 */
export async function syncQueue(): Promise<{
  synced: number;
  failed: number;
}> {
  const { getQueueItems } = await import("./offline-queue");
  const items = await getQueueItems();

  let synced = 0;
  let failed = 0;

  for (const item of items) {
    try {
      // Tenta enviar requisição
      const requestHeaders = {
        ...item.headers,
        "X-Idempotency-Key": item.idempotencyKey,
      };

      let response;
      switch (item.method) {
        case "GET":
          response = await apiClient.get(item.url, { headers: requestHeaders });
          break;
        case "POST":
          response = await apiClient.post(item.url, JSON.parse(item.body), {
            headers: requestHeaders,
          });
          break;
        case "PUT":
          response = await apiClient.put(item.url, JSON.parse(item.body), {
            headers: requestHeaders,
          });
          break;
        case "PATCH":
          response = await apiClient.patch(item.url, JSON.parse(item.body), {
            headers: requestHeaders,
          });
          break;
        case "DELETE":
          response = await apiClient.delete(item.url, {
            headers: requestHeaders,
          });
          break;
      }

      // Sucesso: remove da fila
      await removeFromQueue(item.id);
      synced++;

      console.log(`[syncManager] ✅ Sincronizado: ${item.url}`);
    } catch (error: any) {
      // Erro: incrementa retries
      const newRetries = await incrementRetries(item.id);

      if (newRetries >= 5) {
        // Muitas tentativas: move para failed
        await moveToFailed(item, error.message || "Erro ao sincronizar");
        failed++;
        console.error(`[syncManager] ❌ Falhou após 5 tentativas: ${item.url}`);
      } else {
        console.warn(
          `[syncManager] ⚠️ Erro ao sincronizar (tentativa ${newRetries}/5): ${item.url}`
        );
      }
    }
  }

  return { synced, failed };
}

