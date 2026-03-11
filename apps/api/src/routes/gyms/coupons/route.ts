import { NextResponse } from "@/runtime/next-server";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

const createGymCouponSchema = z.object({
  code: z.string().min(1, "Codigo do cupom e obrigatorio"),
  notes: z.string().optional(),
  discountKind: z.enum(["PERCENTAGE", "FIXED"]),
  discount: z
    .number({ invalid_type_error: "discount deve ser um numero" })
    .positive("Valor do desconto deve ser maior que zero"),
  maxRedeems: z.number().int().optional(),
  expiresAt: z.string().nullable().optional(),
});

export const GET = createSafeHandler(
  async ({ gymContext }) => {
    const gymId = gymContext!.gymId;
    const now = new Date();

    await db.gymCoupon.updateMany({
      where: {
        gymId,
        isActive: true,
        expiresAt: { lt: now },
      },
      data: { isActive: false },
    });

    const limitedCoupons = await db.gymCoupon.findMany({
      where: {
        gymId,
        isActive: true,
        maxUses: { not: -1 },
      },
      select: { id: true, currentUses: true, maxUses: true },
    });

    const maxedCouponIds = limitedCoupons
      .filter((coupon) => coupon.currentUses >= coupon.maxUses)
      .map((coupon) => coupon.id);

    if (maxedCouponIds.length > 0) {
      await db.gymCoupon.updateMany({
        where: { id: { in: maxedCouponIds } },
        data: { isActive: false },
      });
    }

    const coupons = await db.gymCoupon.findMany({
      where: { gymId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      coupons: coupons.map((coupon) => ({
        id: coupon.id,
        code: coupon.code,
        type: coupon.discountType as "percentage" | "fixed",
        value: coupon.discountValue,
        maxUses: coupon.maxUses === -1 ? 999999 : coupon.maxUses,
        currentUses: coupon.currentUses,
        expiryDate: coupon.expiresAt ?? new Date(9999, 11, 31),
        isActive: coupon.isActive,
      })),
    });
  },
  { auth: "gym" },
);

export const POST = createSafeHandler(
  async ({ body, gymContext }) => {
    const gymId = gymContext!.gymId;
    const payload = body;
    const code = payload.code.trim().toUpperCase();
    const discountType =
      payload.discountKind === "PERCENTAGE" ? "percentage" : "fixed";
    const parsedExpiresAt = payload.expiresAt
      ? new Date(payload.expiresAt)
      : null;

    if (!code) {
      return NextResponse.json(
        { error: "Código do cupom é obrigatório" },
        { status: 400 },
      );
    }

    if (Number.isNaN(payload.discount) || payload.discount <= 0) {
      return NextResponse.json(
        { error: "Valor do desconto deve ser maior que zero" },
        { status: 400 },
      );
    }

    if (discountType === "percentage" && payload.discount > 100) {
      return NextResponse.json(
        { error: "Porcentagem deve ser até 100" },
        { status: 400 },
      );
    }

    if (parsedExpiresAt && Number.isNaN(parsedExpiresAt.getTime())) {
      return NextResponse.json(
        { error: "Data de validade inválida" },
        { status: 400 },
      );
    }

    const existing = await db.gymCoupon.findFirst({
      where: { gymId, code },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Cupom com esse código já existe" },
        { status: 409 },
      );
    }

    await db.gymCoupon.create({
      data: {
        gymId,
        code,
        notes: payload.notes?.trim() || code,
        discountType,
        discountValue: payload.discount,
        maxUses: payload.maxRedeems ?? -1,
        isActive: true,
        expiresAt: parsedExpiresAt,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  },
  { auth: "gym", schema: { body: createGymCouponSchema } },
);

export const DELETE = createSafeHandler(
  async ({ req, gymContext }) => {
    const gymId = gymContext!.gymId;
    const { searchParams } = new URL(req.url);
    const couponId = searchParams.get("couponId");

    if (!couponId) {
      return NextResponse.json(
        { error: "couponId é obrigatório" },
        { status: 400 },
      );
    }

    const deleted = await db.gymCoupon.deleteMany({
      where: { id: couponId, gymId },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Cupom não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  },
  { auth: "gym" },
);
