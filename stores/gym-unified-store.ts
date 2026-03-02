import { create } from "zustand";
import { apiClient } from "@/lib/api/client";
import type {
  GymDataSection,
  GymPendingAction,
  GymUnifiedData,
} from "@/lib/types/gym-unified";
import { initialGymData } from "@/lib/types/gym-unified";
import { normalizeGymDates } from "@/lib/utils/date-safe";
import {
  clearLoadingState,
  loadSection as loadSectionHelper,
  loadSectionsIncremental,
  updateStoreWithSection,
} from "./gym/load-helpers";

export interface GymUnifiedState {
  data: GymUnifiedData;
  /** Limpa todos os dados ao trocar de academia (evita dados da academia anterior) */
  resetForGymChange: () => void;
  loadAll: () => Promise<void>;
  loadAllPrioritized: (
    priorities: GymDataSection[],
    onlyPriorities?: boolean,
  ) => Promise<void>;
  loadSection: (section: GymDataSection) => Promise<void>;
  hydrateInitial: (data: Partial<GymUnifiedData>) => void;
  createExpense: (data: {
    type: string;
    description?: string | null;
    amount: number;
    date?: string | null;
    category?: string | null;
  }) => Promise<void>;
  createPayment: (data: {
    studentId: string;
    studentName?: string;
    planId?: string | null;
    amount: number;
    dueDate: string;
    paymentMethod?: string;
    reference?: string | null;
  }) => Promise<void>;
  checkInStudent: (studentId: string) => Promise<void>;
  checkOutStudent: (checkInId: string) => Promise<void>;
  updatePaymentStatus: (
    paymentId: string,
    status: "paid" | "pending" | "overdue" | "canceled",
  ) => Promise<void>;
  updateMemberStatus: (
    membershipId: string,
    status: "active" | "suspended" | "canceled",
  ) => Promise<void>;
  createEquipment: (data: {
    name: string;
    type: string;
    brand?: string | null;
    model?: string | null;
    serialNumber?: string | null;
    purchaseDate?: string | null;
  }) => Promise<void>;
  updateEquipment: (
    equipmentId: string,
    data: {
      name?: string;
      type?: string;
      brand?: string | null;
      model?: string | null;
      serialNumber?: string | null;
      purchaseDate?: string | null;
      status?: "available" | "in-use" | "maintenance" | "broken";
    },
  ) => Promise<void>;
  createMaintenance: (
    equipmentId: string,
    data: {
      type: string;
      description: string;
      performedBy: string;
      cost?: string | number;
      nextScheduled?: string;
    },
  ) => Promise<void>;
  createMembershipPlan: (data: {
    name: string;
    type: string;
    price: number;
    duration: number;
    benefits?: string[];
  }) => Promise<void>;
  updateMembershipPlan: (
    planId: string,
    data: {
      name?: string;
      type?: string;
      price?: number;
      duration?: number;
      benefits?: string[];
    },
  ) => Promise<void>;
  deleteMembershipPlan: (planId: string) => Promise<void>;
  enrollStudent: (data: {
    studentId: string;
    planId?: string | null;
    amount: number;
  }) => Promise<void>;
  createGymSubscription: (data: {
    billingPeriod?: "monthly" | "annual";
  }) => Promise<void>;
  cancelGymSubscription: () => Promise<void>;
}

