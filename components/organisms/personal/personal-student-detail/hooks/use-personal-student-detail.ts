"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  DailyNutrition,
  WeeklyPlanData,
} from "@/lib/types";

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
  const [activeTab, setActiveTab] =
    useState<PersonalStudentDetailTab>("overview");
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

  const fetchWeeklyPlan = useCallback(async () => {
    if (!studentId) return;
    setIsLoadingWeeklyPlan(true);
    try {
      const res = await fetch(
        `/api/personals/students/${studentId}/weekly-plan`,
      );
      const data = await res.json();
      if (data.success && data.weeklyPlan) {
        setWeeklyPlan(data.weeklyPlan);
      } else {
        setWeeklyPlan(null);
      }
    } catch {
      setWeeklyPlan(null);
    } finally {
      setIsLoadingWeeklyPlan(false);
    }
  }, [studentId]);

  const fetchNutrition = useCallback(
    async (date?: string) => {
      if (!studentId) return;
      const d = date ?? nutritionDate;
      setIsLoadingNutrition(true);
      try {
        const res = await fetch(
          `/api/personals/students/${studentId}/nutrition?date=${d}`,
        );
        const data = await res.json();
        if (data.success) {
          setDailyNutrition({
            date: data.date,
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
    [studentId, nutritionDate],
  );

  useEffect(() => {
    if (activeTab === "workouts") fetchWeeklyPlan();
  }, [activeTab, fetchWeeklyPlan]);

  useEffect(() => {
    if (activeTab === "diet") fetchNutrition();
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
    onBack,
    tabOptions,
  };
}
