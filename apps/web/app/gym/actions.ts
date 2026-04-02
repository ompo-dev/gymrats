"use server";

import { serverApiDelete, serverApiGet, serverApiPost } from "@/lib/api/server";
import {
  buildApiPath,
  getApiErrorMessage,
  reviveDate,
} from "@/lib/api/server-action-utils";
import { log } from "@/lib/observability/logger";
import type {
  BoostCampaign,
  CheckIn,
  Coupon,
  Equipment,
  Expense,
  FinancialSummary,
  GymProfile,
  GymStats,
  Payment,
  StudentData,
} from "@/lib/types";
import {
  normalizeEquipmentItem,
  normalizeEquipmentList,
} from "@/lib/utils/gym/normalize-equipment";

type SessionPayload = {
  user?: {
    role?: string | null;
  };
};

type BalanceWithdraws = {
  balanceReais: number;
  balanceCents: number;
  withdraws: Array<{
    id: string;
    amount: number;
    pixKey: string;
    pixKeyType: string;
    externalId: string;
    status: string;
    createdAt: Date | string;
    completedAt: Date | string | null;
  }>;
};

function reviveGymProfile(profile: GymProfile | null): GymProfile | null {
  if (!profile) {
    return null;
  }

  return {
    ...profile,
    createdAt: reviveDate(profile.createdAt) as Date,
  };
}

function reviveCheckIns(checkIns: CheckIn[]): CheckIn[] {
  return checkIns.map((checkIn) => ({
    ...checkIn,
    timestamp: reviveDate(checkIn.timestamp) as Date,
    checkOut:
      (reviveDate(checkIn.checkOut) as Date | null | undefined) ?? undefined,
  }));
}

function revivePayments(payments: Payment[]): Payment[] {
  return payments.map((payment) => ({
    ...payment,
    date: reviveDate(payment.date) as Date,
    dueDate: reviveDate(payment.dueDate) as Date,
    withdrawnAt:
      (reviveDate(payment.withdrawnAt) as Date | null | undefined) ?? undefined,
  }));
}

function reviveExpenses(expenses: Expense[]): Expense[] {
  return expenses.map((expense) => ({
    ...expense,
    date: reviveDate(expense.date) as Date,
  }));
}

function reviveCoupons(coupons: Coupon[]): Coupon[] {
  return coupons.map((coupon) => ({
    ...coupon,
    expiryDate: reviveDate(coupon.expiryDate) as Date,
  }));
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

function reviveBalanceWithdraws(data: BalanceWithdraws): BalanceWithdraws {
  return {
    ...data,
    withdraws: data.withdraws.map((withdraw) => ({
      ...withdraw,
      createdAt: reviveDate(withdraw.createdAt) as Date,
      completedAt: (reviveDate(withdraw.completedAt) as Date | null) ?? null,
    })),
  };
}

function reviveGymSubscription(
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
    log.error("[getCurrentUserInfo] Erro", { error });
    return { isAdmin: false, role: null };
  }
}

export async function getGymProfile(): Promise<GymProfile | null> {
  try {
    const payload = await serverApiGet<{ profile: GymProfile | null }>(
      "/api/gyms/profile",
    );
    return reviveGymProfile(payload.profile);
  } catch (error) {
    log.error("[getGymProfile] Erro", { error });
    return null;
  }
}

export async function getGymEquipment(): Promise<Equipment[]> {
  try {
    const payload = await serverApiGet<{ equipment: Equipment[] }>(
      "/api/gyms/equipment",
    );
    return normalizeEquipmentList(payload.equipment);
  } catch (error) {
    log.error("[getGymEquipment] Erro", { error });
    return [];
  }
}

export async function getGymEquipmentById(
  equipmentId: string,
): Promise<Equipment | null> {
  try {
    const payload = await serverApiGet<{ equipment: Equipment }>(
      `/api/gyms/equipment/${equipmentId}`,
    );
    return normalizeEquipmentItem(payload.equipment);
  } catch (error) {
    log.error("[getGymEquipmentById] Erro", { error, equipmentId });
    return null;
  }
}

export async function getGymMembershipPlans() {
  try {
    const payload = await serverApiGet<{ plans: unknown[] }>("/api/gyms/plans");
    return payload.plans;
  } catch (error) {
    log.error("[getGymMembershipPlans] Erro", { error });
    return [];
  }
}

