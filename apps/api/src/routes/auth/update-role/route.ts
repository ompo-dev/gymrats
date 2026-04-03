import { requireAdmin } from "@/lib/api/middleware/auth.middleware";
import { updateRoleSchema } from "@/lib/api/schemas";
import { invalidateAuthSessionCacheForUser } from "@/lib/auth/session-cache";
import { db } from "@/lib/db";
import { log } from "@/lib/observability";
import { auditLog } from "@/lib/security/audit-log";
import { type UpdateRoleInput, updateRoleUseCase } from "@/lib/use-cases/auth";
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

    if (body?.role === "ADMIN") {
      await auditLog({
        action: "ROLE:ESCALATION_ATTEMPT",
        actorId: auth.userId,
        targetId: typeof body.userId === "string" ? body.userId : null,
        request,
        payload: {
          attemptedRole: body.role,
          path: request.nextUrl.pathname,
        },
        result: "FAILURE",
      });

      return NextResponse.json(
        { error: "Promocao publica para ADMIN nao e permitida" },
        { status: 403 },
      );
    }

    const validation = updateRoleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Erro de validacao", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const result = await updateRoleUseCase(
      {
        findUserById: (id) =>
          db.user.findUnique({
            where: { id },
            include: { student: true, gyms: true, personal: true },
          }) as unknown as Promise<
            import("@/lib/use-cases/auth").UserSummary | null
          >,
        updateUserRole: (id, role) =>
          db.user.update({ where: { id }, data: { role } }),
        findStudentByUserId: (id) =>
          db.student.findUnique({ where: { userId: id } }),
        createStudent: (id) =>
          db.student.create({ data: { userId: id } }).then(() => undefined),
        findGymByUserId: (id) => db.gym.findFirst({ where: { userId: id } }),
        findPersonalByUserId: (id) =>
          db.personal.findUnique({ where: { userId: id } }),
        createGym: (data) => db.gym.create({ data }).then(() => undefined),
        createPersonal: (data) =>
          db.personal.create({ data }).then(() => undefined),
      },
      validation.data as UpdateRoleInput,
    );

    if (!result.ok) {
      await auditLog({
        action: "ROLE:CHANGED",
        actorId: auth.userId,
        targetId: validation.data.userId,
        request,
        payload: {
          role: validation.data.role,
          error: result.error.message,
        },
        result: "FAILURE",
      });

      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.status },
      );
    }

    await auditLog({
      action: "ROLE:CHANGED",
      actorId: auth.userId,
      targetId: result.data.user.id,
      request,
      payload: {
        role: result.data.user.role,
      },
      result: "SUCCESS",
    });

    await invalidateAuthSessionCacheForUser(result.data.user.id);

    return NextResponse.json(result.data);
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
