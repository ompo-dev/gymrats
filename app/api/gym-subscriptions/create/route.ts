import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/utils/session";
import { createGymSubscriptionBilling } from "@/lib/utils/subscription";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session?.user?.gym) {
      return NextResponse.json(
        { error: "Academia não encontrada" },
        { status: 404 }
      );
    }

    const { plan, billingPeriod = "monthly" } = await request.json();

    if (
      !plan ||
      (plan !== "basic" && plan !== "premium" && plan !== "enterprise")
    ) {
      return NextResponse.json(
        { error: "Plano inválido" },
        { status: 400 }
      );
    }

    if (billingPeriod !== "monthly" && billingPeriod !== "annual") {
      return NextResponse.json(
        { error: "Período de cobrança inválido" },
        { status: 400 }
      );
    }

    const activeStudents = await db.gymMembership.count({
      where: {
        gymId: session.user.gym.id,
        status: "active",
      },
    });

    const billing = await createGymSubscriptionBilling(
      session.user.gym.id,
      plan,
      activeStudents,
      billingPeriod
    );

    return NextResponse.json({
      success: true,
      billingUrl: billing.url,
      billingId: billing.id,
    });
  } catch (error: any) {
    console.error("Erro ao criar assinatura:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar assinatura" },
      { status: 500 }
    );
  }
}

