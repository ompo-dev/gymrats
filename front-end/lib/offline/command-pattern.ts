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

/**
 * Verifica se um ID é um ID temporário (formato de command ID)
 * IDs temporários têm formato: timestamp-random-random
 */
export function isTemporaryId(id: string): boolean {
  if (!id) return false;
  // Formato: timestamp-random-random (ex: "1767707729293-ifbn3r43t-20bx1d8y7")
  const parts = id.split("-");
  if (parts.length !== 3) return false;
  // Primeira parte deve ser um timestamp (número)
  const timestamp = parseInt(parts[0], 10);
  return !isNaN(timestamp) && timestamp > 0 && parts[1].length > 0 && parts[2].length > 0;
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
  | 'CREATE_UNIT'
  | 'UPDATE_UNIT'
  | 'DELETE_UNIT'
  | 'CREATE_WORKOUT'
  | 'UPDATE_WORKOUT'
  | 'DELETE_WORKOUT'
  | 'ADD_WORKOUT_EXERCISE'
  | 'UPDATE_WORKOUT_EXERCISE'
  | 'DELETE_WORKOUT_EXERCISE'
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
    version: number; // OBRIGATÓRIO - versão do comando para migração
    dependsOn?: string[]; // IDs de comandos que devem ser executados antes
  };
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retries: number;
  error?: string;
  errorDetails?: any; // Detalhes serializados do erro para debug
}

// ============================================
// FUNÇÕES
// ============================================

/**
 * Versões dos comandos por tipo
 * Incrementar quando o payload mudar
 */
const COMMAND_VERSIONS: Record<CommandType, number> = {
  UPDATE_PROGRESS: 1,
  UPDATE_PROFILE: 1,
  ADD_WEIGHT: 1,
  UPDATE_NUTRITION: 1,
  COMPLETE_WORKOUT: 1,
  ADD_PERSONAL_RECORD: 1,
  UPDATE_SUBSCRIPTION: 1,
  CREATE_UNIT: 1,
  UPDATE_UNIT: 1,
  DELETE_UNIT: 1,
  CREATE_WORKOUT: 1,
  UPDATE_WORKOUT: 1,
  DELETE_WORKOUT: 1,
  ADD_WORKOUT_EXERCISE: 1,
  UPDATE_WORKOUT_EXERCISE: 1,
  DELETE_WORKOUT_EXERCISE: 1,
  CUSTOM: 1,
};

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
    version?: number; // Versão específica (opcional, usa padrão se não fornecido)
    dependsOn?: string[]; // IDs de comandos que devem ser executados antes
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
      version: options?.version ?? COMMAND_VERSIONS[type] ?? 1, // Versão obrigatória
      dependsOn: options?.dependsOn || [],
    },
    status: 'pending',
    retries: 0,
  };
}

/**
 * Converte Command para formato de syncManager
 */
export function commandToSyncManager(
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
      'X-Command-Version': String(command.meta.version), // Versão do comando
      'X-Command-DependsOn': command.meta.dependsOn?.join(',') || '', // Dependências
    },
    priority: 'high' as const,
    idempotencyKey: command.meta.idempotencyKey,
  };
}

