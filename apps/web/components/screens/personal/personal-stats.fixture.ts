"use client";

import type { PersonalStatsScreenProps } from "./personal-stats.screen";

export function createPersonalStatsFixture(
  overrides: Partial<PersonalStatsScreenProps> = {},
): PersonalStatsScreenProps {
  return {
    gyms: 3,
    students: 42,
    studentsViaGym: 28,
    independentStudents: 14,
    ...overrides,
  };
}
