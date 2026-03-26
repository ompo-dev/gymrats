"use client";

import type { ReactNode } from "react";
import { Calendar, TrendingUp } from "lucide-react";
import { DuoStatCard, DuoStatsGrid } from "@/components/duo";
import type { ScreenProps, ViewContract } from "@/components/foundations";
import { ScreenShell, createTestSelector } from "@/components/foundations";

export interface StudentDietScreenProps
  extends ScreenProps<{
    caloriesPercentage: number;
    completedMeals: number;
    foodSearchModalSlot?: ReactNode;
    trackerSlot: ReactNode;
    totalMeals: number;
  }> {}

export const studentDietScreenContract: ViewContract = {
  componentId: "student-diet-screen",
  testId: "student-diet-screen",
};

export function StudentDietScreen({
  caloriesPercentage,
  completedMeals,
  foodSearchModalSlot,
  trackerSlot,
  totalMeals,
}: StudentDietScreenProps) {
  return (
    <ScreenShell.Root
      className="max-w-4xl"
      screenId={studentDietScreenContract.testId}
    >
      <ScreenShell.Header>
        <ScreenShell.Heading className="text-center sm:text-center">
          <ScreenShell.Title>Nutricao</ScreenShell.Title>
          <ScreenShell.Description>
            {completedMeals} de {totalMeals} refeicoes concluidas hoje.
          </ScreenShell.Description>
        </ScreenShell.Heading>
      </ScreenShell.Header>

      <ScreenShell.Body>
        <DuoStatsGrid.Root
          columns={2}
          data-testid={createTestSelector(
            studentDietScreenContract.testId,
            "metrics",
          )}
        >
          <DuoStatCard.Simple
            icon={Calendar}
            iconColor="var(--duo-secondary)"
            label="refeicoes hoje"
            value={`${completedMeals}/${totalMeals}`}
          />
          <DuoStatCard.Simple
            icon={TrendingUp}
            iconColor="var(--duo-primary)"
            label="meta calorica"
            value={`${caloriesPercentage}%`}
          />
        </DuoStatsGrid.Root>

        <div
          data-testid={createTestSelector(
            studentDietScreenContract.testId,
            "tracker",
          )}
        >
          {trackerSlot}
        </div>

        {foodSearchModalSlot}
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
