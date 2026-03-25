/**
 * Mapeamento de tipos de retorno por seletor do useGym.
 */

import type {
  CheckIn,
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

export interface GymActions {
  createExpense: (...args: unknown[]) => unknown;
  createPayment: (...args: unknown[]) => unknown;
  checkInStudent: (...args: unknown[]) => unknown;
  checkOutStudent: (...args: unknown[]) => unknown;
  updatePaymentStatus: (...args: unknown[]) => unknown;
  updateMemberStatus: (...args: unknown[]) => unknown;
  createEquipment: (...args: unknown[]) => unknown;
  updateEquipment: (...args: unknown[]) => unknown;
  createMaintenance: (...args: unknown[]) => unknown;
  createMembershipPlan: (...args: unknown[]) => unknown;
  updateMembershipPlan: (...args: unknown[]) => unknown;
  deleteMembershipPlan: (...args: unknown[]) => unknown;
  enrollStudent: (...args: unknown[]) => unknown;
  createGymSubscription: (...args: unknown[]) => unknown;
  cancelGymSubscription: (...args: unknown[]) => unknown;
  hydrateInitial: (...args: unknown[]) => unknown;
}

export interface GymLoaders {
  loadAll: (...args: unknown[]) => unknown;
  loadAllPrioritized: (...args: unknown[]) => unknown;
  loadSection: (...args: unknown[]) => unknown;
}

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
  subscription: GymSubscriptionSnapshot | null;
  metadata: GymMetadata;
  actions: GymActions;
  loaders: GymLoaders;
}

export type GymDataSelector = keyof GymSelectorReturnMap;

export type GymSelectorDataReturn<S extends GymDataSelector> =
  GymSelectorReturnMap[S];
