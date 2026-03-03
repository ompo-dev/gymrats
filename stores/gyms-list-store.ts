import { create } from "zustand";

// Dados completos de uma academia
export interface GymData {
  id: string;
  name: string;
  logo?: string;
  address: string;
  email: string;
  phone?: string;
  cnpj?: string;
  plan: "basic" | "premium" | "enterprise";
  hasActiveSubscription: boolean;
  isActive: boolean;

  // Profile & Stats
  profile?: {
    totalStudents: number;
    activeStudents: number;
    level: number;
    xp: number;
    currentStreak: number;
    longestStreak: number;
  };

  stats?: {
    todayCheckins: number;
    todayActiveStudents: number;
    weekTotalCheckins: number;
    monthTotalCheckins: number;
  };

  // Dados relacionados
  students?: Array<Record<string, string | number | boolean | object | null>>;
  equipment?: Array<Record<string, string | number | boolean | object | null>>;
  checkIns?: Array<Record<string, string | number | boolean | object | null>>;
  membershipPlans?: Array<
    Record<string, string | number | boolean | object | null>
  >;
  payments?: Array<Record<string, string | number | boolean | object | null>>;
}

interface GymsDataState {
  // Map de todas as academias: { [gymId]: GymData }
  gymsData: Record<string, GymData>;

  // ID da academia ativa
  activeGymId: string | null;

  // Permissão para criar múltiplas
  canCreateMultipleGyms: boolean;

  // Estado de carregamento
  isLoading: boolean;

  // Actions
  setActiveGymId: (gymId: string) => Promise<void>;
  loadAllGyms: () => Promise<void>;
}

export const useGymsDataStore = create<GymsDataState>((set, get) => ({
  gymsData: {},
  activeGymId: null,
  canCreateMultipleGyms: false,
  isLoading: true,

  // Mudar academia ativa
  setActiveGymId: async (gymId: string) => {
    // Atualizar no backend em background usando axios (API → Zustand → Component)
    // PRIMEIRO: Aguardar o backend atualizar o cookie para não causar race conditions
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.post("/api/gyms/set-active", { gymId });
      
      // SEGUNDO: Atualizar a UI via estado local apenas após o backend ter validado
      set({ activeGymId: gymId });
    } catch (error) {
      console.error("Erro ao salvar academia ativa:", error);
    }
  },

  // Carregar TODOS os dados de TODAS as academias
  loadAllGyms: async () => {
    try {
      set({ isLoading: true });

      // Usar axios client (API → Zustand → Component)
      const { apiClient } = await import("@/lib/api/client");
      const response = await apiClient.get<{
        gyms: GymData[];
        canCreateMultipleGyms?: boolean;
        activeGymId?: string | null;
      }>("/api/gyms/list", {
        headers: {
          "Cache-Control": "no-store",
        },
      });
      const data = response.data;

      if (data.gyms && Array.isArray(data.gyms)) {
        // Converter array para Record<id, GymData>
        const gymsMap: Record<string, GymData> = {};
        data.gyms.forEach((gym: GymData) => {
          gymsMap[gym.id] = gym;
        });

        // Prioridade: API activeGymId > store atual > primeira academia
        const apiActiveId = data.activeGymId ?? null;
        const currentState = get();
        let resolvedActiveId = apiActiveId ?? currentState.activeGymId;

        // Se o ID resolvido não existe mais nas academias, usar a primeira
        if (resolvedActiveId && !gymsMap[resolvedActiveId]) {
          resolvedActiveId = data.gyms[0]?.id ?? null;
        }
        // Se ainda não tem, usar a primeira
        if (!resolvedActiveId && data.gyms.length > 0) {
          resolvedActiveId = data.gyms[0].id;
        }

        set({
          gymsData: gymsMap,
          canCreateMultipleGyms: data.canCreateMultipleGyms || false,
          activeGymId: resolvedActiveId,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar academias:", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
