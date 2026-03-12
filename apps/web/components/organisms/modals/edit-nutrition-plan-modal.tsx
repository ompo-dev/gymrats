"use client";

import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { DuoButton, DuoCard, DuoInput } from "@/components/duo";
import { AddMealModal } from "@/components/organisms/modals/add-meal-modal";
import { FoodSearch } from "@/components/organisms/modals/food-search";
import { Modal } from "@/components/organisms/modals/modal";
import { NutritionTracker } from "@/components/organisms/trackers/nutrition-tracker";
import { useStudent } from "@/hooks/use-student";
import type { Meal, NutritionPlanData } from "@/lib/types";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";
import { useStudentDetailStore } from "@/stores/student-detail-store";

interface EditNutritionPlanModalProps {
  isOpen: boolean;
  nutritionPlan: NutritionPlanData | null;
  onClose: () => void;
  onPlanUpdated?: () => void | Promise<void>;
  apiMode?: "student" | "gym" | "personal";
  studentId?: string;
}

const EMPTY_NUTRITION_PLANS: NutritionPlanData[] = [];

function planToTrackerNutrition(plan: NutritionPlanData | null) {
  return {
    date: new Date().toISOString().slice(0, 10),
    meals: (plan?.meals || []).map((meal) => ({
      id: meal.id,
      name: meal.name,
      type: meal.type,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
      completed: false,
      time: meal.time,
      foods: meal.foods.map((food) => ({
        id: food.id,
        foodId: food.foodId || "",
        foodName: food.foodName,
        servings: food.servings,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
        servingSize: food.servingSize,
      })),
    })),
    totalCalories: plan?.totalCalories ?? 0,
    totalProtein: plan?.targetProtein ?? 0,
    totalCarbs: plan?.targetCarbs ?? 0,
    totalFats: plan?.targetFats ?? 0,
    waterIntake: 0,
    targetCalories: plan?.totalCalories ?? 0,
    targetProtein: plan?.targetProtein ?? 0,
    targetCarbs: plan?.targetCarbs ?? 0,
    targetFats: plan?.targetFats ?? 0,
    targetWater: 3000,
  };
}

