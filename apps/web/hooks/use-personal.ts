"use client";

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
  const data = usePersonalUnifiedStore((state) => state.data);
  const loadAll = usePersonalUnifiedStore((state) => state.loadAll);
  const loadAllPrioritized = usePersonalUnifiedStore(
    (state) => state.loadAllPrioritized,
  );
  const loadSection = usePersonalUnifiedStore((state) => state.loadSection);
  const loadStudentDetail = usePersonalUnifiedStore(
    (state) => state.loadStudentDetail,
  );
  const loadStudentPayments = usePersonalUnifiedStore(
    (state) => state.loadStudentPayments,
  );
  const hydrateInitial = usePersonalUnifiedStore(
    (state) => state.hydrateInitial,
  );
  const updateProfile = usePersonalUnifiedStore(
    (state) => state.updateProfile,
  );
  const linkAffiliation = usePersonalUnifiedStore(
    (state) => state.linkAffiliation,
  );
  const unlinkAffiliation = usePersonalUnifiedStore(
    (state) => state.unlinkAffiliation,
  );
  const assignStudent = usePersonalUnifiedStore(
    (state) => state.assignStudent,
  );
  const removeStudent = usePersonalUnifiedStore(
    (state) => state.removeStudent,
  );
  const createExpense = usePersonalUnifiedStore(
    (state) => state.createExpense,
  );
  const createCoupon = usePersonalUnifiedStore((state) => state.createCoupon);
  const deleteCoupon = usePersonalUnifiedStore((state) => state.deleteCoupon);
  const createBoostCampaign = usePersonalUnifiedStore(
    (state) => state.createBoostCampaign,
  );
  const deleteBoostCampaign = usePersonalUnifiedStore(
    (state) => state.deleteBoostCampaign,
  );
  const getBoostCampaignPix = usePersonalUnifiedStore(
    (state) => state.getBoostCampaignPix,
  );
  const createMembershipPlan = usePersonalUnifiedStore(
    (state) => state.createMembershipPlan,
  );
  const updateMembershipPlan = usePersonalUnifiedStore(
    (state) => state.updateMembershipPlan,
  );
  const deleteMembershipPlan = usePersonalUnifiedStore(
    (state) => state.deleteMembershipPlan,
  );
  const createPersonalSubscription = usePersonalUnifiedStore(
    (state) => state.createPersonalSubscription,
  );
  const cancelPersonalSubscription = usePersonalUnifiedStore(
    (state) => state.cancelPersonalSubscription,
  );
  const checkBoostCampaignActive = usePersonalUnifiedStore(
    (state) => state.checkBoostCampaignActive,
  );

  if (selectors.length === 0) {
    return data as PersonalUnifiedState["data"];
  }

  if (selectors.length === 1) {
    const selector = selectors[0];
    if (selector === "actions") {
      return {
        updateProfile,
        linkAffiliation,
        unlinkAffiliation,
        assignStudent,
        removeStudent,
        createExpense,
        createCoupon,
        deleteCoupon,
        createBoostCampaign,
        deleteBoostCampaign,
        getBoostCampaignPix,
        createMembershipPlan,
        updateMembershipPlan,
        deleteMembershipPlan,
        createPersonalSubscription,
        cancelPersonalSubscription,
        checkBoostCampaignActive,
        loadStudentDetail,
        loadStudentPayments,
        hydrateInitial,
      } as unknown as PersonalSelectorReturnMap[T];
    }
    if (selector === "loaders") {
      return {
        loadAll,
        loadAllPrioritized,
        loadSection,
        loadStudentDetail,
        loadStudentPayments,
      } as unknown as PersonalSelectorReturnMap[T];
    }
    return dataSelector(
      selector,
      data,
    ) as PersonalSelectorReturnMap[typeof selector];
  }

  const result: Record<string, unknown> = {};
  selectors.forEach((selector) => {
    if (selector === "actions") {
      result.actions = {
        updateProfile,
        linkAffiliation,
        unlinkAffiliation,
        assignStudent,
        removeStudent,
        createExpense,
        createCoupon,
        deleteCoupon,
        createBoostCampaign,
        deleteBoostCampaign,
        getBoostCampaignPix,
        createMembershipPlan,
        updateMembershipPlan,
        deleteMembershipPlan,
        createPersonalSubscription,
        cancelPersonalSubscription,
        checkBoostCampaignActive,
        loadStudentDetail,
        loadStudentPayments,
        hydrateInitial,
      };
    } else if (selector === "loaders") {
      result.loaders = {
        loadAll,
        loadAllPrioritized,
        loadSection,
        loadStudentDetail,
        loadStudentPayments,
      };
    } else {
      result[selector] = dataSelector(selector, data);
    }
  });

  return result as unknown as Pick<
    PersonalSelectorReturnMap,
    T[number] & keyof PersonalSelectorReturnMap
  >;
}
