import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";

export async function GET(request: NextRequest) {
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

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        gym: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!user || !user.gym) {
      return NextResponse.json({
        hasProfile: false,
      });
    }

    const hasProfile =
      !!user.gym.profile &&
      user.gym.name !== null &&
      user.gym.address !== null &&
      user.gym.phone !== null &&
      user.gym.email !== null;

    return NextResponse.json({
      hasProfile,
      profile: user.gym.profile
        ? {
            name: user.gym.name,
            address: user.gym.address,
            phone: user.gym.phone,
            email: user.gym.email,
            cnpj: user.gym.cnpj,
            equipmentCount: user.gym.profile.equipmentCount,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Erro ao buscar perfil:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar perfil" },
      { status: 500 }
    );
  }
}
