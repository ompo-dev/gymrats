import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.student) {
      return NextResponse.json(
        { error: "Sessão inválida ou usuário não é aluno" },
        { status: 401 }
      );
    }

    const studentId = session.user.student.id;

    // Ler query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Buscar pagamentos do aluno
    const payments = await db.payment.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Transformar para formato esperado
    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      gymId: payment.gymId,
      gymName: payment.gym.name,
      planName: payment.plan?.name || undefined,
      amount: payment.amount,
      date: payment.date,
      dueDate: payment.dueDate,
      status: payment.status as
        | "paid"
        | "pending"
        | "overdue"
        | "canceled",
      paymentMethod: payment.paymentMethod as
        | "credit-card"
        | "debit-card"
        | "pix"
        | "cash"
        | undefined,
      reference: payment.reference || undefined,
    }));

    // Contar total de registros
    const total = await db.payment.count({
      where: {
        studentId: studentId,
      },
    });

    return NextResponse.json({
      payments: formattedPayments,
      total: total,
      limit: limit,
      offset: offset,
    });
  } catch (error: any) {
    console.error("Erro ao buscar pagamentos:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar pagamentos" },
      { status: 500 }
    );
  }
}

