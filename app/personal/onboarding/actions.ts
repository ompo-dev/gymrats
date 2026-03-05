"use server";

import { getUserContext } from "@/lib/context/auth-context-factory";
import { db } from "@/lib/db";
import { ensurePersonalRole } from "@/lib/utils/ensure-user-role";

export async function submitPersonalOnboarding(input: {
  name: string;
  phone?: string;
  bio?: string;
  atendimentoPresencial: boolean;
  atendimentoRemoto: boolean;
}) {
  try {
    const { ctx: userCtx, error } = await getUserContext();
    if (error || !userCtx) {
      return { success: false, error: error || "Sessão inválida" };
    }

    if (userCtx.user.role !== "PENDING" && userCtx.user.role !== "PERSONAL") {
      return { success: false, error: "Fluxo inválido para onboarding personal" };
    }

    const ensured = await ensurePersonalRole(
      userCtx.user.id,
      (userCtx.user.name as string) || input.name,
      (userCtx.user.email as string) || "",
    );
    if (!ensured.ok) {
      return { success: false, error: ensured.error || "Erro ao criar personal" };
    }
    if (!ensured.personalId) {
      return { success: false, error: "Erro ao criar personal" };
    }

    await db.personal.update({
      where: { id: ensured.personalId },
      data: {
        name: input.name,
        phone: input.phone || null,
        bio: input.bio || null,
        atendimentoPresencial: input.atendimentoPresencial,
        atendimentoRemoto: input.atendimentoRemoto,
      },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao salvar onboarding",
    };
  }
}