export function EditNutritionPlanModal({
  isOpen,
  nutritionPlan,
  onClose,
  onPlanUpdated,
  apiMode = "student",
  studentId,
}: EditNutritionPlanModalProps) {
  const updateStudentNutritionLibraryPlan = useStudentUnifiedStore(
    (state) => state.updateNutritionLibraryPlan,
  );
  const loadStudentNutritionLibraryPlans = useStudentUnifiedStore(
    (state) => state.loadNutritionLibraryPlans,
  );
  const loadStudentActiveNutritionPlan = useStudentUnifiedStore(
    (state) => state.loadActiveNutritionPlan,
  );
  const loadStudentNutrition = useStudentUnifiedStore(
    (state) => state.loadNutrition,
  );
  const studentFoodDatabase = useStudent("foodDatabase");
  const studentPlans =
    useStudent("nutritionLibraryPlans") as unknown as NutritionPlanData[];
  const updateDetailNutritionLibraryPlan = useStudentDetailStore(
    (state) => state.updateNutritionLibraryPlan,
  );
  const detailKey =
    apiMode !== "student" && studentId
      ? `${apiMode}:${studentId}` as const
      : null;
  const detailPlans = useStudentDetailStore((state) =>
    detailKey
      ? state.nutritionLibraryPlans[detailKey] ?? EMPTY_NUTRITION_PLANS
      : EMPTY_NUTRITION_PLANS,
  );

  const currentPlan = useMemo(() => {
    if (!nutritionPlan) return null;
    const plans = apiMode === "student" ? studentPlans : detailPlans;
    return plans.find((plan) => plan.id === nutritionPlan.id) ?? nutritionPlan;
  }, [apiMode, detailPlans, nutritionPlan, studentPlans]);

  const [title, setTitle] = useState(currentPlan?.title ?? "");
  const [description, setDescription] = useState(currentPlan?.description ?? "");
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  useEffect(() => {
    setTitle(currentPlan?.title ?? "");
    setDescription(currentPlan?.description ?? "");
  }, [currentPlan?.description, currentPlan?.id, currentPlan?.title]);

  if (!isOpen || !currentPlan) return null;

  const foodDatabase = Array.isArray(studentFoodDatabase)
    ? studentFoodDatabase
    : [];

  const persistPlan = async (payload: {
    title?: string;
    description?: string | null;
    meals?: Meal[];
  }) => {
    if (apiMode === "student") {
      await updateStudentNutritionLibraryPlan(currentPlan.id, payload);
      await loadStudentNutritionLibraryPlans();
      await loadStudentActiveNutritionPlan();
      await loadStudentNutrition();
    } else if (studentId) {
      await updateDetailNutritionLibraryPlan({
        scope: apiMode,
        studentId,
        planId: currentPlan.id,
        payload,
      });
    }

    await onPlanUpdated?.();
  };

  const handleSaveDetails = async () => {
    setIsSavingDetails(true);
    try {
      await persistPlan({
        title,
        description: description || null,
      });
    } finally {
      setIsSavingDetails(false);
    }
  };

  const updateMeals = async (nextMeals: Meal[]) => {
    await persistPlan({
      title,
      description: description || null,
      meals: nextMeals,
    });
  };

  const handleAddMeals = async (
    mealsData: Array<{ name: string; type: Meal["type"]; time?: string }>,
  ) => {
    const nextMeals: Meal[] = [
      ...planToTrackerNutrition(currentPlan).meals,
      ...mealsData.map((mealData, index) => ({
        id: `meal-${Date.now()}-${index}`,
        name: mealData.name,
        type: mealData.type,
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        completed: false,
        time: mealData.time,
        foods: [],
      })),
    ];

    await updateMeals(nextMeals);
  };

  const handleAddFood = async (
    foods: Array<{ food: import("@/lib/types").FoodItem; servings: number }>,
    mealIds: string[],
  ) => {
    const nextMeals = planToTrackerNutrition(currentPlan).meals.map((meal) => {
      if (!mealIds.includes(meal.id)) return meal;

      const newFoods = foods.map(({ food, servings }) => ({
        id: `food-${Date.now()}-${Math.random()}`,
        foodId: food.id,
        foodName: food.name,
        servings,
        calories: food.calories * servings,
        protein: food.protein * servings,
        carbs: food.carbs * servings,
        fats: food.fats * servings,
        servingSize: food.servingSize,
      }));

      const totals = newFoods.reduce(
        (accumulator, food) => ({
          calories: accumulator.calories + food.calories,
          protein: accumulator.protein + food.protein,
          carbs: accumulator.carbs + food.carbs,
          fats: accumulator.fats + food.fats,
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 },
      );

      return {
        ...meal,
        foods: [...(meal.foods || []), ...newFoods],
        calories: meal.calories + totals.calories,
        protein: meal.protein + totals.protein,
        carbs: meal.carbs + totals.carbs,
        fats: meal.fats + totals.fats,
      };
    });

    await updateMeals(nextMeals);
    setShowFoodSearch(false);
    setSelectedMealId(null);
  };

  const handleRemoveMeal = async (mealId: string) => {
    await updateMeals(
      planToTrackerNutrition(currentPlan).meals.filter((meal) => meal.id !== mealId),
    );
  };

  const handleRemoveFood = async (mealId: string, foodId: string) => {
    const nextMeals = planToTrackerNutrition(currentPlan).meals.map((meal) => {
      if (meal.id !== mealId) return meal;
      const foods = (meal.foods || []).filter((food) => food.id !== foodId);
      const totals = foods.reduce(
        (accumulator, food) => ({
          calories: accumulator.calories + food.calories,
          protein: accumulator.protein + food.protein,
          carbs: accumulator.carbs + food.carbs,
          fats: accumulator.fats + food.fats,
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 },
      );
      return {
        ...meal,
        foods,
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fats: totals.fats,
      };
    });

    await updateMeals(nextMeals);
  };

  return (
    <>
      <Modal.Root isOpen={isOpen} onClose={onClose} maxWidth="xl">
        <Modal.Header title="Editar Plano Alimentar" onClose={onClose} />
        <Modal.Content>
          <div className="space-y-6">
            <DuoCard.Root variant="default" padding="md">
              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <div className="grid gap-4">
                  <DuoInput.Simple
                    label="Título"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                  <DuoInput.Simple
                    label="Descrição"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </div>
                <DuoButton onClick={handleSaveDetails} disabled={isSavingDetails}>
                  <Save className="h-4 w-4" />
                  {isSavingDetails ? "Salvando..." : "Salvar detalhes"}
                </DuoButton>
              </div>
            </DuoCard.Root>

            <NutritionTracker.Simple
              nutrition={planToTrackerNutrition(currentPlan)}
              onMealComplete={() => {}}
              onAddMeal={() => setShowAddMeal(true)}
              onAddFoodToMeal={(mealId) => {
                setSelectedMealId(mealId);
                setShowFoodSearch(true);
              }}
              onDeleteMeal={handleRemoveMeal}
              onDeleteFood={handleRemoveFood}
              readOnly={false}
              waterReadOnly
              showCompletionControls={false}
            />
          </div>
        </Modal.Content>
      </Modal.Root>

      {showAddMeal && (
        <AddMealModal.Simple
          onClose={() => setShowAddMeal(false)}
          onAddMeal={async (mealsData) => {
            await handleAddMeals(mealsData);
            setShowAddMeal(false);
          }}
        />
      )}

      {showFoodSearch && (
        <FoodSearch.Simple
          onAddFood={handleAddFood}
          onAddMeal={handleAddMeals}
          onApplyNutrition={async (data) => {
            await updateMeals(data.meals);
          }}
          onClose={() => {
            setShowFoodSearch(false);
            setSelectedMealId(null);
          }}
          selectedMealId={selectedMealId}
          meals={planToTrackerNutrition(currentPlan).meals}
          foodDatabase={foodDatabase}
          onSelectMeal={setSelectedMealId}
          contextMode="external"
        />
      )}
    </>
  );
}
