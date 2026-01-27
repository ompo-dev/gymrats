/**
 * Subscription Store (Stub para Gym)
 * 
 * Este store mantém apenas a funcionalidade de subscription para GYM.
 * Para STUDENT, use useStudent('subscription') do hook unificado.
 * 
 * @deprecated Para student, use useStudent('subscription') from "@/hooks/use-student"
 */

import { create } from "zustand";

interface GymSubscription {
  id: string;
  plan: string;
  status: string;
  basePrice: number;
  pricePerStudent: number;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  trialStart: Date | null;
  trialEnd: Date | null;
  isTrial: boolean;
  daysRemaining: number | null;
  activeStudents: number;
  totalAmount: number;
  billingPeriod?: "monthly" | "annual";
}

interface SubscriptionState {
  // Gym subscription (mantido para compatibilidade)
  gymSubscription: GymSubscription | null;
  setGymSubscription: (subscription: GymSubscription | null) => void;
  
  // Student subscription (DEPRECATED - usar useStudent('subscription'))
  subscription: any | null;
  setSubscription: (subscription: any | null) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  gymSubscription: null,
  setGymSubscription: (subscription) => set({ gymSubscription: subscription }),
  
  subscription: null,
  setSubscription: (subscription) => set({ subscription }),
}));

