import { NextResponse } from "@/runtime/next-server";
import {
  gymEquipmentIdParamsSchema,
  updateGymEquipmentSchema,
} from "@/lib/api/schemas/gyms.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymDomainService } from "@/lib/services/gym-domain.service";
import { GymInventoryService } from "@/lib/services/gym/gym-inventory.service";

export const GET = createSafeHandler(
  async ({ gymContext, params }) => {
    const equipment = await GymInventoryService.getEquipmentById(
      gymContext?.gymId,
      params.equipId,
    );

    if (!equipment) {
      return NextResponse.json(
        { error: "Equipamento não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ equipment });
  },
  {
    auth: "gym",
    schema: {
      params: gymEquipmentIdParamsSchema,
    },
  },
);

export const PATCH = createSafeHandler(
  async ({ gymContext, params, body }) => {
    const equipment = await GymDomainService.updateEquipment(
      gymContext?.gymId,
      params.equipId,
      body,
    );
    return NextResponse.json({ equipment });
  },
  {
    auth: "gym",
    schema: {
      params: gymEquipmentIdParamsSchema,
      body: updateGymEquipmentSchema,
    },
  },
);

export const DELETE = createSafeHandler(
  async ({ gymContext, params }) => {
    await GymDomainService.deleteEquipment(gymContext?.gymId, params.equipId);
    return NextResponse.json({ success: true });
  },
  {
    auth: "gym",
    schema: { params: gymEquipmentIdParamsSchema },
  },
);
