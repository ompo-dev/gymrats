import { NextResponse } from "next/server";
import { createGymSchema } from "@/lib/api/schemas/gyms.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

export const POST = createSafeHandler(
  async ({ body, gymContext }) => {
    const userId = gymContext?.user.id;
    const { name, address, phone, email, cnpj } = body;

    const existingGyms = await db.gym.findMany({
      where: { userId },
      include: { subscription: true },
    });

    if (existingGyms.length > 0) {
      const hasPaidSubscription = existingGyms.some(
        (gym) => gym.subscription?.status === "active",
      );
      if (!hasPaidSubscription) {
        return NextResponse.json(
          {
            error:
              "Para criar múltiplas academias, é necessário plano ativo em pelo menos uma academia",
          },
          { status: 400 },
        );
      }
    }

    if (cnpj) {
      const existingCnpj = await db.gym.findUnique({ where: { cnpj } });
      if (existingCnpj) {
        return NextResponse.json(
          { error: "CNPJ já cadastrado" },
          { status: 400 },
        );
      }
    }

    const newGym = await db.gym.create({
      data: {
        userId,
        name,
        address,
        phone,
        email,
        cnpj: cnpj || null,
        plan: "basic",
        isActive: true,
      },
    });

    await db.gymProfile.create({
      data: {
        gymId: newGym.id,
        totalStudents: 0,
        activeStudents: 0,
        equipmentCount: 0,
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        currentStreak: 0,
        longestStreak: 0,
      },
    });

    await db.gymStats.create({ data: { gymId: newGym.id } });

    await db.user.update({
      where: { id: userId },
      data: { activeGymId: newGym.id },
    });

    await db.gymUserPreference.upsert({
      where: { userId },
      update: {
        lastActiveGymId: newGym.id,
        updatedAt: new Date(),
      },
      create: {
        userId,
        lastActiveGymId: newGym.id,
      },
    });

    return NextResponse.json({
      gym: {
        id: newGym.id,
        name: newGym.name,
        address: newGym.address,
        email: newGym.email,
        plan: newGym.plan,
      },
    });
  },
  {
    auth: "gym",
    schema: { body: createGymSchema },
  },
);
