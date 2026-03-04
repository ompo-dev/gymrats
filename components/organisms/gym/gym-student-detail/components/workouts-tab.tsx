"use client";

import { Calendar, Clock, Dumbbell, Loader2, Moon, Trophy } from "lucide-react";
import { useState } from "react";
import { DuoButton, DuoCard } from "@/components/duo";
import { EditUnitModal } from "@/components/organisms/modals/edit-unit-modal";
import { apiClient } from "@/lib/api/client";
import { WorkoutPreviewCard } from "@/components/organisms/modals/workout-preview-card";
import type {
  PlanSlotData,
  StudentData,
  WeeklyPlanData,
  WorkoutHistory,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const _DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DAY_NAMES_FULL = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

function getStartOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isInCurrentWeek(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const start = getStartOfWeek(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return d >= start && d < end;
}

function formatDay(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoje";
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function getFeedbackColor(feedback?: string): string {
  switch (feedback) {
    case "excelente":
      return "text-duo-green";
    case "bom":
      return "text-duo-blue";
    case "regular":
      return "text-duo-yellow";
    case "ruim":
      return "text-duo-red";
    default:
      return "text-duo-gray-dark";
  }
}

/** Card de treino (histórico): nome + dia, tempo + kg, feedback */
function WorkoutRowCard({
  title,
  dayLabel,
  minutes,
  volumeKg,
  feedback,
}: {
  title: string;
  dayLabel: string;
  minutes: number;
  volumeKg?: number;
  feedback?: string;
}) {
  return (
    <DuoCard.Root variant="default" size="sm" className="p-3">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="font-bold text-duo-text truncate min-w-0">
          {title || "Treino"}
        </div>
        <div className="text-xs font-bold text-duo-gray-dark shrink-0">
          {dayLabel}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-duo-gray-dark">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {minutes} min
          </div>
          {volumeKg !== undefined && volumeKg > 0 && (
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              {volumeKg.toFixed(0)} kg
            </div>
          )}
        </div>
        {feedback && (
          <div className={cn("text-xs font-bold", getFeedbackColor(feedback))}>
            {feedback.charAt(0).toUpperCase() + feedback.slice(1)}
          </div>
        )}
      </div>
    </DuoCard.Root>
  );
}

/** Converte WorkoutSession do plano para o formato do WorkoutPreviewCard */
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

export interface WorkoutsTabProps {
  student: StudentData;
  weeklyPlan: WeeklyPlanData | null | undefined;
  isLoadingWeeklyPlan: boolean;
  isEditOpen?: boolean;
  onEditOpenChange?: (open: boolean) => void;
  onReloadWeeklyPlan?: () => Promise<void>;
}

export function WorkoutsTab({
  student,
  weeklyPlan,
  isLoadingWeeklyPlan,
  isEditOpen,
  onEditOpenChange,
  onReloadWeeklyPlan,
}: WorkoutsTabProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const isModalOpen = isEditOpen ?? localOpen;
  const setModalOpen = (open: boolean) => {
    if (onEditOpenChange) {
      onEditOpenChange(open);
    } else {
      setLocalOpen(open);
    }
  };

  const handleOpenEditor = async () => {
    if (!weeklyPlan) {
      await apiClient.post(`/api/gym/students/${student.id}/weekly-plan`, {});
      await onReloadWeeklyPlan?.();
    }
    setModalOpen(true);
  };
  const slots = weeklyPlan?.slots ?? [];
  const sortedSlots = [...slots].sort(
    (a: PlanSlotData, b: PlanSlotData) => a.dayOfWeek - b.dayOfWeek,
  );
  const workoutHistory = student.workoutHistory ?? [];
  const thisWeekHistory = workoutHistory.filter((wh) =>
    isInCurrentWeek(wh.date),
  );

  return (
    <div className="space-y-6">
      <DuoCard.Root variant="default" padding="md">
        <DuoCard.Header>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar
                className="h-5 w-5 shrink-0"
                style={{ color: "var(--duo-secondary)" }}
                aria-hidden
              />
              <h2 className="font-bold text-duo-fg">Plano Semanal do Aluno</h2>
            </div>
            <DuoButton size="sm" variant="outline" onClick={handleOpenEditor}>
              Editar Plano
            </DuoButton>
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
            {/* Mesma estrutura do workouts-list-section: divider + card por slot */}
            <div className="space-y-4">
              {sortedSlots.map((slot: PlanSlotData) => (
                <div key={slot.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-duo-border" />
                    <span className="text-xs font-bold text-duo-fg-muted uppercase tracking-wider px-2">
                      {DAY_NAMES_FULL[slot.dayOfWeek] ?? "—"}
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

      <DuoCard.Root variant="default" padding="md">
        <DuoCard.Header>
          <div className="flex items-center gap-2">
            <Trophy
              className="h-5 w-5 shrink-0"
              style={{ color: "var(--duo-secondary)" }}
              aria-hidden
            />
            <h2 className="font-bold text-duo-fg">Treinos desta semana</h2>
          </div>
        </DuoCard.Header>
        {thisWeekHistory.length === 0 ? (
          <DuoCard.Root
            variant="default"
            size="default"
            className="p-8 text-center"
          >
            <Dumbbell className="mx-auto mb-3 h-10 w-10 text-duo-gray-dark opacity-40" />
            <p className="font-bold text-duo-gray-dark">
              Nenhum treino nesta semana
            </p>
            <p className="mt-1 text-sm text-duo-gray-dark">
              Os treinos completados aparecerão aqui.
            </p>
          </DuoCard.Root>
        ) : (
          <div className="space-y-2">
            {thisWeekHistory.map((wh: WorkoutHistory, idx: number) => (
              <WorkoutRowCard
                key={`wh-${idx}-${wh.date?.toString?.() ?? idx}`}
                title={wh.workoutName}
                dayLabel={formatDay(wh.date)}
                minutes={wh.duration ?? 0}
                volumeKg={wh.totalVolume ?? 0}
                feedback={wh.overallFeedback}
              />
            ))}
          </div>
        )}
      </DuoCard.Root>

      <EditUnitModal
        isWeeklyPlanMode
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onPlanUpdated={onReloadWeeklyPlan}
        apiMode="gym"
        studentId={student.id}
        weeklyPlan={weeklyPlan ?? null}
        loadWeeklyPlan={onReloadWeeklyPlan}
        profile={student.profile}
      />
    </div>
  );
}
