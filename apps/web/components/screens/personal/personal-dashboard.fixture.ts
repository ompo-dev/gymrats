"use client";

import type { FinancialSummary } from "@/lib/types";
import type { PersonalDashboardScreenProps } from "./personal-dashboard.screen";

export function createPersonalDashboardFixture(
  overrides: Partial<PersonalDashboardScreenProps> = {},
): PersonalDashboardScreenProps {
  return {
    profile: {
      name: "Rafa Moreira",
    },
    stats: {
      gyms: 3,
      students: 42,
      studentsViaGym: 28,
      independentStudents: 14,
    },
    affiliations: [
      {
        id: "affiliation-1",
        gym: {
          id: "gym-1",
          name: "GymRats Paulista",
          logo: "/placeholder.svg",
        },
      },
      {
        id: "affiliation-2",
        gym: {
          id: "gym-2",
          name: "Arena Norte",
          image: "/placeholder.svg",
        },
      },
    ],
    students: [
      {
        id: "assignment-1",
        student: {
          id: "student-1",
          user: {
            id: "user-1",
            name: "Ana Souza",
            email: "ana@gymrats.local",
          },
        },
        gym: {
          id: "gym-1",
          name: "GymRats Paulista",
        },
      },
      {
        id: "assignment-2",
        student: {
          id: "student-2",
          user: {
            id: "user-2",
            name: "Marcos Lima",
            email: "marcos@gymrats.local",
          },
        },
      },
    ],
    subscription: {
      id: "subscription-1",
      plan: "premium",
      status: "active",
      currentPeriodEnd: new Date("2026-04-20T00:00:00.000Z"),
    },
    financialSummary: {
      totalRevenue: 12450,
      totalExpenses: 3180,
      netProfit: 9270,
    } as FinancialSummary,
    onViewGym: () => undefined,
    ...overrides,
  };
}
