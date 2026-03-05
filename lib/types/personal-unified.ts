import type {
  PersonalAffiliation,
  PersonalProfile,
  PersonalStudentAssignment,
  PersonalSubscriptionData,
} from "@/app/personal/types";

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
  metadata: PersonalMetadata;
}

export type PersonalDataSection =
  | "profile"
  | "affiliations"
  | "students"
  | "subscription";

export const initialPersonalData: PersonalUnifiedData = {
  profile: null,
  affiliations: [],
  students: [],
  subscription: null,
  metadata: {
    lastSync: null,
    isLoading: false,
    isInitialized: false,
    errors: {},
  },
};
