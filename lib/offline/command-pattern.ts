/**
 * Command Pattern para Ações Offline
 * 
 * Transforma ações em Commands explícitos para:
 * - Replay
 * - Log
 * - Auditoria
 * - Versionamento
 * - Debug offline
 */

/**
 * Gera UUID simples
 */
function generateUUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// TIPOS
// ============================================

export type CommandType =
  | 'UPDATE_PROGRESS'
  | 'UPDATE_PROFILE'
  | 'ADD_WEIGHT'
  | 'UPDATE_NUTRITION'
  | 'COMPLETE_WORKOUT'
  | 'ADD_PERSONAL_RECORD'
  | 'UPDATE_SUBSCRIPTION'
  | 'CUSTOM';

export interface Command {
  id: string;
  type: CommandType;
  payload: any;
  meta: {
    optimistic: boolean;
    idempotencyKey: string;
    createdAt: number;
    userId?: string;
    version?: string;
  };
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retries: number;
  error?: string;
}

// ============================================
// FUNÇÕES
// ============================================

/**
 * Cria um Command explícito
 */
export function createCommand(
  type: CommandType,
  payload: any,
  options?: {
    idempotencyKey?: string;
    optimistic?: boolean;
    userId?: string;
    version?: string;
  }
): Command {
  return {
    id: generateUUID(),
    type,
    payload,
    meta: {
      optimistic: options?.optimistic ?? true,
      idempotencyKey: options?.idempotencyKey || generateUUID(),
      createdAt: Date.now(),
      userId: options?.userId,
      version: options?.version || '1.0.0',
    },
    status: 'pending',
    retries: 0,
  };
}

/**
 * Converte Command para formato de salvadorOff
 */
export function commandToSalvadorOff(
  command: Command,
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  headers?: Record<string, string>
) {
  return {
    url,
    method,
    body: command.payload,
    headers: {
      ...headers,
      'X-Idempotency-Key': command.meta.idempotencyKey,
      'X-Command-Id': command.id,
      'X-Command-Type': command.type,
    },
    priority: 'high' as const,
    idempotencyKey: command.meta.idempotencyKey,
  };
}

