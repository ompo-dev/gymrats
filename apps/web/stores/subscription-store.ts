import { create } from "zustand";
import {
  centsToReais,
  GYM_PLANS_CONFIG,
} from "@/lib/access-control/plans-config";
import { apiClient } from "@/lib/api/client";
import { clearBootstrapHydrationState } from "@/lib/query/bootstrap-runtime";
import type { StudentData } from "@/lib/types/student-unified";
import { useGymUnifiedStore } from "@/stores/gym-unified-store";
import { useGymsDataStore } from "@/stores/gyms-list-store";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";

const STALE_MS = 60_000;

export interface StudentSubscriptionData {
  id: string;
  plan: string;
  status:
    | "active"
    | "canceled"
    | "expired"
    | "past_due"
    | "trialing"
    | "pending_payment";
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date | null;
  trialStart?: Date | null;
  trialEnd?: Date | null;
  isTrial?: boolean;
  daysRemaining?: number | null;
  billingPeriod?: "monthly" | "annual";
  source?: "OWN" | "GYM_ENTERPRISE";
  gymId?: string;
  enterpriseGymName?: string;
  canStartTrial?: boolean;
}

export interface GymSubscriptionData {
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
  pricePerPersonal: number;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  trialStart: Date | null;
  trialEnd: Date | null;
  isTrial: boolean;
  daysRemaining: number | null;
  activeStudents: number;
  activePersonals: number;
  totalAmount: number;
  billingPeriod?: "monthly" | "annual";
  canStartTrial?: boolean;
}

export type SubscriptionLike = StudentSubscriptionData | GymSubscriptionData;
export type SubscriptionUserType = "student" | "gym";
type StudentSubscriptionSnapshot = NonNullable<StudentData["subscription"]>;

interface SubscriptionMeta {
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  lastFetchedAt: Date | null;
  isFirstPayment: boolean;
}

interface SubscriptionState {
  gymSubscription: SubscriptionLike | null;
  subscription: SubscriptionLike | null;
  studentMeta: SubscriptionMeta;
  gymMeta: SubscriptionMeta;
  setGymSubscription: (subscription: SubscriptionLike | null) => void;
  setSubscription: (subscription: SubscriptionLike | null) => void;
  loadSubscription: (
    userType: SubscriptionUserType,
    force?: boolean,
  ) => Promise<SubscriptionLike | null>;
  startTrial: (
    userType: SubscriptionUserType,
  ) => Promise<{ success?: boolean; error?: string }>;
  createSubscription: (
    userType: SubscriptionUserType,
    params:
      | { plan: "monthly" | "annual"; referralCode?: string }
      | {
          plan: "basic" | "premium" | "enterprise";
          billingPeriod: "monthly" | "annual";
          referralCode?: string;
        },
  ) => Promise<{
    billingUrl?: string;
    pixId?: string;
    brCode?: string;
    brCodeBase64?: string;
    amount?: number;
    expiresAt?: string;
    error?: string;
  }>;
  cancelSubscription: (
    userType: SubscriptionUserType,
  ) => Promise<{ success?: boolean; error?: string }>;
  resetForGymChange: () => void;
}

const createMeta = (): SubscriptionMeta => ({
  isLoading: false,
  isMutating: false,
  error: null,
  lastFetchedAt: null,
  isFirstPayment: true,
});

function isFresh(meta: SubscriptionMeta) {
  if (!meta.lastFetchedAt) return false;
  return Date.now() - new Date(meta.lastFetchedAt).getTime() < STALE_MS;
}

function normalizeSubscription<T extends SubscriptionLike>(
  subscription: T | null,
): T | null {
  if (!subscription) return null;

  const trialEnd = subscription.trialEnd
    ? new Date(subscription.trialEnd)
    : null;
  const normalized = {
    ...subscription,
    currentPeriodStart: subscription.currentPeriodStart
      ? new Date(subscription.currentPeriodStart)
      : undefined,
    currentPeriodEnd: subscription.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd)
      : undefined,
    canceledAt: subscription.canceledAt
      ? new Date(subscription.canceledAt)
      : null,
    trialStart: subscription.trialStart
      ? new Date(subscription.trialStart)
      : null,
    trialEnd,
    isTrial:
      (subscription.status === "trialing" ||
        subscription.status === "canceled") &&
      !!trialEnd &&
      trialEnd > new Date(),
    daysRemaining: trialEnd
      ? Math.max(
          0,
          Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        )
      : null,
  } as T;

  return normalized;
}

function toStudentSubscriptionSnapshot(
  subscription: SubscriptionLike | null,
): Partial<StudentSubscriptionSnapshot> | null {
  if (!subscription || "basePrice" in subscription) {
    return null;
  }

  return {
    id: subscription.id,
    plan: subscription.plan,
    status: subscription.status,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    canceledAt: subscription.canceledAt,
    trialStart: subscription.trialStart,
    trialEnd: subscription.trialEnd,
    isTrial: subscription.isTrial,
    daysRemaining: subscription.daysRemaining,
    billingPeriod: subscription.billingPeriod,
    source: subscription.source,
    gymId: subscription.gymId,
    enterpriseGymName: subscription.enterpriseGymName,
  };
}

