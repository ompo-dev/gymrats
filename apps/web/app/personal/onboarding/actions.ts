"use server";

import { serverApiPost } from "@/lib/api/server";
import { getApiErrorMessage } from "@/lib/api/server-action-utils";

export async function submitPersonalOnboarding(input: {
  name: string;
  phone?: string;
  bio?: string;
  atendimentoPresencial: boolean;
  atendimentoRemoto: boolean;
}) {
  try {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (name.length < 2) {
      return {
        success: false,
        error: "Nome deve ter pelo menos 2 caracteres.",
      };
    }

    return await serverApiPost<{ success: boolean; error?: string }>(
      "/api/personals/onboarding",
      {
        ...input,
        name,
      },
    );
  } catch (error) {
    return {
      success: false,
      error: getApiErrorMessage(error, "Erro ao salvar onboarding"),
    };
  }
}
