import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/utils/session";
import { signInSchema } from "@/lib/api/schemas";
import { validateBody } from "@/lib/api/middleware/validation.middleware";

export async function POST(request: NextRequest) {
  try {
    // Validar body com Zod
    const validation = await validateBody(request, signInSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { email, password } = validation.data;

    const user = await db.user.findUnique({
      where: { email },
      include: {
        student: {
          select: {
            id: true,
          },
        },
        gyms: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      );
    }

    const sessionToken = await createSession(user.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      session: {
        token: sessionToken,
      },
    });

    response.cookies.set("auth_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Erro ao fazer login:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao fazer login";
    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
