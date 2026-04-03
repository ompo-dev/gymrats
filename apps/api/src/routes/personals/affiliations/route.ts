import { z } from "zod";
import { personalAffiliationSchema } from "@/lib/api/schemas/personals.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { featureFlags } from "@/lib/feature-flags";
import { PersonalGymService } from "@/lib/services/personal/personal-gym.service";
import { NextResponse } from "@/runtime/next-server";

const deleteAffiliationSchema = z.object({
  gymId: z.string().cuid("gymId deve ser um CUID valido"),
});

export const GET = createSafeHandler(
  async ({ personalContext, req }) => {
    if (!featureFlags.personalEnabled) {
      return NextResponse.json(
        { error: "Módulo Personal desabilitado" },
        { status: 503 },
      );
    }
    const personalId = personalContext?.personalId || "";
    const fresh = new URL(req.url).searchParams.get("fresh") === "1";
    const affiliations = await PersonalGymService.listPersonalGyms(personalId, {
      fresh,
    });
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
    let { gymId } = body as { gymId: string };
    gymId = gymId.trim();

    // Lógica para busca por username (@maromba -> maromba@...)
    if (gymId.startsWith("@")) {
      const username = gymId.slice(1).toLowerCase();
      // O admin de uma academia tem uma role GYM ou ADMIN, mas podemos buscar pelo usuario que tem gym.
      const gymUser = await db.user.findFirst({
        where: {
          email: { startsWith: `${username}@` },
          gyms: { some: {} },
        },
        include: { gyms: true },
      });

      if (!gymUser || gymUser.gyms.length === 0) {
        return NextResponse.json(
          { error: "Nenhuma academia encontrada para esse @" },
          { status: 404 },
        );
      }
      gymId = gymUser.gyms[0].id;
    }

    try {
      const affiliation = await PersonalGymService.linkPersonalToGym({
        personalId,
        gymId,
      });
      return NextResponse.json({ affiliation });
    } catch (error) {
      if (error instanceof Error && error.message === "Gym not found") {
        return NextResponse.json(
          { error: "Academia não encontrada" },
          { status: 404 },
        );
      }
      const errorCode =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
          ? error.code
          : undefined;
      if (errorCode === "P2002") {
        return NextResponse.json(
          { error: "Você já está vinculado a essa academia" },
          { status: 400 },
        );
      }
      throw error;
    }
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
