import {
  gymEquipmentIdParamsSchema,
  updateGymEquipmentSchema,
} from "@/lib/api/schemas/gyms.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { GymInventoryService } from "@/lib/services/gym/gym-inventory.service";
import { GymDomainService } from "@/lib/services/gym-domain.service";
import { NextResponse } from "@/runtime/next-server";

export const GET = createSafeHandler(
  async ({ gymContext, params }) => {
    const gymId = gymContext?.gymId;
    const equipId = params?.equipId;
    if (!gymId || !equipId) {
      return NextResponse.json(
        { error: "Contexto do equipamento invalido" },
        { status: 400 },
      );
    }

    const equipment = await GymInventoryService.getEquipmentById(
      gymId,
      equipId,
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
    const gymId = gymContext?.gymId;
    const equipId = params?.equipId;
    if (!gymId || !equipId) {
      return NextResponse.json(
        { error: "Contexto do equipamento invalido" },
        { status: 400 },
      );
    }

    const serialNumber = body.serialNumber?.trim() || null;

    if (serialNumber) {
      const duplicatedEquipment = await db.equipment.findFirst({
        where: {
          serialNumber,
          id: { not: equipId },
        },
        select: { id: true },
      });

      if (duplicatedEquipment) {
        return NextResponse.json(
          { error: "Numero de serie ja esta em uso." },
          { status: 409 },
        );
      }
    }

    const equipment = await GymDomainService.updateEquipment(gymId, equipId, {
      ...body,
      ...(body.serialNumber !== undefined ? { serialNumber } : {}),
    });
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
    const gymId = gymContext?.gymId;
    const equipId = params?.equipId;
    if (!gymId || !equipId) {
      return NextResponse.json(
        { error: "Contexto do equipamento invalido" },
        { status: 400 },
      );
    }

    await GymDomainService.deleteEquipment(gymId, equipId);
    return NextResponse.json({ success: true });
  },
  {
    auth: "gym",
    schema: { params: gymEquipmentIdParamsSchema },
  },
);
