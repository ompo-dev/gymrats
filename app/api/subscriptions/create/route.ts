import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/utils/session";
import { createStudentSubscriptionBilling } from "@/lib/utils/subscription";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session?.user?.student) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const { plan } = await request.json();

    if (!plan || (plan !== "monthly" && plan !== "annual")) {
      return NextResponse.json(
        { error: "Plano inválido" },
        { status: 400 }
      );
    }

    const billing = await createStudentSubscriptionBilling(
      session.user.student.id,
      plan
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

