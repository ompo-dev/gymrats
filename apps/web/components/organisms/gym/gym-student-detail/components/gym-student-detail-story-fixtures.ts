import type { Payment, StudentData } from "@/lib/types";

export function createGymStudentDetailFixture(
  overrides: Partial<StudentData> = {},
): StudentData {
  return {
    id: "student-ana-01",
    name: "Ana Souza",
    email: "ana@gymrats.local",
    avatar: "/placeholder.svg",
    age: 29,
    gender: "female",
    phone: "(11) 99999-1000",
    membershipStatus: "active",
    joinDate: new Date("2025-09-15T00:00:00.000Z"),
    totalVisits: 84,
    currentStreak: 12,
    attendanceRate: 92,
    currentWeight: 62.4,
    favoriteEquipment: ["Leg Press", "Bike"],
    assignedTrainer: "Rafa Moreira",
    profile: {
      height: 168,
      fitnessLevel: "intermediate",
      weeklyWorkoutFrequency: 4,
      goals: ["hypertrophy", "conditioning"],
    },
    progress: {
      totalXP: 1680,
      xpToNextLevel: 420,
      currentLevel: 9,
      weeklyXP: [120, 80, 140, 0, 160, 210, 60],
    },
    workoutHistory: [],
    personalRecords: [
      {
        exerciseId: "exercise-1",
        exerciseName: "Agachamento Livre",
        value: 110,
        previousBest: 105,
        type: "max-weight",
        date: new Date("2026-03-20T00:00:00.000Z"),
      },
      {
        exerciseId: "exercise-2",
        exerciseName: "Supino Reto",
        value: 72.5,
        previousBest: 70,
        type: "max-weight",
        date: new Date("2026-03-18T00:00:00.000Z"),
      },
    ],
    weightHistory: [
      {
        date: new Date("2026-03-01T00:00:00.000Z"),
        weight: 61.8,
      },
      {
        date: new Date("2026-03-24T00:00:00.000Z"),
        weight: 62.4,
      },
    ],
    assignedPersonals: [
      {
        id: "personal-1",
        name: "Rafa Moreira",
        gym: {
          id: "gym-1",
          name: "GymRats Paulista",
        },
      },
    ],
    gymMembership: {
      id: "membership-1",
      gymId: "gym-1",
      gymName: "GymRats Paulista",
      gymAddress: "Av. Paulista, 1500",
      planId: "plan-1",
      planName: "Plano Premium",
      planType: "monthly",
      startDate: new Date("2025-09-15T00:00:00.000Z"),
      nextBillingDate: new Date("2026-04-15T00:00:00.000Z"),
      amount: 149.9,
      status: "active",
      autoRenew: true,
      benefits: ["Acesso livre"],
    },
    ...overrides,
  } as unknown as StudentData;
}

export const gymStudentFixture = createGymStudentDetailFixture();

export const gymStudentPaymentsFixture = [
  {
    id: "payment-1",
    planId: "plan-1",
    planName: "Plano Premium",
    amount: 149.9,
    status: "paid",
    paymentMethod: "credit-card",
    date: new Date("2026-03-10T00:00:00.000Z"),
    dueDate: new Date("2026-03-10T00:00:00.000Z"),
  },
  {
    id: "payment-2",
    planId: "plan-1",
    planName: "Plano Premium",
    amount: 149.9,
    status: "pending",
    paymentMethod: "pix",
    date: new Date("2026-04-10T00:00:00.000Z"),
    dueDate: new Date("2026-04-10T00:00:00.000Z"),
  },
] as Payment[];
