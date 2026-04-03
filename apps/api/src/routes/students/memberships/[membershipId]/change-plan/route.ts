import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { createChangePlanPaymentPix } from "@/lib/services/gym/gym-membership-payment.service";
import { NextResponse } from "@/runtime/next-server";

const paramsSchema = z.object({
  membershipId: z.string().cuid("membershipId deve ser um CUID valido"),
});

const bodySchema = z.object({
  planId: z.string().cuid("planId deve ser um CUID valido"),
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
