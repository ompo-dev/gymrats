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
  isCurrentDate: boolean;
  isLoadingNutrition: boolean;
  onNutritionDateChange: (date: string) => void;
  onFetchNutrition: (date?: string) => void;
  onMealComplete: (mealId: string) => void;
  onAddMeal: (
    meals: Array<{ name: string; type: Meal["type"]; time?: string }>,
  ) => void | Promise<void>;
  onAddFood: (
    foods: Array<{ food: FoodItem; servings: number }>,
    mealIds: string[],
  ) => void | Promise<void>;
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
  onRemoveMeal: (mealId: string) => void | Promise<void>;
  onRemoveFood: (mealId: string, foodId: string) => void | Promise<void>;
  onToggleWaterGlass: (index: number) => void | Promise<void>;
  onOpenLibrary: () => void;
  chatStreamUrl?: string;
}

export function DietTab({
  student,
  dailyNutrition,
  nutritionDate,
  isCurrentDate,
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
  onOpenLibrary,
  chatStreamUrl,
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
  const isReadOnly = !isCurrentDate;
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
    const nextValue = String(nutrition.targetWater ?? 3000);
    setTargetWaterInput((current) =>
      current === nextValue ? current : nextValue,
    );
  }, [nutrition.targetWater]);

  const handleSaveTargetWater = async () => {
    const parsed = Number(targetWaterInput);
    if (!Number.isFinite(parsed) || parsed <= 0 || isReadOnly) return;

    setIsSavingTargetWater(true);
    try {
      await onUpdateTargetWater(parsed);
    } finally {
      setIsSavingTargetWater(false);
    }
  };

  return (
    <>
      <DuoCard.Root variant="default" padding="md">
        <DuoCard.Header>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Apple
                className="h-5 w-5 shrink-0"
                style={{ color: "var(--duo-secondary)" }}
                aria-hidden
              />
              <h2 className="font-bold text-duo-fg">Nutricao e Dieta do Aluno</h2>
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
        ) : (
          <>
            <DuoCard.Root variant="default" padding="md" className="mb-4">
              <DuoCard.Header>
                <div className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-duo-blue" />
                  <h2 className="font-bold text-duo-fg">Meta diaria de agua</h2>
                </div>
              </DuoCard.Header>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <DuoInput.Simple
                  label="Total em ml"
                  type="number"
                  value={targetWaterInput}
                  min={0}
                  step={50}
                  disabled={isReadOnly}
                  onChange={(event) => setTargetWaterInput(event.target.value)}
                />
                <DuoButton
                  className="sm:w-40"
                  onClick={handleSaveTargetWater}
                  disabled={isSavingTargetWater || isReadOnly}
                >
                  {isSavingTargetWater ? "Salvando..." : "Salvar"}
                </DuoButton>
              </div>
              <p className="mt-2 text-xs text-duo-fg-muted">
                {isReadOnly
                  ? "Datas anteriores ficam congeladas como historico. A meta e os checks sao somente leitura."
                  : "A academia define a meta; o aluno registra a agua consumida."}
              </p>
            </DuoCard.Root>

            {isReadOnly && (
              <p className="mb-4 text-xs font-medium text-duo-fg-muted">
                Voce esta visualizando um snapshot historico. Refeicoes, alimentos e trocas de plano so podem ser editados na data atual.
              </p>
            )}

            <NutritionTracker.Simple
              nutrition={nutrition}
              onMealComplete={onMealComplete}
              onAddMeal={() => setShowAddMeal(true)}
              onOpenLibrary={onOpenLibrary}
              onAddFoodToMeal={(mealId?: string) => {
                setSelectedMealId(mealId ?? null);
                setShowFoodSearch(true);
              }}
              onDeleteMeal={onRemoveMeal}
              onDeleteFood={onRemoveFood}
              onToggleWaterGlass={onToggleWaterGlass}
              readOnly={isReadOnly}
              waterReadOnly
            />
          </>
        )}
      </DuoCard.Root>

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
          chatStreamUrl={chatStreamUrl}
          contextMode="external"
        />
      )}
    </>
  );
}
