"use client";

import { useEffect, useRef } from "react";

interface UseDomainInitializerOptions<Role> {
  autoLoad?: boolean;
  sessionLoading: boolean;
  hasSession: boolean;
  role: Role | null | undefined;
  canInitializeRole: (role: Role) => boolean;
  loadAll: () => Promise<void>;
  isInitialized: boolean;
  lastSync: Date | string | null;
  isLoading: boolean;
  staleAfterMs?: number;
  onError?: (error: Error) => void;
}

export function useDomainInitializer<Role>({
  autoLoad = true,
  sessionLoading,
  hasSession,
  role,
  canInitializeRole,
  loadAll,
  isInitialized,
  lastSync,
  isLoading,
  staleAfterMs = 5 * 60 * 1000,
  onError,
}: UseDomainInitializerOptions<Role>) {
  const hasInitialized = useRef(false);
  const isInitializing = useRef(false);

  useEffect(() => {
    if (
      !autoLoad ||
      sessionLoading ||
      !hasSession ||
      !role ||
      !canInitializeRole(role) ||
      hasInitialized.current ||
      isInitializing.current
    ) {
      return;
    }

    if (isInitialized && lastSync) {
      const lastSyncDate = new Date(lastSync);
      if (Date.now() - lastSyncDate.getTime() < staleAfterMs) {
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
        onError?.(error instanceof Error ? error : new Error(String(error)));
      });
  }, [
    autoLoad,
    sessionLoading,
    hasSession,
    role,
    canInitializeRole,
    loadAll,
    isInitialized,
    lastSync,
    staleAfterMs,
    onError,
  ]);

  useEffect(() => {
    if (!hasSession || !role || !canInitializeRole(role)) {
      hasInitialized.current = false;
      isInitializing.current = false;
    }
  }, [hasSession, role, canInitializeRole]);

  return {
    isInitialized: hasInitialized.current,
    isInitializing: isInitializing.current,
    isLoading,
  };
}
