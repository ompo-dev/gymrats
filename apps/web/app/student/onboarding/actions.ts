"use server";

import { serverApiPost } from "@/lib/api/server";
import { getApiErrorMessage } from "@/lib/api/server-action-utils";
import { validateOnboarding } from "./schemas";
import type { OnboardingData } from "./steps/types";

const ONBOARDING_DEFAULTS = {
  gymType: "academia-completa" as const,
  preferredSets: 3,
  preferredRepRange: "hipertrofia" as const,
  restTime: "medio" as const,
};

export async function submitOnboarding(formData: OnboardingData) {
  try {
    const normalizedData = {
      ...formData,
      gymType: formData.gymType || ONBOARDING_DEFAULTS.gymType,
      preferredSets:
        formData.preferredSets ?? ONBOARDING_DEFAULTS.preferredSets,
      preferredRepRange:
        formData.preferredRepRange || ONBOARDING_DEFAULTS.preferredRepRange,
      restTime: formData.restTime || ONBOARDING_DEFAULTS.restTime,
    };

    const validation = validateOnboarding({
      age:
        typeof normalizedData.age === "number" ? normalizedData.age : undefined,
      gender: normalizedData.gender || undefined,
      isTrans: normalizedData.isTrans,
      usesHormones: normalizedData.usesHormones,
      hormoneType: normalizedData.hormoneType || undefined,
      height:
        typeof normalizedData.height === "number"
          ? normalizedData.height
          : undefined,
      weight:
        typeof normalizedData.weight === "number"
          ? normalizedData.weight
          : undefined,
      fitnessLevel: normalizedData.fitnessLevel || undefined,
      goals: normalizedData.goals,
      weeklyWorkoutFrequency: normalizedData.weeklyWorkoutFrequency,
      workoutDuration: normalizedData.workoutDuration,
      gymType: normalizedData.gymType || undefined,
      preferredSets: normalizedData.preferredSets,
      preferredRepRange: normalizedData.preferredRepRange,
      restTime: normalizedData.restTime,
      targetCalories: normalizedData.targetCalories,
      targetProtein: normalizedData.targetProtein,
      targetCarbs: normalizedData.targetCarbs,
      targetFats: normalizedData.targetFats,
      activityLevel:
        typeof normalizedData.activityLevel === "number"
          ? normalizedData.activityLevel
          : undefined,
      hormoneTreatmentDuration:
        typeof normalizedData.hormoneTreatmentDuration === "number"
          ? normalizedData.hormoneTreatmentDuration
          : undefined,
      physicalLimitations: normalizedData.physicalLimitations || [],
      motorLimitations: normalizedData.motorLimitations || [],
      medicalConditions: normalizedData.medicalConditions || [],
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError?.message || "Dados invalidos",
      };
    }

    return await serverApiPost<{ success: boolean; error?: string }>(
      "/api/students/onboarding",
      normalizedData,
    );
  } catch (error) {
    console.error("Erro no onboarding:", error);
    return {
      success: false,
      error: getApiErrorMessage(error, "Erro ao salvar perfil"),
    };
  }
}
