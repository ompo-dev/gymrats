/**
 * Subscription Store (Stub para Gym)
 *
 * Este store mantém apenas a funcionalidade de subscription para GYM.
 * Para STUDENT, use useStudent('subscription') do hook unificado.
 *
 * @deprecated Para student, use useStudent('subscription') from "@/hooks/use-student"
 */

import { create } from "zustand";

export interface GymSubscription {
  id: string;
  plan: string;
  status:
    | "active"
    | "canceled"
    | "expired"
    | "past_due"
    | "trialing"
    | "pending_payment"
    | string;
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

/** Subscription mínima (student ou gym) */
export type SubscriptionLike = Omit<
  GymSubscription,
  | "basePrice"
  | "pricePerStudent"
  | "activeStudents"
  | "totalAmount"
  | "currentPeriodStart"
  | "currentPeriodEnd"
> & {
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  source?: "OWN" | "GYM_ENTERPRISE";
  gymId?: string;
  enterpriseGymName?: string;
} & Partial<
    Pick<
      GymSubscription,
      "basePrice" | "pricePerStudent" | "activeStudents" | "totalAmount"
    >
  >;

interface SubscriptionState {
  // Gym subscription (mantido para compatibilidade)
  gymSubscription: SubscriptionLike | null;
  setGymSubscription: (subscription: SubscriptionLike | null) => void;

  // Student subscription (DEPRECATED - usar useStudent('subscription'))
  subscription: SubscriptionLike | null;
  setSubscription: (subscription: SubscriptionLike | null) => void;

  /** Limpa dados ao trocar de academia */
  resetForGymChange: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  gymSubscription: null,
  setGymSubscription: (subscription) => set({ gymSubscription: subscription }),

  subscription: null,
  setSubscription: (subscription) => set({ subscription }),

  resetForGymChange: () => set({ gymSubscription: null, subscription: null }),
}));
