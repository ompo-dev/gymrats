import { NextResponse } from "next/server";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { GymDomainService } from "@/lib/services/gym-domain.service";

const checkInSchema = z.object({
  studentId: z.string().min(1, "studentId é obrigatório"),
});

export const POST = createSafeHandler(
  async ({ body, gymContext }) => {
    const { gymId } = gymContext!;
    const { studentId } = body;

    // Verificar se aluno é membro ativo
    const membership = await db.gymMembership.findFirst({
      where: { gymId, studentId, status: "active" },
    });

    let usedProAccess = false;

    if (!membership) {
      // Tentar Cross-Origin Access (Aluno PRO em Academia Enterprise)
      const studentSubscription = await db.subscription.findUnique({
        where: { studentId },
      });

      const gymSubscription = await db.gymSubscription.findUnique({
        where: { gymId },
      });

      const isStudentPro =
        studentSubscription?.status === "active" &&
        String(studentSubscription.plan).toLowerCase().includes("pro");

      const isGymEnterprise =
        gymSubscription?.status === "active" &&
        String(gymSubscription.plan).toLowerCase().includes("enterprise");

      if (isStudentPro && isGymEnterprise) {
        usedProAccess = true;
      } else {
        return NextResponse.json(
          { error: "Aluno não é membro ativo e não possui acesso de rede válido nesta academia" },
          { status: 403 },
        );
      }
    }

    // Verificar se já tem check-in aberto hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingOpen = await db.checkIn.findFirst({
      where: {
        gymId,
        studentId,
        timestamp: { gte: today },
        checkOut: null,
      },
    });

    if (existingOpen) {
      return NextResponse.json(
        {
          error: "Aluno já tem check-in aberto hoje",
          checkInId: existingOpen.id,
        },
        { status: 409 },
      );
    }

    // Buscar nome do aluno
    const studentUser = await db.user.findFirst({
      where: { student: { id: studentId } },
      select: { name: true },
    });

    const checkIn = await db.checkIn.create({
      data: {
        gymId,
        studentId,
        studentName: studentUser?.name ?? "Aluno",
      },
    });

    // Adicionar XP ao GymProfile (+5 XP por check-in)
    await GymDomainService.addGymXP(gymId, 5);

    if (usedProAccess) {
      await db.proGymAccess.create({
        data: {
          gymId,
          studentId,
          type: "check_in",
        },
      });
    }

    return NextResponse.json({ success: true, checkIn }, { status: 201 });
  },
  {
    auth: "gym",
    schema: { body: checkInSchema },
  },
);
