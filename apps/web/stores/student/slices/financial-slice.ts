/**
 * Slice financeiro para student-unified-store.
 */

import { apiClient } from "@/lib/api/client";
import type {
  StudentData,
  StudentJoinGymResult,
  StudentPaymentPlanOption,
  StudentPixPaymentPayload,
  StudentReferralApplyResult,
} from "@/lib/types/student-unified";
import { loadSection } from "../load-helpers";
import type { StudentGetState, StudentSetState } from "./types";

export function createFinancialSlice(
  set: StudentSetState,
  get: StudentGetState,
) {
  const refreshFinancialData = async () => {
    await Promise.allSettled([
      get().loadSubscription(),
      get().loadMemberships(),
      get().loadPayments(),
      get().loadPaymentMethods(),
      get().loadReferral(),
      get().loadDayPasses(),
    ]);
  };

  return {
    loadSubscription: async () => {
      const section = await loadSection("subscription");
      set((state) => ({
        data: {
          ...state.data,
          subscription: section.subscription ?? state.data.subscription,
        },
      }));
    },
    loadMemberships: async () => {
      const section = await loadSection("memberships");
      set((state) => ({
        data: {
          ...state.data,
          memberships: section.memberships || state.data.memberships,
        },
      }));
    },
    loadPayments: async () => {
      const section = await loadSection("payments");
      set((state) => ({
        data: {
          ...state.data,
          payments: section.payments || state.data.payments,
        },
      }));
    },
    loadPaymentMethods: async () => {
      const section = await loadSection("paymentMethods");
      set((state) => ({
        data: {
          ...state.data,
          paymentMethods: section.paymentMethods || state.data.paymentMethods,
        },
      }));
    },
    loadReferral: async () => {
      const section = await loadSection("referral");
      set((state) => ({
        data: {
          ...state.data,
          referral: section.referral ?? state.data.referral,
        },
      }));
    },
    loadDayPasses: async () => {
      const section = await loadSection("dayPasses");
      set((state) => ({
        data: {
          ...state.data,
          dayPasses: section.dayPasses || state.data.dayPasses,
        },
      }));
    },
    updateSubscription: async (
      updates: Partial<StudentData["subscription"]> | null,
    ) => {
      set((state) => ({
        data: {
          ...state.data,
          subscription: updates
            ? ({
                ...(state.data.subscription || {}),
                ...updates,
              } as StudentData["subscription"])
            : null,
        },
      }));
    },
    updateReferralPixKey: async ({
      pixKey,
      pixKeyType,
    }: {
      pixKey: string;
      pixKeyType: string;
    }) => {
      await apiClient.post("/api/students/referrals/pix-key", {
        pixKey,
        pixKeyType,
      });
      await get().loadReferral();
    },
    requestReferralWithdraw: async (amountCents: number) => {
      await apiClient.post("/api/students/referrals/withdraw", {
        amountCents,
      });
      await get().loadReferral();
    },
    addDayPass: (dayPass: StudentData["dayPasses"][0]) => {
      set((state) => ({
        data: {
          ...state.data,
          dayPasses: [...state.data.dayPasses, dayPass],
        },
      }));
    },
    joinGym: async ({
      gymId,
      planId,
      couponId,
    }: {
      gymId: string;
      planId: string;
      couponId?: string | null;
    }) => {
      const response = await apiClient.post<StudentJoinGymResult>(
        `/api/students/gyms/${gymId}/join`,
        {
          planId,
          couponId: couponId || null,
        },
      );
      await Promise.allSettled([
        get().loadMemberships(),
        get().loadPayments(),
        get().loadGymLocations(),
      ]);
      return response.data;
    },
    loadGymPlans: async (gymId: string) => {
      const response = await apiClient.get<{
        plans: StudentPaymentPlanOption[];
      }>(`/api/students/gyms/${gymId}/plans`);
      return response.data.plans ?? [];
    },
    changeMembershipPlan: async ({
      membershipId,
      planId,
    }: {
      membershipId: string;
      planId: string;
    }) => {
      const response = await apiClient.post<StudentPixPaymentPayload>(
        `/api/students/memberships/${membershipId}/change-plan`,
        { planId },
      );
      await Promise.allSettled([get().loadMemberships(), get().loadPayments()]);
      return response.data;
    },
    cancelMembership: async (membershipId: string) => {
      const previousMemberships = get().data.memberships;

      set((state) => ({
        data: {
          ...state.data,
          memberships: state.data.memberships.map((membership) =>
            membership.id === membershipId
              ? { ...membership, status: "canceled" }
              : membership,
          ),
        },
      }));

      try {
        await apiClient.post(
          `/api/students/memberships/${membershipId}/cancel`,
          {},
        );
        await Promise.allSettled([get().loadMemberships(), get().loadPayments()]);
      } catch (error) {
        set((state) => ({
          data: {
            ...state.data,
            memberships: previousMemberships,
          },
        }));
        throw error;
      }
    },
    cancelPersonalAssignment: async (assignmentId: string) => {
      await apiClient.post(
        `/api/students/personals/assignments/${assignmentId}/cancel`,
        {},
      );
      await refreshFinancialData();
    },
    subscribeToPersonal: async ({
      personalId,
      planId,
      couponId,
    }: {
      personalId: string;
      planId: string;
      couponId?: string | null;
    }) => {
      const response = await apiClient.post<StudentPixPaymentPayload>(
        `/api/students/personals/${personalId}/subscribe`,
        {
          planId,
          couponId: couponId || null,
        },
      );
      await refreshFinancialData();
      return response.data;
    },
    payStudentPayment: async (paymentId: string) => {
      const response = await apiClient.post<StudentPixPaymentPayload>(
        `/api/students/payments/${paymentId}/pay-now`,
        {},
      );
      await get().loadPayments();
      return response.data;
    },
    cancelStudentPayment: async (paymentId: string) => {
      await apiClient.patch(`/api/payments/${paymentId}`, {
        status: "canceled",
      });
      await get().loadPayments();
    },
    getStudentPaymentStatus: async (paymentId: string) => {
      const response = await apiClient.get<{ status: string }>(
        `/api/payments/${paymentId}`,
      );
      return response.data.status;
    },
    getPersonalPaymentStatus: async (paymentId: string) => {
      const response = await apiClient.get<{ status: string }>(
        `/api/students/personals/payments/${paymentId}`,
      );
      return response.data.status;
    },
    applyReferralToSubscription: async (
      referralCode: string,
    ): Promise<StudentReferralApplyResult> => {
      const response = await apiClient.post<StudentReferralApplyResult>(
        "/api/subscriptions/apply-referral",
        {
          referralCode: referralCode.trim(),
        },
      );
      return response.data;
    },
  };
}
