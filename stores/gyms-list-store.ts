import { create } from "zustand";

// Dados completos de uma academia
export interface GymData {
  id: string;
  name: string;
  logo?: string;
  address: string;
  email: string;
  phone: string;
  cnpj?: string;
  plan: "basic" | "premium" | "enterprise";
  hasActiveSubscription: boolean;

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
  students?: any[];
  equipment?: any[];
  checkIns?: any[];
  membershipPlans?: any[];
  payments?: any[];
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

  // Mudar academia ativa (INSTANTÂNEO - só muda o ID)
  setActiveGymId: async (gymId: string) => {
    set({ activeGymId: gymId });

    // Atualizar no backend em background
    try {
      await fetch("/api/gyms/set-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gymId }),
      });
    } catch (error) {
      console.error("Erro ao salvar academia ativa:", error);
    }
  },

  // Carregar TODOS os dados de TODAS as academias
  loadAllGyms: async () => {
    try {
      set({ isLoading: true });

      const response = await fetch("/api/gyms/list", {
        cache: "no-store",
      });
      const data = await response.json();

      if (data.gyms && Array.isArray(data.gyms)) {
        // Converter array para Record<id, GymData>
        const gymsMap: Record<string, GymData> = {};
        data.gyms.forEach((gym: GymData) => {
          gymsMap[gym.id] = gym;
        });

        set({
          gymsData: gymsMap,
          canCreateMultipleGyms: data.canCreateMultipleGyms || false,
        });

        const currentState = get();

        // Se não tem activeGymId, usar a primeira
        if (!currentState.activeGymId && data.gyms.length > 0) {
          set({ activeGymId: data.gyms[0].id });
        }

        // Se o activeGymId não existe mais, usar a primeira
        if (currentState.activeGymId && !gymsMap[currentState.activeGymId]) {
          set({ activeGymId: data.gyms[0]?.id || null });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar academias:", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
