import { db } from "@/lib/db";
import { log } from "@/lib/observability";
import { PersonalFinancialService } from "@/lib/services/personal/personal-financial.service";
import { getPersonalContext } from "@/lib/utils/personal/personal-context";
import { NextResponse } from "@/runtime/next-server";

export async function GET(request: Request) {
  try {
    const { ctx, errorResponse } = await getPersonalContext(request);
    if (errorResponse || !ctx) {
      return (
        errorResponse ??
        NextResponse.json({ error: "N\u00e3o autenticado" }, { status: 401 })
      );
    }

    const fresh = new URL(request.url).searchParams.get("fresh") === "1";
    const coupons = await PersonalFinancialService.getCoupons(ctx.personalId, {
      fresh,
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    log.error("[GET /api/personals/coupons] Erro", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { ctx, errorResponse } = await getPersonalContext(request);
    if (errorResponse || !ctx) {
      return (
        errorResponse ??
        NextResponse.json({ error: "N\u00e3o autenticado" }, { status: 401 })
      );
    }

    const body = await request.json();
    const { code, notes, discountKind, discount, maxRedeems, expiresAt } =
      body as {
        code: string;
        notes?: string;
        discountKind: "PERCENTAGE" | "FIXED";
        discount: number;
        maxRedeems?: number;
        expiresAt?: string | null;
      };

    const codeTrim = (code ?? "").trim().toUpperCase();
    if (!codeTrim) {
      return NextResponse.json(
        { error: "C\u00f3digo do cupom \u00e9 obrigat\u00f3rio" },
        { status: 400 },
      );
    }

    const discountNum = Number(discount);
    if (Number.isNaN(discountNum) || discountNum <= 0) {
      return NextResponse.json(
        { error: "Valor do desconto deve ser maior que zero" },
        { status: 400 },
      );
    }

    const discountType = discountKind === "PERCENTAGE" ? "percentage" : "fixed";
    if (discountType === "percentage" && discountNum > 100) {
      return NextResponse.json(
        { error: "Porcentagem deve ser at\u00e9 100" },
        { status: 400 },
      );
    }

    const parsedExpiresAt = expiresAt ? new Date(expiresAt) : null;
    if (parsedExpiresAt && Number.isNaN(parsedExpiresAt.getTime())) {
      return NextResponse.json(
        { error: "Data de validade inv\u00e1lida" },
        { status: 400 },
      );
    }

    const existing = await db.personalCoupon.findFirst({
      where: { personalId: ctx.personalId, code: codeTrim },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Cupom com esse c\u00f3digo j\u00e1 existe" },
        { status: 400 },
      );
    }

    await db.personalCoupon.create({
      data: {
        personalId: ctx.personalId,
        code: codeTrim,
        notes: notes?.trim() || codeTrim,
        discountType,
        discountValue: discountNum,
        maxUses: maxRedeems ?? -1,
        isActive: true,
        expiresAt: parsedExpiresAt,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    log.error("[POST /api/personals/coupons] Erro", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Erro ao criar cupom" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { ctx, errorResponse } = await getPersonalContext(request);
    if (errorResponse || !ctx) {
      return (
        errorResponse ??
        NextResponse.json({ error: "N\u00e3o autenticado" }, { status: 401 })
      );
    }

    const { searchParams } = new URL(request.url);
    const couponId = searchParams.get("couponId");
    if (!couponId) {
      return NextResponse.json(
        { error: "couponId \u00e9 obrigat\u00f3rio" },
        { status: 400 },
      );
    }

    const deleted = await db.personalCoupon.deleteMany({
      where: { id: couponId, personalId: ctx.personalId },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Cupom n\u00e3o encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("[DELETE /api/personals/coupons] Erro", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
