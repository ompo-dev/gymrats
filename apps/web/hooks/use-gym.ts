"use client";

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
  const data = useGymUnifiedStore((state) => state.data);
  const loadAll = useGymUnifiedStore((state) => state.loadAll);
  const loadAllPrioritized = useGymUnifiedStore(
    (state) => state.loadAllPrioritized,
  );
  const loadSection = useGymUnifiedStore((state) => state.loadSection);
  const loadStudentDetail = useGymUnifiedStore(
    (state) => state.loadStudentDetail,
  );
  const loadStudentPayments = useGymUnifiedStore(
    (state) => state.loadStudentPayments,
  );
  const hydrateInitial = useGymUnifiedStore((state) => state.hydrateInitial);
  const updateProfile = useGymUnifiedStore((state) => state.updateProfile);
  const createExpense = useGymUnifiedStore((state) => state.createExpense);
  const createPayment = useGymUnifiedStore((state) => state.createPayment);
  const checkInStudent = useGymUnifiedStore((state) => state.checkInStudent);
  const checkOutStudent = useGymUnifiedStore((state) => state.checkOutStudent);
  const updatePaymentStatus = useGymUnifiedStore(
    (state) => state.updatePaymentStatus,
  );
  const updateMemberStatus = useGymUnifiedStore(
    (state) => state.updateMemberStatus,
  );
  const createEquipment = useGymUnifiedStore((state) => state.createEquipment);
  const updateEquipment = useGymUnifiedStore((state) => state.updateEquipment);
  const createMaintenance = useGymUnifiedStore(
    (state) => state.createMaintenance,
  );
  const createMembershipPlan = useGymUnifiedStore(
    (state) => state.createMembershipPlan,
  );
  const updateMembershipPlan = useGymUnifiedStore(
    (state) => state.updateMembershipPlan,
  );
  const deleteMembershipPlan = useGymUnifiedStore(
    (state) => state.deleteMembershipPlan,
  );
  const createCoupon = useGymUnifiedStore((state) => state.createCoupon);
  const deleteCoupon = useGymUnifiedStore((state) => state.deleteCoupon);
  const createBoostCampaign = useGymUnifiedStore(
    (state) => state.createBoostCampaign,
  );
  const deleteBoostCampaign = useGymUnifiedStore(
    (state) => state.deleteBoostCampaign,
  );
  const getBoostCampaignPix = useGymUnifiedStore(
    (state) => state.getBoostCampaignPix,
  );
  const createWithdraw = useGymUnifiedStore((state) => state.createWithdraw);
  const enrollStudent = useGymUnifiedStore((state) => state.enrollStudent);
  const createGymSubscription = useGymUnifiedStore(
    (state) => state.createGymSubscription,
  );
  const cancelGymSubscription = useGymUnifiedStore(
    (state) => state.cancelGymSubscription,
  );
  const applySubscriptionReferral = useGymUnifiedStore(
    (state) => state.applySubscriptionReferral,
  );
  const checkCurrentSubscriptionActive = useGymUnifiedStore(
    (state) => state.checkCurrentSubscriptionActive,
  );
  const checkBoostCampaignActive = useGymUnifiedStore(
    (state) => state.checkBoostCampaignActive,
  );

  if (selectors.length === 0) {
    return data as GymUnifiedState["data"];
  }

  if (selectors.length === 1) {
    const selector = selectors[0];
    if (selector === "actions") {
      return {
        createExpense,
        createPayment,
        checkInStudent,
        checkOutStudent,
        updatePaymentStatus,
        updateMemberStatus,
        createEquipment,
        updateEquipment,
        createMaintenance,
        createMembershipPlan,
        updateMembershipPlan,
        deleteMembershipPlan,
        createCoupon,
        deleteCoupon,
        createBoostCampaign,
        deleteBoostCampaign,
        getBoostCampaignPix,
        createWithdraw,
        enrollStudent,
        createGymSubscription,
        cancelGymSubscription,
        applySubscriptionReferral,
        checkCurrentSubscriptionActive,
        checkBoostCampaignActive,
        loadStudentDetail,
        loadStudentPayments,
        hydrateInitial,
        updateProfile,
      } as unknown as GymSelectorReturnMap[T];
    }
    if (selector === "loaders") {
      return {
        loadAll,
        loadAllPrioritized,
        loadSection,
        loadStudentDetail,
        loadStudentPayments,
      } as unknown as GymSelectorReturnMap[T];
    }
    return dataSelector(
      selector,
      data,
    ) as GymSelectorReturnMap[typeof selector];
  }

  const result: Record<string, unknown> = {};
  selectors.forEach((selector) => {
    if (selector === "actions") {
      result.actions = {
        createExpense,
        createPayment,
        checkInStudent,
        checkOutStudent,
        updatePaymentStatus,
        updateMemberStatus,
        createEquipment,
        updateEquipment,
        createMaintenance,
        createMembershipPlan,
        updateMembershipPlan,
        deleteMembershipPlan,
        createCoupon,
        deleteCoupon,
        createBoostCampaign,
        deleteBoostCampaign,
        getBoostCampaignPix,
        createWithdraw,
        enrollStudent,
        createGymSubscription,
        cancelGymSubscription,
        applySubscriptionReferral,
        checkCurrentSubscriptionActive,
        checkBoostCampaignActive,
        loadStudentDetail,
        loadStudentPayments,
        hydrateInitial,
        updateProfile,
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
    GymSelectorReturnMap,
    T[number] & keyof GymSelectorReturnMap
  >;
}
