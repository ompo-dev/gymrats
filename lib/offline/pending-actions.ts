/**
 * Gerenciamento de Ações Pendentes
 *
 * Rastreia ações que foram enfileiradas offline
 * e ainda não foram sincronizadas com o backend
 */

import type { PendingAction } from "@/lib/types/student-unified";

/**
 * Adiciona uma ação pendente ao metadata
 */
export function addPendingAction(
	pendingActions: PendingAction[],
	action: Omit<PendingAction, "id" | "createdAt">,
): PendingAction[] {
	const newAction: PendingAction = {
		id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		...action,
		createdAt: new Date(),
	};

	return [...pendingActions, newAction];
}

/**
 * Remove uma ação pendente após sincronização bem-sucedida
 */
export function removePendingAction(
	pendingActions: PendingAction[],
	actionId: string,
): PendingAction[] {
	return pendingActions.filter((action) => action.id !== actionId);
}

/**
 * Remove ação pendente por queueId
 */
export function removePendingActionByQueueId(
	pendingActions: PendingAction[],
	queueId: string,
): PendingAction[] {
	return pendingActions.filter((action) => action.queueId !== queueId);
}

/**
 * Incrementa retries de uma ação pendente
 */
export function incrementPendingActionRetries(
	pendingActions: PendingAction[],
	actionId: string,
): PendingAction[] {
	return pendingActions.map((action) =>
		action.id === actionId
			? { ...action, retries: action.retries + 1 }
			: action,
	);
}

/**
 * Verifica se há ações pendentes
 */
export function hasPendingActions(pendingActions: PendingAction[]): boolean {
	return pendingActions.length > 0;
}

/**
 * Conta ações pendentes por tipo
 */
export function countPendingActionsByType(
	pendingActions: PendingAction[],
	type: string,
): number {
	return pendingActions.filter((action) => action.type === type).length;
}
