"use client";

import { useEffect, useRef } from "react";
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

  const hasInitialized = useRef(false);
  const isInitializing = useRef(false);

  useEffect(() => {
    if (
      !autoLoad ||
      sessionLoading ||
      !userSession ||
      !role ||
      (!isPersonal(role) && !isAdmin(role)) ||
      hasInitialized.current ||
      isInitializing.current
    ) {
      return;
    }

    if (isInitialized && lastSync) {
      const lastSyncDate = new Date(lastSync);
      const diffMinutes = (Date.now() - lastSyncDate.getTime()) / (1000 * 60);
      if (diffMinutes < 5) {
        hasInitialized.current = true;
        return;
      }
    }

    isInitializing.current = true;
    loadAll()
      .then(() => {
        hasInitialized.current = true;
        isInitializing.current = false;
      })
      .catch((error) => {
        isInitializing.current = false;
        console.error("[usePersonalInitializer] Erro ao inicializar personal:", error);
      });
  }, [
    autoLoad,
    sessionLoading,
    userSession,
    role,
    isInitialized,
    lastSync,
    loadAll,
  ]);

  useEffect(() => {
    if (!userSession) {
      hasInitialized.current = false;
      isInitializing.current = false;
    }
  }, [userSession]);

  return {
    isInitialized: hasInitialized.current,
    isInitializing: isInitializing.current,
    isLoading,
  };
}
