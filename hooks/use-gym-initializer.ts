"use client";

import { useEffect, useRef } from "react";
import { useUserSession } from "@/hooks/use-user-session";
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

  const hasInitialized = useRef(false);
  const isInitializing = useRef(false);

  useEffect(() => {
    if (
      !autoLoad ||
      sessionLoading ||
      !userSession ||
      !role ||
      (!isGym(role) && !isAdmin(role)) ||
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
        console.error("[useGymInitializer] Erro ao inicializar gym:", error);
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
