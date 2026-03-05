"use server";

import { db } from "@/lib/db";
import { PersonalGymService } from "@/lib/services/personal/personal-gym.service";
import { StudentPersonalService } from "@/lib/services/personal/student-personal.service";
import { getPersonalContext } from "@/lib/utils/personal/personal-context";
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
      gym: a.gym
        ? { id: a.gym.id, name: a.gym.name }
        : null,
    }));
  } catch (error) {
    console.error("[getPersonalStudents] Erro:", error);
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
