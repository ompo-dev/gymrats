import { create } from "zustand";
import { apiClient } from "@/lib/api/client";

interface PaymentsState {
  simulatingByUrl: Record<string, boolean>;
  simulatePix: (url: string) => Promise<void>;
}

export const usePaymentsStore = create<PaymentsState>((set) => ({
  simulatingByUrl: {},

  simulatePix: async (url) => {
    set((state) => ({
      simulatingByUrl: { ...state.simulatingByUrl, [url]: true },
    }));

    try {
      await apiClient.post(url, {});
    } finally {
      set((state) => ({
        simulatingByUrl: { ...state.simulatingByUrl, [url]: false },
      }));
    }
  },
}));
