import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { z } from "zod";

const paramsSchema = z.object({
  gymId: z.string().min(1),
});

export const GET = createSafeHandler(
  async ({ params }) => {
    const { gymId } = paramsSchema.parse(params);

    const gym = await db.gym.findUnique({
      where: { id: gymId, isActive: true },
      include: {
        profile: true,
        equipment: { select: { id: true, name: true, type: true, status: true } },
        plans: {
          where: { isActive: true },
          orderBy: { price: "asc" },
          select: {
            id: true,
            name: true,
            type: true,
            price: true,
            duration: true,
            benefits: true,
          },
        },
      },
    });

    if (!gym) {
      return NextResponse.json(
        { error: "Academia não encontrada" },
        { status: 404 },
      );
    }

    let openingHours: { open?: string; close?: string; days?: string[] } | undefined;
    if (gym.openingHours) {
      try {
        openingHours = JSON.parse(gym.openingHours) as any;
      } catch {}
    }

    let amenities: string[] = [];
    if (gym.amenities) {
      try {
        amenities = JSON.parse(gym.amenities);
      } catch {}
    }

    return NextResponse.json({
      id: gym.id,
      name: gym.name,
      address: gym.address,
      phone: gym.phone,
      email: gym.email,
      logo: gym.logo || undefined,
      rating: gym.rating || 0,
      totalReviews: gym.totalReviews || 0,
      openingHours,
      amenities,
      equipmentCount: gym.profile?.equipmentCount ?? gym.equipment.length,
      totalStudents: gym.profile?.totalStudents ?? 0,
      activeStudents: gym.profile?.activeStudents ?? 0,
      equipment: gym.equipment.map((e) => ({
        id: e.id,
        name: e.name,
        type: e.type,
        status: e.status,
      })),
      plans: gym.plans.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        price: p.price,
        duration: p.duration,
        benefits: p.benefits ? JSON.parse(p.benefits) : [],
      })),
    });
  },
  {
    auth: "none",
    schema: { params: paramsSchema },
  },
);
