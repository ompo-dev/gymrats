import { create } from "zustand";
import { actionClient } from "@/lib/actions/client";
import { log } from "@/lib/observability/logger";

const GYMS_LIST_TTL_MS = 30_000;
let gymsListInflightRequest: Promise<void> | null = null;

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

  // Permissao para criar multiplas
  canCreateMultipleGyms: boolean;

  // Estado de carregamento
  isLoading: boolean;
  isCreating: boolean;
  createError: string;
  lastLoadedAt: number;

  // Actions
  setActiveGymId: (gymId: string) => Promise<void>;
  loadAllGyms: (options?: { force?: boolean }) => Promise<void>;
  createGym: (data: {
    name: string;
    address: string;
    phone: string;
    email: string;
    cnpj: string;
  }) => Promise<void>;
}

export const useGymsDataStore = create<GymsDataState>((set, get) => ({
  gymsData: {},
  activeGymId: null,
  canCreateMultipleGyms: false,
  isLoading: true,
  isCreating: false,
  createError: "",
  lastLoadedAt: 0,

  // Mudar academia ativa
  setActiveGymId: async (gymId: string) => {
    try {
      await actionClient.post("/api/gyms/set-active", { gymId });
      set({ activeGymId: gymId, lastLoadedAt: Date.now() });
    } catch (error) {
      log.error("Erro ao salvar academia ativa", { error, gymId });
    }
  },

  // Carregar TODOS os dados de TODAS as academias
  loadAllGyms: async (options) => {
    const currentState = get();
    const hasFreshData =
      !options?.force &&
      currentState.lastLoadedAt > 0 &&
      Date.now() - currentState.lastLoadedAt < GYMS_LIST_TTL_MS &&
      Object.keys(currentState.gymsData).length > 0;

    if (hasFreshData) {
      return;
    }

    if (gymsListInflightRequest) {
      return gymsListInflightRequest;
    }

    const shouldShowLoading = Object.keys(currentState.gymsData).length === 0;

    gymsListInflightRequest = (async () => {
      try {
        if (shouldShowLoading) {
          set({ isLoading: true });
        }

        const response = await actionClient.get<{
          gyms: GymData[];
          canCreateMultipleGyms?: boolean;
          activeGymId?: string | null;
        }>("/api/gyms/list", {
          profile: "minutes",
          scope: "private",
          tags: ["gym:list", "gym:list:self", "gym:bootstrap:self"],
        });
        const data = response.data;

        if (data.gyms && Array.isArray(data.gyms)) {
          const gymsMap: Record<string, GymData> = {};
          data.gyms.forEach((gym: GymData) => {
            gymsMap[gym.id] = gym;
          });

          const apiActiveId = data.activeGymId ?? null;
          const latestState = get();
          let resolvedActiveId = apiActiveId ?? latestState.activeGymId;

          if (resolvedActiveId && !gymsMap[resolvedActiveId]) {
            resolvedActiveId = data.gyms[0]?.id ?? null;
          }

          if (!resolvedActiveId && data.gyms.length > 0) {
            resolvedActiveId = data.gyms[0].id;
          }

          set({
            gymsData: gymsMap,
            canCreateMultipleGyms: data.canCreateMultipleGyms || false,
            activeGymId: resolvedActiveId,
            lastLoadedAt: Date.now(),
          });
        }
      } catch (error) {
        log.error("Erro ao carregar academias", { error });
      } finally {
        gymsListInflightRequest = null;
        set({ isLoading: false });
      }
    })();

    return gymsListInflightRequest;
  },

  createGym: async (data) => {
    set({ isCreating: true, createError: "" });
    try {
      const response = await actionClient.post<{ error?: string }>(
        "/api/gyms/create",
        data,
      );

      if (response.data.error) {
        throw new Error(response.data.error || "Erro ao criar academia");
      }

      await get().loadAllGyms({ force: true });
    } catch (error) {
      set({
        createError:
          error instanceof Error ? error.message : "Erro ao criar academia",
      });
      throw error;
    } finally {
      set({ isCreating: false });
    }
  },
}));
