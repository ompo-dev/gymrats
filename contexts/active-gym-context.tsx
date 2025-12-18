"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

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
  undefined
);

export function ActiveGymProvider({ children }: { children: React.ReactNode }) {
  const [activeGymId, setActiveGymIdState] = useState<string | null>(null);
  const [gyms, setGyms] = useState<GymInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canCreateMultipleGyms, setCanCreateMultipleGyms] = useState(false);

  // Carregar lista de academias do usuário
  const refreshGyms = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/gyms/list", {
        cache: "no-store",
      });
      const data = await response.json();

      if (data.gyms) {
        setGyms(data.gyms);
        setCanCreateMultipleGyms(data.canCreateMultipleGyms || false);

        // Se não tem activeGymId definido, usar a primeira academia
        if (!activeGymId && data.gyms.length > 0) {
          setActiveGymIdState(data.gyms[0].id);
        }

        // Se o activeGymId não existe mais na lista, usar a primeira
        if (
          activeGymId &&
          !data.gyms.find((g: GymInfo) => g.id === activeGymId)
        ) {
          setActiveGymIdState(data.gyms[0]?.id || null);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar academias:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeGymId]);

  // Carregar academias ao montar
  useEffect(() => {
    refreshGyms();
  }, []);

  // Função para alterar academia ativa
  const setActiveGymId = async (gymId: string) => {
    try {
      // Atualizar no backend
      const response = await fetch("/api/gyms/set-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gymId }),
      });

      if (!response.ok) {
        throw new Error("Erro ao alterar academia ativa");
      }

      // Atualizar estado local
      setActiveGymIdState(gymId);

      // Recarregar dados
      await refreshGyms();
    } catch (error) {
      console.error("Erro ao alterar academia:", error);
    }
  };

  const activeGym = gyms.find((g) => g.id === activeGymId) || null;

  return (
    <ActiveGymContext.Provider
      value={{
        activeGymId,
        setActiveGymId,
        gyms,
        activeGym,
        isLoading,
        canCreateMultipleGyms,
        refreshGyms,
      }}
    >
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
