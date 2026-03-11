"use server";

import type { BoostCampaign, GymLocation } from "@/lib/types";
import { serverApiGet, serverApiPost } from "@/lib/api/server";
import {
  getApiErrorMessage,
  reviveDate,
} from "@/lib/api/server-action-utils";

type SessionPayload = {
  user?: {
    role?: string | null;
  };
};

type StudentProfilePayload = {
  hasProfile: boolean;
  profile: Record<string, unknown> | null;
};

type StudentSubscriptionPayload = {
  subscription: Record<string, unknown> | null;
  isFirstPayment?: boolean;
};

function getNeutralProgress() {
  return {
    currentStreak: 0,
    longestStreak: 0,
    totalXP: 0,
    currentLevel: 1,
    xpToNextLevel: 100,
    workoutsCompleted: 0,
    todayXP: 0,
    achievements: [],
    lastActivityDate: new Date().toISOString(),
    dailyGoalXP: 50,
    weeklyXP: [0, 0, 0, 0, 0, 0, 0],
  };
}

function reviveCampaigns(campaigns: BoostCampaign[]): BoostCampaign[] {
  return campaigns.map((campaign) => ({
    ...campaign,
    startsAt: (reviveDate(campaign.startsAt) as Date | null) ?? null,
    endsAt: (reviveDate(campaign.endsAt) as Date | null) ?? null,
    createdAt: reviveDate(campaign.createdAt) as Date,
    updatedAt: reviveDate(campaign.updatedAt) as Date,
  }));
}

function reviveSubscription(
  subscription: Record<string, unknown> | null,
  isFirstPayment?: boolean,
) {
  if (!subscription) {
    return null;
  }

  return {
    ...subscription,
    currentPeriodStart: reviveDate(
      subscription.currentPeriodStart as string | Date | null | undefined,
    ),
    currentPeriodEnd: reviveDate(
      subscription.currentPeriodEnd as string | Date | null | undefined,
    ),
    trialStart: reviveDate(
      subscription.trialStart as string | Date | null | undefined,
    ),
    trialEnd: reviveDate(
      subscription.trialEnd as string | Date | null | undefined,
    ),
    canceledAt: reviveDate(
      subscription.canceledAt as string | Date | null | undefined,
    ),
    isFirstPayment:
      (subscription.isFirstPayment as boolean | undefined) ?? isFirstPayment,
  };
}

export async function getCurrentUserInfo() {
  try {
    const payload = await serverApiGet<SessionPayload>("/api/auth/session");

    return {
      isAdmin: payload.user?.role === "ADMIN",
      role: payload.user?.role ?? null,
    };
  } catch (error) {
    console.error("[getCurrentUserInfo] Erro:", error);
    return { isAdmin: false, role: null };
  }
}

export async function getStudentProfile() {
  try {
    const payload = await serverApiGet<StudentProfilePayload>(
      "/api/students/profile",
    );

    return {
      hasProfile: payload.hasProfile,
      profile: payload.profile,
    };
  } catch (error) {
    console.error("[getStudentProfile] Erro:", error);
    return { hasProfile: false, profile: null };
  }
}

export async function getStudentProgress() {
  try {
    return await serverApiGet<ReturnType<typeof getNeutralProgress>>(
      "/api/students/progress",
    );
  } catch (error) {
    console.error("[getStudentProgress] Erro:", error);
    return getNeutralProgress();
  }
}

export async function getStudentUnits() {
  try {
    const payload = await serverApiGet<{ units: unknown[] }>("/api/workouts/units");
    return payload.units;
  } catch (error) {
    console.error("[getStudentUnits] Erro:", error);
    return [];
  }
}

export async function getGymLocations(): Promise<GymLocation[]> {
  try {
    const payload = await serverApiGet<{ gyms: GymLocation[] }>(
      "/api/gyms/locations",
    );
    return payload.gyms;
  } catch (error) {
    console.error("[getGymLocations] Erro:", error);
    return [];
  }
}

export async function getActiveBoostCampaigns() {
  try {
    const payload = await serverApiGet<{ campaigns: BoostCampaign[] }>(
      "/api/boost-campaigns/nearby",
    );
    return reviveCampaigns(payload.campaigns);
  } catch (error) {
    console.error("[getActiveBoostCampaigns] Erro:", error);
    return [];
  }
}

export async function getStudentSubscription() {
  try {
    const payload = await serverApiGet<StudentSubscriptionPayload>(
      "/api/students/subscription",
    );
    return reviveSubscription(payload.subscription, payload.isFirstPayment);
  } catch (error) {
    console.error("[getStudentSubscription] Erro:", error);
    return null;
  }
}

export async function startStudentTrial() {
  try {
    const payload = await serverApiPost<{ message?: string }>(
      "/api/subscriptions/start-trial",
    );
    return { success: true, ...payload };
  } catch (error) {
    console.error("[startStudentTrial] Erro:", error);
    return {
      error: getApiErrorMessage(error, "Erro ao iniciar trial"),
    };
  }
}
