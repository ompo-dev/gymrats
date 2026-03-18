"use client";

import { useShallow } from "zustand/react/shallow";
import type { PersonalSelectorReturnMap } from "@/lib/utils/personal/personal-selectors";
import {
  type PersonalUnifiedState,
  usePersonalUnifiedStore,
} from "@/stores/personal-unified-store";

type PersonalSelector = keyof PersonalSelectorReturnMap;

const dataSelector = (
  selector: PersonalSelector,
  data: PersonalUnifiedState["data"],
) => {
  switch (selector) {
    case "actions":
    case "loaders":
      return undefined;
    default:
      return data[selector as keyof typeof data];
  }
};

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
  return usePersonalUnifiedStore(
    useShallow((state) => {
      const actions = {
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
          return actions as unknown as PersonalSelectorReturnMap[T];
        }
        if (selector === "loaders") {
          return loaders as unknown as PersonalSelectorReturnMap[T];
        }
        return dataSelector(
          selector,
          state.data,
        ) as PersonalSelectorReturnMap[typeof selector];
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
        PersonalSelectorReturnMap,
        T[number] & keyof PersonalSelectorReturnMap
      >;
    }),
  );
}