export async function getGymStudents(): Promise<StudentData[]> {
  try {
    const payload = await serverApiGet<{ students: StudentData[] }>(
      "/api/gyms/students",
    );
    return payload.students;
  } catch (error) {
    log.error("[getGymStudents] Erro", { error });
    return [];
  }
}

export async function getGymRecentCheckIns(): Promise<CheckIn[]> {
  try {
    const payload = await serverApiGet<{ checkIns: CheckIn[] }>(
      "/api/gyms/checkins/recent",
    );
    return reviveCheckIns(payload.checkIns);
  } catch (error) {
    log.error("[getGymRecentCheckIns] Erro", { error });
    return [];
  }
}

export async function getGymStudentById(
  studentId: string,
): Promise<StudentData | null> {
  try {
    const payload = await serverApiGet<{ student: StudentData }>(
      `/api/gyms/students/${studentId}`,
    );
    return payload.student;
  } catch (error) {
    log.error("[getGymStudentById] Erro", { error, studentId });
    return null;
  }
}

export async function getGymFinancialSummary(): Promise<FinancialSummary | null> {
  try {
    const payload = await serverApiGet<{ summary: FinancialSummary | null }>(
      "/api/gyms/financial-summary",
    );
    return payload.summary;
  } catch (error) {
    log.error("[getGymFinancialSummary] Erro", { error });
    return null;
  }
}

export async function getGymStudentPayments(
  studentId: string,
): Promise<Payment[]> {
  try {
    const payload = await serverApiGet<{ payments: Payment[] }>(
      buildApiPath("/api/gyms/payments", { studentId }),
    );
    return revivePayments(payload.payments);
  } catch (error) {
    log.error("[getGymStudentPayments] Erro", { error, studentId });
    return [];
  }
}

export async function getGymPayments(): Promise<Payment[]> {
  try {
    const payload = await serverApiGet<{ payments: Payment[] }>(
      "/api/gyms/payments",
    );
    return revivePayments(payload.payments);
  } catch (error) {
    log.error("[getGymPayments] Erro", { error });
    return [];
  }
}

export async function getGymExpenses(): Promise<Expense[]> {
  try {
    const payload = await serverApiGet<{ expenses: Expense[] }>(
      "/api/gyms/expenses",
    );
    return reviveExpenses(payload.expenses);
  } catch (error) {
    log.error("[getGymExpenses] Erro", { error });
    return [];
  }
}

export async function getGymStats(): Promise<GymStats | null> {
  try {
    const payload = await serverApiGet<{ stats: GymStats | null }>(
      "/api/gyms/stats",
    );
    return payload.stats;
  } catch (error) {
    log.error("[getGymStats] Erro", { error });
    return null;
  }
}

export async function getGymCoupons(): Promise<Coupon[]> {
  try {
    const payload = await serverApiGet<{ coupons: Coupon[] }>(
      "/api/gyms/coupons",
    );
    return reviveCoupons(payload.coupons);
  } catch (error) {
    log.error("[getGymCoupons] Erro", { error });
    return [];
  }
}

export async function createGymCoupon(data: {
  code: string;
  notes: string;
  discountKind: "PERCENTAGE" | "FIXED";
  discount: number;
  maxRedeems?: number;
  expiresAt?: Date | string | null;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    return await serverApiPost<{ success: true }>("/api/gyms/coupons", data);
  } catch (error) {
    log.error("[createGymCoupon] Erro", { error, data });
    return {
      success: false,
      error: getApiErrorMessage(error, "Erro ao criar cupom"),
    };
  }
}

export async function getGymBoostCampaigns() {
  try {
    const payload = await serverApiGet<{ campaigns: BoostCampaign[] }>(
      "/api/gyms/boost-campaigns",
    );
    return reviveCampaigns(payload.campaigns);
  } catch (error) {
    log.error("[getGymBoostCampaigns] Erro", { error });
    return [];
  }
}

