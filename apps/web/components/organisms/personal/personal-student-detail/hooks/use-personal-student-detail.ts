"use client";

import { useCallback, useEffect, useState } from "react";
import { usePersonal } from "@/hooks/use-personal";
import { useToast } from "@/hooks/use-toast";
import type { FoodItem, Meal, MealFoodItem } from "@/lib/types";
import { getBrazilNutritionDateKey } from "@/lib/utils/brazil-nutrition-date";
import {
  createStudentDetailKey,
  useStudentDetailStore,
} from "@/stores/student-detail-store";

export type PersonalStudentDetailTab =
  | "overview"
  | "workouts"
  | "diet"
  | "progress"
  | "records";

export interface PersonalStudentAssignmentForDetail {
  id: string;
  student: {
    id: string;
    avatar?: string | null;
    user?: { id?: string; name?: string | null; email?: string | null } | null;
    profile?: {
      height?: number | null;
      weight?: number | null;
      fitnessLevel?: string | null;
      weeklyWorkoutFrequency?: number | null;
      goals?: string | null;
      targetCalories?: number | null;
      targetProtein?: number | null;
      targetCarbs?: number | null;
      targetFats?: number | null;
      targetWater?: number | null;
    } | null;
    progress?: {
      totalXP?: number;
      xpToNextLevel?: number;
      currentLevel?: number;
      weeklyXP?: number[];
    } | null;
    records?: Array<{
      exerciseName?: string;
      date?: Date | string;
      value?: number;
      type?: string;
    }>;
  };
  gym?: { id: string; name: string } | null;
}

export interface UsePersonalStudentDetailProps {
  studentId: string | null;
  assignment: PersonalStudentAssignmentForDetail | null;
  onBack: () => void;
}

