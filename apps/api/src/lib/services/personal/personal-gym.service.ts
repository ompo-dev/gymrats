import { getCachedJson, setCachedJson } from "@/lib/cache/resource-cache";
import { db } from "@/lib/db";
import { PersonalSubscriptionService } from "./personal-subscription.service";

function getDiscountPercentByGymPlan(
  plan?: string | null,
  status?: string | null,
) {
  const normalized = (plan || "").toLowerCase();
  const isEligible =
    status === "active" &&
    (normalized === "premium" || normalized === "enterprise");
  return isEligible ? 50 : null;
}

const PERSONAL_GYMS_CACHE_TTL_SECONDS = 20;

function buildPersonalGymCacheKey(
  personalId: string,
  resource: string,
  params?: Record<string, string | number | boolean | null | undefined>,
) {
  const query = Object.entries(params ?? {})
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&");

  return query.length > 0
    ? `personal:gym:${personalId}:${resource}:${query}`
    : `personal:gym:${personalId}:${resource}`;
}

export class PersonalGymService {
  static async linkPersonalToGym(input: { personalId: string; gymId: string }) {
    const { personalId, gymId } = input;

    const gymSubscription = await db.gymSubscription.findUnique({
      where: { gymId },
      select: { plan: true, status: true },
    });
    const discountPercent = getDiscountPercentByGymPlan(
      gymSubscription?.plan,
      gymSubscription?.status,
    );

    const affiliation = await db.$transaction(async (tx) => {
      const existing = await tx.gymPersonalAffiliation.findUnique({
        where: { personalId_gymId: { personalId, gymId } },
      });

      if (existing) {
        return tx.gymPersonalAffiliation.update({
          where: { id: existing.id },
          data: {
            status: "active",
            discountPercent,
          },
        });
      }

      return tx.gymPersonalAffiliation.create({
        data: {
          personalId,
          gymId,
          status: "active",
          discountPercent,
        },
      });
    });

    await PersonalSubscriptionService.recalculateEffectivePrice(personalId);
    return affiliation;
  }

  static async unlinkPersonalFromGym(input: {
    personalId: string;
    gymId: string;
  }) {
    const { personalId, gymId } = input;

    const affiliation = await db.$transaction(async (tx) => {
      const existing = await tx.gymPersonalAffiliation.findUnique({
        where: { personalId_gymId: { personalId, gymId } },
      });

      if (!existing) return null;

      return tx.gymPersonalAffiliation.update({
        where: { id: existing.id },
        data: {
          status: "canceled",
          discountPercent: null,
        },
      });
    });

    await PersonalSubscriptionService.recalculateEffectivePrice(personalId);
    return affiliation;
  }

  static async listPersonalGyms(
    personalId: string,
    options?: { fresh?: boolean },
  ) {
    const cacheKey = buildPersonalGymCacheKey(personalId, "affiliations");

    if (!options?.fresh) {
      const cached =
        await getCachedJson<
          Awaited<ReturnType<typeof db.gymPersonalAffiliation.findMany>>
        >(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const affiliations = await db.gymPersonalAffiliation.findMany({
      where: { personalId, status: "active" },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
            image: true,
            logo: true,
            isActive: true,
            subscription: {
              select: {
                plan: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    await setCachedJson(
      cacheKey,
      affiliations,
      PERSONAL_GYMS_CACHE_TTL_SECONDS,
    );

    return affiliations;
  }

  static async listGymPersonals(gymId: string) {
    return db.gymPersonalAffiliation.findMany({
      where: { gymId, status: "active" },
      include: {
        personal: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            atendimentoPresencial: true,
            atendimentoRemoto: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
