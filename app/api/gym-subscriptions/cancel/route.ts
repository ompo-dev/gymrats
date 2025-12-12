import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/utils/session";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 401 }
      );
    }

    // Se for ADMIN, garantir que tenha perfil de gym
    let gymId: string | null = null;
    if (session.user.role === "ADMIN") {
      const existingGym = await db.gym.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!existingGym) {
        const newGym = await db.gym.create({
          data: {
            userId: session.user.id,
            name: session.user.name,
            address: "",
            phone: "",
            email: session.user.email,
            plan: "basic",
          },
        });
        gymId = newGym.id;
      } else {
        gymId = existingGym.id;
      }
    } else if (session.user.gym?.id) {
      gymId = session.user.gym.id;
    }

    if (!gymId) {
      return NextResponse.json(
        { error: "Academia não encontrada" },
        { status: 404 }
      );
    }

    const subscription = await db.gymSubscription.findUnique({
      where: { gymId },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      );
    }

    await db.gymSubscription.update({
      where: { id: subscription.id },
      data: {
        status: "canceled",
        canceledAt: new Date(),
        cancelAtPeriodEnd: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Assinatura cancelada com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao cancelar assinatura:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao cancelar assinatura" },
      { status: 500 }
    );
  }
}

