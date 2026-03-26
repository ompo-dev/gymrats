import type { Achievement, GymProfile } from "@/lib/types";
import type { GymGamificationScreenProps } from "./gym-gamification.screen";

export function createGymGamificationFixture(
  overrides: Partial<GymGamificationScreenProps> = {},
): GymGamificationScreenProps {
  return {
    profile: {
      id: "gym-profile-1",
      name: "GymRats Paulista",
      address: "Av. Paulista, 900, São Paulo",
      phone: "(11) 4002-8922",
      email: "contato@gymrats.local",
      cnpj: "12.345.678/0001-99",
      plan: "premium",
      totalStudents: 164,
      activeStudents: 139,
      equipmentCount: 48,
      createdAt: new Date("2024-01-10T00:00:00.000Z"),
      gamification: {
        level: 12,
        xp: 3480,
        xpToNextLevel: 520,
        currentStreak: 21,
        longestStreak: 46,
        monthlyStudentGoal: 180,
        avgStudentFrequency: 4.7,
        equipmentUtilization: 78,
        ranking: 3,
        achievements: [
          {
            id: "achievement-1",
            title: "Comunidade Ativa",
            description: "Mantenha 150 alunos ativos no mês.",
            icon: "🏆",
            unlockedAt: new Date("2026-03-10T00:00:00.000Z"),
            progress: 150,
            target: 150,
            category: "special",
            color: "#50D5A1",
          },
          {
            id: "achievement-2",
            title: "Academia em Chamas",
            description: "Manter sequência de 30 dias com check-ins diários.",
            icon: "🔥",
            progress: 21,
            target: 30,
            category: "streak",
            color: "#FF8A00",
          },
        ] as Achievement[],
      },
    } as GymProfile,
    ...overrides,
  };
}
