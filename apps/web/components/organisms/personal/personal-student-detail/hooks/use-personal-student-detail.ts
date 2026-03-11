"use client";

import { useCallback, useEffect, useState } from "react";
import { usePersonal } from "@/hooks/use-personal";
import {
  createStudentDetailKey,
  useStudentDetailStore,
} from "@/stores/student-detail-store";
import { useToast } from "@/hooks/use-toast";

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
  const { actions, loaders } = usePersonal("actions", "loaders");
  const { toast } = useToast();
  const [isRemovingAssignment, setIsRemovingAssignment] = useState(false);
  const [activeTab, setActiveTab] =
    useState<PersonalStudentDetailTab>("overview");
  const [nutritionDate, setNutritionDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const detailKey = studentId
    ? createStudentDetailKey("personal", studentId)
    : null;
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
  const loadWeeklyPlan = useStudentDetailStore((state) => state.loadWeeklyPlan);
  const loadNutrition = useStudentDetailStore((state) => state.loadNutrition);

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
    },
    [studentId, nutritionDate, loadNutrition, getTargets],
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

  const handleRemoveAssignment = useCallback(
    async (sId: string) => {
      setIsRemovingAssignment(true);
      try {
        await actions.removeStudent(sId);
        await loaders.loadSection("students");
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
    [actions, loaders, toast, onBack],
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
    onBack,
    tabOptions,
    handleRemoveAssignment,
    isRemovingAssignment,
  };
}
