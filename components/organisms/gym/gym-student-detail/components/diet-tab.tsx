"use client";

import { Apple, Droplets, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DuoButton, DuoCard, DuoInput } from "@/components/duo";
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
  onUpdateTargetWater: (targetWater: number) => void | Promise<void>;
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
  onUpdateTargetWater,
  onRemoveMeal,
  onRemoveFood,
  onToggleWaterGlass,
}: DietTabProps) {
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [targetWaterInput, setTargetWaterInput] = useState("3000");
  const [isSavingTargetWater, setIsSavingTargetWater] = useState(false);
  const targetCal = student.profile?.targetCalories ?? 2000;
  const targetProtein = student.profile?.targetProtein ?? 150;
  const targetCarbs = student.profile?.targetCarbs ?? 250;
  const targetFats = student.profile?.targetFats ?? 65;
  const nutrition = dailyNutrition ?? {
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

  useEffect(() => {
    setTargetWaterInput(String(nutrition.targetWater ?? 3000));
  }, [nutrition.targetWater]);

  const handleSaveTargetWater = async () => {
    const parsed = Number(targetWaterInput);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    setIsSavingTargetWater(true);
    try {
      await onUpdateTargetWater(parsed);
    } finally {
      setIsSavingTargetWater(false);
    }
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
        <>
          <DuoCard.Root variant="default" padding="md" className="mb-4">
            <DuoCard.Header>
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-duo-blue" />
                <h2 className="font-bold text-duo-fg">Meta diária de água</h2>
              </div>
            </DuoCard.Header>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <DuoInput.Simple
                label="Total em ml"
                type="number"
                value={targetWaterInput}
                min={0}
                step={50}
                onChange={(event) => setTargetWaterInput(event.target.value)}
              />
              <DuoButton
                className="sm:w-40"
                onClick={handleSaveTargetWater}
                disabled={isSavingTargetWater}
              >
                {isSavingTargetWater ? "Salvando..." : "Salvar"}
              </DuoButton>
            </div>
            <p className="mt-2 text-xs text-duo-fg-muted">
              A academia define a meta; o aluno registra a água consumida.
            </p>
          </DuoCard.Root>

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
            waterReadOnly
          />
        </>
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