export function usePersonalStudentDetail({
  studentId,
  assignment,
  onBack,
}: UsePersonalStudentDetailProps) {
  const actions = usePersonal("actions");
  const { toast } = useToast();
  const [isRemovingAssignment, setIsRemovingAssignment] = useState(false);
  const [activeTab, setActiveTab] =
    useState<PersonalStudentDetailTab>("overview");
  const [nutritionDate, setNutritionDate] = useState(() =>
    getBrazilNutritionDateKey(),
  );
  const [isNutritionLibraryOpen, setIsNutritionLibraryOpen] = useState(false);
  const detailKey = studentId
    ? createStudentDetailKey("personal", studentId)
    : null;
  const weeklyPlan = useStudentDetailStore((state) =>
    detailKey ? state.weeklyPlans[detailKey] : undefined,
  );
  const dailyNutrition = useStudentDetailStore((state) =>
    detailKey
      ? (state.nutritionByDate[detailKey]?.[nutritionDate] ?? null)
      : null,
  );
  const isLoadingWeeklyPlan = useStudentDetailStore((state) =>
    detailKey ? Boolean(state.weeklyPlanLoading[detailKey]) : false,
  );
  const isLoadingNutrition = useStudentDetailStore((state) =>
    detailKey ? Boolean(state.nutritionLoading[detailKey]) : false,
  );
  const loadWeeklyPlan = useStudentDetailStore((state) => state.loadWeeklyPlan);
  const loadNutrition = useStudentDetailStore((state) => state.loadNutrition);
  const saveNutrition = useStudentDetailStore((state) => state.saveNutrition);
  const saveTargetWater = useStudentDetailStore(
    (state) => state.updateTargetWater,
  );
  const loadActiveNutritionPlan = useStudentDetailStore(
    (state) => state.loadActiveNutritionPlan,
  );
  const loadNutritionLibraryPlans = useStudentDetailStore(
    (state) => state.loadNutritionLibraryPlans,
  );
  const isCurrentNutritionDate = nutritionDate === getBrazilNutritionDateKey();

  const getTargets = useCallback(() => {
    const profile = assignment?.student?.profile;
    return {
      targetCalories: profile?.targetCalories ?? 2000,
      targetProtein: profile?.targetProtein ?? 150,
      targetCarbs: profile?.targetCarbs ?? 250,
      targetFats: profile?.targetFats ?? 65,
      targetWater: dailyNutrition?.targetWater ?? profile?.targetWater ?? 3000,
    };
  }, [assignment?.student?.profile, dailyNutrition?.targetWater]);

  const fetchWeeklyPlan = useCallback(async () => {
    if (!studentId) return;
    await loadWeeklyPlan("personal", studentId);
  }, [studentId, loadWeeklyPlan]);

  const fetchNutrition = useCallback(
    async (date?: string) => {
      if (!studentId) return;
      const resolvedDate = date ?? nutritionDate;
      await loadNutrition("personal", studentId, resolvedDate, getTargets());

      if (resolvedDate === getBrazilNutritionDateKey()) {
        await Promise.allSettled([
          loadActiveNutritionPlan("personal", studentId),
          loadNutritionLibraryPlans("personal", studentId),
        ]);
      }
    },
    [
      studentId,
      nutritionDate,
      loadNutrition,
      getTargets,
      loadActiveNutritionPlan,
      loadNutritionLibraryPlans,
    ],
  );

  const persistNutrition = useCallback(
    async (nextMeals: Meal[], nextWater: number) => {
      if (!studentId || !isCurrentNutritionDate) return;

      await saveNutrition({
        scope: "personal",
        studentId,
        date: nutritionDate,
        meals: nextMeals,
        waterIntake: nextWater,
        targets: getTargets(),
      });
    },
    [
      studentId,
      isCurrentNutritionDate,
      nutritionDate,
      saveNutrition,
      getTargets,
    ],
  );

  const updateTargetWater = useCallback(
    async (targetWater: number) => {
      if (!studentId || !isCurrentNutritionDate) return;

      await saveTargetWater({
        scope: "personal",
        studentId,
        date: nutritionDate,
        targetWater,
      });
    },
    [studentId, isCurrentNutritionDate, nutritionDate, saveTargetWater],
  );

  const applyNutrition = useCallback(
    async (data: { meals: Meal[]; totals: Record<string, number> }) => {
      const nextWater = dailyNutrition?.waterIntake ?? 0;
      await persistNutrition(data.meals, nextWater);
    },
    [dailyNutrition?.waterIntake, persistNutrition],
  );

  const handleMealComplete = useCallback(
    async (mealId: string) => {
      const baseMeals = dailyNutrition?.meals ?? [];
      const updatedMeals = baseMeals.map((meal: Meal) =>
        meal.id === mealId ? { ...meal, completed: !meal.completed } : meal,
      );
      const nextWater = dailyNutrition?.waterIntake ?? 0;
      await persistNutrition(updatedMeals, nextWater);
    },
    [dailyNutrition, persistNutrition],
  );

  const handleAddMealSubmit = useCallback(
    async (
      mealsData: Array<{
        name: string;
        type: Meal["type"];
        time?: string;
      }>,
    ) => {
      const baseMeals = dailyNutrition?.meals ?? [];
      const newMeals: Meal[] = mealsData.map((mealData) => ({
        id: `meal-${Date.now()}-${Math.random()}`,
        name: mealData.name,
        type: mealData.type,
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        completed: false,
        time: mealData.time,
        foods: [],
      }));
      const nextWater = dailyNutrition?.waterIntake ?? 0;
      await persistNutrition([...baseMeals, ...newMeals], nextWater);
    },
    [dailyNutrition, persistNutrition],
  );

  const handleAddFood = useCallback(
    async (
      foods: Array<{ food: FoodItem; servings: number }>,
      mealIds: string[],
    ) => {
      const baseMeals = dailyNutrition?.meals ?? [];
      const updatedMeals = baseMeals.map((meal: Meal) => {
        if (!mealIds.includes(meal.id)) return meal;

        const newFoods: MealFoodItem[] = foods.map(({ food, servings }) => ({
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
        const updatedFoods = [...(meal.foods || []), ...newFoods];
        const totals = newFoods.reduce(
          (sum, foodEntry) => ({
            calories: sum.calories + foodEntry.calories,
            protein: sum.protein + foodEntry.protein,
            carbs: sum.carbs + foodEntry.carbs,
            fats: sum.fats + foodEntry.fats,
          }),
          { calories: 0, protein: 0, carbs: 0, fats: 0 },
        );

        return {
          ...meal,
          foods: updatedFoods,
          calories: meal.calories + totals.calories,
          protein: meal.protein + totals.protein,
          carbs: meal.carbs + totals.carbs,
          fats: meal.fats + totals.fats,
        };
      });
      const nextWater = dailyNutrition?.waterIntake ?? 0;
      await persistNutrition(updatedMeals, nextWater);
    },
    [dailyNutrition, persistNutrition],
  );

  const removeMeal = useCallback(
    async (mealId: string) => {
      const baseMeals = dailyNutrition?.meals ?? [];
      const updatedMeals = baseMeals.filter((meal: Meal) => meal.id !== mealId);
      const nextWater = dailyNutrition?.waterIntake ?? 0;
      await persistNutrition(updatedMeals, nextWater);
    },
    [dailyNutrition, persistNutrition],
  );

  const removeFoodFromMeal = useCallback(
    async (mealId: string, foodId: string) => {
      const baseMeals = dailyNutrition?.meals ?? [];
      const updatedMeals = baseMeals.map((meal: Meal) => {
        if (meal.id !== mealId) return meal;

        const updatedFoods = (meal.foods || []).filter(
          (foodEntry: MealFoodItem) => foodEntry.id !== foodId,
        );
        const totals = updatedFoods.reduce(
          (
            sum: {
              calories: number;
              protein: number;
              carbs: number;
              fats: number;
            },
            foodEntry: MealFoodItem,
          ) => ({
            calories: sum.calories + (foodEntry.calories || 0),
            protein: sum.protein + (foodEntry.protein || 0),
            carbs: sum.carbs + (foodEntry.carbs || 0),
            fats: sum.fats + (foodEntry.fats || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fats: 0 },
        );

        return {
          ...meal,
          foods: updatedFoods,
          calories: totals.calories,
          protein: totals.protein,
          carbs: totals.carbs,
          fats: totals.fats,
        };
      });
      const nextWater = dailyNutrition?.waterIntake ?? 0;
      await persistNutrition(updatedMeals, nextWater);
    },
    [dailyNutrition, persistNutrition],
  );

  const handleToggleWaterGlass = useCallback(
    async (index: number) => {
      const baseMeals = dailyNutrition?.meals ?? [];
      const current = dailyNutrition?.waterIntake ?? 0;
      const glassAmount = 250;
      const nextWater =
        index < current / glassAmount
          ? current - glassAmount
          : current + glassAmount;

      await persistNutrition(baseMeals, nextWater);
    },
    [dailyNutrition, persistNutrition],
  );

  useEffect(() => {
    if (activeTab === "workouts") fetchWeeklyPlan();
  }, [activeTab, fetchWeeklyPlan]);

  useEffect(() => {
    if (activeTab === "diet") {
      void fetchNutrition();
    }
  }, [activeTab, fetchNutrition]);

  const tabOptions = [
    { value: "overview" as const, label: "Visão Geral", emoji: "📊" },
    { value: "workouts" as const, label: "Treinos", emoji: "💪" },
    { value: "diet" as const, label: "Dieta", emoji: "🍎" },
    { value: "progress" as const, label: "Progresso", emoji: "📈" },
    { value: "records" as const, label: "Recordes", emoji: "🏆" },
  ];

  const openWorkoutsEditor = useCallback(() => {
    setActiveTab("workouts");
  }, []);

  const openDietTab = useCallback(() => {
    setActiveTab("diet");
  }, []);

  const handleNutritionPlansSynced = useCallback(async () => {
    if (!studentId) return;
    await Promise.all([
      fetchNutrition(nutritionDate),
      loadActiveNutritionPlan("personal", studentId),
      loadNutritionLibraryPlans("personal", studentId),
    ]);
  }, [
    studentId,
    nutritionDate,
    fetchNutrition,
    loadActiveNutritionPlan,
    loadNutritionLibraryPlans,
  ]);

  const handleRemoveAssignment = useCallback(
    async (sId: string) => {
      setIsRemovingAssignment(true);
      try {
        await actions.removeStudent(sId);
        toast({
          title: "Vínculo removido",
          description: "O aluno foi desvinculado com sucesso.",
        });
        onBack();
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error
            : err instanceof Error
              ? err.message
              : "Erro ao remover vínculo";
        toast({
          variant: "destructive",
          title: "Erro",
          description: String(msg),
        });
      } finally {
        setIsRemovingAssignment(false);
      }
    },
    [actions, toast, onBack],
  );

  return {
    assignment,
    activeTab,
    setActiveTab,
    openWorkoutsEditor,
    openDietTab,
    weeklyPlan,
    dailyNutrition,
    nutritionDate,
    setNutritionDate,
    isLoadingWeeklyPlan,
    isLoadingNutrition,
    fetchWeeklyPlan,
    fetchNutrition,
    handleMealComplete,
    handleAddMealSubmit,
    handleAddFood,
    applyNutrition,
    updateTargetWater,
    removeMeal,
    removeFoodFromMeal,
    handleToggleWaterGlass,
    isNutritionLibraryOpen,
    setIsNutritionLibraryOpen,
    isCurrentNutritionDate,
    handleNutritionPlansSynced,
    onBack,
    tabOptions,
    handleRemoveAssignment,
    isRemovingAssignment,
    studentsApiBase: "/api/personals/students",
  };
}
