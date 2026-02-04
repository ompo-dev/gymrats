/**
 * Logger de Comandos para Observabilidade
 *
 * Armazena os últimos N comandos localmente para debug
 * Não é visual ainda, só infraestrutura
 */

import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import type { Command } from "./command-pattern";

// ============================================
// TIPOS
// ============================================

interface CommandLogDB extends DBSchema {
	commands: {
		key: string; // command.id
		value: {
			id: string;
			command: Command;
			loggedAt: number;
		};
		indexes: { "by-logged": number; "by-status": string };
	};
}

// ============================================
// CONFIGURAÇÃO
// ============================================

const MAX_LOGS = 100; // Últimos 100 comandos
let logDBInstance: IDBPDatabase<CommandLogDB> | null = null;

// ============================================
// FUNÇÕES
// ============================================

async function getLogDB(): Promise<IDBPDatabase<CommandLogDB>> {
	if (logDBInstance) {
		return logDBInstance;
	}

	logDBInstance = await openDB<CommandLogDB>("command-logs", 1, {
		upgrade(db) {
			if (!db.objectStoreNames.contains("commands")) {
				const store = db.createObjectStore("commands", { keyPath: "id" });
				store.createIndex("logged", "loggedAt", { unique: false });
				store.createIndex("status", "command.status", { unique: false });
			}
		},
	});

	return logDBInstance;
}

/**
 * Loga um comando para observabilidade
 */
export async function logCommand(command: Command): Promise<void> {
	try {
		const db = await getLogDB();
		const store = db
			.transaction("commands", "readwrite")
			.objectStore("commands");

		// Adicionar log
		await store.put({
			id: command.id,
			command: {
				...command,
				// Serializar erro se existir
				errorDetails: command.error
					? {
							message: command.error,
							stack:
								command.error instanceof Error
									? command.error.stack
									: undefined,
						}
					: undefined,
			},
			loggedAt: Date.now(),
		});

		// Limpar logs antigos (manter apenas os últimos MAX_LOGS)
		const index = store.index("logged");
		const allLogs = await index.getAll();

		if (allLogs.length > MAX_LOGS) {
			// Ordenar por data (mais antigo primeiro)
			const sorted = allLogs.sort((a, b) => a.loggedAt - b.loggedAt);
			const toDelete = sorted.slice(0, allLogs.length - MAX_LOGS);

			for (const log of toDelete) {
				await store.delete(log.id);
			}
		}
	} catch (error) {
		console.error("[Command Logger] Erro ao logar comando:", error);
		// Não quebrar o fluxo se o log falhar
	}
}

/**
 * Atualiza o status de um comando logado
 */
export async function updateCommandStatus(
	commandId: string,
	status: Command["status"],
	error?: any,
): Promise<void> {
	try {
		const db = await getLogDB();
		const store = db
			.transaction("commands", "readwrite")
			.objectStore("commands");
		const existing = await store.get(commandId);

		if (existing) {
			await store.put({
				...existing,
				command: {
					...existing.command,
					status,
					error: error?.message || error,
					errorDetails: error
						? {
								message: error?.message || String(error),
								stack: error?.stack,
								code: error?.code,
							}
						: undefined,
				},
			});
		}
	} catch (error) {
		console.error("[Command Logger] Erro ao atualizar status:", error);
	}
}

/**
 * Busca comandos por status
 */
export async function getCommandsByStatus(
	status: Command["status"],
	limit: number = 50,
): Promise<Command[]> {
	try {
		const db = await getLogDB();
		const store = db
			.transaction("commands", "readonly")
			.objectStore("commands");
		const index = store.index("status");
		const results = await index.getAll(status);

		// Ordenar por data (mais recente primeiro) e limitar
		const sorted = results
			.sort((a, b) => b.loggedAt - a.loggedAt)
			.slice(0, limit);

		return sorted.map((log) => log.command);
	} catch (error) {
		console.error("[Command Logger] Erro ao buscar comandos:", error);
		return [];
	}
}

/**
 * Busca os últimos N comandos
 */
export async function getRecentCommands(
	limit: number = 50,
): Promise<Command[]> {
	try {
		const db = await getLogDB();
		const store = db
			.transaction("commands", "readonly")
			.objectStore("commands");
		const index = store.index("logged");
		const allLogs = await index.getAll();

		// Ordenar por data (mais recente primeiro) e limitar
		const sorted = allLogs
			.sort((a, b) => b.loggedAt - a.loggedAt)
			.slice(0, limit);

		return sorted.map((log) => log.command);
	} catch (error) {
		console.error("[Command Logger] Erro ao buscar comandos recentes:", error);
		return [];
	}
}

/**
 * Limpa logs antigos (mais de N dias)
 */
export async function clearOldLogs(daysToKeep: number = 7): Promise<void> {
	try {
		const db = await getLogDB();
		const store = db
			.transaction("commands", "readwrite")
			.objectStore("commands");
		const index = store.index("logged");
		const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

		const allLogs = await index.getAll();
		const toDelete = allLogs.filter((log) => log.loggedAt < cutoff);

		for (const log of toDelete) {
			await store.delete(log.id);
		}

		console.log(`[Command Logger] Limpou ${toDelete.length} logs antigos`);
	} catch (error) {
		console.error("[Command Logger] Erro ao limpar logs:", error);
	}
}
