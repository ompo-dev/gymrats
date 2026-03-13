"use client";

import { Calendar, Clock, Trophy } from "lucide-react";
import { DuoCard } from "@/components/duo";
import type { WorkoutHistory } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecentWorkoutsCardProps {
  workoutHistory: WorkoutHistory[];
}

function RecentWorkoutsCardSimple({ workoutHistory }: RecentWorkoutsCardProps) {
  const recentWorkouts = Array.isArray(workoutHistory)
    ? workoutHistory.slice(0, 3)
    : [];

  if (recentWorkouts.length === 0) {
    return (
      <DuoCard.Root variant="default" padding="md" className="space-y-4">
        <DuoCard.Header>
          <div className="flex items-center gap-2">
            <Calendar
              className="h-5 w-5 shrink-0"
              style={{ color: "var(--duo-secondary)" }}
              aria-hidden
            />
            <h2 className="font-bold text-[var(--duo-fg)]">Treinos Recentes</h2>
          </div>
        </DuoCard.Header>
        <div className="py-4 text-center text-sm text-duo-gray-dark">
          Nenhum treino registrado ainda
        </div>
      </DuoCard.Root>
    );
  }

  const getFeedbackColor = (feedback?: string) => {
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
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Hoje";
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    }
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <DuoCard.Root variant="default" padding="md" className="space-y-3">
      <DuoCard.Header>
        <div className="flex items-center gap-2">
          <Calendar
            className="h-5 w-5 shrink-0"
            style={{ color: "var(--duo-secondary)" }}
            aria-hidden
          />
          <h2 className="font-bold text-[var(--duo-fg)]">Treinos Recentes</h2>
        </div>
      </DuoCard.Header>
      <div className="space-y-2">
        {recentWorkouts.map((workout, index) => (
          <DuoCard.Root key={index} variant="default" size="sm" className="p-3">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="font-bold text-duo-text truncate min-w-0">
                {workout.workoutName || "Treino"}
              </div>
              <div className="text-xs font-bold text-duo-gray-dark shrink-0">
                {formatDate(workout.date)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-duo-gray-dark">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {workout.duration} min
                </div>
                {workout.totalVolume > 0 && (
                  <div className="flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    {workout.totalVolume.toFixed(0)} kg
                  </div>
                )}
              </div>
              {workout.overallFeedback && (
                <div
                  className={cn(
                    "text-xs font-bold",
                    getFeedbackColor(workout.overallFeedback),
                  )}
                >
                  {workout.overallFeedback.charAt(0).toUpperCase() +
                    workout.overallFeedback.slice(1)}
                </div>
              )}
            </div>
          </DuoCard.Root>
        ))}
      </div>
    </DuoCard.Root>
  );
}

export const RecentWorkoutsCard = {
  Simple: RecentWorkoutsCardSimple,
};
