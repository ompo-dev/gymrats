import type { Context } from "elysia";
import {
  createGymSchema,
  gymLocationsQuerySchema,
  setActiveGymSchema,
} from "@/lib/api/schemas";
import {
  createGymUseCase,
  getGymLocationsUseCase,
  getGymProfileUseCase,
  listGymsUseCase,
  setActiveGymUseCase,
} from "@/lib/use-cases/gyms";
import {
  badRequestResponse,
  internalErrorResponse,
  notFoundResponse,
  successResponse,
} from "../utils/response";
import { validateBody, validateQuery } from "../utils/validation";

type GymContext = {
  set: Context["set"];
  body?: Record<string, string | number | boolean | object | null>;
  query?: Record<string, import("@/lib/types/api-error").JsonValue>;
  userId: string;
};

export async function listGymsHandler({ set, userId }: GymContext) {
  try {
    const result = await listGymsUseCase(userId);
    return successResponse(set, result);
  } catch (error) {
    console.error("[listGymsHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao listar academias", error);
  }
}

export async function createGymHandler({ set, body, userId }: GymContext) {
  try {
    const validation = validateBody(body, createGymSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors },
      );
    }

    const { name, address, phone, email, cnpj } = validation.data as {
      name: string;
      address?: string;
      phone?: string;
      email?: string;
      cnpj?: string;
    };

    try {
      const result = await createGymUseCase({
        userId,
        name,
        address,
        phone,
        email,
        cnpj,
      });
      return successResponse(set, result);
    } catch (err) {
      return badRequestResponse(set, (err as Error).message);
    }
  } catch (error) {
    console.error("[createGymHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao criar academia", error);
  }
}

export async function getGymProfileHandler({ set, userId }: GymContext) {
  try {
    const result = await getGymProfileUseCase(userId);
    return successResponse(set, result);
  } catch (error) {
    console.error("[getGymProfileHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao buscar perfil", error);
  }
}

export async function setActiveGymHandler({ set, body, userId }: GymContext) {
  try {
    const validation = validateBody(body, setActiveGymSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors },
      );
    }

    const { gymId } = validation.data as { gymId: string };
    try {
      const result = await setActiveGymUseCase(userId, gymId);
      return successResponse(set, result);
    } catch (err) {
      return notFoundResponse(set, (err as Error).message);
    }
  } catch (error) {
    console.error("[setActiveGymHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao alterar academia ativa", error);
  }
}

export async function getGymLocationsHandler({
  set,
  query,
}: {
  set: GymContext["set"];
  query?: Record<string, import("@/lib/types/api-error").JsonValue>;
}) {
  try {
    const queryValidation = validateQuery(
      (query || {}) as Record<
        string,
        import("@/lib/types/api-error").JsonValue
      >,
      gymLocationsQuerySchema,
    );
    if (!queryValidation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${queryValidation.errors.join("; ")}`,
        { errors: queryValidation.errors },
      );
    }

    const result = await getGymLocationsUseCase({
      lat: queryValidation.data.lat as string | undefined,
      lng: queryValidation.data.lng as string | undefined,
    });

    return successResponse(set, result);
  } catch (error) {
    console.error("[getGymLocationsHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao buscar academias", error);
  }
}
