import { create } from "zustand";
import type { SubscriptionData } from "@/hooks/use-subscription";
import type { GymSubscriptionData } from "@/hooks/use-subscription-unified";

interface SubscriptionState {
  subscription: SubscriptionData | null;
  gymSubscription: GymSubscriptionData | null;
  setSubscription: (subscription: SubscriptionData | null) => void;
  setGymSubscription: (subscription: GymSubscriptionData | null) => void;
  updateSubscription: (updates: Partial<SubscriptionData>) => void;
  clearSubscription: () => void;
  clearGymSubscription: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  subscription: null,
  gymSubscription: null,
  setSubscription: (subscription) => set({ subscription }),
  setGymSubscription: (subscription) => set({ gymSubscription: subscription }),
  updateSubscription: (updates) =>
    set((state) => ({
      subscription: state.subscription
        ? { ...state.subscription, ...updates }
        : null,
    })),
  clearSubscription: () => set({ subscription: null }),
  clearGymSubscription: () => set({ gymSubscription: null }),
}));

