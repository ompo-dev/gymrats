"use server";

import { backendGet, backendPost } from "@/lib/api/backend-client";
import { mockUnits, mockUserProgress } from "@/lib/mock-data";
import { mockGymLocations } from "@/lib/gym-mock-data";

type ApiSuccess<T> = { success: true } & T;

export async function getCurrentUserInfo() {
  try {
    const response = await backendGet<ApiSuccess<{ user: { role: string } }>>(
      "/api/auth/session"
    );

    const role = response?.user?.role ?? null;
    return {
      isAdmin: role === "ADMIN",
      role,
    };
  } catch (error) {
    console.error("[getCurrentUserInfo] Erro ao buscar sessão:", error);
    return { isAdmin: false, role: null };
  }
}

export async function getStudentProfile() {
  try {
    const response = await backendGet<
      ApiSuccess<{ hasProfile?: boolean; profile?: unknown }>
    >("/api/students/profile");

    return {
      hasProfile: response?.hasProfile ?? false,
      profile: response?.profile ?? null,
    };
  } catch (error) {
    console.error("[getStudentProfile] Erro ao buscar perfil:", error);
    return { hasProfile: false, profile: null };
  }
}

export async function getStudentProgress() {
  try {
    const response = await backendGet<ApiSuccess<Record<string, unknown>>>(
      "/api/students/progress"
    );

    const { success, ...progress } = response || { success: false };
    if (!success) {
      return mockUserProgress;
    }

    return progress;
  } catch (error) {
    console.error("[getStudentProgress] Erro ao buscar progresso:", error);
    return mockUserProgress;
  }
}

export async function getStudentUnits() {
  try {
    const response = await backendGet<ApiSuccess<{ units?: unknown[] }>>(
      "/api/workouts/units"
    );

    if (!response?.units) {
      return mockUnits;
    }

    return response.units;
  } catch (error) {
    console.error("[getStudentUnits] Erro ao buscar units:", error);
    return mockUnits;
  }
}

export async function getGymLocations() {
  try {
    const response = await backendGet<ApiSuccess<{ gyms?: any[] }>>(
      "/api/gyms/locations"
    );

    if (!response?.gyms) {
      return mockGymLocations;
    }

    return response.gyms.map((gym) => ({
      id: gym.id,
      name: gym.name,
      logo: gym.logo || undefined,
      address: gym.address,
      coordinates: {
        lat: gym.latitude || 0,
        lng: gym.longitude || 0,
      },
      rating: gym.rating || 0,
      totalReviews: gym.totalReviews || 0,
      plans: {
        daily: 0,
        weekly: 0,
        monthly: 0,
      },
      amenities: [],
      openNow: true,
      openingHours: {
        open: "06:00",
        close: "22:00",
      },
      photos: Array.isArray(gym.photos) ? gym.photos : undefined,
      isPartner: !!gym.isPartner,
    }));
  } catch (error) {
    console.error("[getGymLocations] Erro ao buscar academias:", error);
    return mockGymLocations;
  }
}

export async function getStudentSubscription() {
  try {
    const response = await backendGet<ApiSuccess<Record<string, unknown>>>(
      "/api/subscriptions/current"
    );

    if (!response?.success) {
      return null;
    }

    const { success, ...subscription } = response;
    return subscription;
  } catch (error) {
    console.error("[getStudentSubscription] Erro ao buscar assinatura:", error);
    return null;
  }
}

export async function startStudentTrial() {
  try {
    const response = await backendPost<ApiSuccess<Record<string, unknown>>>(
      "/api/subscriptions/start-trial",
      {}
    );

    return response;
  } catch (error) {
    console.error("[startStudentTrial] Erro ao iniciar trial:", error);
    return { error: "Erro ao iniciar trial" };
  }
}
