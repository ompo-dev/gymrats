"use client";

import { useDomainInitializer } from "@/hooks/shared/use-domain-initializer";
import { useUserSession } from "@/hooks/use-user-session";
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
  const initializer = useDomainInitializer({
    autoLoad,
    sessionLoading,
    hasSession: !!userSession,
    role,
    canInitializeRole: (currentRole) =>
      isPersonal(currentRole as string) || isAdmin(currentRole as string),
    loadAll,
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
