/**
 * Mapeamento de tipos de retorno por seletor do useGym.
 */

import type {
  BoostCampaign,
  CheckIn,
  Coupon,
  Equipment,
  Expense,
  FinancialSummary,
  GymProfile,
  GymStats,
  MembershipPlan,
  Payment,
  StudentData,
} from "@/lib/types";
import type {
  GymMetadata,
  GymSubscriptionSnapshot,
} from "@/lib/types/gym-unified";

export type GymActions = Pick<
  import("@/stores/gym-unified-store").GymUnifiedState,
  | "createExpense"
  | "createPayment"
  | "checkInStudent"
  | "checkOutStudent"
  | "updatePaymentStatus"
  | "updateMemberStatus"
  | "createEquipment"
  | "updateEquipment"
  | "createMaintenance"
  | "createMembershipPlan"
  | "updateMembershipPlan"
  | "deleteMembershipPlan"
  | "createCoupon"
  | "deleteCoupon"
  | "createBoostCampaign"
  | "deleteBoostCampaign"
  | "getBoostCampaignPix"
  | "createWithdraw"
  | "enrollStudent"
  | "applySubscriptionReferral"
  | "checkCurrentSubscriptionActive"
  | "checkBoostCampaignActive"
  | "loadStudentDetail"
  | "loadStudentPayments"
  | "hydrateInitial"
  | "updateProfile"
>;

export type GymLoaders = Pick<
  import("@/stores/gym-unified-store").GymUnifiedState,
  "loadAll" | "loadAllPrioritized" | "loadSection"
>;

export interface GymSelectorReturnMap {
  profile: GymProfile | null;
  stats: GymStats | null;
  students: StudentData[];
  equipment: Equipment[];
  financialSummary: FinancialSummary | null;
  recentCheckIns: CheckIn[];
  membershipPlans: MembershipPlan[];
  payments: Payment[];
  expenses: Expense[];
  coupons: Coupon[];
  campaigns: BoostCampaign[];
  balanceWithdraws: import("@/lib/types/gym-unified").BalanceWithdrawSnapshot;
  studentDetails: Record<string, StudentData | null>;
  studentPayments: Record<string, Payment[]>;
  subscription: GymSubscriptionSnapshot | null;
  metadata: GymMetadata;
  actions: GymActions;
  loaders: GymLoaders;
}

export type GymDataSelector = keyof GymSelectorReturnMap;

export type GymSelectorDataReturn<S extends GymDataSelector> =
  GymSelectorReturnMap[S];
