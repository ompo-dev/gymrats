"use client";

import { useMemo } from "react";
import { createStableDomainSelector } from "@/hooks/shared/select-domain-store";
import type {
  PersonalActions,
  PersonalLoaders,
  PersonalSelectorReturnMap,
} from "@/lib/utils/personal/personal-selectors";
import {
  type PersonalUnifiedState,
  usePersonalUnifiedStore,
} from "@/stores/personal-unified-store";

type PersonalSelector = keyof PersonalSelectorReturnMap;

function getActions(state: PersonalUnifiedState): PersonalActions {
  return {
    updateProfile: state.updateProfile,
    linkAffiliation: state.linkAffiliation,
    unlinkAffiliation: state.unlinkAffiliation,
    assignStudent: state.assignStudent,
    removeStudent: state.removeStudent,
    createExpense: state.createExpense,
    createCoupon: state.createCoupon,
    deleteCoupon: state.deleteCoupon,
    createBoostCampaign: state.createBoostCampaign,
    deleteBoostCampaign: state.deleteBoostCampaign,
    getBoostCampaignPix: state.getBoostCampaignPix,
    createMembershipPlan: state.createMembershipPlan,
    updateMembershipPlan: state.updateMembershipPlan,
    deleteMembershipPlan: state.deleteMembershipPlan,
    createPersonalSubscription: state.createPersonalSubscription,
    cancelPersonalSubscription: state.cancelPersonalSubscription,
    checkBoostCampaignActive: state.checkBoostCampaignActive,
    loadStudentDetail: state.loadStudentDetail,
    loadStudentPayments: state.loadStudentPayments,
    hydrateInitial: state.hydrateInitial,
  };
}

function getLoaders(state: PersonalUnifiedState): PersonalLoaders {
  return {
    loadAll: state.loadAll,
    loadAllPrioritized: state.loadAllPrioritized,
    loadSection: state.loadSection,
  };
}

export function usePersonal(): PersonalUnifiedState["data"];
export function usePersonal<S extends PersonalSelector>(
  selector: S,
): PersonalSelectorReturnMap[S];
export function usePersonal<
  S extends [PersonalSelector, PersonalSelector, ...PersonalSelector[]],
>(...selectors: S): Pick<PersonalSelectorReturnMap, S[number]>;
export function usePersonal<T extends PersonalSelector>(
  ...selectors: T[]
):
  | PersonalUnifiedState["data"]
  | PersonalSelectorReturnMap[T]
  | { [K in T]: PersonalSelectorReturnMap[K] } {
  const selectorKey = selectors.join("|");
  const selector = useMemo(
    () =>
      createStableDomainSelector<
        PersonalUnifiedState,
        PersonalUnifiedState["data"],
        T,
        PersonalActions,
        PersonalLoaders
      >(selectors, {
        getActions,
        getLoaders,
      }),
    [selectorKey],
  );

  return usePersonalUnifiedStore(selector) as
    | PersonalUnifiedState["data"]
    | PersonalSelectorReturnMap[T]
    | { [K in T]: PersonalSelectorReturnMap[K] };
}
