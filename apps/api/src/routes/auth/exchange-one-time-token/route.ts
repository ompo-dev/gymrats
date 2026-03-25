import { z } from "zod";
import { type NextRequest, NextResponse } from "@/runtime/next-server";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { createSessionPayload } from "@/lib/auth/session-payload";
import { auth } from "@/lib/auth-config";
import { db } from "@/lib/db";

const exchangeOneTimeTokenSchema = z.object({
  token: z.string().min(1, "Token eh obrigatorio"),
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
    console.error("Erro ao trocar one-time token:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao trocar token";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
