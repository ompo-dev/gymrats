import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";

export async function POST(request: NextRequest) {
  try {
    const sessionToken =
      request.cookies.get("auth_token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!sessionToken) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    const userId = session.userId;
    const body = await request.json();
    const { name, address, phone, email, cnpj } = body;

    // Validar campos obrigatórios
    if (!name || !address || !phone || !email) {
      return NextResponse.json(
        { error: "Todos os campos obrigatórios devem ser preenchidos" },
        { status: 400 }
      );
    }

    // Buscar academias existentes do usuário
    const existingGyms = await db.gym.findMany({
      where: { userId },
      include: {
        subscription: true,
      },
    });

    // Verificar se usuário pode criar múltiplas academias
    // Só pode criar segunda+ academia se tiver pelo menos UMA com plano ativo (não trial)
    if (existingGyms.length > 0) {
      const hasPaidSubscription = existingGyms.some((gym) => {
        if (!gym.subscription) return false;
        return gym.subscription.status === "active";
      });

      if (!hasPaidSubscription) {
        return NextResponse.json(
          {
            error:
              "Para criar múltiplas academias, você precisa ter pelo menos uma academia com plano ativo (não trial)",
          },
          { status: 403 }
        );
      }
    }

    // Verificar se CNPJ já existe (se fornecido)
    if (cnpj) {
      const existingCnpj = await db.gym.findUnique({
        where: { cnpj },
      });

      if (existingCnpj) {
        return NextResponse.json(
          { error: "CNPJ já cadastrado" },
          { status: 400 }
        );
      }
    }

    // Criar nova academia
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

    // Criar perfil da academia
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

    // Criar stats da academia
    await db.gymStats.create({
      data: {
        gymId: newGym.id,
      },
    });

    // Definir como academia ativa
    await db.user.update({
      where: { id: userId },
      data: { activeGymId: newGym.id },
    });

    // Atualizar preferência
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
      success: true,
      gym: {
        id: newGym.id,
        name: newGym.name,
        address: newGym.address,
        email: newGym.email,
        plan: newGym.plan,
      },
    });
  } catch (error: any) {
    console.error("Erro ao criar academia:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar academia" },
      { status: 500 }
    );
  }
}
