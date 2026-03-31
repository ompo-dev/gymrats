import {
  createPersonalSchema,
  updatePersonalSchema,
} from "@/lib/api/schemas/personals.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { featureFlags } from "@/lib/feature-flags";
import { NextResponse } from "@/runtime/next-server";

export const GET = createSafeHandler(
  async ({ personalContext }) => {
    if (!featureFlags.personalEnabled) {
      return NextResponse.json(
        { error: "Módulo Personal desabilitado" },
        { status: 503 },
      );
    }
    const personalId = personalContext?.personalId;
    const personal = await db.personal.findUnique({
      where: { id: personalId },
      include: {
        subscription: true,
      },
    });

    return NextResponse.json({ personal });
  },
  { auth: "personal" },
);

export const POST = createSafeHandler(
  async ({ personalContext, body }) => {
    if (!featureFlags.personalEnabled) {
      return NextResponse.json(
        { error: "Módulo Personal desabilitado" },
        { status: 503 },
      );
    }
    const personalId = personalContext?.personalId;
    const payload = body as Record<string, unknown>;

    const updated = await db.personal.update({
      where: { id: personalId },
      data: {
        ...(payload.name !== undefined ? { name: payload.name as string } : {}),
        ...(payload.email !== undefined
          ? { email: payload.email as string }
          : {}),
        ...(payload.phone !== undefined
          ? { phone: payload.phone as string }
          : {}),
        ...(payload.avatar !== undefined
          ? { avatar: payload.avatar as string }
          : {}),
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
        ...(payload.atendimentoPresencial !== undefined
          ? { atendimentoPresencial: payload.atendimentoPresencial as boolean }
          : {}),
        ...(payload.atendimentoRemoto !== undefined
          ? { atendimentoRemoto: payload.atendimentoRemoto as boolean }
          : {}),
      },
    });

    return NextResponse.json({ personal: updated });
  },
  { auth: "personal", schema: { body: createPersonalSchema } },
);

export const PATCH = createSafeHandler(
  async ({ personalContext, body }) => {
    if (!featureFlags.personalEnabled) {
      return NextResponse.json(
        { error: "Módulo Personal desabilitado" },
        { status: 503 },
      );
    }
    const personalId = personalContext?.personalId;
    const payload = body as Record<string, unknown>;

    const updated = await db.personal.update({
      where: { id: personalId },
      data: {
        ...(payload.name !== undefined ? { name: payload.name as string } : {}),
        ...(payload.email !== undefined
          ? { email: payload.email as string }
          : {}),
        ...(payload.phone !== undefined
          ? { phone: payload.phone as string }
          : {}),
        ...(payload.avatar !== undefined
          ? { avatar: payload.avatar as string }
          : {}),
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
        ...(payload.atendimentoPresencial !== undefined
          ? { atendimentoPresencial: payload.atendimentoPresencial as boolean }
          : {}),
        ...(payload.atendimentoRemoto !== undefined
          ? { atendimentoRemoto: payload.atendimentoRemoto as boolean }
          : {}),
      },
    });

    return NextResponse.json({ personal: updated });
  },
  { auth: "personal", schema: { body: updatePersonalSchema } },
);
