"use server";

import { db } from "@/lib/db";
import { PersonalFinancialService } from "@/lib/services/personal/personal-financial.service";
import { PersonalGymService } from "@/lib/services/personal/personal-gym.service";
import { StudentPersonalService } from "@/lib/services/personal/student-personal.service";
import { getPersonalContext } from "@/lib/utils/personal/personal-context";
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
  type: string; // Changed from "monthly" | "quarterly" | "semi-annual" | "annual" | "trial" to string
  price: number;
  duration: number;
  benefits?: string[] | string | null; // Changed from string | null to string[] | string | null
  isActive: boolean;
}

export async function getPersonalProfile(): Promise<PersonalProfile | null> {
  try {
    const { ctx, errorResponse } = await getPersonalContext();
    if (errorResponse || !ctx) return null;
    const personal = await db.personal.findUnique({
      where: { id: ctx.personalId },
    });
    if (!personal) return null;
    return {
      id: personal.id,
      name: personal.name,
      email: personal.email,
      bio: personal.bio,
      phone: personal.phone,
      address: (personal as any).address,
      cref: (personal as any).cref,
      pixKey: (personal as any).pixKey,
      pixKeyType: (personal as any).pixKeyType,
      atendimentoPresencial: personal.atendimentoPresencial,
      atendimentoRemoto: personal.atendimentoRemoto,
    };
  } catch (error) {
    console.error("[getPersonalProfile] Erro:", error);
    return null;
  }
}

export async function getPersonalAffiliations(): Promise<
  PersonalAffiliation[]
> {
  try {
    const { ctx, errorResponse } = await getPersonalContext();
    if (errorResponse || !ctx) return [];
    const affiliations = await PersonalGymService.listPersonalGyms(
      ctx.personalId,
    );
    return (affiliations as any[]).map((a: any) => ({
      id: a.id,
      gym: {
        id: a.gym.id,
        name: a.gym.name,
        image: a.gym.image ?? null,
        logo: a.gym.logo ?? null,
      },
    }));
  } catch (error) {
    console.error("[getPersonalAffiliations] Erro:", error);
    return [];
  }
}

export async function getPersonalStudents(
  gymId?: string,
): Promise<StudentData[]> {
  try {
    const { ctx, errorResponse } = await getPersonalContext();
    if (errorResponse || !ctx) return [];
    return StudentPersonalService.listStudentsAsStudentData(
      ctx.personalId,
      gymId,
    );
  } catch (error) {
    console.error("[getPersonalStudents] Erro:", error);
    return [];
  }
}

export async function getPersonalStudentAssignments(
  gymId?: string,
): Promise<PersonalStudentAssignment[]> {
  try {
    const { ctx, errorResponse } = await getPersonalContext();
    if (errorResponse || !ctx) return [];
    const assignments = await StudentPersonalService.listStudentsByPersonal(
      ctx.personalId,
      gymId,
    );
    return (assignments as any[]).map((a: any) => ({
      id: a.id,
      student: {
        id: a.student.id,
        avatar: a.student.avatar ?? null,
        user: a.student.user
          ? {
              id: a.student.user.id,
              name: a.student.user.name ?? null,
              email: a.student.user.email ?? null,
            }
          : null,
      },
      gym: a.gym ? { id: a.gym.id, name: a.gym.name } : null,
    }));
  } catch (error) {
    console.error("[getPersonalStudentAssignments] Erro:", error);
    return [];
  }
}

export async function getPersonalStudentsAsStudentData(): Promise<StudentData[]> {
  try {
    const { ctx, errorResponse } = await getPersonalContext();
    if (errorResponse || !ctx) return [];
    return StudentPersonalService.listStudentsAsStudentData(ctx.personalId);
  } catch (error) {
    console.error("[getPersonalStudentsAsStudentData] Erro:", error);
    return [];
  }
}

export async function getPersonalStudentById(
  studentId: string,
): Promise<StudentData | null> {
  try {
    const { ctx, errorResponse } = await getPersonalContext();
    if (errorResponse || !ctx) return null;
    return StudentPersonalService.getStudentByIdAsStudentData(
      ctx.personalId,
      studentId,
    );
  } catch (error) {
    console.error("[getPersonalStudentById] Erro:", error);
    return null;
  }
}

export async function getPersonalStudentPayments(
  _studentId: string,
): Promise<Payment[]> {
  try {
    await getPersonalContext();
    return [];
  } catch (error) {
    console.error("[getPersonalStudentPayments] Erro:", error);
    return [];
  }
}

export async function getPersonalFinancialSummary(): Promise<FinancialSummary | null> {
  try {
    const { ctx, errorResponse } = await getPersonalContext();
    if (errorResponse || !ctx) return null;
    return PersonalFinancialService.getFinancialSummary(ctx.personalId);
  } catch (error) {
    console.error("[getPersonalFinancialSummary] Erro:", error);
    return null;
  }
}

export async function getPersonalExpenses(): Promise<Expense[]> {
  try {
    const { ctx, errorResponse } = await getPersonalContext();
    if (errorResponse || !ctx) return [];
    return PersonalFinancialService.getExpenses(ctx.personalId);
  } catch (error) {
    console.error("[getPersonalExpenses] Erro:", error);
    return [];
  }
}

