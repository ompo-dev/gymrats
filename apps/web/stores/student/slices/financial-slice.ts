/**
 * Slice financeiro para student-unified-store.
 */

import { actionClient as apiClient } from "@/lib/actions/client";
import type {
  StudentData,
  StudentJoinGymResult,
  StudentPaymentPlanOption,
  StudentPixPaymentPayload,
  StudentReferralApplyResult,
  StudentReferralWithdraw,
} from "@/lib/types/student-unified";
import { loadSection } from "../load-helpers";
import type { StudentGetState, StudentSetState } from "./types";

function createIdempotencyKey(scope: string, entityId: string) {
  const cryptoApi =
    typeof window !== "undefined" && "crypto" in window ? window.crypto : null;
  const suffix =
    cryptoApi && "randomUUID" in cryptoApi
      ? cryptoApi.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `${scope}:${entityId}:${suffix}`;
}

export function createFinancialSlice(
  set: StudentSetState,
  get: StudentGetState,
) {
  type StudentReferralSnapshot = Exclude<StudentData["referral"], null>;

  const updateReferralSnapshot = (
    updater: (referral: StudentReferralSnapshot) => StudentReferralSnapshot,
  ) => {
    set((state) => ({
      data: {
        ...state.data,
        referral: state.data.referral
          ? updater(state.data.referral)
          : state.data.referral,
      },
    }));
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
      const previousReferral = get().data.referral;

      if (previousReferral) {
        updateReferralSnapshot((referral) => ({
          ...referral,
          pixKey,
          pixKeyType,
        }));
      }

      try {
        await apiClient.post("/api/students/referrals/pix-key", {
          pixKey,
          pixKeyType,
        });
      } catch (error) {
        if (previousReferral) {
          set((state) => ({
            data: {
              ...state.data,
              referral: previousReferral,
            },
          }));
        }

        throw error;
      }
    },
    requestReferralWithdraw: async (amountCents: number) => {
      const response = await apiClient.post<{
        withdraw: StudentReferralWithdraw;
      }>("/api/students/referrals/withdraw", {
        amountCents,
      });
      const withdraw = {
        ...response.data.withdraw,
        completedAt: response.data.withdraw.completedAt ?? null,
      };

      updateReferralSnapshot((referral) => {
        const balanceCents = Math.max(0, referral.balanceCents - amountCents);

        return {
          ...referral,
          balanceCents,
          balanceReais: Number((balanceCents / 100).toFixed(2)),
          withdraws: [withdraw, ...referral.withdraws],
        };
      });
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
        {
          headers: {
            "X-Idempotency-Key": createIdempotencyKey(
              "student-join-gym",
              gymId,
            ),
          },
        },
      );
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
        {
          headers: {
            "X-Idempotency-Key": createIdempotencyKey(
              "student-change-plan",
              membershipId,
            ),
          },
        },
      );
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
        {
          headers: {
            "X-Idempotency-Key": createIdempotencyKey(
              "student-subscribe-personal",
              personalId,
            ),
          },
        },
      );
      return response.data;
    },
    payStudentPayment: async (paymentId: string) => {
      const response = await apiClient.post<StudentPixPaymentPayload>(
        `/api/students/payments/${paymentId}/pay-now`,
        {},
        {
          headers: {
            "X-Idempotency-Key": createIdempotencyKey(
              "student-pay-now",
              paymentId,
            ),
          },
        },
      );
      return response.data;
    },
    cancelStudentPayment: async (paymentId: string) => {
      const previousPayments = get().data.payments;

      set((state) => ({
        data: {
          ...state.data,
          payments: state.data.payments.map((payment) =>
            payment.id === paymentId
              ? { ...payment, status: "canceled" }
              : payment,
          ),
        },
      }));

      try {
        await apiClient.patch(
          `/api/payments/${paymentId}`,
          {
            status: "canceled",
          },
          {
            headers: {
              "X-Idempotency-Key": createIdempotencyKey(
                "student-cancel-payment",
                paymentId,
              ),
            },
          },
        );
      } catch (error) {
        set((state) => ({
          data: {
            ...state.data,
            payments: previousPayments,
          },
        }));

        throw error;
      }
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
