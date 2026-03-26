"use client";

import { Dumbbell, Flame, Trophy, Zap } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { WhileInView } from "@/components/animations/while-in-view";
import { DuoStatCard, DuoStatsGrid } from "@/components/duo";
import type { ScreenProps, ViewContract } from "@/components/foundations";
import { ScreenShell, createTestSelector } from "@/components/foundations";
import { ContinueWorkoutCard } from "@/components/organisms/home/home/continue-workout-card";
import { LevelProgressCard } from "@/components/organisms/home/home/level-progress-card";
import { NutritionStatusCard } from "@/components/organisms/home/home/nutrition-status-card";
import { RecentWorkoutsCard } from "@/components/organisms/home/home/recent-workouts-card";
import { WeightProgressCard } from "@/components/organisms/home/home/weight-progress-card";
import type {
  DailyNutrition,
  Unit,
  WorkoutHistory,
} from "@/lib/types";

interface StudentHomeProgressSnapshot {
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  todayXP: number;
  currentLevel: number;
  xpToNextLevel: number;
  workoutsCompleted: number;
}

interface StudentWeightHistoryItem {
  date: Date | string;
  weight: number;
}

export interface StudentHomeScreenProps
  extends ScreenProps<{
    userName?: string | null;
    displayProgress: StudentHomeProgressSnapshot;
    showLevelProgress?: boolean;
    workoutHistory: WorkoutHistory[];
    units: Unit[];
    dailyNutrition: DailyNutrition | null;
    currentWeight: number | null;
    weightGain: number | null;
    hasWeightLossGoal?: boolean;
    weightHistory: StudentWeightHistoryItem[];
    campaignsSlot?: ReactNode;
  }> {}

export const studentHomeScreenContract: ViewContract = {
  componentId: "student-home-screen",
  testId: "student-home-screen",
};

export function StudentHomeScreen({
  userName,
  displayProgress,
  showLevelProgress = true,
  workoutHistory,
  units,
  dailyNutrition,
  currentWeight,
  weightGain,
  hasWeightLossGoal = false,
  weightHistory,
  campaignsSlot,
}: StudentHomeScreenProps) {
  return (
    <ScreenShell.Root
      screenId={studentHomeScreenContract.testId}
      className="max-w-2xl"
    >
      <FadeIn>
        <ScreenShell.Header>
          <ScreenShell.Heading className="text-center sm:text-center">
            <ScreenShell.Title>
              {userName ? `Olá, ${userName.split(" ")[0]}!` : "Olá, Atleta!"}
            </ScreenShell.Title>
            <ScreenShell.Description>
              Continue sua jornada fitness de hoje
            </ScreenShell.Description>
          </ScreenShell.Heading>
        </ScreenShell.Header>
      </FadeIn>

      <ScreenShell.Body>
        {campaignsSlot ? <WhileInView delay={0.3}>{campaignsSlot}</WhileInView> : null}

        {showLevelProgress ? (
          <WhileInView delay={0.4}>
            <LevelProgressCard.Simple
              currentLevel={displayProgress.currentLevel}
              totalXP={displayProgress.totalXP}
              xpToNextLevel={displayProgress.xpToNextLevel}
            />
          </WhileInView>
        ) : null}

        <DuoStatsGrid.Root
          columns={2}
          className="gap-4"
          data-testid={createTestSelector(
            studentHomeScreenContract.testId,
            "metrics",
          )}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <DuoStatCard.Simple
              icon={Flame}
              value={displayProgress.currentStreak}
              label="dias de sequência"
              badge={`Recorde: ${displayProgress.longestStreak || 0}`}
              iconColor="var(--duo-accent)"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <DuoStatCard.Simple
              icon={Zap}
              value={`${displayProgress.todayXP} XP`}
              label="ganho hoje"
              badge={`Total: ${displayProgress.totalXP || 0} XP`}
              iconColor="var(--duo-warning)"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <DuoStatCard.Simple
              icon={Trophy}
              value={`#${displayProgress.currentLevel}`}
              label="nível atual"
              badge="Continue treinando"
              iconColor="var(--duo-secondary)"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            <DuoStatCard.Simple
              icon={Dumbbell}
              value={displayProgress.workoutsCompleted}
              label="treinos completos"
              badge={
                workoutHistory.length > 0
                  ? `${workoutHistory.length} treinos registrados`
                  : "Nenhum treino ainda"
              }
              iconColor="var(--duo-primary)"
            />
          </motion.div>
        </DuoStatsGrid.Root>

        {currentWeight != null ? (
          <WhileInView delay={0.45}>
            <WeightProgressCard.Simple
              currentWeight={currentWeight}
              weightGain={weightGain}
              hasWeightLossGoal={hasWeightLossGoal}
              weightHistory={weightHistory}
            />
          </WhileInView>
        ) : null}

        <WhileInView delay={0.3}>
          <ContinueWorkoutCard.Simple
            units={units}
            workoutHistory={workoutHistory}
          />
        </WhileInView>

        <WhileInView delay={0.35}>
          <NutritionStatusCard.Simple dailyNutrition={dailyNutrition} />
        </WhileInView>

        {workoutHistory.length > 0 ? (
          <WhileInView delay={0.5}>
            <RecentWorkoutsCard.Simple workoutHistory={workoutHistory} />
          </WhileInView>
        ) : null}
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
