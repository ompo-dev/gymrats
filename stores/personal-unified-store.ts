import { apiClient } from "@/lib/api/client";
import { getAxiosInstance } from "@/lib/api/client-factory";
import type {
  PersonalDataSection,
  PersonalUnifiedData,
} from "@/lib/types/personal-unified";
import { initialPersonalData } from "@/lib/types/personal-unified";
import { create } from "zustand";
import {
  loadSection as loadSectionHelper,
  loadSectionsIncremental,
  updateStoreWithSection,
} from "./personal/load-helpers";

export interface PersonalUnifiedState {
  data: PersonalUnifiedData;
  loadAll: () => Promise<void>;
  loadAllPrioritized: (
    priorities: PersonalDataSection[],
    onlyPriorities?: boolean,
  ) => Promise<void>;
  loadSection: (section: PersonalDataSection) => Promise<void>;
  hydrateInitial: (data: Partial<PersonalUnifiedData>) => void;
  updateProfile: (data: {
    name?: string;
    email?: string;
    phone?: string | null;
    bio?: string | null;
    atendimentoPresencial?: boolean;
    atendimentoRemoto?: boolean;
  }) => Promise<void>;
  assignStudent: (data: {
    studentId: string;
    gymId?: string;
  }) => Promise<void>;
  removeStudent: (studentId: string) => Promise<void>;
  createPersonalSubscription: (data: {
    plan: "standard" | "pro_ai";
    billingPeriod: "monthly" | "annual";
  }) => Promise<{ pix?: { brCode: string; brCodeBase64: string; amount: number; expiresAt?: string } } | null>;
  cancelPersonalSubscription: () => Promise<void>;
}

export const usePersonalUnifiedStore = create<PersonalUnifiedState>()(
  (set, get) => ({
    data: initialPersonalData,

    hydrateInitial: (data) => {
      set((state) => ({
        data: {
          ...state.data,
          ...data,
          metadata: {
            ...state.data.metadata,
            isInitialized: true,
            lastSync: new Date(),
          },
        },
      }));
    },

    loadAll: async () => {
      set((s) => ({
        data: {
          ...s.data,
          metadata: { ...s.data.metadata, isLoading: true },
        },
      }));
      try {
        const sections: PersonalDataSection[] = [
          "profile",
          "affiliations",
          "students",
          "subscription",
        ];
        const result = await loadSectionsIncremental(sections);
        updateStoreWithSection(set, result);
      } catch (err) {
        console.error("[personal-unified-store] loadAll erro:", err);
        set((s) => ({
          data: {
            ...s.data,
            metadata: {
              ...s.data.metadata,
              isLoading: false,
              errors: {
                ...s.data.metadata.errors,
                loadAll: err instanceof Error ? err.message : "Erro ao carregar",
              },
            },
          },
        }));
      }
    },

    loadAllPrioritized: async (priorities, onlyPriorities = true) => {
      const allSections: PersonalDataSection[] = [
        "profile",
        "affiliations",
        "students",
        "subscription",
      ];
      const sections = onlyPriorities
        ? priorities
        : [...new Set([...priorities, ...allSections])];
      set((s) => ({
        data: {
          ...s.data,
          metadata: { ...s.data.metadata, isLoading: true },
        },
      }));
      try {
        const result = await loadSectionsIncremental(sections);
        updateStoreWithSection(set, result);
      } catch (err) {
        console.error("[personal-unified-store] loadAllPrioritized erro:", err);
        set((s) => ({
          data: {
            ...s.data,
            metadata: { ...s.data.metadata, isLoading: false },
          },
        }));
      }
    },

    loadSection: async (section) => {
      try {
        const result = await loadSectionHelper(section);
        updateStoreWithSection(set, result);
      } catch (err) {
        console.error(
          `[personal-unified-store] loadSection(${section}) erro:`,
          err,
        );
      }
    },

    updateProfile: async (data) => {
      try {
        await apiClient.patch("/api/personals", data);
        await get().loadSection("profile");
      } catch (err) {
        console.error("[personal-unified-store] updateProfile erro:", err);
        throw err;
      }
    },

    assignStudent: async ({ studentId, gymId }) => {
      try {
        await apiClient.post("/api/personals/students/assign", {
          studentId,
          ...(gymId ? { gymId } : {}),
        });
        await get().loadSection("students");
      } catch (err) {
        console.error("[personal-unified-store] assignStudent erro:", err);
        throw err;
      }
    },

    removeStudent: async (studentId) => {
      try {
        await getAxiosInstance().delete("/api/personals/students/assign", {
          data: { studentId },
        });
        await get().loadSection("students");
      } catch (err) {
        console.error("[personal-unified-store] removeStudent erro:", err);
        throw err;
      }
    },

    createPersonalSubscription: async ({ plan, billingPeriod }) => {
      try {
        const res = await apiClient.post<{
          subscription: unknown;
          pix?: {
            brCode: string;
            brCodeBase64: string;
            amount: number;
            expiresAt?: string;
          };
        }>("/api/personals/subscription", { plan, billingPeriod });
        await get().loadSection("subscription");
        return res.data?.pix ? { pix: res.data.pix } : null;
      } catch (err) {
        console.error(
          "[personal-unified-store] createPersonalSubscription erro:",
          err,
        );
        throw err;
      }
    },

    cancelPersonalSubscription: async () => {
      try {
        await apiClient.post("/api/personals/subscription/cancel", {});
        await get().loadSection("subscription");
      } catch (err) {
        console.error(
          "[personal-unified-store] cancelPersonalSubscription erro:",
          err,
        );
        throw err;
      }
    },
  }),
);
