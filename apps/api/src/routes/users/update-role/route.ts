import type { Gym, Student } from "@prisma/client";
import { requireAdmin } from "@/lib/api/middleware/auth.middleware";
import { updateUserRoleSchema } from "@/lib/api/schemas";
import { invalidateAuthSessionCacheForUser } from "@/lib/auth/session-cache";
import { db } from "@/lib/db";
import { log } from "@/lib/observability";
import { auditLog } from "@/lib/security/audit-log";
import {
  initializeGymTrial,
  initializeStudentTrial,
} from "@/lib/utils/auto-trial";
import { type NextRequest, NextResponse } from "@/runtime/next-server";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) {
      return auth.response;
    }

    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const validation = updateUserRoleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Erro de validacao", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const role = validation.data.role as "STUDENT" | "GYM" | "PERSONAL";
    const userId = validation.data.userId;

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { role },
    });

    if (role === "STUDENT") {
      const existingStudent = await db.student.findUnique({
        where: { userId },
      });

      let student: Student;
      if (!existingStudent) {
        student = await db.student.create({
          data: { userId },
        });
      } else {
        student = existingStudent;
      }

      await initializeStudentTrial(student.id);
    } else if (role === "GYM") {
      const existingGym = await db.gym.findFirst({
        where: { userId },
      });

      let gym: Gym;
      if (!existingGym) {
        gym = await db.gym.create({
          data: {
            userId,
            name: updatedUser.name,
            address: "",
            phone: "",
            email: updatedUser.email,
          },
        });
      } else {
        gym = existingGym;
      }

      await initializeGymTrial(gym.id);
    } else if (role === "PERSONAL") {
      const existingPersonal = await db.personal.findUnique({
        where: { userId },
      });
      if (!existingPersonal) {
        await db.personal.create({
          data: {
            userId,
            name: updatedUser.name,
            email: updatedUser.email,
          },
        });
      }
    }

    await auditLog({
      action: "ROLE:CHANGED",
      actorId: auth.userId,
      targetId: updatedUser.id,
      request,
      payload: {
        role: updatedUser.role,
      },
      result: "SUCCESS",
    });

    await invalidateAuthSessionCacheForUser(updatedUser.id);

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    log.error("Erro ao atualizar role", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
