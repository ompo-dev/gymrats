"use client";

import { useDomainInitializer } from "@/hooks/shared/use-domain-initializer";
import { usePersonalBootstrap } from "@/hooks/use-personal-bootstrap";
import { useUserSession } from "@/hooks/use-user-session";
import { DEFAULT_PERSONAL_BOOTSTRAP_SECTIONS } from "@/lib/api/bootstrap-sections";
import { isAdmin, isPersonal } from "@/lib/utils/role";
import { usePersonalUnifiedStore } from "@/stores/personal-unified-store";

export function usePersonalInitializer(options?: { autoLoad?: boolean }) {
  const { autoLoad = true } = options || {};
  const { userSession, isLoading: sessionLoading, role } = useUserSession();
  const isInitialized = usePersonalUnifiedStore(
    (state) => state.data.metadata.isInitialized,
  );
  const lastSync = usePersonalUnifiedStore(
    (state) => state.data.metadata.lastSync,
  );
  const isLoading = usePersonalUnifiedStore(
    (state) => state.data.metadata.isLoading,
  );
  const bootstrapQuery = usePersonalBootstrap(
    DEFAULT_PERSONAL_BOOTSTRAP_SECTIONS,
    {
      enabled: false,
    },
  );
  const initializer = useDomainInitializer({
    autoLoad,
    sessionLoading,
    hasSession: !!userSession,
    role,
    canInitializeRole: (currentRole) =>
      isPersonal(currentRole as string) || isAdmin(currentRole as string),
    loadAll: async () => {
      const bootstrapData =
        bootstrapQuery.data ?? (await bootstrapQuery.refetch()).data ?? null;

      if (!bootstrapData?.data) {
        throw new Error("Personal bootstrap retornou payload vazio.");
      }

      usePersonalUnifiedStore.getState().hydrateInitial(bootstrapData.data);
    },
    isInitialized,
    lastSync,
    isLoading,
    onError: (error) => {
      console.error(
        "[usePersonalInitializer] Erro ao inicializar personal:",
        error,
      );
    },
  });

  return {
    isInitialized: initializer.isInitialized,
    isInitializing: initializer.isInitializing,
    isLoading: initializer.isLoading,
  };
}