function syncStudentSubscription(subscription: SubscriptionLike | null) {
  void useStudentUnifiedStore
    .getState()
    .updateSubscription(toStudentSubscriptionSnapshot(subscription));
}

function toGymSubscriptionSnapshot(
  subscription: SubscriptionLike | null,
): GymSubscriptionData | null {
  if (!subscription || !("basePrice" in subscription)) {
    return null;
  }

  return {
    id: subscription.id,
    plan: subscription.plan,
    status: subscription.status,
    basePrice: subscription.basePrice,
    pricePerStudent: subscription.pricePerStudent,
    pricePerPersonal: subscription.pricePerPersonal,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    canceledAt: subscription.canceledAt,
    trialStart: subscription.trialStart,
    trialEnd: subscription.trialEnd,
    isTrial: subscription.isTrial,
    daysRemaining: subscription.daysRemaining,
    activeStudents: subscription.activeStudents,
    activePersonals: subscription.activePersonals,
    totalAmount: subscription.totalAmount,
    billingPeriod: subscription.billingPeriod,
    canStartTrial: subscription.canStartTrial,
  };
}

function syncGymSubscription(subscription: SubscriptionLike | null) {
  const nextSubscription = toGymSubscriptionSnapshot(subscription);
  useGymUnifiedStore.setState((state) => ({
    data: {
      ...state.data,
      subscription: nextSubscription,
    },
  }));
}

function getMetaKey(userType: SubscriptionUserType) {
  return userType === "student" ? "studentMeta" : "gymMeta";
}

function getSubscriptionKey(userType: SubscriptionUserType) {
  return userType === "student" ? "subscription" : "gymSubscription";
}

function getCurrentEndpoint(userType: SubscriptionUserType) {
  return userType === "student"
    ? "/api/subscriptions/current"
    : "/api/gym-subscriptions/current";
}

function getStartTrialEndpoint(userType: SubscriptionUserType) {
  return userType === "student"
    ? "/api/subscriptions/start-trial"
    : "/api/gym-subscriptions/start-trial";
}

function getCreateEndpoint(userType: SubscriptionUserType) {
  return userType === "student"
    ? "/api/subscriptions/create"
    : "/api/gym-subscriptions/create";
}

