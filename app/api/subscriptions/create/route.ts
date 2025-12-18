import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/utils/session";
import { createStudentSubscriptionBilling } from "@/lib/utils/subscription";
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

    // Se for ADMIN, garantir que tenha perfil de student
    let studentId: string | null = null;
    if (session.user.role === "ADMIN") {
      const existingStudent = await db.student.findUnique({
        where: { userId: session.user.id },
      });

      if (!existingStudent) {
        const newStudent = await db.student.create({
          data: {
            userId: session.user.id,
          },
        });
        studentId = newStudent.id;
      } else {
        studentId = existingStudent.id;
      }
    } else if (session.user.student?.id) {
      studentId = session.user.student.id;
    }

    if (!studentId) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const { plan } = await request.json();

    if (!plan || (plan !== "monthly" && plan !== "annual")) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    // Verificar se existe subscription com trial ativo
    const existingSubscription = await db.subscription.findUnique({
      where: { studentId },
    });

    const now = new Date();
    const periodEnd = new Date(now);
    if (plan === "annual") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Se existe subscription com trial, atualizar para desativar trial
    if (existingSubscription) {
      await db.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          plan: "premium",
          status: "active", // Mudar para active (o webhook vai confirmar quando pagar)
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

    const billing = await createStudentSubscriptionBilling(studentId, plan);

    // Validar se billing tem as propriedades necessárias
    if (!billing || !billing.id) {
      console.error("Billing criado mas sem ID:", billing);
      throw new Error(
        "Erro ao criar cobrança: resposta inválida da AbacatePay"
      );
    }

    // Atualizar subscription com billingId
    if (existingSubscription) {
      await db.subscription.update({
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
