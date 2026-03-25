import type { GymDataSection } from "@/lib/types/gym-unified";
import type { PersonalDataSection } from "@/lib/types/personal-unified";
import type { StudentDataSection } from "@/lib/types/student-unified";

function normalizeSections(sections?: readonly string[]) {
  return sections && sections.length > 0
    ? [...sections].sort().join(",")
    : "all";
}

export const queryKeys = {
  studentBootstrap: (sections?: readonly StudentDataSection[]) =>
    ["student", "bootstrap", normalizeSections(sections)] as const,
  studentPayments: () => ["student", "payments"] as const,
  studentMemberships: () => ["student", "memberships"] as const,
  studentSubscription: () => ["student", "subscription"] as const,
  studentReferral: () => ["student", "referral"] as const,
  gymBootstrap: (sections?: readonly GymDataSection[]) =>
    ["gym", "bootstrap", normalizeSections(sections)] as const,
  personalBootstrap: (sections?: readonly PersonalDataSection[]) =>
    ["personal", "bootstrap", normalizeSections(sections)] as const,
  paymentStatus: (paymentId: string) =>
    ["payments", "status", paymentId] as const,
};
