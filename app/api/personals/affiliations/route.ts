import { NextResponse } from "next/server";
import { z } from "zod";
import { personalAffiliationSchema } from "@/lib/api/schemas/personals.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { PersonalGymService } from "@/lib/services/personal/personal-gym.service";
import { featureFlags } from "@/lib/feature-flags";

const deleteAffiliationSchema = z.object({
  gymId: z.string().min(1),
});

export const GET = createSafeHandler(
  async ({ personalContext }) => {
    if (!featureFlags.personalEnabled) {
      return NextResponse.json(
        { error: "Módulo Personal desabilitado" },
        { status: 503 },
      );
    }
    const personalId = personalContext?.personalId || "";
    const affiliations = await PersonalGymService.listPersonalGyms(personalId);
    return NextResponse.json({ affiliations });
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
    const personalId = personalContext?.personalId || "";
    const { gymId } = body as { gymId: string };
    const affiliation = await PersonalGymService.linkPersonalToGym({
      personalId,
      gymId,
    });
    return NextResponse.json({ affiliation });
  },
  { auth: "personal", schema: { body: personalAffiliationSchema } },
);

export const DELETE = createSafeHandler(
  async ({ personalContext, body }) => {
    if (!featureFlags.personalEnabled) {
      return NextResponse.json(
        { error: "Módulo Personal desabilitado" },
        { status: 503 },
      );
    }
    const personalId = personalContext?.personalId || "";
    const { gymId } = body as { gymId: string };
    const affiliation = await PersonalGymService.unlinkPersonalFromGym({
      personalId,
      gymId,
    });
    return NextResponse.json({ affiliation });
  },
  { auth: "personal", schema: { body: deleteAffiliationSchema } },
);
