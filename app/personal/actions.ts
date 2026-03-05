"use server";

import { db } from "@/lib/db";
import { PersonalFinancialService } from "@/lib/services/personal/personal-financial.service";
import { PersonalGymService } from "@/lib/services/personal/personal-gym.service";
import { StudentPersonalService } from "@/lib/services/personal/student-personal.service";
import { getPersonalContext } from "@/lib/utils/personal/personal-context";
import type {
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
    return affiliations.map((a) => ({
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
    return assignments.map((a) => ({
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
    return PersonalFinancialService.getCoupons(ctx.personalId);
  } catch (error) {
    console.error("[getPersonalCoupons] Erro:", error);
    return [];
  }
}

export async function getPersonalSubscription(): Promise<PersonalSubscriptionData | null> {
  try {
    const { ctx, errorResponse } = await getPersonalContext();
    if (errorResponse || !ctx) return null;
    const sub = await db.personalSubscription.findUnique({
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
