/**
 * Garante que o usuário tenha role STUDENT ou GYM e o registro correspondente.
 * Usado no onboarding quando o usuário é PENDING - cadastra apenas ao concluir.
 */

import {
  type ProvisionUserAccessResult,
  updateUserRoleAndProvisionAccess,
} from "@gymrats/auth";

export type EnsureRoleResult =
  | { ok: true; studentId?: string; gymId?: string; personalId?: string }
  | { ok: false; error: string };

function toEnsureRoleSuccess(
  result: ProvisionUserAccessResult,
): EnsureRoleResult {
  return {
    ok: true,
    studentId: result.studentId,
    gymId: result.gymId,
    personalId: result.personalId,
  };
}

export async function ensureStudentRole(
  userId: string,
): Promise<EnsureRoleResult> {
  try {
    const result = await updateUserRoleAndProvisionAccess({
      userId,
      role: "STUDENT",
    });
    return toEnsureRoleSuccess(result);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao criar perfil",
    };
  }
}

export async function ensureGymRole(
  userId: string,
  userName: string,
  userEmail: string,
): Promise<EnsureRoleResult> {
  try {
    const result = await updateUserRoleAndProvisionAccess({
      userId,
      role: "GYM",
      userName,
      userEmail,
    });
    return toEnsureRoleSuccess(result);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao criar perfil",
    };
  }
}

export async function ensurePersonalRole(
  userId: string,
  userName: string,
  userEmail: string,
): Promise<EnsureRoleResult> {
  try {
    const result = await updateUserRoleAndProvisionAccess({
      userId,
      role: "PERSONAL",
      userName,
      userEmail,
    });
    return toEnsureRoleSuccess(result);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao criar perfil",
    };
  }
}
