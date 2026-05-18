import type { AuthResult } from "@/lib/api/middleware/auth.middleware";
import { db } from "@/lib/db";

type SupportedLibraryRole = "STUDENT" | "GYM" | "PERSONAL";
type TrainingLibraryOperation =
  | "list"
  | "detail"
  | "create"
  | "update"
  | "delete"
  | "clone";

type TrainingLibraryPlanAccessSummary = {
  studentId: string;
  createdById: string | null;
  creatorType: string | null;
};

const TRAINING_LIBRARY_ACCESS_DENIED_CODE = "TRAINING_LIBRARY_ACCESS_DENIED";

export class TrainingLibraryAccessError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number = 403) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function normalizeStudentId(studentId?: string | null) {
  if (!studentId) {
    return null;
  }

  const trimmed = studentId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getRole(auth: AuthResult): SupportedLibraryRole {
  const role = auth.user.role;
  if (role === "STUDENT" || role === "GYM" || role === "PERSONAL") {
    return role;
  }

  throw new TrainingLibraryAccessError(
    TRAINING_LIBRARY_ACCESS_DENIED_CODE,
    "Acesso negado para operar a biblioteca de treinos",
    403,
  );
}

function getAuthStudentId(auth: AuthResult) {
  return auth.user.student?.id ?? null;
}

function getAuthGymId(auth: AuthResult) {
  const activeGymId =
    typeof auth.user.activeGymId === "string" ? auth.user.activeGymId : null;
  if (activeGymId) {
    return activeGymId;
  }

  return auth.user.gyms?.[0]?.id ?? null;
}

function getAuthPersonalId(auth: AuthResult) {
  return auth.user.personal?.id ?? null;
}

async function assertGymCanOperateStudent(gymId: string, studentId: string) {
  const membership = await db.gymMembership.findFirst({
    where: {
      gymId,
      studentId,
      status: "active",
    },
    select: { id: true },
  });

  if (!membership) {
    throw new TrainingLibraryAccessError(
      TRAINING_LIBRARY_ACCESS_DENIED_CODE,
      "Acesso negado: aluno sem vinculo ativo nesta academia",
      403,
    );
  }
}

async function assertPersonalCanOperateStudent(
  personalId: string,
  studentId: string,
) {
  const assignment = await db.studentPersonalAssignment.findFirst({
    where: {
      personalId,
      studentId,
      status: "active",
    },
    select: { id: true },
  });

  if (!assignment) {
    throw new TrainingLibraryAccessError(
      TRAINING_LIBRARY_ACCESS_DENIED_CODE,
      "Acesso negado: aluno sem atribuicao ativa para este personal",
      403,
    );
  }
}

async function hasActiveAffiliation(personalId: string, gymId: string) {
  const affiliation = await db.gymPersonalAffiliation.findFirst({
    where: {
      personalId,
      gymId,
      status: "active",
    },
    select: { id: true },
  });

  return Boolean(affiliation);
}

export function isTrainingLibraryAccessError(
  error: unknown,
): error is TrainingLibraryAccessError {
  return error instanceof TrainingLibraryAccessError;
}

export async function resolveAuthorizedTrainingLibraryStudentId(
  auth: AuthResult,
  requestedStudentId?: string | null,
) {
  const role = getRole(auth);
  const ownStudentId = getAuthStudentId(auth);

  if (role === "STUDENT") {
    if (!ownStudentId) {
      throw new TrainingLibraryAccessError(
        TRAINING_LIBRARY_ACCESS_DENIED_CODE,
        "Contexto de aluno nao encontrado para este usuario",
        401,
      );
    }
    return ownStudentId;
  }

  const targetStudentId = normalizeStudentId(requestedStudentId);
  if (!targetStudentId) {
    throw new TrainingLibraryAccessError(
      "TRAINING_LIBRARY_STUDENT_ID_REQUIRED",
      "studentId e obrigatorio para esta operacao",
      400,
    );
  }

  await assertActorCanOperateTrainingLibraryStudent(auth, targetStudentId, role);
  return targetStudentId;
}

export async function assertActorCanOperateTrainingLibraryStudent(
  auth: AuthResult,
  studentId: string,
  resolvedRole?: SupportedLibraryRole,
) {
  const role = resolvedRole ?? getRole(auth);

  if (role === "STUDENT") {
    if (studentId !== getAuthStudentId(auth)) {
      throw new TrainingLibraryAccessError(
        TRAINING_LIBRARY_ACCESS_DENIED_CODE,
        "Acesso negado para operar a biblioteca de outro aluno",
        403,
      );
    }
    return;
  }

  if (role === "GYM") {
    const gymId = getAuthGymId(auth);
    if (!gymId) {
      throw new TrainingLibraryAccessError(
        TRAINING_LIBRARY_ACCESS_DENIED_CODE,
        "Contexto de academia nao encontrado para este usuario",
        403,
      );
    }

    await assertGymCanOperateStudent(gymId, studentId);
    return;
  }

  const personalId = getAuthPersonalId(auth);
  if (!personalId) {
    throw new TrainingLibraryAccessError(
      TRAINING_LIBRARY_ACCESS_DENIED_CODE,
      "Contexto de personal nao encontrado para este usuario",
      403,
    );
  }

  await assertPersonalCanOperateStudent(personalId, studentId);
}

export async function assertActorCanAccessTrainingLibraryPlan(
  auth: AuthResult,
  plan: TrainingLibraryPlanAccessSummary,
  operation: TrainingLibraryOperation,
) {
  const role = getRole(auth);
  await assertActorCanOperateTrainingLibraryStudent(auth, plan.studentId, role);

  if (role === "STUDENT") {
    return;
  }

  if (role === "GYM") {
    if (operation === "update" || operation === "delete") {
      const gymId = getAuthGymId(auth);
      if (plan.creatorType !== "GYM" || !gymId || plan.createdById !== gymId) {
        throw new TrainingLibraryAccessError(
          TRAINING_LIBRARY_ACCESS_DENIED_CODE,
          "Acesso negado: a academia so pode alterar planos criados por ela",
          403,
        );
      }
    }
    return;
  }

  const personalId = getAuthPersonalId(auth);
  if (!personalId) {
    throw new TrainingLibraryAccessError(
      TRAINING_LIBRARY_ACCESS_DENIED_CODE,
      "Contexto de personal nao encontrado para este usuario",
      403,
    );
  }

  if (plan.creatorType === "GYM") {
    if (!plan.createdById) {
      throw new TrainingLibraryAccessError(
        TRAINING_LIBRARY_ACCESS_DENIED_CODE,
        "Acesso negado para operar este plano da academia",
        403,
      );
    }

    const affiliated = await hasActiveAffiliation(personalId, plan.createdById);
    if (!affiliated) {
      throw new TrainingLibraryAccessError(
        TRAINING_LIBRARY_ACCESS_DENIED_CODE,
        "Acesso negado: personal sem afiliacao ativa com a academia do plano",
        403,
      );
    }

    return;
  }

  if (operation === "update" || operation === "delete") {
    if (plan.creatorType === "PERSONAL" && plan.createdById === personalId) {
      return;
    }

    throw new TrainingLibraryAccessError(
      TRAINING_LIBRARY_ACCESS_DENIED_CODE,
      "Acesso negado: personal so pode alterar o proprio plano",
      403,
    );
  }
}

export async function filterVisibleTrainingLibraryPlansForActor<
  TPlan extends {
    creatorType: string | null;
    createdById: string | null;
  },
>(auth: AuthResult, plans: TPlan[]) {
  const role = getRole(auth);
  if (role !== "PERSONAL") {
    return plans;
  }

  const personalId = getAuthPersonalId(auth);
  if (!personalId) {
    return [];
  }

  const gymIds = [...new Set(
    plans
      .filter((plan) => plan.creatorType === "GYM" && Boolean(plan.createdById))
      .map((plan) => plan.createdById as string),
  )];

  if (gymIds.length === 0) {
    return plans;
  }

  const affiliations = await db.gymPersonalAffiliation.findMany({
    where: {
      personalId,
      gymId: { in: gymIds },
      status: "active",
    },
    select: { gymId: true },
  });

  const allowedGymIds = new Set(affiliations.map((affiliation) => affiliation.gymId));
  return plans.filter((plan) => {
    if (plan.creatorType !== "GYM") {
      return true;
    }

    return Boolean(plan.createdById && allowedGymIds.has(plan.createdById));
  });
}
