import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { z } from "zod";

const paramsSchema = z.object({
  gymId: z.string().min(1),
});

export const GET = createSafeHandler(
  async ({ params, studentContext }) => {
    const { gymId } = paramsSchema.parse(params);
    const studentId = studentContext?.studentId;

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

    let photos: string[] = [];
    if (gym.photos) {
      try {
        photos = JSON.parse(gym.photos);
      } catch {}
    }

    let myMembership: {
      id: string;
      status: string;
      planId: string | null;
    } | null = null;

    if (studentId) {
      const membership = await db.gymMembership.findFirst({
        where: { gymId, studentId, status: { in: ["active", "pending"] } },
        select: { id: true, status: true, planId: true },
      });
      if (membership) {
        myMembership = {
          id: membership.id,
          status: membership.status,
          planId: membership.planId,
        };
      }
    }

    return NextResponse.json({
      id: gym.id,
      name: gym.name,
      address: gym.address,
      phone: gym.phone,
      email: gym.email,
      logo: gym.image || gym.logo || undefined,
      photos: photos.length > 0 ? photos : undefined,
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
      myMembership,
    });
  },
  {
    auth: "student",
    schema: { params: paramsSchema },
  },
);
