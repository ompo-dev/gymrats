"use client";

import type React from "react";
import { createContext, useContext, useEffect, useMemo } from "react";
import { useGymsDataStore } from "@/stores/gyms-list-store";

export interface GymInfo {
  id: string;
  name: string;
  logo?: string;
  address: string;
  email: string;
  plan: "basic" | "premium" | "enterprise";
  isActive: boolean;
  hasActiveSubscription: boolean;
}

interface ActiveGymContextType {
  activeGymId: string | null;
  setActiveGymId: (gymId: string) => Promise<void>;
  gyms: GymInfo[];
  activeGym: GymInfo | null;
  isLoading: boolean;
  canCreateMultipleGyms: boolean;
  refreshGyms: () => Promise<void>;
}

const ActiveGymContext = createContext<ActiveGymContextType | undefined>(
  undefined,
);

export function ActiveGymProvider({ children }: { children: React.ReactNode }) {
  const gymsData = useGymsDataStore((state) => state.gymsData);
  const activeGymId = useGymsDataStore((state) => state.activeGymId);
  const isLoading = useGymsDataStore((state) => state.isLoading);
  const canCreateMultipleGyms = useGymsDataStore(
    (state) => state.canCreateMultipleGyms,
  );
  const setActiveGymId = useGymsDataStore((state) => state.setActiveGymId);
  const refreshGyms = useGymsDataStore((state) => state.loadAllGyms);

  useEffect(() => {
    void refreshGyms();
  }, [refreshGyms]);

  const value = useMemo<ActiveGymContextType>(() => {
    const gyms = Object.values(gymsData) as GymInfo[];
    const activeGym = activeGymId ? (gymsData[activeGymId] ?? null) : null;

    return {
      activeGymId,
      setActiveGymId,
      gyms,
      activeGym,
      isLoading,
      canCreateMultipleGyms,
      refreshGyms,
    };
  }, [
    activeGymId,
    canCreateMultipleGyms,
    gymsData,
    isLoading,
    refreshGyms,
    setActiveGymId,
  ]);

  return (
    <ActiveGymContext.Provider value={value}>
      {children}
    </ActiveGymContext.Provider>
  );
}

export function useActiveGym() {
  const context = useContext(ActiveGymContext);
  if (context === undefined) {
    throw new Error("useActiveGym deve ser usado dentro de ActiveGymProvider");
  }
  return context;
}
