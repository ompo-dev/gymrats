"use server";

import {
  serverApiDelete,
  serverApiGet,
  serverApiPatch,
  serverApiPost,
} from "@/lib/api/server";
import {
  buildApiPath,
  getApiErrorMessage,
  reviveDate,
} from "@/lib/api/server-action-utils";
import { log } from "@/lib/observability/logger";
import type {
  BoostCampaign,
  Coupon,
  Expense,
  FinancialSummary,
  Payment,
  StudentData,
} from "@/lib/types";
import type {
  PersonalAffiliation,
  PersonalProfile,
  PersonalStudentAssignment,
  PersonalSubscriptionData,
} from "./types";

export interface PersonalMembershipPlan {
  id: string;
  personalId: string;
  name: string;
  description?: string | null;
  type: string;
  price: number;
  duration: number;
  benefits?: string[] | string | null;
  isActive: boolean;
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

function reviveSubscription(
  subscription: PersonalSubscriptionData | null,
): PersonalSubscriptionData | null {
  if (!subscription) {
    return null;
  }

  return {
    ...subscription,
    currentPeriodStart: reviveDate(subscription.currentPeriodStart) as Date,
    currentPeriodEnd: reviveDate(subscription.currentPeriodEnd) as Date,
    canceledAt: (reviveDate(subscription.canceledAt) as Date | null) ?? null,
  };
}

export async function getPersonalProfile(): Promise<PersonalProfile | null> {
  try {
    const payload = await serverApiGet<{
      personal: (PersonalProfile & { subscription?: unknown }) | null;
    }>("/api/personals");

    if (!payload.personal) {
      return null;
    }

    return {
      id: payload.personal.id,
      name: payload.personal.name,
      email: payload.personal.email,
      bio: payload.personal.bio,
      phone: payload.personal.phone,
      address: payload.personal.address,
      cref: payload.personal.cref,
      pixKey: payload.personal.pixKey,
      pixKeyType: payload.personal.pixKeyType,
      atendimentoPresencial: payload.personal.atendimentoPresencial,
      atendimentoRemoto: payload.personal.atendimentoRemoto,
    };
  } catch (error) {
    log.error("[getPersonalProfile] Erro", { error });
    return null;
  }
}

export async function getPersonalAffiliations(): Promise<
  PersonalAffiliation[]
> {
  try {
    const payload = await serverApiGet<{
      affiliations: Array<{
        id: string;
        gym: {
          id: string;
          name: string;
          image?: string | null;
          logo?: string | null;
        };
      }>;
    }>("/api/personals/affiliations");

    return payload.affiliations.map((affiliation) => ({
      id: affiliation.id,
      gym: {
        id: affiliation.gym.id,
        name: affiliation.gym.name,
        image: affiliation.gym.image ?? null,
        logo: affiliation.gym.logo ?? null,
      },
    }));
  } catch (error) {
    log.error("[getPersonalAffiliations] Erro", { error });
    return [];
  }
}

export async function getPersonalStudents(
  gymId?: string,
): Promise<StudentData[]> {
  try {
    const payload = await serverApiGet<{ students: StudentData[] }>(
      buildApiPath("/api/personals/students/student-data", { gymId }),
    );
    return payload.students;
  } catch (error) {
    log.error("[getPersonalStudents] Erro", { error, gymId });
    return [];
  }
}

export async function getPersonalStudentAssignments(
  gymId?: string,
): Promise<PersonalStudentAssignment[]> {
  try {
    const payload = await serverApiGet<{
      students: Array<{
        id: string;
        student: {
          id: string;
          avatar?: string | null;
          user?: {
            id: string;
            name?: string | null;
            email?: string | null;
          } | null;
        };
        gym?: { id: string; name: string } | null;
      }>;
    }>(buildApiPath("/api/personals/students", { gymId }));

    return payload.students.map((assignment) => ({
      id: assignment.id,
      student: {
        id: assignment.student.id,
        avatar: assignment.student.avatar ?? null,
        user: assignment.student.user ?? null,
      },
      gym: assignment.gym ?? null,
    }));
  } catch (error) {
    log.error("[getPersonalStudentAssignments] Erro", { error, gymId });
    return [];
  }
}

export async function getPersonalStudentsAsStudentData(): Promise<
  StudentData[]
> {
  return getPersonalStudents();
}

export async function getPersonalStudentById(
  studentId: string,
): Promise<StudentData | null> {
  try {
    const payload = await serverApiGet<{ student: StudentData }>(
      `/api/personals/students/${studentId}/student-data`,
    );
    return payload.student;
  } catch (error) {
    log.error("[getPersonalStudentById] Erro", { error, studentId });
    return null;
  }
}

export async function getPersonalStudentPayments(
  _studentId: string,
): Promise<Payment[]> {
  return [];
}

export async function getPersonalFinancialSummary(): Promise<FinancialSummary | null> {
  try {
    const payload = await serverApiGet<{
      financialSummary: FinancialSummary | null;
    }>("/api/personals/financial-summary");
    return payload.financialSummary;
  } catch (error) {
    log.error("[getPersonalFinancialSummary] Erro", { error });
    return null;
  }
}

export async function getPersonalExpenses(): Promise<Expense[]> {
  try {
    const payload = await serverApiGet<{ expenses: Expense[] }>(
      "/api/personals/expenses",
    );
    return reviveExpenses(payload.expenses);
  } catch (error) {
    log.error("[getPersonalExpenses] Erro", { error });
    return [];
  }
}

export async function getPersonalCoupons(): Promise<Coupon[]> {
  try {
    const payload = await serverApiGet<{ coupons: Coupon[] }>(
      "/api/personals/coupons",
    );
    return reviveCoupons(payload.coupons);
  } catch (error) {
    log.error("[getPersonalCoupons] Erro", { error });
    return [];
  }
}

export async function createPersonalCoupon(data: {
  code: string;
  notes: string;
  discountKind: "PERCENTAGE" | "FIXED";
  discount: number;
  maxRedeems?: number;
  expiresAt?: Date | string | null;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    return await serverApiPost<{ success: true }>(
      "/api/personals/coupons",
      data,
    );
  } catch (error) {
    log.error("[createPersonalCoupon] Erro", { error, data });
    return {
      success: false,
      error: getApiErrorMessage(error, "Erro ao criar cupom"),
    };
  }
}

export async function getPersonalPayments(): Promise<Payment[]> {
  try {
    const payload = await serverApiGet<{ payments: Payment[] }>(
      "/api/personals/payments",
    );
    return revivePayments(payload.payments);
  } catch (error) {
    log.error("[getPersonalPayments] Erro", { error });
    return [];
  }
}

export async function deletePersonalCoupon(
  couponId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    return await serverApiDelete<{ success: true }>(
      buildApiPath("/api/personals/coupons", { couponId }),
    );
  } catch (error) {
    log.error("[deletePersonalCoupon] Erro", { error, couponId });
    return {
      success: false,
      error: getApiErrorMessage(error, "Erro ao excluir cupom"),
    };
  }
}

