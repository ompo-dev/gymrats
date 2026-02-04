/**
 * Hook para Inicialização Automática dos Dados do Student
 *
 * Este hook verifica se há uma sessão válida e carrega automaticamente
 * todos os dados do student via `/api/students/all` quando:
 * - O usuário faz login
 * - O app é carregado/refreshado e há uma sessão válida
 *
 * Uso: Adicionar este hook em componentes de layout ou providers globais
 */

"use client";

import { useCallback, useEffect, useRef } from "react";
import { useUserSession } from "@/hooks/use-user-session";
import { isAdmin, isStudent } from "@/lib/utils/role";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";

/**
 * Hook que inicializa automaticamente os dados do student
 * quando há uma sessão válida de STUDENT ou ADMIN
 *
 * @param options - Opções de configuração
 * @param options.autoLoad - Se true, carrega automaticamente (padrão: true)
 * @param options.onLoadStart - Callback quando o carregamento inicia
 * @param options.onLoadComplete - Callback quando o carregamento completa
 * @param options.onLoadError - Callback quando há erro no carregamento
 */
export function useStudentInitializer(options?: {
	autoLoad?: boolean;
	onLoadStart?: () => void;
	onLoadComplete?: () => void;
	onLoadError?: (error: Error) => void;
}) {
	const {
		autoLoad = true,
		onLoadStart,
		onLoadComplete,
		onLoadError,
	} = options || {};

	const { userSession, isLoading: sessionLoading, role } = useUserSession();

	// Usar seletores separados e estáveis para evitar re-renders infinitos
	const loadAll = useStudentUnifiedStore((state) => state.loadAll);
	const isInitialized = useStudentUnifiedStore(
		(state) => state.data.metadata.isInitialized,
	);
	const lastSync = useStudentUnifiedStore(
		(state) => state.data.metadata.lastSync,
	);
	const isLoading = useStudentUnifiedStore(
		(state) => state.data.metadata.isLoading,
	);
	const errors = useStudentUnifiedStore((state) => state.data.metadata.errors);

	// Ref para evitar múltiplas chamadas simultâneas
	const hasInitialized = useRef(false);
	const isInitializing = useRef(false);

	// Memoizar callbacks para evitar mudanças desnecessárias
	const memoizedOnLoadStart = useCallback(() => {
		onLoadStart?.();
	}, [onLoadStart]);

	const memoizedOnLoadComplete = useCallback(() => {
		onLoadComplete?.();
	}, [onLoadComplete]);

	const memoizedOnLoadError = useCallback(
		(error: Error) => {
			onLoadError?.(error);
		},
		[onLoadError],
	);

	useEffect(() => {
		// Não fazer nada se:
		// - autoLoad está desabilitado
		// - Ainda está carregando a sessão
		// - Não há sessão válida
		// - O usuário não é STUDENT ou ADMIN
		// - Já inicializou ou está inicializando
		if (
			!autoLoad ||
			sessionLoading ||
			!userSession ||
			!role ||
			(!isStudent(role) && !isAdmin(role)) ||
			hasInitialized.current ||
			isInitializing.current
		) {
			return;
		}

		// Verificar se já está inicializado (dados já foram carregados)
		if (isInitialized && lastSync) {
			// Verificar se os dados não estão muito antigos (mais de 5 minutos)
			const lastSyncDate = new Date(lastSync);
			const now = new Date();
			const diffMinutes =
				(now.getTime() - lastSyncDate.getTime()) / (1000 * 60);

			// Se os dados são recentes (menos de 5 minutos), não recarregar
			if (diffMinutes < 5) {
				hasInitialized.current = true;
				return;
			}
		}

		// Marcar como inicializando para evitar chamadas duplicadas
		isInitializing.current = true;
		memoizedOnLoadStart();

		// Carregar todos os dados
		loadAll()
			.then(() => {
				hasInitialized.current = true;
				isInitializing.current = false;
				memoizedOnLoadComplete();
			})
			.catch((error) => {
				isInitializing.current = false;
				const err = error instanceof Error ? error : new Error(String(error));
				memoizedOnLoadError(err);
				console.error("[useStudentInitializer] Erro ao carregar dados:", err);
			});
	}, [
		autoLoad,
		sessionLoading,
		userSession,
		role,
		loadAll,
		isInitialized,
		lastSync,
		memoizedOnLoadStart,
		memoizedOnLoadComplete,
		memoizedOnLoadError,
	]);

	// Reset do flag quando o usuário muda (logout/login)
	useEffect(() => {
		if (!userSession || !role || (!isStudent(role) && !isAdmin(role))) {
			hasInitialized.current = false;
			isInitializing.current = false;
		}
	}, [userSession, role]);

	return {
		isInitialized: hasInitialized.current,
		isInitializing: isInitializing.current,
		isLoading,
		hasError: Object.keys(errors).length > 0,
		errors,
	};
}
