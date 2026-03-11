import { z } from "zod";
import { type NextRequest, NextResponse } from "@/runtime/next-server";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
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
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario nao encontrado" },
        { status: 404 },
      );
    }

    const response = NextResponse.json({
      user,
      session: {
        id: verifiedSession.session.id,
        token: verifiedSession.session.token,
      },
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
