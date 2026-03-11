"use client";

import { Apple, Loader2 } from "lucide-react";
import { DuoCard } from "@/components/duo";
import type { DailyNutrition } from "@/lib/types";

export interface PersonalDietTabProps {
  dailyNutrition: DailyNutrition | null;
  nutritionDate: string;
  isLoadingNutrition: boolean;
  onNutritionDateChange: (date: string) => void;
  onFetchNutrition: (date?: string) => void;
}

export function PersonalDietTab({
  dailyNutrition,
  nutritionDate,
  isLoadingNutrition,
  onNutritionDateChange,
  onFetchNutrition,
}: PersonalDietTabProps) {
  return (
    <DuoCard.Root variant="default" padding="md">
      <DuoCard.Header>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Apple
              className="h-5 w-5 shrink-0"
              style={{ color: "var(--duo-secondary)" }}
              aria-hidden
            />
            <h2 className="font-bold text-duo-fg">Nutrição</h2>
          </div>
          <input
            type="date"
            value={nutritionDate}
            onChange={(e) => {
              onNutritionDateChange(e.target.value);
              onFetchNutrition(e.target.value);
            }}
            className="rounded-lg border border-duo-border bg-duo-bg px-3 py-1.5 text-sm font-bold text-duo-text"
          />
        </div>
      </DuoCard.Header>
      {isLoadingNutrition ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-duo-gray-dark" />
        </div>
      ) : dailyNutrition ? (
        <div className="mt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-duo-fg-muted">Calorias</span>
            <span className="font-semibold text-duo-fg">
              {dailyNutrition.totalCalories} / {dailyNutrition.targetCalories}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-duo-fg-muted">Proteína</span>
            <span className="font-semibold text-duo-fg">
              {dailyNutrition.totalProtein}g
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-duo-fg-muted">Carboidratos</span>
            <span className="font-semibold text-duo-fg">
              {dailyNutrition.totalCarbs}g
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-duo-fg-muted">Gorduras</span>
            <span className="font-semibold text-duo-fg">
              {dailyNutrition.totalFats}g
            </span>
          </div>
          <p className="text-sm text-duo-fg-muted">
            {dailyNutrition.meals?.length ?? 0} refeições registradas
          </p>
        </div>
      ) : (
        <div className="py-12 text-center">
          <Apple className="mx-auto mb-3 h-10 w-10 text-duo-gray-dark opacity-40" />
          <p className="font-bold text-duo-gray-dark">
            Nenhum registro de nutrição para esta data
          </p>
          <p className="mt-1 text-sm text-duo-gray-dark">
            Os dados de nutrição do aluno aparecerão aqui.
          </p>
        </div>
      )}
    </DuoCard.Root>
  );
}