export async function createBoostCampaign(data: {
  title: string;
  description: string;
  primaryColor: string;
  linkedCouponId: string | null;
  linkedPlanId: string | null;
  durationHours: number;
  amountCents: number;
  radiusKm?: number;
}) {
  try {
    return await serverApiPost<
      | {
          success: true;
          brCode: string;
          brCodeBase64: string;
          amount: number;
          pixId: string;
          campaignId: string;
          expiresAt?: string;
        }
      | { success: false; error: string }
    >("/api/gyms/boost-campaigns", data);
  } catch (error) {
    log.error("[createBoostCampaign] Erro", { error, data });
    return {
      success: false,
      error: getApiErrorMessage(error, "Erro interno ao criar campanha"),
    } as const;
  }
}

export async function getGymReferrals() {
  return [];
}

export async function deleteGymCoupon(
  couponId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    return await serverApiDelete<{ success: true }>(
      buildApiPath("/api/gyms/coupons", { couponId }),
    );
  } catch (error) {
    log.error("[deleteGymCoupon] Erro", { error, couponId });
    return {
      success: false,
      error: getApiErrorMessage(error, "Erro ao excluir cupom"),
    };
  }
}

export async function deleteBoostCampaign(
  campaignId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    return await serverApiDelete<{ success: true }>(
      buildApiPath("/api/gyms/boost-campaigns", { campaignId }),
    );
  } catch (error) {
    log.error("[deleteBoostCampaign] Erro", { error, campaignId });
    return {
      success: false,
      error: getApiErrorMessage(error, "Erro ao excluir campanha"),
    };
  }
}

export async function getBoostCampaignPix(campaignId: string): Promise<
  | {
      success: true;
      brCode: string;
      brCodeBase64: string;
      amount: number;
      pixId: string;
      expiresAt?: string;
    }
  | { success: false; error: string }
> {
  try {
    return await serverApiGet<
      | {
          success: true;
          brCode: string;
          brCodeBase64: string;
          amount: number;
          pixId: string;
          expiresAt?: string;
        }
      | { success: false; error: string }
    >(`/api/gyms/boost-campaigns/${campaignId}/pix`);
  } catch (error) {
    log.error("[getBoostCampaignPix] Erro", { error, campaignId });
    return {
      success: false,
      error: getApiErrorMessage(error, "Erro ao gerar PIX"),
    };
  }
}

export async function getGymBalanceWithdraws(): Promise<BalanceWithdraws> {
  try {
    const payload = await serverApiGet<BalanceWithdraws>("/api/gyms/withdraws");
    return reviveBalanceWithdraws(payload);
  } catch (error) {
    log.error("[getGymBalanceWithdraws] Erro", { error });
    return { balanceReais: 0, balanceCents: 0, withdraws: [] };
  }
}

export async function createGymWithdraw(data: {
  amountCents: number;
  fake?: boolean;
}): Promise<
  | { success: true; withdraw: { id: string; amount: number; status: string } }
  | { success: false; error: string }
> {
  try {
    return await serverApiPost<
      | {
          success: true;
          withdraw: { id: string; amount: number; status: string };
        }
      | { success: false; error: string }
    >("/api/gyms/withdraws", data);
  } catch (error) {
    log.error("[createGymWithdraw] Erro", { error, data });
    return {
      success: false,
      error: getApiErrorMessage(error, "Erro ao criar saque"),
    };
  }
}

export async function getGymSubscription() {
  try {
    const payload = await serverApiGet<{
      subscription: Record<string, unknown> | null;
      isFirstPayment?: boolean;
    }>("/api/gym-subscriptions/current");

    return reviveGymSubscription(payload.subscription, payload.isFirstPayment);
  } catch (error) {
    log.error("[getGymSubscription] Erro", { error });
    return null;
  }
}

export async function startGymTrial() {
  try {
    const payload = await serverApiPost<Record<string, unknown>>(
      "/api/gym-subscriptions/start-trial",
    );
    return { success: true, ...payload };
  } catch (error) {
    log.error("[startGymTrial] Erro", { error });
    return {
      error: getApiErrorMessage(error, "Erro ao iniciar trial"),
    };
  }
}

export async function syncGymSubscriptionPrices() {
  try {
    return await serverApiPost<
      { success: true; updated: boolean; message?: string } | { error: string }
    >("/api/gym-subscriptions/sync-prices");
  } catch (error) {
    log.error("[syncGymSubscriptionPrices] Erro", { error });
    return {
      error: getApiErrorMessage(error, "Erro ao sincronizar precos"),
    };
  }
}
