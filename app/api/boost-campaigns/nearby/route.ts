import { NextResponse } from "next/server";
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
    if (query.lat == null || query.lng == null) {
      return NextResponse.json({ campaigns: [] }, { status: 200 });
    }

    const lat = parseFloat(query.lat);
    const lng = parseFloat(query.lng);

    const campaigns = await db.boostCampaign.findMany({
      where: {
        status: "active",
        endsAt: { gt: new Date() },
      },
      include: {
        gym: {
          select: { id: true, latitude: true, longitude: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const filtered = campaigns.filter((c) => {
      const gym = c.gym;
      if (gym.latitude == null || gym.longitude == null) return false;
      const radiusKm = c.radiusKm ?? 5;
      const distance = haversineKm(
        lat,
        lng,
        gym.latitude,
        gym.longitude,
      );
      return distance <= radiusKm;
    });

    return NextResponse.json({
      campaigns: filtered.map((c) => ({
        id: c.id,
        gymId: c.gymId,
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
