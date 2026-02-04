/**
 * Gerenciamento da Fila Offline (IndexedDB)
 *
 * Gerencia a fila de ações offline usando IndexedDB
 */

import { type DBSchema, type IDBPDatabase, openDB } from "idb";

// ============================================
// TIPOS
// ============================================

export interface OfflineQueueItem {
	id: string;
	url: string;
	method: string;
	headers: Record<string, string>;
	body: string;
	timestamp: number;
	retries: number;
	idempotencyKey: string;
	priority?: "high" | "normal" | "low";
}

interface OfflineQueueDB extends DBSchema {
	queue: {
		key: string;
		value: OfflineQueueItem;
		indexes: { "by-timestamp": number; "by-priority": string };
	};
	failed: {
		key: string;
		value: OfflineQueueItem & { error: string; failedAt: number };
		indexes: { "by-timestamp": number };
	};
}

// ============================================
// FUNÇÕES DE BANCO DE DADOS
// ============================================

let dbInstance: IDBPDatabase<OfflineQueueDB> | null = null;

/**
 * Abre conexão com IndexedDB
 */
export async function getDB(): Promise<IDBPDatabase<OfflineQueueDB>> {
	if (dbInstance) {
		return dbInstance;
	}

	dbInstance = await openDB<OfflineQueueDB>("offline-queue", 1, {
		upgrade(db) {
			// Store para fila de ações
			if (!db.objectStoreNames.contains("queue")) {
				const queueStore = db.createObjectStore("queue", { keyPath: "id" });
				queueStore.createIndex("timestamp", "timestamp", { unique: false });
				queueStore.createIndex("priority", "priority", { unique: false });
			}

			// Store para ações falhadas
			if (!db.objectStoreNames.contains("failed")) {
				const failedStore = db.createObjectStore("failed", { keyPath: "id" });
				failedStore.createIndex("timestamp", "timestamp", { unique: false });
			}
		},
	});

	return dbInstance;
}

/**
 * Adiciona item à fila offline
 */
export async function addToQueue(
	item: Omit<OfflineQueueItem, "id" | "timestamp" | "retries">,
): Promise<string> {
	const db = await getDB();
	const queue = db.transaction("queue", "readwrite").objectStore("queue");

	const queueItem: OfflineQueueItem = {
		id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		timestamp: Date.now(),
		retries: 0,
		...item,
	};

	await queue.add(queueItem);
	return queueItem.id;
}

/**
 * Remove item da fila
 */
export async function removeFromQueue(id: string): Promise<void> {
	const db = await getDB();
	const queue = db.transaction("queue", "readwrite").objectStore("queue");
	await queue.delete(id);
}

/**
 * Obtém todos os itens da fila
 */
export async function getQueueItems(): Promise<OfflineQueueItem[]> {
	const db = await getDB();
	const queue = db.transaction("queue", "readonly").objectStore("queue");
	return queue.getAll();
}

/**
 * Obtém tamanho da fila
 */
export async function getQueueSize(): Promise<number> {
	const db = await getDB();
	const queue = db.transaction("queue", "readonly").objectStore("queue");
	return queue.count();
}

/**
 * Incrementa retries de um item
 */
export async function incrementRetries(id: string): Promise<number> {
	const db = await getDB();
	const queue = db.transaction("queue", "readwrite").objectStore("queue");
	const item = await queue.get(id);

	if (!item) {
		throw new Error(`Item ${id} não encontrado na fila`);
	}

	item.retries++;
	await queue.put(item);
	return item.retries;
}

/**
 * Move item para fila de falhados
 */
export async function moveToFailed(
	item: OfflineQueueItem,
	error: string,
): Promise<void> {
	const db = await getDB();
	const failed = db.transaction("failed", "readwrite").objectStore("failed");

	await failed.add({
		...item,
		error,
		failedAt: Date.now(),
	});

	// Remove da fila principal
	await removeFromQueue(item.id);
}

/**
 * Limpa fila de falhados
 */
export async function clearFailed(): Promise<void> {
	const db = await getDB();
	const failed = db.transaction("failed", "readwrite").objectStore("failed");
	await failed.clear();
}
