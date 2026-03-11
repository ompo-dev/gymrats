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
} from "./core";

export interface GymSubscriptionSnapshot {
  id: string;
  plan: string;
  status: string;
  basePrice: number;
  pricePerStudent: number;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  trialStart: Date | null;
  trialEnd: Date | null;
  isTrial: boolean;
  daysRemaining: number | null;
  activeStudents: number;
  totalAmount: number;
  billingPeriod?: "monthly" | "annual";
}

export interface GymPendingAction {
  id: string;
  type: string;
  queueId?: string;
  createdAt: Date;
  retries: number;
}

export interface ResourceSnapshot {
  status: "idle" | "loading" | "ready" | "error";
  lastStartedAt: Date | null;
  lastFetchedAt: Date | null;
  error: string | null;
}

export interface BalanceWithdrawSnapshot {
  balanceReais: number;
  balanceCents: number;
  withdraws: Array<{
    id: string;
    amount: number;
    pixKey: string;
    pixKeyType: string;
    externalId: string;
    status: string;
    createdAt: Date;
    completedAt: Date | null;
  }>;
}

export interface GymMetadata {
  lastSync: Date | null;
  isLoading: boolean;
  isInitialized: boolean;
  errors: Record<string, string | null>;
  pendingActions: GymPendingAction[];
  telemetry: Record<string, number>;
  resources: Record<string, ResourceSnapshot>;
}

export interface GymUnifiedData {
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
  balanceWithdraws: BalanceWithdrawSnapshot;
  studentDetails: Record<string, StudentData | null>;
  studentPayments: Record<string, Payment[]>;
  subscription: GymSubscriptionSnapshot | null;
  metadata: GymMetadata;
}

export type GymDataSection =
  | "profile"
  | "stats"
  | "students"
  | "equipment"
  | "financialSummary"
  | "recentCheckIns"
  | "membershipPlans"
  | "payments"
  | "expenses"
  | "coupons"
  | "campaigns"
  | "balanceWithdraws"
  | "subscription";

export const initialGymData: GymUnifiedData = {
  profile: null,
  stats: null,
  students: [],
  equipment: [],
  financialSummary: null,
  recentCheckIns: [],
  membershipPlans: [],
  payments: [],
  expenses: [],
  coupons: [],
  campaigns: [],
  balanceWithdraws: {
    balanceReais: 0,
    balanceCents: 0,
    withdraws: [],
  },
  studentDetails: {},
  studentPayments: {},
  subscription: null,
  metadata: {
    lastSync: null,
    isLoading: false,
    isInitialized: false,
    errors: {},
    pendingActions: [],
    telemetry: {},
    resources: {},
  },
};
