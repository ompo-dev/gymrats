"use client";

import { featureFlags } from "@gymrats/config";
import { useDomainInitializer } from "@/hooks/shared/use-domain-initializer";
import { usePersonalBootstrap } from "@/hooks/use-personal-bootstrap";
import { useUserSession } from "@/hooks/use-user-session";
import { isClientApiCapabilityEnabled } from "@/lib/api/route-capabilities";
import { isAdmin, isPersonal } from "@/lib/utils/role";
import { usePersonalUnifiedStore } from "@/stores/personal-unified-store";

export function usePersonalInitializer(options?: { autoLoad?: boolean }) {
  const { autoLoad = true } = options || {};
  const { userSession, isLoading: sessionLoading, role } = useUserSession();
  const loadAll = usePersonalUnifiedStore((state) => state.loadAll);
  const isInitialized = usePersonalUnifiedStore(
    (state) => state.data.metadata.isInitialized,
  );
  const lastSync = usePersonalUnifiedStore(
    (state) => state.data.metadata.lastSync,
  );
  const isLoading = usePersonalUnifiedStore(
    (state) => state.data.metadata.isLoading,
  );
  const bootstrapQuery = usePersonalBootstrap(undefined, {
    enabled: false,
  });
  const initializer = useDomainInitializer({
    autoLoad,
    sessionLoading,
    hasSession: !!userSession,
    role,
    canInitializeRole: (currentRole) =>
      isPersonal(currentRole as string) || isAdmin(currentRole as string),
    loadAll: async () => {
      if (
        featureFlags.perfPersonalBootstrapV2 &&
        isClientApiCapabilityEnabled("personalBootstrap")
      ) {
        const bootstrapData =
          bootstrapQuery.data ?? (await bootstrapQuery.refetch()).data ?? null;

        if (bootstrapData?.data) {
          usePersonalUnifiedStore.getState().hydrateInitial(bootstrapData.data);
          return;
        }
      }

      await loadAll();
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
