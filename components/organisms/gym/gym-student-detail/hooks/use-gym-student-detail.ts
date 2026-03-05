"use client";

import { useCallback, useEffect, useState } from "react";
import { useGym } from "@/hooks/use-gym";
import { apiClient } from "@/lib/api/client";
import type {
  DailyNutrition,
  FoodItem,
  Meal,
  MealFoodItem,
  Payment,
  PlanSlotData,
  StudentData,
  WeeklyPlanData,
} from "@/lib/types";

const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const API_TIMEOUT_MS = 35000;

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
  onBack,
  variant = "gym",
}: UseGymStudentDetailProps) {
  const apiBase = getStudentsApiBase(variant);
  const actions = useGym("actions");
  const [studentPayments, setStudentPayments] = useState(payments);
  const [activeTab, setActiveTab] = useState<StudentDetailTab>("overview");
  const [membershipStatus, setMembershipStatus] = useState<
    "active" | "inactive" | "suspended" | "canceled"
  >(student?.membershipStatus ?? "inactive");

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [isAssigningPersonal, setIsAssigningPersonal] = useState(false);
  const [weeklyPlan, setWeeklyPlan] = useState<
    WeeklyPlanData | null | undefined
  >(undefined);
  const [dailyNutrition, setDailyNutrition] = useState<DailyNutrition | null>(
    null,
  );
  const [nutritionDate, setNutritionDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [isLoadingWeeklyPlan, setIsLoadingWeeklyPlan] = useState(false);
  const [isLoadingNutrition, setIsLoadingNutrition] = useState(false);
  const [isEditWeeklyPlanOpen, setIsEditWeeklyPlanOpen] = useState(false);

  const fetchWeeklyPlan = useCallback(async () => {
    if (!student?.id) return;
    setIsLoadingWeeklyPlan(true);
    try {
      const { data } = await apiClient.get<{
        success?: boolean;
        weeklyPlan?: WeeklyPlanData;
      }>(`${apiBase}/${student.id}/weekly-plan`, {
        timeout: API_TIMEOUT_MS,
      });
      if (data?.success && data?.weeklyPlan) {
        setWeeklyPlan(data.weeklyPlan);
      } else {
        setWeeklyPlan(null);
      }
    } catch {
      setWeeklyPlan(null);
    } finally {
      setIsLoadingWeeklyPlan(false);
    }
  }, [student?.id, apiBase]);

  const fetchNutrition = useCallback(
    async (date?: string) => {
      if (!student?.id) return;
      const d = date ?? nutritionDate;
      setIsLoadingNutrition(true);
      try {
        const { data } = await apiClient.get<{
          success?: boolean;
          date?: string;
          meals?: Meal[];
          totalCalories?: number;
          totalProtein?: number;
          totalCarbs?: number;
          totalFats?: number;
          waterIntake?: number;
          targetCalories?: number;
          targetProtein?: number;
          targetCarbs?: number;
          targetFats?: number;
          targetWater?: number;
        }>(`${apiBase}/${student.id}/nutrition?date=${d}`, {
          timeout: API_TIMEOUT_MS,
        });
        if (data?.success) {
          setDailyNutrition({
            date: data.date ?? d,
            meals: data.meals ?? [],
            totalCalories: data.totalCalories ?? 0,
            totalProtein: data.totalProtein ?? 0,
            totalCarbs: data.totalCarbs ?? 0,
            totalFats: data.totalFats ?? 0,
            waterIntake: data.waterIntake ?? 0,
            targetCalories: data.targetCalories ?? 2000,
            targetProtein: data.targetProtein ?? 150,
            targetCarbs: data.targetCarbs ?? 250,
            targetFats: data.targetFats ?? 65,
            targetWater: data.targetWater ?? 3000,
          });
        } else {
          setDailyNutrition(null);
        }
      } catch {
        setDailyNutrition(null);
      } finally {
        setIsLoadingNutrition(false);
      }
    },
    [student?.id, nutritionDate, apiBase],
  );

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

  const calculateTotalsFromCompletedMeals = useCallback((meals: Meal[]) => {
    const completedMeals = meals.filter((meal) => meal.completed === true);
    return {
      totalCalories: completedMeals.reduce(
        (sum, meal) => sum + (meal.calories || 0),
        0,
      ),
      totalProtein: completedMeals.reduce(
        (sum, meal) => sum + (meal.protein || 0),
        0,
      ),
      totalCarbs: completedMeals.reduce(
        (sum, meal) => sum + (meal.carbs || 0),
        0,
      ),
      totalFats: completedMeals.reduce((sum, meal) => sum + (meal.fats || 0), 0),
    };
  }, []);

  const persistNutrition = useCallback(
    async (nextMeals: Meal[], nextWater: number) => {
      if (!student?.id) return;
      const totals = calculateTotalsFromCompletedMeals(nextMeals);
      const targets = getTargets();
      const nextNutrition: DailyNutrition = {
        date: nutritionDate,
        meals: nextMeals,
        waterIntake: nextWater,
        ...totals,
        ...targets,
      };
      setDailyNutrition(nextNutrition);
      try {
        await apiClient.post(
          `${apiBase}/${student.id}/nutrition`,
          {
            date: nutritionDate,
            meals: nextMeals,
            waterIntake: nextWater,
          },
          { timeout: API_TIMEOUT_MS },
        );
      } catch (error) {
        console.error("[GymStudentDetail] Erro ao salvar nutrição:", error);
      }
    },
    [student?.id, nutritionDate, calculateTotalsFromCompletedMeals, getTargets, apiBase],
  );

  const updateTargetWater = useCallback(
    async (targetWater: number) => {
      if (!student?.id) return;
      const normalized = Math.max(0, Math.round(targetWater));
      try {
        await apiClient.post(
          `${apiBase}/${student.id}/nutrition`,
          { targetWater: normalized },
          { timeout: API_TIMEOUT_MS },
        );
        setDailyNutrition((prev) =>
          prev ? { ...prev, targetWater: normalized } : prev,
        );
      } catch (error) {
        console.error("[GymStudentDetail] Erro ao salvar meta de água:", error);
      }
    },
    [student?.id, apiBase],
  );

  const applyNutrition = useCallback(
    async (data: { meals: Meal[]; totals: Record<string, number> }) => {
      const nextWater = dailyNutrition?.waterIntake ?? 0;
      await persistNutrition(data.meals, nextWater);
    },
    [dailyNutrition, persistNutrition],
  );

  const handleMealComplete = useCallback(
    async (mealId: string) => {
      const baseMeals = dailyNutrition?.meals ?? [];
      const updatedMeals = baseMeals.map((meal) =>
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
      const updatedMeals = baseMeals.map((meal) => {
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
          (sum, f) => ({
            calories: sum.calories + f.calories,
            protein: sum.protein + f.protein,
            carbs: sum.carbs + f.carbs,
            fats: sum.fats + f.fats,
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
      const updatedMeals = baseMeals.filter((meal) => meal.id !== mealId);
      const nextWater = dailyNutrition?.waterIntake ?? 0;
      await persistNutrition(updatedMeals, nextWater);
    },
    [dailyNutrition, persistNutrition],
  );

  const removeFoodFromMeal = useCallback(
    async (mealId: string, foodId: string) => {
      const baseMeals = dailyNutrition?.meals ?? [];
      const updatedMeals = baseMeals.map((meal) => {
        if (meal.id !== mealId) return meal;
        const updatedFoods = (meal.foods || []).filter(
          (food) => food.id !== foodId,
        );
        const totals = updatedFoods.reduce(
          (sum, food) => ({
            calories: sum.calories + (food.calories || 0),
            protein: sum.protein + (food.protein || 0),
            carbs: sum.carbs + (food.carbs || 0),
            fats: sum.fats + (food.fats || 0),
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
      fetchNutrition();
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
    const payment = studentPayments.find((p) => p.id === paymentId);
    if (!payment) return;

    const newStatus = payment.status === "paid" ? "pending" : "paid";

    setStudentPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: newStatus,
              date: newStatus === "paid" ? new Date() : p.date,
            }
          : p,
      ),
    );

    try {
      await actions.updatePaymentStatus(paymentId, newStatus);
    } catch {
      setStudentPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? payment : p)),
      );
    }
  };

  const handleAssignPersonal = async (personalId: string) => {
    if (!student?.id || !personalId.trim() || variant === "personal") return;
    setIsAssigningPersonal(true);
    try {
      await apiClient.post(
        `/api/gym/students/${student.id}/assign-personal`,
        { personalId: personalId.trim() },
        { timeout: API_TIMEOUT_MS },
      );
    } catch {
      throw new Error("Não foi possível atribuir o personal");
    } finally {
      setIsAssigningPersonal(false);
    }
  };

  const handleUnassignStudent = useCallback(async () => {
    if (!student?.id || variant !== "personal") return;
    setIsUnassigning(true);
    try {
      await apiClient.post(
        `/api/personals/students/${student.id}/unassign`,
        {},
        { timeout: API_TIMEOUT_MS },
      );
      onBack();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ??
        (err instanceof Error ? err.message : "Erro ao desvincular");
      alert(msg);
    } finally {
      setIsUnassigning(false);
    }
  }, [student?.id, variant, onBack]);

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

  const createWeeklyPlan = useCallback(async () => {
    if (!student?.id) return;
    try {
      await apiClient.post(
        `${apiBase}/${student.id}/weekly-plan`,
        {},
        { timeout: API_TIMEOUT_MS },
      );
      await fetchWeeklyPlan();
    } catch {
      // Erro ao criar plano - fetchWeeklyPlan pode ser chamado para refresh
    }
  }, [student?.id, apiBase, fetchWeeklyPlan]);

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
    handleUnassignStudent,
    isUnassigning,
    togglePaymentStatus,
    tabOptions,
    DAY_NAMES,
    openWorkoutsEditor,
    openDietTab,
    createWeeklyPlan,
    studentsApiBase: apiBase,
  };
}

export type { PlanSlotData };
