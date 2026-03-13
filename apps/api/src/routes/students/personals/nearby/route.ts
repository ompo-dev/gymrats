import { NextResponse } from "@/runtime/next-server";
import type { Prisma } from "@prisma/client";
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
  filter: z
    .enum(["all", "subscribed", "near", "remote"])
    .optional()
    .default("all"),
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
 * GET /api/students/personals/nearby?lat=&lng=&filter=
 * Retorna personais para o aluno com filtros: all, subscribed, near, remote
 */
export const GET = createSafeHandler(
  async ({ studentContext, query }) => {
    const { lat, lng, filter } = querySchema.parse(query);
    const studentId = studentContext?.studentId ?? "";
    const latNum = lat != null ? parseFloat(lat) : null;
    const lngNum = lng != null ? parseFloat(lng) : null;
    const RADIUS_KM = 10;

    const where: Prisma.PersonalWhereInput = {
      isActive: true,
    };

    if (filter === "remote") {
      where.atendimentoRemoto = true;
    }

    if (filter === "subscribed") {
      where.studentAssignments = {
        some: {
          studentId,
          status: "active",
        },
      };
    }

    if (filter === "near" && latNum != null && lngNum != null) {
      const latitudeDelta = RADIUS_KM / 111;
      const longitudeDelta =
        RADIUS_KM /
        Math.max(1, 111 * Math.cos((latNum * Math.PI) / 180));

      where.latitude = {
        gte: latNum - latitudeDelta,
        lte: latNum + latitudeDelta,
      };
      where.longitude = {
        gte: lngNum - longitudeDelta,
        lte: lngNum + longitudeDelta,
      };
    }

    const personals = await db.personal.findMany({
      where,
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        address: true,
        latitude: true,
        longitude: true,
        atendimentoPresencial: true,
        atendimentoRemoto: true,
        gymAffiliations: {
          where: { status: "active" },
          select: {
            gym: { select: { id: true, name: true } },
          },
        },
        studentAssignments: {
          where: { studentId, status: "active" },
          select: { id: true },
        },
        boostCampaigns: {
          where: {
            status: "active",
            endsAt: { gt: new Date() },
          },
          orderBy: { endsAt: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            primaryColor: true,
            linkedCouponId: true,
            linkedPlanId: true,
          },
        },
      },
    });

    let filtered = personals;

    if (filter === "subscribed") {
      filtered = personals.filter((p) => p.studentAssignments.length > 0);
    } else if (filter === "remote") {
      filtered = personals.filter((p) => p.atendimentoRemoto);
    } else if (filter === "near" && latNum != null && lngNum != null) {
      filtered = personals.filter((p) => {
        if (p.latitude == null || p.longitude == null) return false;
        const d = haversineKm(latNum, lngNum, p.latitude, p.longitude);
        return d <= RADIUS_KM;
      });
      filtered.sort((a, b) => {
        if (!a.latitude || !a.longitude || !b.latitude || !b.longitude)
          return 0;
        const dA = haversineKm(latNum, lngNum, a.latitude, a.longitude);
        const dB = haversineKm(latNum, lngNum, b.latitude, b.longitude);
        return dA - dB;
      });
    }

    return NextResponse.json({
      personals: filtered.map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        bio: p.bio,
        address: p.address ?? undefined,
        coordinates: {
          lat: p.latitude ?? 0,
          lng: p.longitude ?? 0,
        },
        distance:
          latNum != null &&
          lngNum != null &&
          p.latitude != null &&
          p.longitude != null
            ? Math.round(
                haversineKm(latNum, lngNum, p.latitude, p.longitude) * 10,
              ) / 10
            : null,
        atendimentoPresencial: p.atendimentoPresencial,
        atendimentoRemoto: p.atendimentoRemoto,
        gyms: p.gymAffiliations.map((a) => ({
          id: a.gym.id,
          name: a.gym.name,
        })),
        isSubscribed: p.studentAssignments.length > 0,
        activeCampaigns:
          p.boostCampaigns?.map((c) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            primaryColor: c.primaryColor,
            linkedCouponId: c.linkedCouponId,
            linkedPlanId: c.linkedPlanId,
          })) ?? [],
      })),
    });
  },
  {
    auth: "student",
    schema: { query: querySchema },
  },
);