function getCancelEndpoint(userType: SubscriptionUserType) {
  return userType === "student"
    ? "/api/subscriptions/cancel"
    : "/api/gym-subscriptions/cancel";
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  gymSubscription: null,
  subscription: null,
  studentMeta: createMeta(),
  gymMeta: createMeta(),

  setGymSubscription: (subscription) => {
    syncGymSubscription(subscription);
    set({ gymSubscription: subscription });
  },

  setSubscription: (subscription) => {
    syncStudentSubscription(subscription);
    set({ subscription });
  },

  loadSubscription: async (userType, force = false) => {
    const metaKey = getMetaKey(userType);
    const subscriptionKey = getSubscriptionKey(userType);
    const currentMeta = get()[metaKey];
    const currentSubscription = get()[subscriptionKey];

    if (!force && currentMeta.isLoading) {
      return currentSubscription;
    }

    if (!force && currentSubscription && isFresh(currentMeta)) {
      return currentSubscription;
    }

    set((state) => ({
      [metaKey]: {
        ...state[metaKey],
        isLoading: true,
        error: null,
      },
    }));

    try {
      const response = await apiClient.get<{
        subscription: SubscriptionLike | null;
        isFirstPayment?: boolean;
      }>(getCurrentEndpoint(userType));

      const normalized = normalizeSubscription(response.data.subscription);

      if (userType === "student") {
        syncStudentSubscription(normalized);
      } else {
        syncGymSubscription(normalized);
      }

      set((state) => ({
        [subscriptionKey]: normalized,
        [metaKey]: {
          ...state[metaKey],
          isLoading: false,
          error: null,
          lastFetchedAt: new Date(),
          isFirstPayment: response.data.isFirstPayment ?? true,
        },
      }));

      return normalized;
    } catch (error) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : error instanceof Error
            ? error.message
            : "Erro ao carregar assinatura";

      set((state) => ({
        [metaKey]: {
          ...state[metaKey],
          isLoading: false,
          error: String(message),
        },
      }));

      return currentSubscription;
    }
  },

  startTrial: async (userType) => {
    const metaKey = getMetaKey(userType);
    const subscriptionKey = getSubscriptionKey(userType);
    const previousSubscription = get()[subscriptionKey];

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const optimisticSubscription: SubscriptionLike =
      userType === "student"
        ? ({
            id: "temp-trial-id",
            plan: "premium",
            status: "trialing",
            currentPeriodStart: now,
            currentPeriodEnd: trialEnd,
            cancelAtPeriodEnd: false,
            canceledAt: null,
            trialStart: now,
            trialEnd,
            isTrial: true,
            daysRemaining: 14,
          } satisfies StudentSubscriptionData)
        : ({
            id: "temp-trial-id",
            plan: "basic",
            status: "trialing",
            basePrice: centsToReais(GYM_PLANS_CONFIG.BASIC.prices.monthly),
            pricePerStudent: centsToReais(
              GYM_PLANS_CONFIG.BASIC.pricePerStudent,
            ),
            pricePerPersonal: centsToReais(
              GYM_PLANS_CONFIG.BASIC.pricePerPersonal ?? 0,
            ),
            currentPeriodStart: now,
            currentPeriodEnd: trialEnd,
            cancelAtPeriodEnd: false,
            canceledAt: null,
            trialStart: now,
            trialEnd,
            isTrial: true,
            daysRemaining: 14,
            activeStudents: 0,
            activePersonals: 0,
            totalAmount: centsToReais(GYM_PLANS_CONFIG.BASIC.prices.monthly),
          } satisfies GymSubscriptionData);

    if (userType === "student") {
      syncStudentSubscription(optimisticSubscription);
    } else {
      syncGymSubscription(optimisticSubscription);
    }

    set((state) => ({
      [subscriptionKey]: optimisticSubscription,
      [metaKey]: {
        ...state[metaKey],
        isMutating: true,
        error: null,
      },
    }));

    try {
      const response = await apiClient.post<{
        success?: boolean;
        error?: string;
      }>(getStartTrialEndpoint(userType));

      await get().loadSubscription(userType, true);

      if (userType === "gym") {
        await useGymsDataStore.getState().loadAllGyms();
      }

      return response.data;
    } catch (error) {
      if (userType === "student") {
        syncStudentSubscription(previousSubscription);
      } else {
        syncGymSubscription(previousSubscription);
      }

      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : error instanceof Error
            ? error.message
            : "Erro ao iniciar trial";

      set((state) => ({
        [subscriptionKey]: previousSubscription,
        [metaKey]: {
          ...state[metaKey],
          isMutating: false,
          error: String(message),
        },
      }));

      await get().loadSubscription(userType, true);
      return { error: String(message) };
    } finally {
      set((state) => ({
        [metaKey]: {
          ...state[metaKey],
          isMutating: false,
        },
      }));
    }
  },

  createSubscription: async (userType, params) => {
    const metaKey = getMetaKey(userType);

    set((state) => ({
      [metaKey]: {
        ...state[metaKey],
        isMutating: true,
        error: null,
      },
    }));

    try {
      const response = await apiClient.post<{
        billingUrl?: string;
        pixId?: string;
        brCode?: string;
        brCodeBase64?: string;
        amount?: number;
        expiresAt?: string;
        error?: string;
      }>(getCreateEndpoint(userType), params);

      await get().loadSubscription(userType, true);

      if (userType === "gym") {
        await useGymsDataStore.getState().loadAllGyms();
      }

      return response.data;
    } catch (error) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : error instanceof Error
            ? error.message
            : "Erro ao criar assinatura";

      set((state) => ({
        [metaKey]: {
          ...state[metaKey],
          error: String(message),
        },
      }));

      return { error: String(message) };
    } finally {
      set((state) => ({
        [metaKey]: {
          ...state[metaKey],
          isMutating: false,
        },
      }));
    }
  },

  cancelSubscription: async (userType) => {
    const metaKey = getMetaKey(userType);
    const subscriptionKey = getSubscriptionKey(userType);
    const previousSubscription = get()[subscriptionKey];

    set((state) => ({
      [subscriptionKey]: previousSubscription
        ? {
            ...previousSubscription,
            status: "canceled",
            canceledAt: new Date(),
            cancelAtPeriodEnd: true,
          }
        : null,
      [metaKey]: {
        ...state[metaKey],
        isMutating: true,
        error: null,
      },
    }));

    try {
      const response = await apiClient.post<{
        success?: boolean;
        error?: string;
      }>(getCancelEndpoint(userType), {});

      await get().loadSubscription(userType, true);

      if (userType === "gym") {
        await useGymsDataStore.getState().loadAllGyms();
      }

      return response.data;
    } catch (error) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : error instanceof Error
            ? error.message
            : "Erro ao cancelar assinatura";

      if (userType === "student") {
        syncStudentSubscription(previousSubscription);
      } else {
        syncGymSubscription(previousSubscription);
      }

      set((state) => ({
        [subscriptionKey]: previousSubscription,
        [metaKey]: {
          ...state[metaKey],
          error: String(message),
        },
      }));

      return { error: String(message) };
    } finally {
      set((state) => ({
        [metaKey]: {
          ...state[metaKey],
          isMutating: false,
        },
      }));
    }
  },

  resetForGymChange: () =>
    (() => {
      clearBootstrapHydrationState("gym");
      set({
        gymSubscription: null,
        subscription: null,
        studentMeta: createMeta(),
        gymMeta: createMeta(),
      });
    })(),
}));
