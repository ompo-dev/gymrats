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

  static async listPersonalGyms(personalId: string) {
    return db.gymPersonalAffiliation.findMany({
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
