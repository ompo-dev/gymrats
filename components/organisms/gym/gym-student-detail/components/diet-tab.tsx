"use client";

import { Apple, Loader2 } from "lucide-react";
import { useState } from "react";
import { DuoCard } from "@/components/duo";
import { AddMealModal } from "@/components/organisms/modals/add-meal-modal";
import { FoodSearch } from "@/components/organisms/modals/food-search";
import { NutritionTracker } from "@/components/organisms/trackers/nutrition-tracker";
import type { DailyNutrition, FoodItem, Meal, StudentData } from "@/lib/types";

export interface DietTabProps {
  student: StudentData;
  dailyNutrition: DailyNutrition | null;
  nutritionDate: string;
  isLoadingNutrition: boolean;
  onNutritionDateChange: (date: string) => void;
  onFetchNutrition: (date?: string) => void;
  onMealComplete: (mealId: string) => void;
  onAddMeal: (
    meals: Array<{ name: string; type: Meal["type"]; time?: string }>,
  ) => void;
  onAddFood: (
    foods: Array<{ food: FoodItem; servings: number }>,
    mealIds: string[],
  ) => void;
  onApplyNutrition: (data: {
    meals: Meal[];
    totals: {
      totalCalories: number;
      totalProtein: number;
      totalCarbs: number;
      totalFats: number;
    };
  }) => void | Promise<void>;
  onRemoveMeal: (mealId: string) => void;
  onRemoveFood: (mealId: string, foodId: string) => void;
  onToggleWaterGlass: (index: number) => void;
}

export function DietTab({
  student,
  dailyNutrition,
  nutritionDate,
  isLoadingNutrition,
  onNutritionDateChange,
  onFetchNutrition,
  onMealComplete,
  onAddMeal,
  onAddFood,
  onApplyNutrition,
  onRemoveMeal,
  onRemoveFood,
  onToggleWaterGlass,
}: DietTabProps) {
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const targetCal = student.profile?.targetCalories ?? 2000;
  const targetProtein = student.profile?.targetProtein ?? 150;
  const targetCarbs = student.profile?.targetCarbs ?? 250;
  const targetFats = student.profile?.targetFats ?? 65;
  const nutrition =
    dailyNutrition ?? {
      date: nutritionDate,
      meals: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      waterIntake: 0,
      targetCalories: targetCal,
      targetProtein,
      targetCarbs,
      targetFats,
      targetWater: 3000,
    };

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
            <h2 className="font-bold text-duo-fg">Nutrição e Dieta do Aluno</h2>
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
      ) : nutrition ? (
        <NutritionTracker.Simple
          nutrition={nutrition}
          onMealComplete={onMealComplete}
          onAddMeal={() => setShowAddMeal(true)}
          onAddFoodToMeal={(mealId?: string) => {
            if (mealId) {
              setSelectedMealId(mealId);
            } else {
              setSelectedMealId(null);
            }
            setShowFoodSearch(true);
          }}
          onDeleteMeal={onRemoveMeal}
          onDeleteFood={onRemoveFood}
          onToggleWaterGlass={onToggleWaterGlass}
        />
      ) : (
        <div className="py-12 text-center">
          <Apple className="mx-auto mb-3 h-10 w-10 text-duo-gray-dark opacity-40" />
          <p className="font-bold text-duo-gray-dark">
            Nenhum registro de nutrição para esta data
          </p>
          <p className="mt-1 text-sm text-duo-gray-dark">
            As metas do perfil: {targetCal} kcal, {targetProtein}g Proteína,{" "}
            {targetCarbs}g Carboidratos, {targetFats}g Gorduras.
          </p>
        </div>
      )}

      {showAddMeal && (
        <AddMealModal.Simple
          onClose={() => setShowAddMeal(false)}
          onAddMeal={async (mealsData) => {
            await onAddMeal(mealsData);
            setShowAddMeal(false);
          }}
        />
      )}

      {showFoodSearch && (
        <FoodSearch.Simple
          onAddFood={onAddFood}
          onAddMeal={onAddMeal}
          onClose={() => {
            setShowFoodSearch(false);
            setSelectedMealId(null);
          }}
          selectedMealId={selectedMealId}
          meals={nutrition.meals}
          onSelectMeal={(mealId) => setSelectedMealId(mealId)}
          onApplyNutrition={onApplyNutrition}
          chatStreamUrl={`/api/gym/students/${student.id}/nutrition/chat-stream`}
        />
      )}
    </DuoCard.Root>
  );
}
