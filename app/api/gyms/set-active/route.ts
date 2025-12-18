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
    const { gymId } = await request.json();

    if (!gymId) {
      return NextResponse.json(
        { error: "gymId é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se a academia pertence ao usuário
    const gym = await db.gym.findFirst({
      where: {
        id: gymId,
        userId,
      },
    });

    if (!gym) {
      return NextResponse.json(
        { error: "Academia não encontrada" },
        { status: 404 }
      );
    }

    // Atualizar activeGymId no usuário
    await db.user.update({
      where: { id: userId },
      data: { activeGymId: gymId },
    });

    // Atualizar preferência do usuário
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

    return NextResponse.json({ success: true, activeGymId: gymId });
  } catch (error: any) {
    console.error("Erro ao alterar academia ativa:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao alterar academia ativa" },
      { status: 500 }
    );
  }
}
