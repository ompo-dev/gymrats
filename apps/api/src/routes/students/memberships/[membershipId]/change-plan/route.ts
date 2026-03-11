import { NextResponse } from "@/runtime/next-server";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { createChangePlanPaymentPix } from "@/lib/services/gym/gym-membership-payment.service";

const paramsSchema = z.object({
  membershipId: z.string().min(1),
});

const bodySchema = z.object({
  planId: z.string().min(1),
});

export const POST = createSafeHandler(
  async ({ studentContext, params, body }) => {
    const { membershipId } = paramsSchema.parse(params);
    const { planId } = bodySchema.parse(body);
    const studentId = studentContext?.studentId;

    // Validar que o membership pertence ao student
    const { db } = await import("@/lib/db");
    const membership = await db.gymMembership.findFirst({
      where: { id: membershipId, studentId },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Matrícula não encontrada ou você não tem permissão" },
        { status: 404 },
      );
    }

    const result = await createChangePlanPaymentPix(membershipId, planId);
    return NextResponse.json(result);
  },
  {
    auth: "student",
    schema: { params: paramsSchema, body: bodySchema },
  },
);
