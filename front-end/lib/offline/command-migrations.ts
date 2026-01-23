/**
 * Migrações de Comandos
 * 
 * Quando o payload de um comando muda entre versões,
 * esta função migra comandos antigos para o formato atual
 */

import type { Command } from './command-pattern';

/**
 * Migra um comando de uma versão antiga para a versão atual
 */
export function migrateCommand(command: Command): Command {
  const { type, meta } = command;
  const currentVersion = getCurrentVersion(type);
  
  // Se já está na versão atual, não precisa migrar
  if (meta.version >= currentVersion) {
    return command;
  }

  // Aplicar migrações sequenciais
  let migratedCommand = { ...command };
  
  for (let version = meta.version; version < currentVersion; version++) {
    migratedCommand = applyMigration(migratedCommand, type, version, version + 1);
  }

  return migratedCommand;
}

/**
 * Aplica uma migração específica entre duas versões
 */
function applyMigration(
  command: Command,
  type: string,
  fromVersion: number,
  toVersion: number
): Command {
  // Migrações específicas por tipo e versão
  switch (type) {
    case 'UPDATE_PROGRESS':
      return migrateUpdateProgress(command, fromVersion, toVersion);
    
    case 'UPDATE_PROFILE':
      return migrateUpdateProfile(command, fromVersion, toVersion);
    
    case 'ADD_WEIGHT':
      return migrateAddWeight(command, fromVersion, toVersion);
    
    case 'UPDATE_NUTRITION':
      return migrateUpdateNutrition(command, fromVersion, toVersion);
    
    default:
      // Sem migração necessária
      return {
        ...command,
        meta: {
          ...command.meta,
          version: toVersion,
        },
      };
  }
}

/**
 * Migrações específicas
 */

function migrateUpdateProgress(
  command: Command,
  fromVersion: number,
  toVersion: number
): Command {
  // Exemplo: se no futuro mudarmos a estrutura do payload
  // if (fromVersion === 1 && toVersion === 2) {
  //   return {
  //     ...command,
  //     payload: {
  //       ...command.payload,
  //       // Transformações necessárias
  //     },
  //     meta: {
  //       ...command.meta,
  //       version: 2,
  //     },
  //   };
  // }
  
  return {
    ...command,
    meta: {
      ...command.meta,
      version: toVersion,
    },
  };
}

function migrateUpdateProfile(
  command: Command,
  fromVersion: number,
  toVersion: number
): Command {
  return {
    ...command,
    meta: {
      ...command.meta,
      version: toVersion,
    },
  };
}

function migrateAddWeight(
  command: Command,
  fromVersion: number,
  toVersion: number
): Command {
  return {
    ...command,
    meta: {
      ...command.meta,
      version: toVersion,
    },
  };
}

function migrateUpdateNutrition(
  command: Command,
  fromVersion: number,
  toVersion: number
): Command {
  return {
    ...command,
    meta: {
      ...command.meta,
      version: toVersion,
    },
  };
}

/**
 * Retorna a versão atual de um tipo de comando
 */
function getCurrentVersion(type: string): number {
  // Versões atuais (deve corresponder a COMMAND_VERSIONS em command-pattern.ts)
  const versions: Record<string, number> = {
    UPDATE_PROGRESS: 1,
    UPDATE_PROFILE: 1,
    ADD_WEIGHT: 1,
    UPDATE_NUTRITION: 1,
    COMPLETE_WORKOUT: 1,
    ADD_PERSONAL_RECORD: 1,
    UPDATE_SUBSCRIPTION: 1,
    CUSTOM: 1,
  };
  
  return versions[type] ?? 1;
}

