import { NextResponse } from "next/server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

/**
 * GET /api/students/memberships
 * Retorna as matrículas (academias) ativas do aluno logado.
 */
export const GET = createSafeHandler(
  async ({ studentContext }) => {
    const studentId = studentContext?.studentId ?? "";

    const memberships = await db.gymMembership.findMany({
      where: {
        studentId,
        status: { in: ["active", "pending"] },
      },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
            image: true,
            logo: true,
            address: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            type: true,
            price: true,
            duration: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      memberships: memberships.map((m) => ({
        id: m.id,
        status: m.status,
        startDate: m.startDate,
        gym: {
          id: m.gym.id,
          name: m.gym.name,
          image: m.gym.image,
          logo: m.gym.logo,
          address: m.gym.address,
        },
        plan: m.plan
          ? {
              id: m.plan.id,
              name: m.plan.name,
              type: m.plan.type,
              price: m.plan.price,
            }
          : null,
      })),
    });
  },
  { auth: "student" },
);
