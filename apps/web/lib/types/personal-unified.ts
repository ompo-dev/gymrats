import type {
  PersonalAffiliation,
  PersonalProfile,
  PersonalStudentAssignment,
  PersonalSubscriptionData,
  PersonalMembershipPlan,
} from "@gymrats/types/personal-module";
import type {
  BoostCampaign,
  Coupon,
  Expense,
  FinancialSummary,
  Payment,
  StudentData,
} from "@/lib/types";

export interface ResourceSnapshot {
  status: "idle" | "loading" | "ready" | "error";
  lastStartedAt: Date | null;
  lastFetchedAt: Date | null;
  error: string | null;
}

export interface PersonalMetadata {
  lastSync: Date | null;
  isLoading: boolean;
  isInitialized: boolean;
  errors: Record<string, string | null>;
  resources: Record<string, ResourceSnapshot>;
}

export interface PersonalUnifiedData {
  profile: PersonalProfile | null;
  affiliations: PersonalAffiliation[];
  students: PersonalStudentAssignment[];
  studentDirectory: StudentData[];
  studentDetails: Record<string, StudentData | null>;
  studentPayments: Record<string, Payment[]>;
  subscription: PersonalSubscriptionData | null;
  financialSummary: FinancialSummary | null;
  expenses: Expense[];
  payments: Payment[];
  coupons: Coupon[];
  campaigns: BoostCampaign[];
  membershipPlans: PersonalMembershipPlan[];
  metadata: PersonalMetadata;
}

export type PersonalDataSection =
  | "profile"
  | "affiliations"
  | "students"
  | "studentDirectory"
  | "subscription"
  | "financialSummary"
  | "expenses"
  | "payments"
  | "coupons"
  | "campaigns"
  | "membershipPlans";

export const initialPersonalData: PersonalUnifiedData = {
  profile: null,
  affiliations: [],
  students: [],
  studentDirectory: [],
  studentDetails: {},
  studentPayments: {},
  subscription: null,
  financialSummary: null,
  expenses: [],
  payments: [],
  coupons: [],
  campaigns: [],
  membershipPlans: [],
  metadata: {
    lastSync: null,
    isLoading: false,
    isInitialized: false,
    errors: {},
    resources: {},
  },
};
