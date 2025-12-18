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
        gyms: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!user || !user.gyms || user.gyms.length === 0) {
      return NextResponse.json({
        hasProfile: false,
      });
    }

    // Pegar a primeira academia do usuário (ou a ativa se tiver activeGymId no futuro)
    const gym = user.gyms[0];

    const hasProfile =
      !!gym.profile &&
      gym.name !== null &&
      gym.address !== null &&
      gym.phone !== null &&
      gym.email !== null;

    return NextResponse.json({
      hasProfile,
      profile: gym.profile
        ? {
            name: gym.name,
            address: gym.address,
            phone: gym.phone,
            email: gym.email,
            cnpj: gym.cnpj,
            equipmentCount: gym.profile.equipmentCount,
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
