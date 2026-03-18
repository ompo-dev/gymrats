"use client";

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

// Overloads para inferência correta de tipo (ordem importa: mais específico primeiro)
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
  return useGymUnifiedStore(
    useShallow((state) => {
      const actions = {
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
        createGymSubscription: state.createGymSubscription,
        cancelGymSubscription: state.cancelGymSubscription,
        applySubscriptionReferral: state.applySubscriptionReferral,
        checkCurrentSubscriptionActive: state.checkCurrentSubscriptionActive,
        checkBoostCampaignActive: state.checkBoostCampaignActive,
        loadStudentDetail: state.loadStudentDetail,
        loadStudentPayments: state.loadStudentPayments,
        hydrateInitial: state.hydrateInitial,
        updateProfile: state.updateProfile,
      };
      const loaders = {
        loadAll: state.loadAll,
        loadAllPrioritized: state.loadAllPrioritized,
        loadSection: state.loadSection,
        loadStudentDetail: state.loadStudentDetail,
        loadStudentPayments: state.loadStudentPayments,
      };

      if (selectors.length === 0) {
        return state.data;
      }

      if (selectors.length === 1) {
        const selector = selectors[0];
        if (selector === "actions") {
          return actions as unknown as GymSelectorReturnMap[T];
        }
        if (selector === "loaders") {
          return loaders as unknown as GymSelectorReturnMap[T];
        }
        return dataSelector(
          selector,
          state.data,
        ) as GymSelectorReturnMap[typeof selector];
      }

      const result: Record<string, unknown> = {};
      selectors.forEach((selector) => {
        if (selector === "actions") {
          result.actions = actions;
        } else if (selector === "loaders") {
          result.loaders = loaders;
        } else {
          result[selector] = dataSelector(selector, state.data);
        }
      });

      return result as unknown as Pick<
        GymSelectorReturnMap,
        T[number] & keyof GymSelectorReturnMap
      >;
    }),
  );
}
