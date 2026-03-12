"use client";

import { featureFlags } from "@gymrats/config";
import { useDomainInitializer } from "@/hooks/shared/use-domain-initializer";
import { useGymBootstrap } from "@/hooks/use-gym-bootstrap";
import { useUserSession } from "@/hooks/use-user-session";
import { isClientApiCapabilityEnabled } from "@/lib/api/route-capabilities";
import { isAdmin, isGym } from "@/lib/utils/role";
import { useGymUnifiedStore } from "@/stores/gym-unified-store";

export function useGymInitializer(options?: { autoLoad?: boolean }) {
  const { autoLoad = true } = options || {};
  const { userSession, isLoading: sessionLoading, role } = useUserSession();
  const loadAll = useGymUnifiedStore((state) => state.loadAll);
  const isInitialized = useGymUnifiedStore(
    (state) => state.data.metadata.isInitialized,
  );
  const lastSync = useGymUnifiedStore((state) => state.data.metadata.lastSync);
  const isLoading = useGymUnifiedStore(
    (state) => state.data.metadata.isLoading,
  );
  const bootstrapQuery = useGymBootstrap(undefined, {
    enabled: false,
  });
  const initializer = useDomainInitializer({
    autoLoad,
    sessionLoading,
    hasSession: !!userSession,
    role,
    canInitializeRole: (currentRole) =>
      isGym(currentRole as string) || isAdmin(currentRole as string),
    loadAll: async () => {
      if (
        featureFlags.perfGymBootstrapV2 &&
        isClientApiCapabilityEnabled("gymBootstrap")
      ) {
        const bootstrapData =
          bootstrapQuery.data ?? (await bootstrapQuery.refetch()).data ?? null;

        if (bootstrapData?.data) {
          useGymUnifiedStore.getState().hydrateInitial(bootstrapData.data);
          return;
        }
      }

      await loadAll();
    },
    isInitialized,
    lastSync,
    isLoading,
    onError: (error) => {
      console.error("[useGymInitializer] Erro ao inicializar gym:", error);
    },
  });

  return {
    isInitialized: initializer.isInitialized,
    isInitializing: initializer.isInitializing,
    isLoading: initializer.isLoading,
  };
}
