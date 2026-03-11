import { NextResponse } from "@/runtime/next-server";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { GymInventoryService } from "@/lib/services/gym/gym-inventory.service";
import { GymDomainService } from "@/lib/services/gym-domain.service";

const createEquipmentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.string().min(1, "Tipo é obrigatório"),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
});

export const GET = createSafeHandler(
  async ({ gymContext }) => {
    const equipment = await GymInventoryService.getEquipment(gymContext?.gymId);
    return NextResponse.json({ equipment });
  },
  {
    auth: "gym",
  },
);

export const POST = createSafeHandler(
  async ({ body, gymContext }) => {
    const { gymId } = gymContext!;
    const { name, type, brand, model, purchaseDate } = body;
    const serialNumber = body.serialNumber?.trim() || null;

    if (serialNumber) {
      const duplicatedEquipment = await db.equipment.findFirst({
        where: { serialNumber },
        select: { id: true },
      });

      if (duplicatedEquipment) {
        return NextResponse.json(
          { error: "Numero de serie ja esta em uso." },
          { status: 409 },
        );
      }
    }

    const equipment = await db.equipment.create({
      data: {
        gymId,
        name,
        type,
        brand: brand || null,
        model: model || null,
        serialNumber: serialNumber || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        status: "available",
      },
    });

    // Atualizar contagem de equipamentos no perfil da academia
    await GymDomainService.incrementEquipmentCount(gymId);

    return NextResponse.json({ equipment }, { status: 201 });
  },
  {
    auth: "gym",
    schema: { body: createEquipmentSchema },
  },
);
