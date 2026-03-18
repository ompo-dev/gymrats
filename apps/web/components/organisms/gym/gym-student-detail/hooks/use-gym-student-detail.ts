"use client";

import { useCallback, useEffect, useState } from "react";
import { useGym } from "@/hooks/use-gym";
import { getBrazilNutritionDateKey } from "@/lib/utils/brazil-nutrition-date";
import {
  createStudentDetailKey,
  useStudentDetailStore,
} from "@/stores/student-detail-store";
import type {
  FoodItem,
  Meal,
  MealFoodItem,
  Payment,
  PlanSlotData,
  StudentData,
} from "@/lib/types";

const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export type StudentDetailTab =
  | "overview"
  | "workouts"
  | "diet"
  | "progress"
  | "records"
  | "payments";

export interface UseGymStudentDetailProps {
  student: StudentData | null;
  payments?: Payment[];
  onBack: () => void;
  variant?: "gym" | "personal";
}

const getStudentsApiBase = (variant: "gym" | "personal") =>
  variant === "personal" ? "/api/personals/students" : "/api/gym/students";

export function useGymStudentDetail({
  student,
  payments = [],
  variant = "gym",
}: UseGymStudentDetailProps) {
  const apiBase = getStudentsApiBase(variant);
  const detailScope = variant === "personal" ? "personal" : "gym";
  const detailKey = student?.id
    ? createStudentDetailKey(detailScope, student.id)
    : null;
  const actions = useGym("actions");
  const [studentPayments, setStudentPayments] = useState(payments);
  const [activeTab, setActiveTab] = useState<StudentDetailTab>("overview");
  const [membershipStatus, setMembershipStatus] = useState<
    "active" | "inactive" | "suspended" | "canceled"
  >(student?.membershipStatus ?? "inactive");
  const [nutritionDate, setNutritionDate] = useState(() =>
    getBrazilNutritionDateKey(),
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isEditWeeklyPlanOpen, setIsEditWeeklyPlanOpen] = useState(false);
  const [isNutritionLibraryOpen, setIsNutritionLibraryOpen] = useState(false);

  const weeklyPlan = useStudentDetailStore((state) =>
    detailKey ? state.weeklyPlans[detailKey] : undefined,
  );
  const dailyNutrition = useStudentDetailStore((state) =>
    detailKey ? (state.nutritionByDate[detailKey]?.[nutritionDate] ?? null) : null,
  );
  const isLoadingWeeklyPlan = useStudentDetailStore((state) =>
    detailKey ? Boolean(state.weeklyPlanLoading[detailKey]) : false,
  );
  const isLoadingNutrition = useStudentDetailStore((state) =>
    detailKey ? Boolean(state.nutritionLoading[detailKey]) : false,
  );
  const isAssigningPersonal = useStudentDetailStore((state) =>
    student?.id ? Boolean(state.assigningPersonal[student.id]) : false,
  );
  const loadWeeklyPlan = useStudentDetailStore((state) => state.loadWeeklyPlan);
  const createStudentWeeklyPlan = useStudentDetailStore(
    (state) => state.createWeeklyPlan,
  );
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
  const assignPersonal = useStudentDetailStore((state) => state.assignPersonal);
  const isCurrentNutritionDate = nutritionDate === getBrazilNutritionDateKey();

  useEffect(() => {
    setStudentPayments((current) => {
      if (
        current.length === payments.length &&
        current.every(
          (entry, index) =>
            entry.id === payments[index]?.id &&
            entry.status === payments[index]?.status &&
            entry.amount === payments[index]?.amount,
        )
      ) {
        return current;
      }

      return payments;
    });
  }, [payments]);

  useEffect(() => {
    setMembershipStatus(student?.membershipStatus ?? "inactive");
  }, [student?.membershipStatus]);

  const getTargets = useCallback(() => {
    const profile = student?.profile;
    return {
      targetCalories: profile?.targetCalories ?? 2000,
      targetProtein: profile?.targetProtein ?? 150,
      targetCarbs: profile?.targetCarbs ?? 250,
      targetFats: profile?.targetFats ?? 65,
      targetWater: dailyNutrition?.targetWater ?? profile?.targetWater ?? 3000,
    };
  }, [student?.profile, dailyNutrition?.targetWater]);

  const fetchWeeklyPlan = useCallback(async () => {
    if (!student?.id) return;
    await loadWeeklyPlan(detailScope, student.id);
  }, [student?.id, detailScope, loadWeeklyPlan]);

  const fetchNutrition = useCallback(
    async (date?: string) => {
      if (!student?.id) return;
      const resolvedDate = date ?? nutritionDate;
      await loadNutrition(detailScope, student.id, resolvedDate, getTargets());

      if (resolvedDate === getBrazilNutritionDateKey()) {
        await Promise.allSettled([
          loadActiveNutritionPlan(detailScope, student.id),
          loadNutritionLibraryPlans(detailScope, student.id),
        ]);
      }
    },
    [
      student?.id,
      nutritionDate,
      detailScope,
      loadNutrition,
      getTargets,
      loadActiveNutritionPlan,
      loadNutritionLibraryPlans,
    ],
  );

  const persistNutrition = useCallback(
    async (nextMeals: Meal[], nextWater: number) => {
      if (!student?.id || !isCurrentNutritionDate) return;
      try {
        await saveNutrition({
          scope: detailScope,
          studentId: student.id,
          date: nutritionDate,
          meals: nextMeals,
          waterIntake: nextWater,
          targets: getTargets(),
        });
      } catch (error) {
        console.error("[GymStudentDetail] Erro ao salvar nutrição:", error);
      }
    },
    [
      student?.id,
      isCurrentNutritionDate,
      detailScope,
      nutritionDate,
      saveNutrition,
      getTargets,
    ],
  );

  const updateTargetWater = useCallback(
    async (targetWater: number) => {
      if (!student?.id || !isCurrentNutritionDate) return;
      try {
        await saveTargetWater({
          scope: detailScope,
          studentId: student.id,
          date: nutritionDate,
          targetWater,
        });
      } catch (error) {
        console.error("[GymStudentDetail] Erro ao salvar meta de água:", error);
      }
    },
    [
      student?.id,
      isCurrentNutritionDate,
      detailScope,
      nutritionDate,
      saveTargetWater,
    ],
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
            sum: { calories: number; protein: number; carbs: number; fats: number },
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
        index < current / glassAmount ? current - glassAmount : current + glassAmount;
      await persistNutrition(baseMeals, nextWater);
    },
    [dailyNutrition, persistNutrition],
  );

  useEffect(() => {
    if (activeTab === "workouts" && student?.id) {
      fetchWeeklyPlan();
    }
  }, [activeTab, student?.id, fetchWeeklyPlan]);

  useEffect(() => {
    if (activeTab === "diet" && student?.id) {
      void fetchNutrition();
    }
  }, [activeTab, student?.id, fetchNutrition]);

  const handleMembershipAction = async (
    action: "suspended" | "canceled" | "active",
  ) => {
    const membershipId = student?.gymMembership?.id;
    if (!membershipId) return;
    setIsUpdatingStatus(true);
    try {
      await actions.updateMemberStatus(membershipId, action);
      setMembershipStatus(action);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const togglePaymentStatus = async (paymentId: string) => {
    const payment = studentPayments.find((entry) => entry.id === paymentId);
    if (!payment) return;

    const newStatus = payment.status === "paid" ? "pending" : "paid";

    setStudentPayments((prev) =>
      prev.map((entry) =>
        entry.id === paymentId
          ? {
              ...entry,
              status: newStatus,
              date: newStatus === "paid" ? new Date() : entry.date,
            }
          : entry,
      ),
    );

    try {
      await actions.updatePaymentStatus(paymentId, newStatus);
    } catch {
      setStudentPayments((prev) =>
        prev.map((entry) => (entry.id === paymentId ? payment : entry)),
      );
    }
  };

  const handleAssignPersonal = async (personalId: string) => {
    if (!student?.id || !personalId.trim() || variant === "personal") return;
    await assignPersonal(student.id, personalId.trim());
  };

  const tabOptions = [
    { value: "overview", label: "Visão Geral", emoji: "📊" },
    { value: "workouts", label: "Treinos", emoji: "💪" },
    { value: "diet", label: "Dieta", emoji: "🍎" },
    { value: "progress", label: "Progresso", emoji: "📈" },
    { value: "records", label: "Recordes", emoji: "🏆" },
    { value: "payments", label: "Pagamentos", emoji: "💳" },
  ];

  const openWorkoutsEditor = () => {
    setActiveTab("workouts");
    setIsEditWeeklyPlanOpen(true);
  };

  const openDietTab = () => {
    setActiveTab("diet");
  };

  const handleNutritionPlansSynced = useCallback(async () => {
    if (!student?.id) return;
    await Promise.all([
      fetchNutrition(nutritionDate),
      loadActiveNutritionPlan(detailScope, student.id),
      loadNutritionLibraryPlans(detailScope, student.id),
    ]);
  }, [
    detailScope,
    fetchNutrition,
    loadActiveNutritionPlan,
    loadNutritionLibraryPlans,
    nutritionDate,
    student?.id,
  ]);

  const createWeeklyPlan = useCallback(async () => {
    if (!student?.id) return;
    await createStudentWeeklyPlan(detailScope, student.id);
  }, [student?.id, detailScope, createStudentWeeklyPlan]);

  return {
    student,
    studentPayments,
    activeTab,
    setActiveTab,
    isEditWeeklyPlanOpen,
    setIsEditWeeklyPlanOpen,
    membershipStatus,
    isUpdatingStatus,
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
    handleMembershipAction,
    handleAssignPersonal,
    isAssigningPersonal,
    togglePaymentStatus,
    tabOptions,
    DAY_NAMES,
    openWorkoutsEditor,
    openDietTab,
    isNutritionLibraryOpen,
    setIsNutritionLibraryOpen,
    isCurrentNutritionDate,
    handleNutritionPlansSynced,
    createWeeklyPlan,
    studentsApiBase: apiBase,
  };
}

export type { PlanSlotData };