export async function getPersonalCoupons(): Promise<Coupon[]> {
  try {
    const { ctx, errorResponse } = await getPersonalContext();
    if (errorResponse || !ctx) return [];
    return (await PersonalFinancialService.getCoupons(
      ctx.personalId,
    )) as unknown as Coupon[];
  } catch (error) {
    console.error("[getPersonalCoupons] Erro:", error);
    return [];
  }
}

export async function createPersonalCoupon(data: {
  code: string;
  notes: string;
  discountKind: "PERCENTAGE" | "FIXED";
  discount: number;
  maxRedeems?: number;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { ctx, errorResponse } = await getPersonalContext();
    if (errorResponse || !ctx)
      return { success: false, error: "Não autenticado" };

    const code = data.code.trim().toUpperCase();
    const discountType =
      data.discountKind === "PERCENTAGE" ? "percentage" : "fixed";

    const existing = await db.personalCoupon.findFirst({
      where: { personalId: ctx.personalId, code },
    });
    if (existing)
      return { success: false, error: "Cupom com esse código já existe" };

    await db.personalCoupon.create({
      data: {
        personalId: ctx.personalId,
        code,
        notes: data.notes || code,
        discountType,
        discountValue: data.discount,
        maxUses: data.maxRedeems ?? -1,
        isActive: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[createPersonalCoupon] Erro:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao criar cupom",
    };
  }
}

export async function getPersonalPayments(): Promise<Payment[]> {
  try {
    const { ctx, errorResponse } = await getPersonalContext();
    if (errorResponse || !ctx) return [];
    return await PersonalFinancialService.getPayments(ctx.personalId) as unknown as Payment[];
  } catch (error) {
    console.error("[getPersonalPayments] Erro:", error);
    return [];
  }
}

export async function getPersonalBoostCampaigns(): Promise<BoostCampaign[]> {
  // Retornar array vazio por enquanto (Personal ainda não tem campanhas de Ads ativas no Prisma model)
  // Se for adicionar no futuro, bastaria adicionar à PersonalFinancialService
  return [];
}

export async function getPersonalMembershipPlans(): Promise<PersonalMembershipPlan[]> {
  try {
    const { ctx, errorResponse } = await getPersonalContext();
    if (errorResponse || !ctx) return [];
    return await PersonalFinancialService.getMembershipPlans(ctx.personalId);
  } catch (error) {
    console.error("[getPersonalMembershipPlans] Erro:", error);
    return [];
  }
}

export async function createPersonalMembershipPlan(
  data: Omit<PersonalMembershipPlan, "id" | "isActive" | "personalId">,
) {
  const { ctx, errorResponse } = await getPersonalContext();
  if (errorResponse || !ctx) throw new Error("Não autorizado");

  const parsedBenefits = Array.isArray(data.benefits)
    ? JSON.stringify(data.benefits)
    : data.benefits;

    const plan = await (db as any).personalMembershipPlan.create({
    data: {
      personalId: ctx.personalId,
      name: data.name,
      description: data.description,
      type: data.type,
      price: data.price,
      duration: data.duration,
      benefits: parsedBenefits,
      isActive: true,
    },
  });
  return plan;
}

export async function updatePersonalMembershipPlan(
  planId: string,
  data: Partial<Omit<PersonalMembershipPlan, "id" | "personalId">>,
) {
  const { ctx, errorResponse } = await getPersonalContext();
  if (errorResponse || !ctx) throw new Error("Não autorizado");

  const updateData: any = { ...data };
  if (data.benefits !== undefined) {
    updateData.benefits = Array.isArray(data.benefits)
      ? JSON.stringify(data.benefits)
      : data.benefits;
  }

  const plan = await (db as any).personalMembershipPlan.update({
    where: { id: planId, personalId: ctx.personalId },
    data: updateData,
  });
  return plan;
}

export async function deletePersonalMembershipPlan(planId: string) {
  const { ctx, errorResponse } = await getPersonalContext();
  if (errorResponse || !ctx) throw new Error("Não autorizado");

  await (db as any).personalMembershipPlan.update({
    where: { id: planId, personalId: ctx.personalId },
    data: { isActive: false },
  });
}

export async function getPersonalSubscription(): Promise<PersonalSubscriptionData | null> {
  try {
    const { ctx, errorResponse } = await getPersonalContext();
    if (errorResponse || !ctx) return null;
    const sub = await (db as any).personalSubscription.findUnique({
      where: { personalId: ctx.personalId },
    });
    if (!sub) return null;
    return {
      id: sub.id,
      plan: sub.plan,
      status: sub.status,
      basePrice: sub.basePrice,
      effectivePrice: sub.effectivePrice ?? null,
      discountPercent: sub.discountPercent ?? null,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? undefined,
      canceledAt: sub.canceledAt ?? null,
    };
  } catch (error) {
    console.error("[getPersonalSubscription] Erro:", error);
    return null;
  }
}