export const useGymUnifiedStore = create<GymUnifiedState>()((set, get) => ({
  data: initialGymData,

  resetForGymChange: () => {
    clearLoadingState();
    set({
      data: {
        ...initialGymData,
        metadata: {
          ...initialGymData.metadata,
          isInitialized: false,
          lastSync: null,
        },
      },
    });
  },

  hydrateInitial: (incoming) => {
    const normalized = normalizeGymDates(incoming) as Partial<GymUnifiedData>;
    set((state) => ({
      data: {
        ...state.data,
        ...normalized,
        metadata: {
          ...state.data.metadata,
          isInitialized: true,
          lastSync: new Date(),
        },
      },
    }));
  },

  loadAll: async () => {
    set((state) => ({
      data: {
        ...state.data,
        metadata: { ...state.data.metadata, isLoading: true },
      },
    }));
    const allSections: GymDataSection[] = [
      "stats",
      "students",
      "equipment",
      "recentCheckIns",
      "financialSummary",
      "membershipPlans",
      "payments",
      "expenses",
      "subscription",
    ];
    await loadSectionsIncremental(set, allSections);
    set((state) => ({
      data: {
        ...state.data,
        metadata: {
          ...state.data.metadata,
          isLoading: false,
          isInitialized: true,
          lastSync: new Date(),
        },
      },
    }));
  },

  loadAllPrioritized: async (priorities, onlyPriorities = true) => {
    await loadSectionsIncremental(set, priorities);
    if (!onlyPriorities) {
      const allSections: GymDataSection[] = [
        "stats",
        "students",
        "equipment",
        "recentCheckIns",
        "financialSummary",
        "membershipPlans",
        "payments",
        "expenses",
        "subscription",
      ];
      const rest = allSections.filter((s) => !priorities.includes(s));
      loadSectionsIncremental(set, rest).catch(() => {});
    }
  },

  loadSection: async (section) => {
    const start = Date.now();
    const sectionData = await loadSectionHelper(section);
    updateStoreWithSection(set, sectionData, Date.now() - start, section);
  },

  createExpense: async (payload) => {
    try {
      await apiClient.post("/api/gyms/expenses", payload as any);
      await get().loadSection("expenses");
      await get().loadSection("financialSummary");
    } catch (error) {
      console.error("[GymUnifiedStore] Erro ao criar despesa:", error);
    }
  },

  createPayment: async (payload) => {
    try {
      await apiClient.post("/api/gyms/payments", payload as any);
      await get().loadSection("payments");
      await get().loadSection("financialSummary");
    } catch (error) {
      console.error("[GymUnifiedStore] Erro ao criar pagamento:", error);
    }
  },

  checkInStudent: async (studentId) => {
    try {
      await apiClient.post("/api/gyms/checkin", { studentId } as any);
      await Promise.all([
        get().loadSection("recentCheckIns"),
        get().loadSection("stats"),
      ]);
    } catch (error) {
      console.error("[GymUnifiedStore] Erro ao fazer check-in:", error);
    }
  },

  checkOutStudent: async (checkInId) => {
    try {
      await apiClient.post("/api/gyms/checkout", { checkInId } as any);
      await Promise.all([
        get().loadSection("recentCheckIns"),
        get().loadSection("stats"),
      ]);
    } catch (error) {
      console.error("[GymUnifiedStore] Erro ao fazer checkout:", error);
    }
  },

  updatePaymentStatus: async (paymentId, status) => {
    try {
      await apiClient.patch(`/api/gyms/payments/${paymentId}`, {
        status,
      } as any);
      await Promise.all([
        get().loadSection("payments"),
        get().loadSection("financialSummary"),
      ]);
    } catch (error) {
      console.error(
        "[GymUnifiedStore] Erro ao atualizar status do pagamento:",
        error,
      );
    }
  },

  updateMemberStatus: async (membershipId, status) => {
    try {
      await apiClient.patch(`/api/gyms/members/${membershipId}`, {
        status,
      } as any);
      await Promise.all([
        get().loadSection("students"),
        get().loadSection("stats"),
      ]);
    } catch (error) {
      console.error(
        "[GymUnifiedStore] Erro ao atualizar status do membro:",
        error,
      );
    }
  },

  createEquipment: async (payload) => {
    try {
      await apiClient.post("/api/gyms/equipment", payload as any);
      await Promise.all([
        get().loadSection("equipment"),
        get().loadSection("stats"),
      ]);
    } catch (error) {
      console.error("[GymUnifiedStore] Erro ao criar equipamento:", error);
    }
  },

  updateEquipment: async (equipmentId, payload) => {
    try {
      await apiClient.patch(
        `/api/gyms/equipment/${equipmentId}`,
        payload as any,
      );
      await Promise.all([
        get().loadSection("equipment"),
        get().loadSection("stats"),
      ]);
    } catch (error) {
      console.error("[GymUnifiedStore] Erro ao atualizar equipamento:", error);
    }
  },

  createMaintenance: async (equipmentId, payload) => {
    try {
      await apiClient.post(`/api/gyms/equipment/${equipmentId}/maintenance`, {
        ...payload,
      } as any);
      await get().loadSection("equipment");
    } catch (error) {
      console.error("[GymUnifiedStore] Erro ao criar manutenção:", error);
    }
  },

  createMembershipPlan: async (payload) => {
    try {
      await apiClient.post("/api/gyms/plans", payload as any);
      await get().loadSection("membershipPlans");
    } catch (error) {
      console.error("[GymUnifiedStore] Erro ao criar plano:", error);
    }
  },

  updateMembershipPlan: async (planId, payload) => {
    try {
      await apiClient.patch(`/api/gyms/plans/${planId}`, payload as any);
      await get().loadSection("membershipPlans");
    } catch (error) {
      console.error("[GymUnifiedStore] Erro ao atualizar plano:", error);
    }
  },

  deleteMembershipPlan: async (planId) => {
    try {
      await apiClient.delete(`/api/gyms/plans/${planId}`);
      await get().loadSection("membershipPlans");
    } catch (error) {
      console.error("[GymUnifiedStore] Erro ao deletar plano:", error);
    }
  },

  enrollStudent: async (payload) => {
    try {
      await apiClient.post("/api/gyms/members", payload as any);
      await Promise.all([
        get().loadSection("students"),
        get().loadSection("stats"),
      ]);
    } catch (error) {
      console.error("[GymUnifiedStore] Erro ao matricular aluno:", error);
    }
  },

  createGymSubscription: async (payload) => {
    try {
      await apiClient.post("/api/gym-subscriptions/create", payload as any);
      await get().loadSection("subscription");
    } catch (error) {
      console.error(
        "[GymUnifiedStore] Erro ao criar assinatura da academia:",
        error,
      );
    }
  },

  cancelGymSubscription: async () => {
    try {
      await apiClient.post("/api/gym-subscriptions/cancel", {} as any);
      await get().loadSection("subscription");
    } catch (error) {
      console.error(
        "[GymUnifiedStore] Erro ao cancelar assinatura da academia:",
        error,
      );
    }
  },
}));
