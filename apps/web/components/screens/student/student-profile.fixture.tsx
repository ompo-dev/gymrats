import type { ReactNode } from "react";
import { DuoCard } from "@/components/duo";
import type { StudentProfileScreenProps } from "./student-profile.screen";

function PlaceholderRelationshipCard({
  title,
  description,
  accentClassName,
}: {
  title: string;
  description: string;
  accentClassName: string;
}) {
  return (
    <DuoCard.Root variant="default" padding="md">
      <DuoCard.Header>
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${accentClassName}`} />
          <h2 className="font-bold text-duo-fg">{title}</h2>
        </div>
      </DuoCard.Header>
      <p className="text-sm text-duo-fg-muted">{description}</p>
    </DuoCard.Root>
  );
}

function createDefaultGymsSlot(): ReactNode {
  return (
    <PlaceholderRelationshipCard
      title="Minhas Academias"
      description="GymRats Paulista • Plano Mensal ativo"
      accentClassName="bg-duo-blue"
    />
  );
}

function createDefaultPersonalsSlot(): ReactNode {
  return (
    <PlaceholderRelationshipCard
      title="Meus Personais"
      description="Rafa Moreira • acompanhamento hibrido"
      accentClassName="bg-duo-purple"
    />
  );
}

export function createStudentProfileFixture(
  overrides: Partial<StudentProfileScreenProps> = {},
): StudentProfileScreenProps {
  return {
    profileUserInfo: {
      name: "E2E Student",
      username: "@student",
      memberSince: "Jan 2025",
    },
    totalWorkoutsCompleted: 58,
    displayProgress: {
      currentStreak: 7,
      longestStreak: 18,
      totalXP: 1340,
      currentLevel: 8,
      xpToNextLevel: 60,
      workoutsCompleted: 58,
    },
    weeklyWorkouts: 3,
    weightHistory: [
      {
        date: new Date("2026-03-01T00:00:00.000Z"),
        weight: 77.8,
      },
      {
        date: new Date("2026-03-24T00:00:00.000Z"),
        weight: 78.4,
      },
    ],
    currentWeight: 78.4,
    weightGain: 0.6,
    hasWeightLossGoal: false,
    recentWorkoutHistory: [
      {
        workoutId: "workout-1",
        workoutName: "Treino A",
        date: new Date("2026-03-24T18:00:00.000Z"),
        duration: 54,
        totalVolume: 3420,
        exercises: [
          {
            id: "exercise-log-1",
            exerciseId: "exercise-1",
            exerciseName: "Supino reto",
            workoutId: "workout-1",
            date: new Date("2026-03-24T18:00:00.000Z"),
            sets: [{ reps: 10, weight: 40 }],
          },
        ],
        overallFeedback: "bom",
        bodyPartsFatigued: ["peito"],
      },
    ] as StudentProfileScreenProps["recentWorkoutHistory"],
    personalRecords: [
      {
        exerciseId: "exercise-1",
        exerciseName: "Agachamento",
        value: 110,
        previousBest: 105,
        type: "max-weight",
        date: new Date("2026-03-20T00:00:00.000Z"),
      },
    ] as StudentProfileScreenProps["personalRecords"],
    lastInProgressWorkout: null,
    isAdmin: false,
    isWeightModalOpen: false,
    newWeight: "78.4",
    gymsSlot: createDefaultGymsSlot(),
    personalsSlot: createDefaultPersonalsSlot(),
    onNewWeightChange: () => undefined,
    onCloseWeightModal: () => undefined,
    onOpenWeightModal: () => undefined,
    onSaveWeight: () => undefined,
    onOpenWorkout: () => undefined,
    onSwitchToGym: () => undefined,
    onLogout: () => undefined,
    ...overrides,
  };
}
