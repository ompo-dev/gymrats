import { NextResponse } from "next/server";
import { z } from "zod";
import { updatePersonalSchema } from "@/lib/api/schemas/personals.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { featureFlags } from "@/lib/feature-flags";

const paramsSchema = z.object({
  id: z.string().min(1),
});

export const GET = createSafeHandler(
  async ({ personalContext, params }) => {
    if (!featureFlags.personalEnabled) {
      return NextResponse.json(
        { error: "Módulo Personal desabilitado" },
        { status: 503 },
      );
    }
    const requestedId = params?.id || "";
    const currentId = personalContext?.personalId || "";
    const userRole = personalContext?.user?.role;

    if (requestedId !== currentId && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const personal = await db.personal.findUnique({
      where: { id: requestedId },
      include: {
        subscription: true,
      },
    });

    if (!personal) {
      return NextResponse.json({ error: "Personal não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ personal });
  },
  { auth: "personal", schema: { params: paramsSchema } },
);

export const PATCH = createSafeHandler(
  async ({ personalContext, params, body }) => {
    if (!featureFlags.personalEnabled) {
      return NextResponse.json(
        { error: "Módulo Personal desabilitado" },
        { status: 503 },
      );
    }
    const requestedId = params?.id || "";
    const currentId = personalContext?.personalId || "";
    const userRole = personalContext?.user?.role;

    if (requestedId !== currentId && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const payload = body as Record<string, unknown>;

    const personal = await db.personal.update({
      where: { id: requestedId },
      data: {
        ...(payload.name !== undefined ? { name: payload.name as string } : {}),
        ...(payload.email !== undefined ? { email: payload.email as string } : {}),
        ...(payload.phone !== undefined ? { phone: payload.phone as string } : {}),
        ...(payload.avatar !== undefined ? { avatar: payload.avatar as string } : {}),
        ...(payload.bio !== undefined ? { bio: payload.bio as string } : {}),
        ...(payload.address !== undefined
          ? { address: payload.address as string }
          : {}),
        ...(payload.latitude !== undefined
          ? { latitude: payload.latitude as number }
          : {}),
        ...(payload.longitude !== undefined
          ? { longitude: payload.longitude as number }
          : {}),
      },
    });

    return NextResponse.json({ personal });
  },
  { auth: "personal", schema: { params: paramsSchema, body: updatePersonalSchema } },
);
