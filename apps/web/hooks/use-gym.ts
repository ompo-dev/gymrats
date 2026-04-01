"use client";

import { useShallow } from "zustand/react/shallow";
import { selectDomainStoreSlice } from "@/hooks/shared/select-domain-store";
import type {
  GymActions,
  GymLoaders,
  GymSelectorReturnMap,
} from "@/lib/utils/gym/gym-selectors";
import {
  type GymUnifiedState,
  useGymUnifiedStore,
} from "@/stores/gym-unified-store";

type GymSelector = keyof GymSelectorReturnMap;

function getActions(state: GymUnifiedState): GymActions {
  return {
    createExpense: state.createExpense,
    createPayment: state.createPayment,
    checkInStudent: state.checkInStudent,
    checkOutStudent: state.checkOutStudent,
    updatePaymentStatus: state.updatePaymentStatus,
    settlePayment: state.settlePayment,
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
  };
}

function getLoaders(state: GymUnifiedState): GymLoaders {
  return {
    loadAll: state.loadAll,
    loadAllPrioritized: state.loadAllPrioritized,
    loadSection: state.loadSection,
  };
}

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
    useShallow(
      (state) =>
        selectDomainStoreSlice<
          GymUnifiedState,
          GymUnifiedState["data"],
          T,
          GymActions,
          GymLoaders
        >(state, selectors, {
          getActions,
          getLoaders,
        }) as
          | GymUnifiedState["data"]
          | GymSelectorReturnMap[T]
          | { [K in T]: GymSelectorReturnMap[K] },
    ),
  );
}
