import { db } from "@/lib/db";
import type { Context } from "elysia";
import {
  createGymSchema,
  gymLocationsQuerySchema,
  setActiveGymSchema,
} from "@gymrats/contracts";
import {
  badRequestResponse,
  internalErrorResponse,
  notFoundResponse,
  successResponse,
} from "../utils/response";
import { validateBody, validateQuery } from "../utils/validation";

type GymContext = {
  set: Context["set"];
  body?: unknown;
  query?: Record<string, unknown>;
  userId: string;
};

export async function listGymsHandler({ set, userId }: GymContext) {
  try {
    const gyms = await db.gym.findMany({
      where: { userId },
      include: { subscription: true },
      orderBy: { createdAt: "asc" },
    });

    const hasPaidSubscription = gyms.some(
      (gym) => gym.subscription?.status === "active"
    );

    const canCreateMultipleGyms = hasPaidSubscription;

    const gymsData = gyms.map((gym) => {
      const now = new Date();
      const gymHasActiveSubscription = gym.subscription
        ? gym.subscription.status === "active" ||
          (gym.subscription.status === "trialing" &&
            gym.subscription.trialEnd &&
            new Date(gym.subscription.trialEnd) > now)
        : false;

      return {
        id: gym.id,
        name: gym.name,
        logo: gym.logo,
        address: gym.address,
        email: gym.email,
        plan: gym.plan,
        isActive: gym.isActive,
        hasActiveSubscription: gymHasActiveSubscription,
      };
    });

    return successResponse(set, {
      gyms: gymsData,
      canCreateMultipleGyms,
      totalGyms: gyms.length,
    });
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
        { errors: validation.errors }
      );
    }

    const { name, address, phone, email, cnpj } = validation.data as any;
    const existingGyms = await db.gym.findMany({
      where: { userId },
      include: { subscription: true },
    });

    if (existingGyms.length > 0) {
      const hasPaidSubscription = existingGyms.some(
        (gym) => gym.subscription?.status === "active"
      );

      if (!hasPaidSubscription) {
        return badRequestResponse(
          set,
          "Para criar múltiplas academias, você precisa ter pelo menos uma academia com plano ativo (não trial)"
        );
      }
    }

    if (cnpj) {
      const existingCnpj = await db.gym.findUnique({ where: { cnpj } });
      if (existingCnpj) {
        return badRequestResponse(set, "CNPJ já cadastrado");
      }
    }

    const newGym = await db.gym.create({
      data: {
        userId,
        name,
        address,
        phone,
        email,
        cnpj: cnpj || null,
        plan: "basic",
        isActive: true,
      },
    });

    await db.gymProfile.create({
      data: {
        gymId: newGym.id,
        totalStudents: 0,
        activeStudents: 0,
        equipmentCount: 0,
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        currentStreak: 0,
        longestStreak: 0,
      },
    });

    await db.gymStats.create({
      data: { gymId: newGym.id },
    });

    await db.user.update({
      where: { id: userId },
      data: { activeGymId: newGym.id },
    });

    await db.gymUserPreference.upsert({
      where: { userId },
      update: {
        lastActiveGymId: newGym.id,
        updatedAt: new Date(),
      },
      create: {
        userId,
        lastActiveGymId: newGym.id,
      },
    });

    return successResponse(set, {
      gym: {
        id: newGym.id,
        name: newGym.name,
        address: newGym.address,
        email: newGym.email,
        plan: newGym.plan,
      },
    });
  } catch (error) {
    console.error("[createGymHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao criar academia", error);
  }
}

export async function getGymProfileHandler({ set, userId }: GymContext) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        gyms: {
          include: { profile: true },
        },
      },
    });

    if (!user || !user.gyms || user.gyms.length === 0) {
      return successResponse(set, { hasProfile: false });
    }

    const gym = user.gyms[0];
    const hasProfile =
      !!gym.profile &&
      gym.name !== null &&
      gym.address !== null &&
      gym.phone !== null &&
      gym.email !== null;

    return successResponse(set, {
      hasProfile,
      profile: gym.profile
        ? {
            name: gym.name,
            address: gym.address,
            phone: gym.phone,
            email: gym.email,
            cnpj: gym.cnpj,
          }
        : null,
    });
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
        { errors: validation.errors }
      );
    }

    const { gymId } = validation.data;

    const gym = await db.gym.findFirst({
      where: { id: gymId, userId },
    });

    if (!gym) {
      return notFoundResponse(set, "Academia não encontrada");
    }

    await db.user.update({
      where: { id: userId },
      data: { activeGymId: gymId },
    });

    await db.gymUserPreference.upsert({
      where: { userId },
      update: { lastActiveGymId: gymId, updatedAt: new Date() },
      create: { userId, lastActiveGymId: gymId },
    });

    return successResponse(set, { success: true });
  } catch (error) {
    console.error("[setActiveGymHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao definir academia ativa", error);
  }
}

export async function getGymLocationsHandler({
  set,
  query,
}: Pick<GymContext, "set" | "query">) {
  try {
    const validation = validateQuery(
      (query || {}) as Record<string, unknown>,
      gymLocationsQuerySchema
    );
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors }
      );
    }

    const { lat, lng, isPartner } = validation.data as any;

    const gyms = await db.gym.findMany({
      where: {
        ...(typeof isPartner === "boolean" ? { isPartner } : {}),
      },
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        isPartner: true,
        rating: true,
        totalReviews: true,
        photos: true,
      },
    });

    return successResponse(set, {
      gyms: gyms.map((gym) => ({
        id: gym.id,
        name: gym.name,
        address: gym.address,
        latitude: gym.latitude || undefined,
        longitude: gym.longitude || undefined,
        isPartner: gym.isPartner,
        rating: gym.rating || 0,
        totalReviews: gym.totalReviews || 0,
        photos: gym.photos ? JSON.parse(gym.photos) : [],
      })),
    });
  } catch (error) {
    console.error("[getGymLocationsHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao buscar academias", error);
  }
}
