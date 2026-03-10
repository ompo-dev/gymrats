"use client";

import { Dumbbell, Loader2, Moon } from "lucide-react";
import { DuoCard } from "@/components/duo";
import { WorkoutPreviewCard } from "@/components/organisms/modals/workout-preview-card";
import type { PlanSlotData, WeeklyPlanData } from "@/lib/types";

const DAY_NAMES_FULL = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

function toPreviewWorkout(slot: PlanSlotData) {
  if (!slot.workout) return null;
  const w = slot.workout;
  return {
    title: w.title,
    description: w.description || "",
    type: "strength" as const,
    muscleGroup: w.muscleGroup || "",
    difficulty: (w.difficulty || "iniciante") as
      | "iniciante"
      | "intermediario"
      | "avancado",
    exercises: (w.exercises ?? []).map((ex) => ({
      name: ex.name,
      sets: ex.sets ?? 0,
      reps: ex.reps ?? "",
      rest: ex.rest ?? 0,
      notes: ex.notes,
      alternatives: undefined,
    })),
  };
}

export interface PersonalWorkoutsTabProps {
  weeklyPlan: WeeklyPlanData | null | undefined;
  isLoadingWeeklyPlan: boolean;
}

export function PersonalWorkoutsTab({
  weeklyPlan,
  isLoadingWeeklyPlan,
}: PersonalWorkoutsTabProps) {
  const slots = weeklyPlan?.slots ?? [];
  const sortedSlots = [...slots].sort(
    (a: PlanSlotData, b: PlanSlotData) => a.dayOfWeek - b.dayOfWeek,
  );

  return (
    <DuoCard.Root variant="default" padding="md">
      <DuoCard.Header>
        <div className="flex items-center gap-2">
          <Dumbbell
            className="h-5 w-5 shrink-0"
            style={{ color: "var(--duo-secondary)" }}
            aria-hidden
          />
          <h2 className="font-bold text-duo-fg">Plano Semanal</h2>
        </div>
      </DuoCard.Header>
      {isLoadingWeeklyPlan ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-duo-gray-dark" />
        </div>
      ) : sortedSlots.length > 0 ? (
        <div className="space-y-4">
          {weeklyPlan && (
            <p className="text-sm text-duo-gray-dark">
              {weeklyPlan.title}
              {weeklyPlan.description && ` • ${weeklyPlan.description}`}
            </p>
          )}
          <div className="space-y-4">
            {sortedSlots.map((slot: PlanSlotData) => (
              <div key={slot.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-duo-border" />
                  <span className="text-xs font-bold text-duo-fg-muted uppercase tracking-wider px-2">
                    {DAY_NAMES_FULL[slot.dayOfWeek ?? 0] ?? "—"}
                  </span>
                  <div className="h-px flex-1 bg-duo-border" />
                </div>
                {slot.type === "rest" || !slot.workout ? (
                  <DuoCard.Root
                    variant="default"
                    padding="md"
                    className="bg-duo-gray/5 border-dashed"
                  >
                    <div className="flex items-center gap-2 text-duo-fg-muted">
                      <Moon className="h-5 w-5" />
                      <span className="text-sm font-medium">Descanso</span>
                    </div>
                  </DuoCard.Root>
                ) : (
                  <WorkoutPreviewCard
                    workout={toPreviewWorkout(slot)!}
                    index={slot.dayOfWeek}
                    displayNumber={slot.dayOfWeek + 1}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-8 text-center">
          <Dumbbell className="mx-auto mb-3 h-10 w-10 text-duo-gray-dark opacity-40" />
          <p className="font-bold text-duo-gray-dark">
            Aluno ainda não possui plano semanal
          </p>
          <p className="mt-1 text-sm text-duo-gray-dark">
            O plano será exibido aqui quando o aluno criar um no app.
          </p>
        </div>
      )}
    </DuoCard.Root>
  );
}
