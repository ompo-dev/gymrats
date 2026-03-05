import { create } from "zustand";
import type {
  PersonalDataSection,
  PersonalUnifiedData,
} from "@/lib/types/personal-unified";
import { initialPersonalData } from "@/lib/types/personal-unified";
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
  }),
);
