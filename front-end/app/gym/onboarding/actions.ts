"use server";

import type { GymOnboardingData } from "./steps/types";
import { backendPost } from "@/lib/api/backend-client";

function buildFullAddress(formData: GymOnboardingData) {
  return formData.addressNumber
    ? `${formData.address}, ${formData.addressNumber}, ${formData.city}, ${formData.state} - ${formData.zipCode}`
    : `${formData.address}, ${formData.city}, ${formData.state} - ${formData.zipCode}`;
}

export async function submitNewGym(formData: GymOnboardingData) {
  try {
    const response = await backendPost<Record<string, unknown>>("/api/gyms/create", {
      name: formData.name,
      address: buildFullAddress(formData),
      phone: formData.phone,
      email: formData.email,
      cnpj: formData.cnpj || null,
    });

    if ((response as { success?: boolean }).success) {
      return { success: true };
    }

    return {
      success: false,
      error: (response as { error?: string }).error || "Erro ao criar academia",
    };
  } catch (error: any) {
    console.error("[submitNewGym] Erro:", error);
    return { success: false, error: error.message || "Erro ao criar academia" };
  }
}

export async function submitGymOnboarding(formData: GymOnboardingData) {
  return submitNewGym(formData);
}
