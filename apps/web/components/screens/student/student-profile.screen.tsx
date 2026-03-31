"use client";

import { Edit, Flame, TrendingUp, Trophy, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { DuoButton, DuoStatCard, DuoStatsGrid } from "@/components/duo";
import type { ScreenProps, ViewContract } from "@/components/foundations";
import { ScreenShell, createTestSelector } from "@/components/foundations";
import { ProfileHeader } from "@/components/ui/profile-header";
import type { ExerciseLog, PersonalRecord, WorkoutHistory } from "@/lib/types";
import type { WeightHistoryItem } from "@/lib/types/student-unified";
import {
  AccountSection,
  PersonalRecordsCard,
  RecentHistoryCard,
  WeightEvolutionCard,
  WeightModal,
} from "@/app/student/_profile/components";

interface StudentProfileUserInfo {
  name: string;
  username: string;
  memberSince: string;
}

interface StudentProfileProgressSnapshot {
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  currentLevel: number;
  xpToNextLevel: number;
  workoutsCompleted: number;
}

interface StudentProfileInProgressWorkout {
  workout: { id: string };
  progress: { exerciseLogs?: ExerciseLog[] };
}

export interface StudentProfileScreenProps
  extends ScreenProps<{
    profileUserInfo: StudentProfileUserInfo | null;
    totalWorkoutsCompleted: number;
    displayProgress: StudentProfileProgressSnapshot;
    weeklyWorkouts: number;
    weightHistory: WeightHistoryItem[];
    currentWeight: number | null;
    weightGain: number | null;
    hasWeightLossGoal: boolean;
    recentWorkoutHistory: WorkoutHistory[];
    personalRecords: PersonalRecord[];
    lastInProgressWorkout: StudentProfileInProgressWorkout | null;
    isAdmin: boolean;
    isWeightModalOpen: boolean;
    newWeight: string;
    gymsSlot?: ReactNode;
    personalsSlot?: ReactNode;
    onNewWeightChange: (value: string) => void;
    onCloseWeightModal: () => void;
    onOpenWeightModal: () => void;
    onSaveWeight: () => void | Promise<void>;
    onOpenWorkout: () => void;
    onSwitchToGym: () => void;
    onLogout: () => void;
  }> {}

export const studentProfileScreenContract: ViewContract = {
  componentId: "student-profile-screen",
  testId: "student-profile-screen",
};

function getWeightDeltaLabel(weightGain: number | null) {
  if (weightGain === null || weightGain === undefined) {
    return "kg";
  }

  if (weightGain < 0) {
    return "kg Perdidos";
  }

  if (weightGain > 0) {
    return "kg Ganhos";
  }

  return "Sem mudanca";
}

export function StudentProfileScreen({
  profileUserInfo,
  totalWorkoutsCompleted,
  displayProgress,
  weeklyWorkouts,
  weightHistory,
  currentWeight,
  weightGain,
  hasWeightLossGoal,
  recentWorkoutHistory,
  personalRecords,
  lastInProgressWorkout,
  isAdmin,
  isWeightModalOpen,
  newWeight,
  gymsSlot,
  personalsSlot,
  onNewWeightChange,
  onCloseWeightModal,
  onOpenWeightModal,
  onSaveWeight,
  onOpenWorkout,
  onSwitchToGym,
  onLogout,
}: StudentProfileScreenProps) {
  return (
    <ScreenShell.Root
      screenId={studentProfileScreenContract.testId}
      className="max-w-4xl"
    >
      <ScreenShell.Body>
        <div
          data-testid={createTestSelector(
            studentProfileScreenContract.testId,
            "header",
          )}
        >
          <ProfileHeader
            name={profileUserInfo?.name || "Usuario"}
            username={profileUserInfo?.username || "@usuario"}
            memberSince={profileUserInfo?.memberSince || "Jan 2025"}
            stats={{
              workouts: totalWorkoutsCompleted,
              streak: displayProgress.currentStreak,
            }}
            quickStats={[
              {
                value:
                  weightGain !== null && weightGain !== undefined
                    ? `${weightGain > 0 ? "+" : ""}${weightGain.toFixed(1)}`
                    : "0.0",
                label: getWeightDeltaLabel(weightGain),
                highlighted:
                  weightGain !== null &&
                  weightGain !== undefined &&
                  weightGain !== 0,
              },
            ]}
            quickStatsButtons={
              <DuoButton
                onClick={onOpenWeightModal}
                variant="primary"
                className="h-auto w-full p-3 text-center"
                data-testid={createTestSelector(
                  studentProfileScreenContract.testId,
                  "weight-trigger",
                )}
              >
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="mb-1 text-xl font-bold">
                    {currentWeight ? (
                      <div className="flex items-center justify-center gap-1">
                        <span>{currentWeight.toFixed(1)}</span>
                        <Edit className="h-3 w-3 opacity-60" />
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </div>
                  <div className="text-xs font-semibold">kg Atual</div>
                </div>
              </DuoButton>
            }
          />
        </div>

        <DuoStatsGrid.Root
          columns={4}
          className="gap-4"
          data-testid={createTestSelector(
            studentProfileScreenContract.testId,
            "metrics",
          )}
        >
          <DuoStatCard.Simple
            icon={Flame}
            value={displayProgress.currentStreak}
            label="Dias seguidos"
            badge={`Recorde: ${displayProgress.longestStreak}`}
            iconColor="var(--duo-accent)"
          />
          <DuoStatCard.Simple
            icon={Zap}
            value={displayProgress.totalXP}
            label="XP Total"
            badge={`${displayProgress.xpToNextLevel} ate nivel ${
              displayProgress.currentLevel + 1
            }`}
            iconColor="var(--duo-warning)"
          />
          <DuoStatCard.Simple
            icon={Trophy}
            value={`#${displayProgress.currentLevel}`}
            label="Nivel atual"
            badge="Continue treinando"
            iconColor="var(--duo-secondary)"
          />
          <DuoStatCard.Simple
            icon={TrendingUp}
            value={displayProgress.workoutsCompleted}
            label="Treinos"
            badge={
              weeklyWorkouts > 0
                ? `+${weeklyWorkouts} esta semana`
                : "Nenhum esta semana"
            }
            iconColor="var(--duo-primary)"
          />
        </DuoStatsGrid.Root>

        <div
          data-testid={createTestSelector(
            studentProfileScreenContract.testId,
            "weight-history",
          )}
        >
          <WeightEvolutionCard
            weightHistory={weightHistory}
            weightGain={weightGain}
            hasWeightLossGoal={hasWeightLossGoal}
            onOpenWeightModal={onOpenWeightModal}
          />
        </div>

        <ScreenShell.SectionGrid>
          <div
            data-testid={createTestSelector(
              studentProfileScreenContract.testId,
              "recent-history",
            )}
          >
            <RecentHistoryCard
              workouts={recentWorkoutHistory}
              lastInProgressWorkout={lastInProgressWorkout}
              onWorkoutClick={onOpenWorkout}
            />
          </div>
          <div
            data-testid={createTestSelector(
              studentProfileScreenContract.testId,
              "personal-records",
            )}
          >
            <PersonalRecordsCard
              records={personalRecords}
              onWorkoutClick={onOpenWorkout}
            />
          </div>
        </ScreenShell.SectionGrid>

        <ScreenShell.SectionGrid
          data-testid={createTestSelector(
            studentProfileScreenContract.testId,
            "networks",
          )}
        >
          <div
            data-testid={createTestSelector(
              studentProfileScreenContract.testId,
              "gyms",
            )}
          >
            {gymsSlot}
          </div>
          <div
            data-testid={createTestSelector(
              studentProfileScreenContract.testId,
              "personals",
            )}
          >
            {personalsSlot}
          </div>
        </ScreenShell.SectionGrid>

        <div
          data-testid={createTestSelector(
            studentProfileScreenContract.testId,
            "account",
          )}
        >
          <AccountSection
            isAdmin={isAdmin}
            onSwitchToGym={onSwitchToGym}
            onLogout={onLogout}
          />
        </div>
      </ScreenShell.Body>

      <WeightModal
        isOpen={isWeightModalOpen}
        onClose={onCloseWeightModal}
        newWeight={newWeight}
        onNewWeightChange={onNewWeightChange}
        currentWeight={currentWeight}
        onSave={onSaveWeight}
      />
    </ScreenShell.Root>
  );
}
