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

    // Buscar memberships do aluno
    const memberships = await db.gymMembership.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
            logo: true,
            address: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            type: true,
            benefits: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    // Transformar para formato esperado
    const formattedMemberships = memberships.map((membership) => {
      // Parse benefits
      let benefits: string[] = [];
      if (membership.plan?.benefits) {
        try {
          benefits = JSON.parse(membership.plan.benefits);
        } catch (e) {
          // Ignorar erro de parse
        }
      }

      return {
        id: membership.id,
        gymId: membership.gymId,
        gymName: membership.gym.name,
        gymLogo: membership.gym.logo || undefined,
        gymAddress: membership.gym.address,
        planId: membership.planId || undefined,
        planName: membership.plan?.name || undefined,
        planType: membership.plan?.type as
          | "monthly"
          | "quarterly"
          | "semi-annual"
          | "annual"
          | undefined,
        startDate: membership.startDate,
        nextBillingDate: membership.nextBillingDate || undefined,
        amount: membership.amount,
        status: membership.status as
          | "active"
          | "suspended"
          | "canceled"
          | "pending",
        autoRenew: membership.autoRenew,
        benefits: benefits,
      };
    });

    return NextResponse.json({ memberships: formattedMemberships });
  } catch (error: any) {
    console.error("Erro ao buscar memberships:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar memberships" },
      { status: 500 }
    );
  }
}

