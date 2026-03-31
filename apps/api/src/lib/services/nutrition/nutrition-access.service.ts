import { db } from "@/lib/db";

type NutritionLibraryPlanSummary = {
  id: string;
  studentId: string;
  isLibraryTemplate: boolean;
  createdById: string | null;
  creatorType: string | null;
};

export class NutritionAccessError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function getNutritionLibraryPlanSummary(
  planId: string,
): Promise<NutritionLibraryPlanSummary> {
  const plan = await db.nutritionPlan.findUnique({
    where: { id: planId },
    select: {
      id: true,
      studentId: true,
      isLibraryTemplate: true,
      createdById: true,
      creatorType: true,
    },
  });

  if (!plan) {
    throw new NutritionAccessError(
      "NUTRITION_PLAN_NOT_FOUND",
      "Plano de alimentacao nao encontrado",
    );
  }

  return plan;
}

export async function assertGymStudentAccess(gymId: string, studentId: string) {
  const membership = await db.gymMembership.findFirst({
    where: { gymId, studentId },
    select: { id: true },
  });

  if (!membership) {
    throw new NutritionAccessError(
      "STUDENT_ACCESS_FORBIDDEN",
      "Aluno nao encontrado ou nao pertence a esta academia",
    );
  }
}

export async function assertPersonalStudentAccess(
  personalId: string,
  studentId: string,
) {
  const assignment = await db.studentPersonalAssignment.findFirst({
    where: {
      studentId,
      personalId,
      status: "active",
    },
    select: { id: true },
  });

  if (!assignment) {
    throw new NutritionAccessError(
      "STUDENT_ACCESS_FORBIDDEN",
      "Aluno nao encontrado ou nao esta atribuido a voce",
    );
  }
}

export async function assertStudentCanManageNutritionLibraryPlan(
  studentId: string,
  planId: string,
) {
  const plan = await getNutritionLibraryPlanSummary(planId);

  if (!plan.isLibraryTemplate) {
    throw new NutritionAccessError(
      "NUTRITION_PLAN_NOT_LIBRARY",
      "Plano nao esta na biblioteca",
    );
  }

  if (plan.studentId !== studentId) {
    throw new NutritionAccessError(
      "NUTRITION_PLAN_FORBIDDEN",
      "Sem permissao para gerenciar o plano de outro aluno",
    );
  }

  return plan;
}

export async function assertGymCanManageNutritionLibraryPlan(
  gymId: string,
  planId: string,
) {
  const plan = await getNutritionLibraryPlanSummary(planId);

  if (!plan.isLibraryTemplate) {
    throw new NutritionAccessError(
      "NUTRITION_PLAN_NOT_LIBRARY",
      "Plano nao esta na biblioteca",
    );
  }

  if (plan.creatorType !== "GYM" || plan.createdById !== gymId) {
    throw new NutritionAccessError(
      "NUTRITION_PLAN_FORBIDDEN",
      "Sem permissao para gerenciar o plano desta academia",
    );
  }

  return plan;
}

export async function assertPersonalCanManageNutritionLibraryPlan(
  personalId: string,
  planId: string,
) {
  const plan = await getNutritionLibraryPlanSummary(planId);

  if (!plan.isLibraryTemplate) {
    throw new NutritionAccessError(
      "NUTRITION_PLAN_NOT_LIBRARY",
      "Plano nao esta na biblioteca",
    );
  }

  if (plan.creatorType === "PERSONAL" && plan.createdById === personalId) {
    return plan;
  }

  if (plan.creatorType === "GYM" && plan.createdById) {
    const affiliation = await db.gymPersonalAffiliation.findFirst({
      where: {
        personalId,
        gymId: plan.createdById,
      },
      select: { id: true },
    });

    if (affiliation) {
      return plan;
    }
  }

  throw new NutritionAccessError(
    "NUTRITION_PLAN_FORBIDDEN",
    "Sem permissao para gerenciar este plano",
  );
}

export function isNutritionAccessError(error: unknown, code: string) {
  return error instanceof NutritionAccessError && error.code === code;
}

export function getNutritionAccessErrorMessage(error: unknown) {
  if (error instanceof NutritionAccessError) {
    return error.message;
  }

  return "Unexpected nutrition access error";
}
