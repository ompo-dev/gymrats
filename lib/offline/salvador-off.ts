/**
 * SalvadorOff - Gerencia Offline/Online Automaticamente
 * 
 * Esta função automaticamente:
 * - Detecta se está online/offline
 * - Se online: envia para API imediatamente
 * - Se offline: salva na fila para sincronizar depois
 * - Registra Background Sync quando offline
 * 
 * Uso:
 * const result = await salvadorOff({
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
} from './offline-queue';
import { apiClient } from '@/lib/api/client';

// ============================================
// TIPOS
// ============================================

export interface SalvadorOffOptions {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  priority?: 'high' | 'normal' | 'low';
  idempotencyKey?: string;
  retries?: number;
}

export interface SalvadorOffResult {
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
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Gera idempotency key único
 */
function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Registra Background Sync
 */
async function registerBackgroundSync(): Promise<void> {
  if (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    'sync' in ServiceWorkerRegistration.prototype
  ) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-queue');
    } catch (error) {
      console.warn('[salvadorOff] Erro ao registrar Background Sync:', error);
    }
  }
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

/**
 * SalvadorOff - Gerencia offline/online automaticamente
 * 
 * @param options - Opções da requisição
 * @returns Resultado da operação
 */
export async function salvadorOff(
  options: SalvadorOffOptions
): Promise<SalvadorOffResult> {
  const {
    url,
    method,
    body,
    headers = {},
    priority = 'normal',
    idempotencyKey,
    retries = 0,
  } = options;

  const key = idempotencyKey || generateIdempotencyKey();

  // Se estiver online, tenta enviar imediatamente
  if (isOnline()) {
    try {
      // Adiciona idempotency key aos headers
      const requestHeaders = {
        ...headers,
        'X-Idempotency-Key': key,
      };

      // Faz requisição
      let response;
      switch (method) {
        case 'GET':
          response = await apiClient.get(url, { headers: requestHeaders });
          break;
        case 'POST':
          response = await apiClient.post(url, body, { headers: requestHeaders });
          break;
        case 'PUT':
          response = await apiClient.put(url, body, { headers: requestHeaders });
          break;
        case 'PATCH':
          response = await apiClient.patch(url, body, { headers: requestHeaders });
          break;
        case 'DELETE':
          response = await apiClient.delete(url, { headers: requestHeaders });
          break;
      }

      return {
        success: true,
        queued: false,
        data: response.data,
      };
    } catch (error: any) {
      // Se erro e for erro de rede, salva na fila
      if (
        error.code === 'ECONNABORTED' ||
        error.message?.includes('Network Error') ||
        !isOnline()
      ) {
        // Agora está offline, salva na fila
        return await queueRequest(options, key);
      }

      // Erro não relacionado a rede, retorna erro
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
  options: SalvadorOffOptions,
  idempotencyKey: string
): Promise<SalvadorOffResult> {
  try {
    const queueId = await addToQueue({
      url: options.url,
      method: options.method,
      headers: options.headers || {},
      body: JSON.stringify(options.body || {}),
      idempotencyKey,
      priority: options.priority || 'normal',
    });

    // Registra Background Sync
    await registerBackgroundSync();

    console.log(`[salvadorOff] ✅ Ação salva na fila offline (ID: ${queueId})`);

    return {
      success: true,
      queued: true,
      queueId,
    };
  } catch (error) {
    console.error('[salvadorOff] Erro ao salvar na fila:', error);
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
  const { getQueueItems } = await import('./offline-queue');
  const items = await getQueueItems();

  let synced = 0;
  let failed = 0;

  for (const item of items) {
    try {
      // Tenta enviar requisição
      const requestHeaders = {
        ...item.headers,
        'X-Idempotency-Key': item.idempotencyKey,
      };

      let response;
      switch (item.method) {
        case 'GET':
          response = await apiClient.get(item.url, { headers: requestHeaders });
          break;
        case 'POST':
          response = await apiClient.post(
            item.url,
            JSON.parse(item.body),
            { headers: requestHeaders }
          );
          break;
        case 'PUT':
          response = await apiClient.put(
            item.url,
            JSON.parse(item.body),
            { headers: requestHeaders }
          );
          break;
        case 'PATCH':
          response = await apiClient.patch(
            item.url,
            JSON.parse(item.body),
            { headers: requestHeaders }
          );
          break;
        case 'DELETE':
          response = await apiClient.delete(item.url, { headers: requestHeaders });
          break;
      }

      // Sucesso: remove da fila
      await removeFromQueue(item.id);
      synced++;

      console.log(`[salvadorOff] ✅ Sincronizado: ${item.url}`);
    } catch (error: any) {
      // Erro: incrementa retries
      const newRetries = await incrementRetries(item.id);

      if (newRetries >= 5) {
        // Muitas tentativas: move para failed
        await moveToFailed(
          item,
          error.message || 'Erro ao sincronizar'
        );
        failed++;
        console.error(`[salvadorOff] ❌ Falhou após 5 tentativas: ${item.url}`);
      } else {
        console.warn(
          `[salvadorOff] ⚠️ Erro ao sincronizar (tentativa ${newRetries}/5): ${item.url}`
        );
      }
    }
  }

  return { synced, failed };
}

