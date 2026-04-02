import bcrypt from "bcryptjs";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { signInSchema } from "@/lib/api/schemas";
import { createSessionPayload } from "@/lib/auth/session-payload";
import { db } from "@/lib/db";
import { log } from "@/lib/observability";
import { auditLog } from "@/lib/security/audit-log";
import { type SignInInput, signInUseCase } from "@/lib/use-cases/auth";
import { createSession } from "@/lib/utils/session";
import { type NextRequest, NextResponse } from "@/runtime/next-server";

export async function POST(request: NextRequest) {
  try {
    const validation = await validateBody(request, signInSchema);
    if (!validation.success) {
      return validation.response;
    }

    const result = await signInUseCase(
      {
        findUserByEmail: (email) =>
          db.user.findUnique({
            where: { email },
            include: {
              student: { select: { id: true } },
              gyms: { select: { id: true } },
            },
          }),
        comparePassword: (plain, hashed) => bcrypt.compare(plain, hashed),
        createSession,
      },
      validation.data as SignInInput,
    );

    if (!result.ok) {
      await auditLog({
        action: "AUTH:FAILED_LOGIN",
        request,
        payload: {
          email: validation.data.email,
        },
        result: "FAILURE",
      });

      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.status },
      );
    }

    await auditLog({
      action: "AUTH:LOGIN",
      actorId: result.data.user.id,
      targetId: result.data.user.id,
      request,
      payload: {
        role: result.data.user.role,
      },
      result: "SUCCESS",
    });

    const response = NextResponse.json({
      user: result.data.user,
      session: createSessionPayload(request, {
        id: result.data.sessionToken,
        token: result.data.session.token,
      }),
    });

    response.cookies.set("auth_token", result.data.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error) {
    log.error("Erro ao fazer login", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
      },
      { status: 500 },
    );
  }
}
