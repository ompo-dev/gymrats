import { create } from "zustand";
import type { SubscriptionData } from "@/hooks/use-subscription";

interface SubscriptionState {
  subscription: SubscriptionData | null;
  setSubscription: (subscription: SubscriptionData | null) => void;
  updateSubscription: (updates: Partial<SubscriptionData>) => void;
  clearSubscription: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  subscription: null,
  setSubscription: (subscription) => set({ subscription }),
  updateSubscription: (updates) =>
    set((state) => ({
      subscription: state.subscription
        ? { ...state.subscription, ...updates }
        : null,
    })),
  clearSubscription: () => set({ subscription: null }),
}));

