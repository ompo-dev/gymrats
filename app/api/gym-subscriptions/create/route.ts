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
    if (!session) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
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

    const { plan, billingPeriod = "monthly" } = await request.json();

    if (
      !plan ||
      (plan !== "basic" && plan !== "premium" && plan !== "enterprise")
    ) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    if (billingPeriod !== "monthly" && billingPeriod !== "annual") {
      return NextResponse.json(
        { error: "Período de cobrança inválido" },
        { status: 400 }
      );
    }

    const activeStudents = await db.gymMembership.count({
      where: {
        gymId,
        status: "active",
      },
    });

    // Verificar se existe subscription com trial ativo
    const existingSubscription = await db.gymSubscription.findUnique({
      where: { gymId },
    });

    const now = new Date();
    const planPrices = {
      basic: { base: 150, perStudent: 1.5 },
      premium: { base: 250, perStudent: 1 },
      enterprise: { base: 400, perStudent: 0.5 },
    };
    const prices = planPrices[plan];

    // Calcular período
    const periodEnd = new Date(now);
    if (billingPeriod === "annual") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Se existe subscription com trial, atualizar para desativar trial
    if (existingSubscription) {
      await db.gymSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          plan,
          billingPeriod,
          status: "active", // Mudar para active (o webhook vai confirmar quando pagar)
          basePrice: prices.base,
          pricePerStudent: billingPeriod === "annual" ? 0 : prices.perStudent,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          // Desativar trial
          trialStart: null,
          trialEnd: null,
          canceledAt: null,
          cancelAtPeriodEnd: false,
        },
      });
    }

    const billing = await createGymSubscriptionBilling(
      gymId,
      plan,
      activeStudents,
      billingPeriod
    );

    // Validar se billing tem as propriedades necessárias
    if (!billing || !billing.id) {
      console.error("Billing criado mas sem ID:", billing);
      throw new Error(
        "Erro ao criar cobrança: resposta inválida da AbacatePay"
      );
    }

    // Atualizar subscription com billingId
    if (existingSubscription) {
      await db.gymSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          abacatePayBillingId: billing.id,
        },
      });
    }

    // Garantir que apenas propriedades serializáveis sejam retornadas
    const responseData = {
      success: true,
      billingUrl: String(billing.url || ""),
      billingId: String(billing.id || ""),
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Erro ao criar assinatura:", error);
    console.error("Stack trace:", error.stack);
    return NextResponse.json(
      { error: error.message || "Erro ao criar assinatura" },
      { status: 500 }
    );
  }
}
