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

    const subscription = await db.subscription.findUnique({
      where: { studentId },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      );
    }

    await db.subscription.update({
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

