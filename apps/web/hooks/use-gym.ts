"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import type { GymSelectorReturnMap } from "@/lib/utils/gym/gym-selectors";
import {
  type GymUnifiedState,
  useGymUnifiedStore,
} from "@/stores/gym-unified-store";

type GymSelector = keyof GymSelectorReturnMap;

const dataSelector = (selector: GymSelector, data: GymUnifiedState["data"]) => {
  switch (selector) {
    case "actions":
    case "loaders":
      return undefined;
    default:
      return data[selector as keyof typeof data];
  }
};

// Overloads para inferÃªncia correta de tipo.
export function useGym(): GymUnifiedState["data"];
export function useGym<S extends GymSelector>(
  selector: S,
): GymSelectorReturnMap[S];
export function useGym<S extends [GymSelector, GymSelector, ...GymSelector[]]>(
  ...selectors: S
): Pick<GymSelectorReturnMap, S[number]>;
export function useGym<T extends GymSelector>(
  ...selectors: T[]
):
  | GymUnifiedState["data"]
  | GymSelectorReturnMap[T]
  | { [K in T]: GymSelectorReturnMap[K] } {
  const actions = useGymUnifiedStore(
    useShallow((state: GymUnifiedState) => ({
      createExpense: state.createExpense,
      createPayment: state.createPayment,
      checkInStudent: state.checkInStudent,
      checkOutStudent: state.checkOutStudent,
      updatePaymentStatus: state.updatePaymentStatus,
      updateMemberStatus: state.updateMemberStatus,
      createEquipment: state.createEquipment,
      updateEquipment: state.updateEquipment,
      createMaintenance: state.createMaintenance,
      createMembershipPlan: state.createMembershipPlan,
      updateMembershipPlan: state.updateMembershipPlan,
      deleteMembershipPlan: state.deleteMembershipPlan,
      createCoupon: state.createCoupon,
      deleteCoupon: state.deleteCoupon,
      createBoostCampaign: state.createBoostCampaign,
      deleteBoostCampaign: state.deleteBoostCampaign,
      getBoostCampaignPix: state.getBoostCampaignPix,
      createWithdraw: state.createWithdraw,
      enrollStudent: state.enrollStudent,
      applySubscriptionReferral: state.applySubscriptionReferral,
      checkCurrentSubscriptionActive: state.checkCurrentSubscriptionActive,
      checkBoostCampaignActive: state.checkBoostCampaignActive,
      loadStudentDetail: state.loadStudentDetail,
      loadStudentPayments: state.loadStudentPayments,
      hydrateInitial: state.hydrateInitial,
      updateProfile: state.updateProfile,
    })),
  );
  const loaders = useGymUnifiedStore(
    useShallow((state: GymUnifiedState) => ({
      loadAll: state.loadAll,
      loadAllPrioritized: state.loadAllPrioritized,
      loadSection: state.loadSection,
    })),
  );
  const selectedData = useGymUnifiedStore(
    useShallow((state) => {
      if (selectors.length === 0) {
        return state.data;
      }

      if (selectors.length === 1) {
        const selector = selectors[0];
        if (selector === "actions" || selector === "loaders") {
          return undefined;
        }

        return dataSelector(
          selector,
          state.data,
        ) as GymSelectorReturnMap[typeof selector];
      }

      const result: Record<string, unknown> = {};
      selectors.forEach((selector) => {
        if (selector === "actions" || selector === "loaders") {
          return;
        }

        result[selector] = dataSelector(selector, state.data);
      });

      return result as unknown as Pick<
        GymSelectorReturnMap,
        T[number] & keyof GymSelectorReturnMap
      >;
    }),
  );

  return useMemo(() => {
    if (selectors.length === 0) {
      return selectedData as GymUnifiedState["data"];
    }

    if (selectors.length === 1) {
      const selector = selectors[0];
      if (selector === "actions") {
        return actions as GymSelectorReturnMap[T];
      }
      if (selector === "loaders") {
        return loaders as GymSelectorReturnMap[T];
      }

      return selectedData as GymSelectorReturnMap[T];
    }

    return {
      ...(selectedData as Record<string, unknown>),
      ...(selectors.includes("actions" as T) ? { actions } : {}),
      ...(selectors.includes("loaders" as T) ? { loaders } : {}),
    } as Pick<GymSelectorReturnMap, T[number] & keyof GymSelectorReturnMap>;
  }, [actions, loaders, selectedData, selectors]);
}
