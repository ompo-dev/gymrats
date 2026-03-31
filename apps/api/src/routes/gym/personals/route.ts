import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { featureFlags } from "@/lib/feature-flags";
import { PersonalGymService } from "@/lib/services/personal/personal-gym.service";
import { NextResponse } from "@/runtime/next-server";

const linkSchema = z.object({
  personalId: z.string().min(1),
});

const unlinkSchema = z.object({
  personalId: z.string().min(1),
});

export const GET = createSafeHandler(
  async ({ gymContext }) => {
    if (!featureFlags.personalEnabled) {
      return NextResponse.json(
        { error: "Módulo Personal desabilitado" },
        { status: 503 },
      );
    }
    const gymId = gymContext?.gymId || "";
    const personals = await PersonalGymService.listGymPersonals(gymId);
    return NextResponse.json({ personals });
  },
  { auth: "gym" },
);

export const POST = createSafeHandler(
  async ({ gymContext, body }) => {
    if (!featureFlags.personalEnabled) {
      return NextResponse.json(
        { error: "Módulo Personal desabilitado" },
        { status: 503 },
      );
    }
    const gymId = gymContext?.gymId || "";
    const { personalId } = body as { personalId: string };

    const affiliation = await PersonalGymService.linkPersonalToGym({
      personalId,
      gymId,
    });
    return NextResponse.json({ affiliation });
  },
  { auth: "gym", schema: { body: linkSchema } },
);

export const DELETE = createSafeHandler(
  async ({ gymContext, body }) => {
    if (!featureFlags.personalEnabled) {
      return NextResponse.json(
        { error: "Módulo Personal desabilitado" },
        { status: 503 },
      );
    }
    const gymId = gymContext?.gymId || "";
    const { personalId } = body as { personalId: string };

    const affiliation = await db.gymPersonalAffiliation.findUnique({
      where: {
        personalId_gymId: {
          personalId,
          gymId,
        },
      },
    });
    if (!affiliation) {
      return NextResponse.json(
        { error: "Vínculo não encontrado" },
        { status: 404 },
      );
    }

    const removed = await PersonalGymService.unlinkPersonalFromGym({
      personalId,
      gymId,
    });
    return NextResponse.json({ affiliation: removed });
  },
  { auth: "gym", schema: { body: unlinkSchema } },
);
