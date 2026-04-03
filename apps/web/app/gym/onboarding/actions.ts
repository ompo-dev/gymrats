"use server";

import { executeWebMutationAction } from "@/lib/actions/web-actions";
import { getApiErrorMessage } from "@/lib/api/server-action-utils";
import type { GymOnboardingData } from "./steps/types";

export async function submitNewGym(formData: GymOnboardingData) {
  try {
    return await executeWebMutationAction<{
      success: boolean;
      gymId?: string;
      error?: string;
    }>({
      path: "/api/gyms/onboarding",
      method: "POST",
      body: {
        ...formData,
        createAdditional: true,
      },
    });
  } catch (error) {
    console.error("Erro ao criar nova academia:", error);
    return {
      success: false,
      error: getApiErrorMessage(error, "Erro ao criar nova academia"),
    };
  }
}

export async function submitGymOnboarding(formData: GymOnboardingData) {
  try {
    return await executeWebMutationAction<{
      success: boolean;
      gymId?: string;
      error?: string;
    }>({
      path: "/api/gyms/onboarding",
      method: "POST",
      body: formData,
    });
  } catch (error) {
    console.error("Erro ao salvar perfil da academia:", error);
    return {
      success: false,
      error: getApiErrorMessage(error, "Erro ao salvar perfil da academia"),
    };
  }
}
