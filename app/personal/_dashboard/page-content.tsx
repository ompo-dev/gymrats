"use client";

import { PersonalDashboardPage } from "@/components/organisms/personal";
import type { PersonalProfile } from "../types";

interface PersonalDashboardStats {
  gyms: number;
  students: number;
  studentsViaGym: number;
  independentStudents: number;
}

interface PersonalDashboardPageContentProps {
  profile: PersonalProfile | null;
  stats: PersonalDashboardStats;
}

export function PersonalDashboardPageContent({
  profile,
  stats,
}: PersonalDashboardPageContentProps) {
  return <PersonalDashboardPage profile={profile} stats={stats} />;
}