export async function getPersonalBoostCampaigns(): Promise<BoostCampaign[]> {
  try {
    const payload = await serverApiGet<{ campaigns: BoostCampaign[] }>(
      "/api/personals/boost-campaigns",
    );
    return reviveCampaigns(payload.campaigns);
  } catch (error) {
    log.error("[getPersonalBoostCampaigns] Erro", { error });
    return [];
  }
}

export async function createPersonalBoostCampaign(data: {
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
    >("/api/personals/boost-campaigns", data);
  } catch (error) {
    log.error("[createPersonalBoostCampaign] Erro", { error, data });
    return {
      success: false,
      error: getApiErrorMessage(error, "Erro interno ao criar campanha"),
    } as const;
  }
}

export async function deletePersonalBoostCampaign(
  campaignId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    return await serverApiDelete<{ success: true }>(
      buildApiPath("/api/personals/boost-campaigns", { campaignId }),
    );
  } catch (error) {
    log.error("[deletePersonalBoostCampaign] Erro", { error, campaignId });
    return {
      success: false,
      error: getApiErrorMessage(error, "Erro ao excluir campanha"),
    };
  }
}

export async function getPersonalBoostCampaignPix(campaignId: string): Promise<
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
    >(`/api/personals/boost-campaigns/${campaignId}/pix`);
  } catch (error) {
    log.error("[getPersonalBoostCampaignPix] Erro", { error, campaignId });
    return {
      success: false,
      error: getApiErrorMessage(error, "Erro ao gerar PIX"),
    };
  }
}

export async function getPersonalMembershipPlans(): Promise<
  PersonalMembershipPlan[]
> {
  try {
    const payload = await serverApiGet<{ plans: PersonalMembershipPlan[] }>(
      "/api/personals/membership-plans",
    );
    return payload.plans;
  } catch (error) {
    log.error("[getPersonalMembershipPlans] Erro", { error });
    return [];
  }
}

export async function createPersonalMembershipPlan(
  data: Omit<PersonalMembershipPlan, "id" | "isActive" | "personalId">,
) {
  const payload = await serverApiPost<{ plan: PersonalMembershipPlan }>(
    "/api/personals/membership-plans",
    data,
  );
  return payload.plan;
}

export async function updatePersonalMembershipPlan(
  planId: string,
  data: Partial<Omit<PersonalMembershipPlan, "id" | "personalId">>,
) {
  const payload = await serverApiPatch<{ plan: PersonalMembershipPlan }>(
    `/api/personals/membership-plans/${planId}`,
    data,
  );
  return payload.plan;
}

export async function deletePersonalMembershipPlan(planId: string) {
  await serverApiDelete<{ success: true }>(
    `/api/personals/membership-plans/${planId}`,
  );
}

export async function getPersonalSubscription(): Promise<PersonalSubscriptionData | null> {
  try {
    const payload = await serverApiGet<{
      subscription: PersonalSubscriptionData | null;
    }>("/api/personals/subscription");
    return reviveSubscription(payload.subscription);
  } catch (error) {
    log.error("[getPersonalSubscription] Erro", { error });
    return null;
  }
}
