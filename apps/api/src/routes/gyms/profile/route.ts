import { updateGymProfileSchema } from "@/lib/api/schemas/gyms.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { geocodeAddress } from "@/lib/services/geocoding.service";
import { GymInventoryService } from "@/lib/services/gym/gym-inventory.service";
import { GymDomainService } from "@/lib/services/gym-domain.service";
import { NextResponse } from "@/runtime/next-server";

export const GET = createSafeHandler(
  async ({ gymContext, req }) => {
    const gymId = gymContext?.gymId;
    if (!gymId) {
      return NextResponse.json(
        { error: "Contexto da academia invalido" },
        { status: 400 },
      );
    }

    const fresh = new URL(req.url).searchParams.get("fresh") === "1";
    const profile = await GymInventoryService.getProfile(gymId, { fresh });
    return NextResponse.json({
      hasProfile: !!profile,
      profile,
    });
  },
  { auth: "gym" },
);

export const PATCH = createSafeHandler(
  async ({ gymContext, body }) => {
    const gymId = gymContext?.gymId;
    if (!gymId) {
      return NextResponse.json(
        { error: "Contexto da academia invalido" },
        { status: 400 },
      );
    }

    let updateBody = { ...body };

    if (body.address != null && String(body.address).trim() !== "") {
      const coords = await geocodeAddress(String(body.address).trim());
      if (coords) {
        updateBody = {
          ...updateBody,
          latitude: coords.lat,
          longitude: coords.lng,
        };
      }
    }

    await GymDomainService.updateGymProfile(gymId, {
      name: updateBody.name,
      address: updateBody.address ?? undefined,
      phone: updateBody.phone ?? undefined,
      cnpj: updateBody.cnpj ?? null,
      latitude: updateBody.latitude ?? null,
      longitude: updateBody.longitude ?? null,
      pixKey: updateBody.pixKey ?? null,
      pixKeyType: updateBody.pixKeyType ?? null,
      openingHours: updateBody.openingHours
        ? {
            ...updateBody.openingHours,
            byDay: updateBody.openingHours.byDay ?? undefined,
          }
        : null,
    });
    const profile = await GymInventoryService.getProfile(gymId, {
      fresh: true,
    });
    return NextResponse.json({ profile });
  },
  {
    auth: "gym",
    schema: { body: updateGymProfileSchema },
  },
);
