import { z } from "zod";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { createSessionPayload } from "@/lib/auth/session-payload";
import { auth } from "@/lib/auth-config";
import { db } from "@/lib/db";
import { log } from "@/lib/observability";
import { type NextRequest, NextResponse } from "@/runtime/next-server";

const exchangeOneTimeTokenSchema = z.object({
  token: z.string().min(1, "Token eh obrigatorio").max(2048),
});

export async function POST(request: NextRequest) {
  try {
    const validation = await validateBody(request, exchangeOneTimeTokenSchema);
    if (!validation.success) {
      return validation.response;
    }

    const verifiedSession = await auth.api.verifyOneTimeToken({
      body: {
        token: validation.data.token,
      },
    });

    const user = await db.user.findUnique({
      where: { id: verifiedSession.user.id },
      include: {
        student: {
          select: {
            id: true,
            subscription: {
              select: {
                plan: true,
                status: true,
                currentPeriodEnd: true,
              },
            },
          },
        },
        personal: {
          select: {
            id: true,
          },
        },
        gyms: {
          select: {
            id: true,
            plan: true,
            subscription: {
              select: {
                plan: true,
                status: true,
                currentPeriodEnd: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario nao encontrado" },
        { status: 404 },
      );
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hasGym: user.role === "ADMIN" || user.gyms.length > 0,
        hasStudent: user.role === "ADMIN" || Boolean(user.student),
        activeGymId: user.activeGymId ?? null,
        gyms: user.gyms,
        student: user.student,
        personal: user.personal,
      },
      session: createSessionPayload(request, {
        id: verifiedSession.session.id,
        token: verifiedSession.session.token,
      }),
    });

    response.cookies.set("auth_token", verifiedSession.session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error) {
    log.error("Erro ao trocar one-time token", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
