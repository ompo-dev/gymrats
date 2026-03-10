"use client";

import { PersonalStatsPage } from "@/components/organisms/personal";

interface PersonalStatsPageContentProps {
  gyms: number;
  students: number;
  studentsViaGym: number;
  independentStudents: number;
}

export function PersonalStatsPageContent({
  gyms,
  students,
  studentsViaGym,
  independentStudents,
}: PersonalStatsPageContentProps) {
  return (
    <PersonalStatsPage
      gyms={gyms}
      students={students}
      studentsViaGym={studentsViaGym}
      independentStudents={independentStudents}
    />
  );
}
