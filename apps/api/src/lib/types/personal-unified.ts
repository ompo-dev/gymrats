import type {
  PersonalAffiliation,
  PersonalMembershipPlan,
  PersonalProfile,
  PersonalStudentAssignment,
  PersonalSubscriptionData,
} from "@gymrats/types/personal-module";
import type { Expense, FinancialSummary } from "@/lib/types";

export interface PersonalMetadata {
  lastSync: Date | null;
  isLoading: boolean;
  isInitialized: boolean;
  errors: Record<string, string | null>;
}

export interface PersonalUnifiedData {
  profile: PersonalProfile | null;
  affiliations: PersonalAffiliation[];
  students: PersonalStudentAssignment[];
  subscription: PersonalSubscriptionData | null;
  membershipPlans?: PersonalMembershipPlan[];
  financialSummary: FinancialSummary | null;
  expenses: Expense[];
  metadata: PersonalMetadata;
}

export type PersonalDataSection =
  | "profile"
  | "affiliations"
  | "students"
  | "subscription"
  | "financialSummary"
  | "expenses";

export const initialPersonalData: PersonalUnifiedData = {
  profile: null,
  affiliations: [],
  students: [],
  subscription: null,
  financialSummary: null,
  expenses: [],
  metadata: {
    lastSync: null,
    isLoading: false,
    isInitialized: false,
    errors: {},
  },
};
