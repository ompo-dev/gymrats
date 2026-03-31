/**
 * Mapeamento de tipos de retorno por seletor do usePersonal.
 */

import type {
  PersonalAffiliation,
  PersonalMembershipPlan,
  PersonalProfile,
  PersonalStudentAssignment,
  PersonalSubscriptionData,
} from "@gymrats/types/personal-module";
import type {
  BoostCampaign,
  Coupon,
  Expense,
  Payment,
  StudentData,
} from "@/lib/types";
import type { PersonalMetadata } from "@/lib/types/personal-unified";

export type PersonalActions = Pick<
  import("@/stores/personal-unified-store").PersonalUnifiedState,
  | "updateProfile"
  | "linkAffiliation"
  | "unlinkAffiliation"
  | "assignStudent"
  | "removeStudent"
  | "createExpense"
  | "createCoupon"
  | "deleteCoupon"
  | "createBoostCampaign"
  | "deleteBoostCampaign"
  | "getBoostCampaignPix"
  | "createMembershipPlan"
  | "updateMembershipPlan"
  | "deleteMembershipPlan"
  | "createPersonalSubscription"
  | "cancelPersonalSubscription"
  | "checkBoostCampaignActive"
  | "loadStudentDetail"
  | "loadStudentPayments"
  | "hydrateInitial"
>;

export type PersonalLoaders = Pick<
  import("@/stores/personal-unified-store").PersonalUnifiedState,
  "loadAll" | "loadAllPrioritized" | "loadSection"
>;

export interface PersonalSelectorReturnMap {
  profile: PersonalProfile | null;
  affiliations: PersonalAffiliation[];
  students: PersonalStudentAssignment[];
  studentDirectory: StudentData[];
  studentDetails: Record<string, StudentData | null>;
  studentPayments: Record<string, Payment[]>;
  subscription: PersonalSubscriptionData | null;
  financialSummary: import("@/lib/types").FinancialSummary | null;
  expenses: Expense[];
  payments: Payment[];
  coupons: Coupon[];
  campaigns: BoostCampaign[];
  membershipPlans: PersonalMembershipPlan[];
  metadata: PersonalMetadata;
  actions: PersonalActions;
  loaders: PersonalLoaders;
}

export type PersonalDataSelector = keyof PersonalSelectorReturnMap;

export type PersonalSelectorDataReturn<S extends PersonalDataSelector> =
  PersonalSelectorReturnMap[S];
