/**
 * Hook para Ações Offline
 * 
 * Encapsula syncManager() para uso fácil em componentes
 * 
 * Exemplo:
 * const updateXp = useOfflineAction('PUT', '/api/students/progress');
 * await updateXp({ totalXP: 1500 });
 */

"use client";

import { useCallback } from "react";
import { syncManager, type SyncManagerOptions, type SyncManagerResult } from "@/lib/offline/sync-manager";
import { apiClient } from "@/lib/api/client";

// ============================================
// TIPOS
// ============================================

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface UseOfflineActionOptions {
  method: HttpMethod;
  url: string;
  priority?: 'high' | 'normal' | 'low';
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onQueued?: (queueId: string) => void;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

/**
 * Hook para ações offline/online automáticas
 * 
 * @param options - Configuração da ação
 * @returns Função para executar a ação
 */
export function useOfflineAction<T = any>(
  options: UseOfflineActionOptions
) {
  const { method, url, priority, onSuccess, onError, onQueued } = options;

  const action = useCallback(
    async (body?: T, customHeaders?: Record<string, string>): Promise<SyncManagerResult> => {
      // Obtém token de autenticação
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('auth_token') 
        : null;

      const headers: Record<string, string> = {
        ...customHeaders,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Executa syncManager
      const result = await syncManager({
        url,
        method,
        body,
        headers,
        priority,
      });

      // Callbacks
      if (result.success) {
        if (result.queued) {
          onQueued?.(result.queueId!);
        } else {
          onSuccess?.(result.data);
        }
      } else {
        onError?.(result.error || new Error('Erro desconhecido'));
      }

      return result;
    },
    [method, url, priority, onSuccess, onError, onQueued]
  );

  return action;
}

// ============================================
// HOOKS ESPECIALIZADOS
// ============================================

/**
 * Hook para atualizar progresso (XP, level, etc)
 */
export function useUpdateProgress() {
  return useOfflineAction({
    method: 'PUT',
    url: '/api/students/progress',
    priority: 'high',
  });
}

/**
 * Hook para atualizar perfil
 */
export function useUpdateProfile() {
  return useOfflineAction({
    method: 'POST',
    url: '/api/students/profile',
    priority: 'normal',
  });
}

/**
 * Hook para adicionar peso
 */
export function useAddWeight() {
  return useOfflineAction({
    method: 'POST',
    url: '/api/students/weight',
    priority: 'high',
  });
}

/**
 * Hook para atualizar nutrição
 */
export function useUpdateNutrition() {
  return useOfflineAction({
    method: 'POST',
    url: '/api/nutrition/daily',
    priority: 'normal',
  });
}

/**
 * Hook para completar workout
 */
export function useCompleteWorkout() {
  return useOfflineAction({
    method: 'POST',
    url: '/api/workouts/[id]/complete',
    priority: 'high',
  });
}

