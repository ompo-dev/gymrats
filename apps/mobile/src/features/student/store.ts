import { create } from "zustand";
import {
  addStudentWeight,
  fetchStudentHomeData,
  saveStudentDailyNutrition,
  trackBoostCampaignClick,
  trackBoostCampaignImpression,
} from "./api";
import type { DailyNutrition, StudentHomeData } from "./types";

type StudentHomeStore = {
  data: StudentHomeData | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  seenImpressions: string[];
  load: (options: { apiUrl: string; token: string; force?: boolean }) => Promise<void>;
  trackImpression: (options: {
    apiUrl: string;
    campaignId: string;
  }) => Promise<void>;
  trackClick: (options: { apiUrl: string; campaignId: string }) => Promise<void>;
  addWeight: (options: {
    apiUrl: string;
    token: string;
    weight: number;
    notes?: string;
  }) => Promise<void>;
  saveNutrition: (options: {
    apiUrl: string;
    token: string;
    nutrition: DailyNutrition;
    syncPlan?: boolean;
  }) => Promise<void>;
  reset: () => void;
};

export const useStudentHomeStore = create<StudentHomeStore>((set, get) => ({
  data: null,
  loading: false,
  refreshing: false,
  error: null,
  seenImpressions: [],
  load: async ({ apiUrl, token, force = false }) => {
    if (get().loading && !force) {
      return;
    }

    set((state) => ({
      loading: state.data == null,
      refreshing: state.data != null,
      error: null,
    }));

    try {
      const data = await fetchStudentHomeData({
        apiUrl,
        token,
      });
      set({
        data,
        loading: false,
        refreshing: false,
        error: null,
      });
    } catch (error) {
      set({
        loading: false,
        refreshing: false,
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar a home do aluno.",
      });
    }
  },
  trackImpression: async ({ apiUrl, campaignId }) => {
    if (get().seenImpressions.includes(campaignId)) {
      return;
    }

    set((state) => ({
      seenImpressions: [...state.seenImpressions, campaignId],
    }));

    try {
      await trackBoostCampaignImpression(apiUrl, campaignId);
    } catch {
      set((state) => ({
        seenImpressions: state.seenImpressions.filter((id) => id !== campaignId),
      }));
    }
  },
  trackClick: async ({ apiUrl, campaignId }) => {
    try {
      await trackBoostCampaignClick(apiUrl, campaignId);
    } catch {
      // click tracking should not block navigation
    }
  },
  addWeight: async ({ apiUrl, token, weight, notes }) => {
    const previousData = get().data;

    if (!previousData) {
      return;
    }

    const nextEntry = {
      date: new Date().toISOString(),
      weight,
      notes,
    };

    set({
      data: {
        ...previousData,
        profile: {
          ...(previousData.profile ?? {}),
          weight,
        },
        weightHistory: [nextEntry, ...previousData.weightHistory],
      },
      error: null,
    });

    try {
      await addStudentWeight({
        apiUrl,
        token,
        weight,
        notes,
      });
    } catch (error) {
      set({
        data: previousData,
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel salvar o peso.",
      });
    }
  },
  saveNutrition: async ({ apiUrl, token, nutrition, syncPlan = false }) => {
    const previousData = get().data;

    if (!previousData) {
      return;
    }

    set({
      data: {
        ...previousData,
        dailyNutrition: nutrition,
      },
      error: null,
    });

    try {
      const updatedNutrition = await saveStudentDailyNutrition({
        apiUrl,
        token,
        nutrition,
        syncPlan,
      });

      set((state) => ({
        data: state.data
          ? {
              ...state.data,
              dailyNutrition: updatedNutrition,
            }
          : state.data,
      }));
    } catch (error) {
      set({
        data: previousData,
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel salvar a nutricao.",
      });
    }
  },
  reset: () => {
    set({
      data: null,
      loading: false,
      refreshing: false,
      error: null,
      seenImpressions: [],
    });
  },
}));
