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

import { featureFlags } from "@gymrats/config";
import { useCallback } from "react";
import { useDomainInitializer } from "@/hooks/shared/use-domain-initializer";
import { useStudentBootstrap } from "@/hooks/use-student-bootstrap";
import { useUserSession } from "@/hooks/use-user-session";
import { isAdmin, isStudent } from "@/lib/utils/role";
import { hydrateStudentBootstrapData } from "@/stores/student/load-helpers";
import { useStudentDiscoveryStore } from "@/stores/student-discovery-store";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";
import type { StudentData } from "@/lib/types/student-unified";

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
  type StudentStoreSetter = (
    fn: (state: { data: StudentData }) => { data: StudentData },
  ) => void;

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
  const preloadDiscovery = useStudentDiscoveryStore(
    (state) => state.preloadDefault,
  );
  const bootstrapQuery = useStudentBootstrap(undefined, {
    enabled: false,
  });

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

  const initializer = useDomainInitializer({
    autoLoad,
    sessionLoading,
    hasSession: !!userSession,
    role,
    canInitializeRole: (currentRole) =>
      isStudent(currentRole as string) || isAdmin(currentRole as string),
    loadAll: async () => {
      memoizedOnLoadStart();
      if (featureFlags.perfStudentBootstrapV2) {
        const bootstrapData =
          bootstrapQuery.data ??
          (await bootstrapQuery.refetch()).data ??
          null;

        if (bootstrapData?.data) {
          hydrateStudentBootstrapData(
            useStudentUnifiedStore.setState as unknown as StudentStoreSetter,
            bootstrapData.data,
          );
        } else {
          await loadAll();
        }
      } else {
        await loadAll();
      }
      await preloadDiscovery();
      memoizedOnLoadComplete();
    },
    isInitialized,
    lastSync,
    isLoading,
    onError: (error) => {
      memoizedOnLoadError(error);
      console.error("[useStudentInitializer] Erro ao carregar dados:", error);
    },
  });

  return {
    isInitialized: initializer.isInitialized,
    isInitializing: initializer.isInitializing,
    isLoading: initializer.isLoading,
    hasError: Object.keys(errors).length > 0,
    errors,
  };
}
