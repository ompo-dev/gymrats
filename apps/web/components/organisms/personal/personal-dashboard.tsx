"use client";

import {
  PersonalDashboardScreen,
  type PersonalDashboardScreenProps,
} from "@/components/screens/personal";
import type { FinancialSummary } from "@/lib/types";

export interface PersonalDashboardStats {
  gyms: number;
  students: number;
  studentsViaGym: number;
  independentStudents: number;
}

export interface PersonalAffiliationItem {
  id: string;
  gym: {
    id: string;
    name: string;
    image?: string | null;
    logo?: string | null;
  };
}

export interface PersonalStudentItem {
  id: string;
  student: {
    id: string;
    user?: { id: string; name?: string | null; email?: string | null } | null;
  };
  gym?: { id: string; name: string } | null;
}

export interface PersonalDashboardProps {
  profile: { name?: string | null } | null;
  stats: PersonalDashboardStats;
  affiliations?: PersonalAffiliationItem[];
  students?: PersonalStudentItem[];
  subscription?: {
    id: string;
    plan: string;
    status: string;
    currentPeriodEnd?: Date;
  } | null;
  financialSummary?: FinancialSummary | null;
  onViewGym?: (gymId: string) => void;
}

export function PersonalDashboardPage({
  profile,
  stats,
  affiliations = [],
  students = [],
  subscription,
  financialSummary,
  onViewGym,
}: PersonalDashboardProps) {
  return (
    <PersonalDashboardScreen
      profile={profile as PersonalDashboardScreenProps["profile"]}
      stats={stats}
      affiliations={affiliations}
      students={students}
      subscription={subscription}
      financialSummary={financialSummary}
      onViewGym={onViewGym}
    />
  );
}
