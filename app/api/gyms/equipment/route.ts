import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymDomainService } from "@/lib/services/gym-domain.service";
import { z } from "zod";

const createEquipmentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.string().min(1, "Tipo é obrigatório"),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
});

export const POST = createSafeHandler(
  async ({ body, gymContext }) => {
    const { gymId } = gymContext!;
    const { name, type, brand, model, serialNumber, purchaseDate } = body;

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
  }
);
