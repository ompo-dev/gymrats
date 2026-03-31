"use client";

import { PersonalStatsScreen } from "@/components/screens/personal";

export interface PersonalStatsProps {
  gyms: number;
  students: number;
  studentsViaGym: number;
  independentStudents: number;
}

export function PersonalStatsPage({
  gyms,
  students,
  studentsViaGym,
  independentStudents,
}: PersonalStatsProps) {
  return (
    <PersonalStatsScreen
      gyms={gyms}
      students={students}
      studentsViaGym={studentsViaGym}
      independentStudents={independentStudents}
    />
  );
}
