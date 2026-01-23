/**
 * Hook para gerenciar sincronização do Service Worker
 * 
 * Escuta mensagens do Service Worker sobre sincronização
 * e fornece status e controles para sincronização manual
 */

"use client";

import { useEffect, useState, useCallback } from 'react';

interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: number | null;
  lastSyncResult: {
    synced: number;
    failed: number;
    total: number;
  } | null;
}

/**
 * Hook para gerenciar sincronização do Service Worker
 */
export function useServiceWorkerSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncTime: null,
    lastSyncResult: null,
  });

  // Escuta mensagens do Service Worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SYNC_COMPLETE') {
        setSyncStatus((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncTime: Date.now(),
          lastSyncResult: {
            synced: event.data.synced || 0,
            failed: event.data.failed || 0,
            total: event.data.total || 0,
          },
        }));
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  /**
   * Força sincronização manual
   */
  const syncNow = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    try {
      setSyncStatus((prev) => ({ ...prev, isSyncing: true }));

      const registration = await navigator.serviceWorker.ready;

      // Tenta usar Background Sync se disponível
      if ('sync' in registration) {
        await registration.sync.register('sync-queue');
      } else {
        // Fallback: envia mensagem para Service Worker
        if (registration.active) {
          registration.active.postMessage({ type: 'SYNC_NOW' });
        }
      }
    } catch (error) {
      console.error('[useServiceWorkerSync] Erro ao sincronizar:', error);
      setSyncStatus((prev) => ({ ...prev, isSyncing: false }));
    }
  }, []);

  return {
    ...syncStatus,
    syncNow,
  };
}

