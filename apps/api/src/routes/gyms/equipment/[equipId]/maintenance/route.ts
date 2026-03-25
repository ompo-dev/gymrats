import {
  createGymMaintenanceSchema,
  gymEquipmentIdParamsSchema,
} from "@/lib/api/schemas/gyms.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymDomainService } from "@/lib/services/gym-domain.service";
import { NextResponse } from "@/runtime/next-server";

export const POST = createSafeHandler(
  async ({ gymContext, params, body }) => {
    const gymId = gymContext?.gymId;
    const equipId = params?.equipId;
    if (!gymId || !equipId) {
      return NextResponse.json(
        { error: "Contexto da manutencao invalido" },
        { status: 400 },
      );
    }

    const record = await GymDomainService.createEquipmentMaintenance(
      gymId,
      equipId,
      body,
    );
    return NextResponse.json({ record }, { status: 201 });
  },
  {
    auth: "gym",
    schema: {
      params: gymEquipmentIdParamsSchema,
      body: createGymMaintenanceSchema,
    },
  },
);
