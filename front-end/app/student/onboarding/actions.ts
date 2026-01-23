"use server";

import type { OnboardingData } from "./steps/types";
import { validateOnboarding } from "./schemas";
import { backendPost } from "@/lib/api/backend-client";

export async function submitOnboarding(formData: OnboardingData) {
  try {
    const validation = validateOnboarding({
      age: typeof formData.age === "number" ? formData.age : undefined,
      gender: formData.gender || undefined,
      isTrans: formData.isTrans,
      usesHormones: formData.usesHormones,
      hormoneType: formData.hormoneType || undefined,
      height: typeof formData.height === "number" ? formData.height : undefined,
      weight: typeof formData.weight === "number" ? formData.weight : undefined,
      fitnessLevel: formData.fitnessLevel || undefined,
      goals: formData.goals,
      weeklyWorkoutFrequency: formData.weeklyWorkoutFrequency,
      workoutDuration: formData.workoutDuration,
      gymType: formData.gymType || undefined,
      preferredSets: formData.preferredSets,
      preferredRepRange: formData.preferredRepRange,
      restTime: formData.restTime,
      targetCalories: formData.targetCalories,
      targetProtein: formData.targetProtein,
      targetCarbs: formData.targetCarbs,
      targetFats: formData.targetFats,
      activityLevel:
        typeof formData.activityLevel === "number"
          ? formData.activityLevel
          : undefined,
      hormoneTreatmentDuration:
        typeof formData.hormoneTreatmentDuration === "number"
          ? formData.hormoneTreatmentDuration
          : undefined,
      physicalLimitations: formData.physicalLimitations || [],
      motorLimitations: formData.motorLimitations || [],
      medicalConditions: formData.medicalConditions || [],
      limitationDetails: formData.limitationDetails || undefined,
      dailyAvailableHours: formData.dailyAvailableHours,
      bmr: formData.bmr,
      tdee: formData.tdee,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError?.message || "Dados inválidos",
      };
    }

    const response = await backendPost<Record<string, unknown>>(
      "/api/students/profile",
      validation.data
    );

    if (response && (response as { success?: boolean }).success) {
      return { success: true };
    }

    const errorMessage =
      (response as { error?: string })?.error || "Erro ao salvar perfil";
    return { success: false, error: errorMessage };
  } catch (error: any) {
    console.error("Erro ao salvar perfil:", error);
    return { success: false, error: error.message || "Erro ao salvar perfil" };
  }
}
