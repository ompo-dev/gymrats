import { requireAuth } from "@/lib/api/middleware/auth.middleware";
import { db } from "@/lib/db";
import { log } from "@/lib/observability";
import { geocodeAddress } from "@/lib/services/geocoding.service";
import { GymInventoryService } from "@/lib/services/gym/gym-inventory.service";
import { ensureGymRole } from "@/lib/utils/ensure-user-role";
import { type NextRequest, NextResponse } from "@/runtime/next-server";

type GymEquipmentInput = {
  name: string;
  type: string;
};

type GymOnboardingBody = {
  name: string;
  address: string;
  addressNumber?: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  cnpj?: string;
  equipment?: GymEquipmentInput[];
  createAdditional?: boolean;
};

function buildFullAddress(data: GymOnboardingBody): string {
  if (data.addressNumber && data.addressNumber.trim().length > 0) {
    return `${data.address}, ${data.addressNumber}, ${data.city}, ${data.state} - ${data.zipCode}`;
  }

  return `${data.address}, ${data.city}, ${data.state} - ${data.zipCode}`;
}

async function syncActiveGym(userId: string, gymId: string) {
  await db.user.update({
    where: { id: userId },
    data: { activeGymId: gymId },
  });

  await db.gymUserPreference.upsert({
    where: { userId },
    update: {
      lastActiveGymId: gymId,
      updatedAt: new Date(),
    },
    create: {
      userId,
      lastActiveGymId: gymId,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return auth.response;
    }

    const body = (await request.json()) as GymOnboardingBody;
    const payload = {
      ...body,
      equipment: Array.isArray(body.equipment) ? body.equipment : [],
    };

    const fullAddress = buildFullAddress(payload);
    const coords = await geocodeAddress(fullAddress);

    if (payload.createAdditional) {
      const newGym = await GymInventoryService.createGym(auth.userId, {
        name: payload.name,
        address: fullAddress,
        phone: payload.phone,
        email: payload.email,
        cnpj: payload.cnpj,
        equipment: payload.equipment,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      });

      await syncActiveGym(auth.userId, newGym.id);

      return NextResponse.json({
        success: true,
        gymId: newGym.id,
      });
    }

    if (auth.user.role !== "PENDING" && auth.user.role !== "GYM") {
      return NextResponse.json({ error: "Fluxo invalido" }, { status: 400 });
    }

    let gymId = auth.user.activeGymId as string | undefined;
    if (!gymId) {
      const ensured = await ensureGymRole(
        auth.userId,
        (auth.user.name as string) || payload.name,
        (auth.user.email as string) || payload.email,
      );

      if (!ensured.ok) {
        return NextResponse.json(
          { error: ensured.error || "Erro ao criar academia" },
          { status: 400 },
        );
      }

      gymId = ensured.gymId;
    }

    const gyms = await db.gym.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    const primaryGymId = gymId || gyms[0]?.id;

    if (primaryGymId) {
      await GymInventoryService.updateOnboarding(primaryGymId, {
        name: payload.name,
        address: fullAddress,
        phone: payload.phone,
        email: payload.email,
        cnpj: payload.cnpj,
        equipment: payload.equipment,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      });

      await syncActiveGym(auth.userId, primaryGymId);

      return NextResponse.json({
        success: true,
        gymId: primaryGymId,
      });
    }

    const createdGym = await GymInventoryService.createGym(auth.userId, {
      name: payload.name,
      address: fullAddress,
      phone: payload.phone,
      email: payload.email,
      cnpj: payload.cnpj,
      equipment: payload.equipment,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
    });

    await syncActiveGym(auth.userId, createdGym.id);

    return NextResponse.json({
      success: true,
      gymId: createdGym.id,
    });
  } catch (error) {
    log.error("[POST /api/gyms/onboarding] Erro", { error });
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao salvar onboarding",
      },
      { status: 500 },
    );
  }
}
