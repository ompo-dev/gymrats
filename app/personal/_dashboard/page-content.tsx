"use client";

import { PersonalDashboardPage } from "@/components/organisms/personal";
import type {
  PersonalAffiliation,
  PersonalProfile,
  PersonalStudentAssignment,
  PersonalSubscriptionData,
} from "../types";
import type { FinancialSummary } from "@/lib/types";

interface PersonalDashboardStats {
  gyms: number;
  students: number;
  studentsViaGym: number;
  independentStudents: number;
}

interface PersonalDashboardPageContentProps {
  profile: PersonalProfile | null;
  stats: PersonalDashboardStats;
  affiliations: PersonalAffiliation[];
  students: PersonalStudentAssignment[];
  subscription: PersonalSubscriptionData | null;
  financialSummary?: FinancialSummary | null;
}

export function PersonalDashboardPageContent({
  profile,
  stats,
  affiliations,
  students,
  subscription,
  financialSummary,
}: PersonalDashboardPageContentProps) {
  return (
    <PersonalDashboardPage
      profile={profile}
      stats={stats}
      affiliations={affiliations}
      students={students}
      subscription={subscription}
      financialSummary={financialSummary}
    />
  );
}

