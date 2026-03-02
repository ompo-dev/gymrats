/**
 * Slice financeiro para student-unified-store.
 */

import type { StudentData } from "@/lib/types/student-unified";
import { loadSection } from "../load-helpers";
import type { StudentGetState, StudentSetState } from "./types";

export function createFinancialSlice(
  set: StudentSetState,
  _get: StudentGetState,
) {
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
    addDayPass: (dayPass: StudentData["dayPasses"][0]) => {
      set((state) => ({
        data: {
          ...state.data,
          dayPasses: [...state.data.dayPasses, dayPass],
        },
      }));
    },
  };
}
