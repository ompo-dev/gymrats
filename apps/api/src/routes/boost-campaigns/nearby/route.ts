import { NextResponse } from "@/runtime/next-server";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

const querySchema = z.object({
  lat: z
    .string()
    .regex(/^-?\d+\.?\d*$/)
    .optional(),
  lng: z
    .string()
    .regex(/^-?\d+\.?\d*$/)
    .optional(),
});

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * GET /api/boost-campaigns/nearby?lat=&lng=
 * Retorna campanhas ativas cujo gym está dentro do radiusKm da posição do usuário.
 * Auth: none (aluno pode estar logado ou não; usado na home para exibir ads).
 */
export const GET = createSafeHandler(
  async ({ query }) => {
    const now = new Date();

    const campaigns = await db.boostCampaign.findMany({
      where: {
        status: "active",
        endsAt: { gt: now },
      },
      select: {
        id: true,
        gymId: true,
        personalId: true,
        title: true,
        description: true,
        primaryColor: true,
        durationHours: true,
        amountCents: true,
        status: true,
        clicks: true,
        impressions: true,
        linkedCouponId: true,
        linkedPlanId: true,
        startsAt: true,
        endsAt: true,
        createdAt: true,
        updatedAt: true,
        radiusKm: true,
        gym: {
          select: { id: true, latitude: true, longitude: true },
        },
        personal: {
          select: {
            id: true,
            name: true,
            avatar: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const radiusKmDefault = 5;
    const hasCoordinates = query.lat != null && query.lng != null;
    const lat = hasCoordinates ? parseFloat(query.lat!) : null;
    const lng = hasCoordinates ? parseFloat(query.lng!) : null;

    const filtered = hasCoordinates
      ? campaigns.filter((c) => {
          const radiusKm = c.radiusKm ?? radiusKmDefault;
          if (c.gymId && c.gym) {
            const gym = c.gym;
            if (gym.latitude == null || gym.longitude == null) return false;
            const distance = haversineKm(
              lat!,
              lng!,
              gym.latitude,
              gym.longitude,
            );
            return distance <= radiusKm;
          }
          if (c.personalId && c.personal) {
            const personal = c.personal;
            if (personal.latitude == null || personal.longitude == null) {
              return false;
            }
            const distance = haversineKm(
              lat!,
              lng!,
              personal.latitude,
              personal.longitude,
            );
            return distance <= radiusKm;
          }
          return false;
        })
      : campaigns;

    return NextResponse.json({
      campaigns: filtered.map((c) => ({
        id: c.id,
        gymId: c.gymId,
        personalId: c.personalId,
        personal: c.personal
          ? {
              id: c.personal.id,
              name: c.personal.name,
              avatar: c.personal.avatar,
            }
          : null,
        title: c.title,
        description: c.description,
        primaryColor: c.primaryColor,
        durationHours: c.durationHours,
        amountCents: c.amountCents,
        status: c.status,
        clicks: c.clicks,
        impressions: c.impressions,
        linkedCouponId: c.linkedCouponId,
        linkedPlanId: c.linkedPlanId,
        startsAt: c.startsAt,
        endsAt: c.endsAt,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        radiusKm: c.radiusKm,
      })),
    });
  },
  {
    auth: "none",
    schema: { query: querySchema },
  },
);
