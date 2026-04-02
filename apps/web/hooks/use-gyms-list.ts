import { useEffect } from "react";
import { useGymsDataStore } from "@/stores/gyms-list-store";

/**
 * Hook para acessar dados das academias
 * Usa selectors do Zustand para performance otimizada
 */
export function useGymsList() {
  const gymsData = useGymsDataStore((state) => state.gymsData);
  const activeGymId = useGymsDataStore((state) => state.activeGymId);
  const canCreateMultipleGyms = useGymsDataStore(
    (state) => state.canCreateMultipleGyms,
  );
  const isLoading = useGymsDataStore((state) => state.isLoading);
  const isCreating = useGymsDataStore((state) => state.isCreating);
  const createError = useGymsDataStore((state) => state.createError);
  const setActiveGymId = useGymsDataStore((state) => state.setActiveGymId);
  const loadAllGyms = useGymsDataStore((state) => state.loadAllGyms);
  const createGym = useGymsDataStore((state) => state.createGym);

  useEffect(() => {
    const needsRefresh = sessionStorage.getItem("refresh-gyms") === "true";
    if (needsRefresh) {
      sessionStorage.removeItem("refresh-gyms");
    }

    void loadAllGyms({ force: needsRefresh });
  }, [loadAllGyms]);

  const gyms = Object.values(gymsData);
  const activeGym = activeGymId ? gymsData[activeGymId] : null;

  return {
    gyms,
    activeGym,
    activeGymId,
    gymsData,
    canCreateMultipleGyms,
    isLoading,
    isCreating,
    createError,
    setActiveGymId,
    refreshGyms: () => loadAllGyms({ force: true }),
    createGym,
  };
}
