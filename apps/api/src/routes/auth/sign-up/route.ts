import type { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { signUpSchema } from "@/lib/api/schemas";
import { createSessionPayload } from "@/lib/auth/session-payload";
import { db } from "@/lib/db";
import { log } from "@/lib/observability";
import { type SignUpInput, signUpUseCase } from "@/lib/use-cases/auth";
import { createSession } from "@/lib/utils/session";
import { type NextRequest, NextResponse } from "@/runtime/next-server";

export async function POST(request: NextRequest) {
  try {
    // Validar body com Zod
    const validation = await validateBody(request, signUpSchema);
    if (!validation.success) {
      return validation.response;
    }

    const result = await signUpUseCase(
      {
        findUserByEmail: async (email) => {
          return db.user.findUnique({ where: { email } });
        },
        hashPassword: (plain) => bcrypt.hash(plain, 10),
        createUser: async (data) => {
          return db.user.create({
            data: {
              ...data,
              role: data.role as UserRole,
            },
          });
        },
        createStudent: async (userId) => {
          await db.student.create({ data: { userId } });
        },
        createSession,
      },
      validation.data as SignUpInput,
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.status },
      );
    }

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
    log.error("Erro ao criar conta", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
