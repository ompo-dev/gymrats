import { type NextRequest, NextResponse } from "@/runtime/next-server";
import { requireAuth } from "@/lib/api/middleware/auth.middleware";
import { db } from "@/lib/db";
import { ensurePersonalRole } from "@/lib/utils/ensure-user-role";

type PersonalOnboardingBody = {
  name: string;
  phone?: string;
  bio?: string;
  atendimentoPresencial: boolean;
  atendimentoRemoto: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return auth.response;
    }

    if (auth.user.role !== "PENDING" && auth.user.role !== "PERSONAL") {
      return NextResponse.json({ error: "Fluxo invalido" }, { status: 400 });
    }

    const body = (await request.json()) as PersonalOnboardingBody;
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Nome deve ter pelo menos 2 caracteres." },
        { status: 400 },
      );
    }

    const ensured = await ensurePersonalRole(
      auth.userId,
      (auth.user.name as string) || name,
      (auth.user.email as string) || "",
    );

    if (!ensured.ok || !ensured.personalId) {
      return NextResponse.json(
        {
          error: ensured.ok
            ? "Erro ao criar personal"
            : ensured.error || "Erro ao criar personal",
        },
        { status: 400 },
      );
    }

    await db.personal.update({
      where: { id: ensured.personalId },
      data: {
        name,
        phone:
          typeof body.phone === "string" ? body.phone.trim() || null : null,
        bio: typeof body.bio === "string" ? body.bio.trim().slice(0, 500) : null,
        atendimentoPresencial: Boolean(body.atendimentoPresencial),
        atendimentoRemoto: Boolean(body.atendimentoRemoto),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/personals/onboarding] Erro:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao salvar onboarding",
      },
      { status: 500 },
    );
  }
}
