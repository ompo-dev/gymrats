import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPersonalContext } from "@/lib/utils/personal/personal-context";

export async function GET() {
  try {
    const { ctx, errorResponse } = await getPersonalContext();
    if (errorResponse || !ctx) {
      return (
        errorResponse ??
        NextResponse.json({ error: "Não autenticado" }, { status: 401 })
      );
    }
    const coupons = await db.personalCoupon.findMany({
      where: { personalId: ctx.personalId },
      orderBy: { createdAt: "desc" },
    });
    const mapped = coupons.map((c) => ({
      id: c.id,
      code: c.code,
      type: c.discountType as "percentage" | "fixed",
      value: c.discountValue,
      maxUses: c.maxUses === -1 ? 999999 : c.maxUses,
      currentUses: c.currentUses,
      expiryDate: c.expiresAt ?? new Date(9999, 11, 31),
      isActive: c.isActive,
    }));
    return NextResponse.json({ coupons: mapped });
  } catch (error) {
    console.error("[GET /api/personals/coupons] Erro:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { ctx, errorResponse } = await getPersonalContext();
    if (errorResponse || !ctx) {
      return (
        errorResponse ??
        NextResponse.json({ error: "Não autenticado" }, { status: 401 })
      );
    }

    const body = await request.json();
    const {
      code,
      notes,
      discountKind,
      discount,
      maxRedeems,
    } = body as {
      code: string;
      notes?: string;
      discountKind: "PERCENTAGE" | "FIXED";
      discount: number;
      maxRedeems?: number;
    };

    const codeTrim = (code ?? "").trim().toUpperCase();
    if (!codeTrim) {
      return NextResponse.json(
        { error: "Código do cupom é obrigatório" },
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

    const discountType =
      discountKind === "PERCENTAGE" ? "percentage" : "fixed";
    if (discountType === "percentage" && discountNum > 100) {
      return NextResponse.json(
        { error: "Porcentagem deve ser até 100" },
        { status: 400 },
      );
    }

    const existing = await db.personalCoupon.findFirst({
      where: { personalId: ctx.personalId, code: codeTrim },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Cupom com esse código já existe" },
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
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/personals/coupons] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao criar cupom" },
      { status: 500 },
    );
  }
}
