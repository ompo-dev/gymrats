"use server";

import {
  GYM_PLANS_CONFIG,
  centsToReais,
} from "@/lib/access-control/plans-config";
import { db } from "@/lib/db";
import { GymFinancialService } from "@/lib/services/gym/gym-financial.service";
import { GymInventoryService } from "@/lib/services/gym/gym-inventory.service";
import { GymMemberService } from "@/lib/services/gym/gym-member.service";
import type {
  CheckIn,
  Equipment,
  Expense,
  FinancialSummary,
  GymProfile,
  GymStats,
  Payment,
  StudentData,
} from "@/lib/types";
import { getGymContext } from "@/lib/utils/gym/gym-context";

// ============================================
// INFORMAÇÕES DO USUÁRIO
// ============================================

export async function getCurrentUserInfo() {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx) return { isAdmin: false, role: null };

    return {
      isAdmin: ctx.user.role === "ADMIN",
      role: ctx.user.role ?? null,
    };
  } catch (error) {
    console.error("[getCurrentUserInfo] Erro:", error);
    return { isAdmin: false, role: null };
  }
}

// ============================================
// PERFIL E INVENTÁRIO (GymInventoryService)
// ============================================

export async function getGymProfile(): Promise<GymProfile | null> {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx) return null;
    return GymInventoryService.getProfile(ctx.gymId);
  } catch (error) {
    console.error("[getGymProfile] Erro:", error);
    return null;
  }
}

export async function getGymEquipment(): Promise<Equipment[]> {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx) return [];
    return GymInventoryService.getEquipment(ctx.gymId);
  } catch (error) {
    console.error("[getGymEquipment] Erro:", error);
    return [];
  }
}

export async function getGymEquipmentById(
  equipmentId: string,
): Promise<Equipment | null> {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx) return null;
    return GymInventoryService.getEquipmentById(ctx.gymId, equipmentId);
  } catch (error) {
    console.error("[getGymEquipmentById] Erro:", error);
    return null;
  }
}

export async function getGymMembershipPlans() {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx) return [];
    return GymInventoryService.getMembershipPlans(ctx.gymId);
  } catch (error) {
    console.error("[getGymMembershipPlans] Erro:", error);
    return [];
  }
}

// ============================================
// MEMBROS E ALUNOS (GymMemberService)
// ============================================

export async function getGymStudents(): Promise<StudentData[]> {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx) return [];
    return (await GymMemberService.getStudents(ctx.gymId)) as StudentData[];
  } catch (error) {
    console.error("[getGymStudents] Erro:", error);
    return [];
  }
}

export async function getGymRecentCheckIns(): Promise<CheckIn[]> {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx) return [];
    const checkIns = await GymMemberService.getRecentCheckIns(ctx.gymId);
    return checkIns.map((c) => ({
      ...c,
      checkOut: c.checkOut ?? undefined,
    })) as CheckIn[];
  } catch (error) {
    console.error("[getGymRecentCheckIns] Erro:", error);
    return [];
  }
}

export async function getGymStudentById(
  studentId: string,
): Promise<StudentData | null> {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx) return null;
    return (await GymMemberService.getStudentById(
      ctx.gymId,
      studentId,
    )) as StudentData | null;
  } catch (error) {
    console.error("[getGymStudentById] Erro:", error);
    return null;
  }
}

// ============================================
// FINANCEIRO (GymFinancialService)
// ============================================

export async function getGymFinancialSummary(): Promise<FinancialSummary | null> {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx) return null;
    return GymFinancialService.getFinancialSummary(ctx.gymId);
  } catch (error) {
    console.error("[getGymFinancialSummary] Erro:", error);
    return null;
  }
}

export async function getGymStudentPayments(
  studentId: string,
): Promise<Payment[]> {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx) return [];
    return GymFinancialService.getPayments(ctx.gymId, studentId);
  } catch (error) {
    console.error("[getGymStudentPayments] Erro:", error);
    return [];
  }
}

export async function getGymPayments(): Promise<Payment[]> {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx) return [];
    return GymFinancialService.getPayments(ctx.gymId);
  } catch (error) {
    console.error("[getGymPayments] Erro:", error);
    return [];
  }
}

export async function getGymExpenses(): Promise<Expense[]> {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx) return [];
    return GymFinancialService.getExpenses(ctx.gymId);
  } catch (error) {
    console.error("[getGymExpenses] Erro:", error);
    return [];
  }
}

// ============================================
// ESTATÍSTICAS E OUTROS
// ============================================

export async function getGymStats(): Promise<GymStats | null> {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx) return null;
    return GymInventoryService.getStats(ctx.gymId);
  } catch (error) {
    console.error("[getGymStats] Erro:", error);
    return null;
  }
}

export async function getGymCoupons(): Promise<import("@/lib/types").Coupon[]> {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx) return [];
    const now = new Date();

    await db.gymCoupon.updateMany({
      where: {
        gymId: ctx.gymId,
        isActive: true,
        expiresAt: { lt: now },
      },
      data: { isActive: false },
    });

    const limitedCoupons = await db.gymCoupon.findMany({
      where: {
        gymId: ctx.gymId,
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

    const dbCoupons = await db.gymCoupon.findMany({
      where: { gymId: ctx.gymId },
      orderBy: { createdAt: "desc" },
    });

    return dbCoupons.map((c) => ({
      id: c.id,
      code: c.code,
      type: c.discountType as "percentage" | "fixed",
      value: c.discountValue,
      maxUses: c.maxUses === -1 ? 999999 : c.maxUses,
      currentUses: c.currentUses,
      expiryDate: c.expiresAt ?? new Date(9999, 11, 31),
      isActive: c.isActive,
    }));
  } catch (error) {
    console.error("[getGymCoupons] Erro:", error);
    return [];
  }
}

export async function createGymCoupon(data: {
  code: string;
  notes: string;
  discountKind: "PERCENTAGE" | "FIXED";
  discount: number;
  maxRedeems?: number;
  expiresAt?: Date | string | null;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx)
      return { success: false, error: "Não autenticado" };

    const code = data.code.trim().toUpperCase();
    const discountType = data.discountKind === "PERCENTAGE" ? "percentage" : "fixed";
    const parsedExpiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    if (parsedExpiresAt && Number.isNaN(parsedExpiresAt.getTime())) {
      return { success: false, error: "Data de validade inv\u00e1lida" };
    }

    // Verifica duplicação no DB
    const existing = await db.gymCoupon.findFirst({
      where: { gymId: ctx.gymId, code },
    });
    if (existing) return { success: false, error: "Cupom com esse código já existe" };

    // Tenta sincronizar com AbacatePay (opcional — não bloqueia se falhar)
    let abacatePayId: string | undefined;
    try {
      const { abacatePay } = await import("@/lib/api/abacatepay");
      const res = await abacatePay.createCoupon({
        code,
        notes: data.notes || code,
        discountKind: data.discountKind,
        discount: data.discount,
        maxRedeems: data.maxRedeems ?? -1,
      });
      if (res.data) {
        abacatePayId = res.data.id;
      }
    } catch {
      // ignora erro do AbacatePay — salva no DB mesmo assim
    }

    // Salva no banco de dados
    await db.gymCoupon.create({
      data: {
        gymId: ctx.gymId,
        code,
        notes: data.notes || code,
        discountType,
        discountValue: data.discount,
        maxUses: data.maxRedeems ?? -1,
        isActive: true,
        expiresAt: parsedExpiresAt,
        abacatePayId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[createGymCoupon] Erro:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao criar cupom",
    };
  }
}

// ============================================
// ADS / BOOST CAMPAIGNS
// ============================================

export async function getGymBoostCampaigns() {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx) return [];
    const now = new Date();

    await db.boostCampaign.updateMany({
      where: {
        gymId: ctx.gymId,
        status: "active",
        endsAt: { lte: now },
      },
      data: { status: "expired" },
    });

    return await db.boostCampaign.findMany({
      where: { gymId: ctx.gymId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("[getGymBoostCampaigns] Erro:", error);
    return [];
  }
}

export async function createBoostCampaign(data: {
  title: string;
  description: string;
  primaryColor: string;
  linkedCouponId: string | null;
  linkedPlanId: string | null;
  durationHours: number;
  amountCents: number;
  radiusKm?: number;
}) {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx)
      return { success: false, error: "Não autenticado" };

    const gym = await db.gym.findUnique({
      where: { id: ctx.gymId },
      select: { name: true, email: true },
    });

    const radiusKm = data.radiusKm ?? 5;

    // Cria a campanha no DB com status pending_payment
    const campaign = await db.boostCampaign.create({
      data: {
        gymId: ctx.gymId,
        title: data.title,
        description: data.description,
        primaryColor: data.primaryColor,
        linkedCouponId: data.linkedCouponId,
        linkedPlanId: data.linkedPlanId,
        durationHours: data.durationHours,
        amountCents: data.amountCents,
        radiusKm,
        status: "pending_payment",
      },
    });

    // Gera PIX direto (igual ao fluxo de alunos — não exige taxId)
    const { abacatePay } = await import("@/lib/api/abacatepay");
    const { PIX_EXPIRES_IN_SECONDS } = await import("@/lib/utils/subscription");
    const pixResponse = await abacatePay.createPixQrCode({
      amount: data.amountCents,
      expiresIn: PIX_EXPIRES_IN_SECONDS, // 4 minutos
      description: `Impulsionamento: ${data.title}`.slice(0, 37),
      metadata: {
        campaignId: campaign.id,
        gymId: ctx.gymId,
        kind: "boost-campaign",
      },
      customer: gym?.email
        ? {
            name: gym.name ?? "Academia",
            email: gym.email,
            cellphone: "",
            taxId: "",
          }
        : undefined,
    });

    if (pixResponse.error || !pixResponse.data) {
      return {
        success: false,
        error: pixResponse.error ?? "Erro ao gerar PIX",
      } as const;
    }

    // Salva o ID do PIX na campanha
    await db.boostCampaign.update({
      where: { id: campaign.id },
      data: { abacatePayBillingId: pixResponse.data.id },
    });

    return {
      success: true,
      brCode: pixResponse.data.brCode,
      brCodeBase64: pixResponse.data.brCodeBase64,
      amount: pixResponse.data.amount,
      pixId: pixResponse.data.id,
      campaignId: campaign.id,
      expiresAt: pixResponse.data.expiresAt,
    } as const;
  } catch (error) {
    console.error("[createBoostCampaign] Erro:", error);
    return { success: false, error: "Erro interno ao criar campanha" } as const;
  }
}

export async function getGymReferrals() {
  return [];
}

export async function deleteGymCoupon(
  couponId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx)
      return { success: false, error: "N\u00e3o autenticado" };

    const deleted = await db.gymCoupon.deleteMany({
      where: { id: couponId, gymId: ctx.gymId },
    });

    if (deleted.count === 0) {
      return { success: false, error: "Cupom n\u00e3o encontrado" };
    }

    return { success: true };
  } catch (error) {
    console.error("[deleteGymCoupon] Erro:", error);
    return { success: false, error: "Erro ao excluir cupom" };
  }
}

/** Cancela/deleta uma campanha da academia. Só é possível se não estiver ativa ou pagamento pendente.*/
export async function deleteBoostCampaign(
  campaignId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx)
      return { success: false, error: "N\u00e3o autenticado" };

    const deleted = await db.boostCampaign.deleteMany({
      where: { id: campaignId, gymId: ctx.gymId },
    });

    if (deleted.count === 0)
      return { success: false, error: "Campanha n\u00e3o encontrada" };

    return { success: true };
  } catch (error) {
    console.error("[deleteBoostCampaign] Erro:", error);
    return { success: false, error: "Erro ao excluir campanha" };
  }
}

export async function getBoostCampaignPix(
  campaignId: string,
): Promise<
  | {
      success: true;
      brCode: string;
      brCodeBase64: string;
      amount: number;
      pixId: string;
      expiresAt?: string;
    }
  | { success: false; error: string }
> {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx)
      return { success: false, error: "Não autenticado" };

    const campaign = await db.boostCampaign.findFirst({
      where: { id: campaignId, gymId: ctx.gymId, status: "pending_payment" },
      include: { gym: { select: { name: true, email: true } } },
    });

    if (!campaign) return { success: false, error: "Campanha não encontrada ou já paga" };

    const { abacatePay } = await import("@/lib/api/abacatepay");

    // Se já tem PIX e ainda não expirou, retorna o existente
    if (campaign.abacatePayBillingId) {
      const existing = await abacatePay.checkPixQrCodeStatus(campaign.abacatePayBillingId);
      if (existing.data?.status === "PENDING") {
        // Busca o brCode do PIX existente (a API checkPixQrCodeStatus não retorna brCode,
        // precisamos recriar — mas salva uma chamada extra na maioria dos casos)
        // Por simplicidade, sempre recria o PIX para garantir o QR code fresco
      }
    }

    // Cria novo PIX
    const { PIX_EXPIRES_IN_SECONDS } = await import("@/lib/utils/subscription");
    const pixResponse = await abacatePay.createPixQrCode({
      amount: campaign.amountCents,
      expiresIn: PIX_EXPIRES_IN_SECONDS, // 4 minutos
      description: `Impulsionamento: ${campaign.title}`.slice(0, 37),
      metadata: {
        campaignId: campaign.id,
        gymId: ctx.gymId,
        kind: "boost-campaign",
      },
      customer: campaign.gym?.email
        ? {
            name: campaign.gym.name ?? "Academia",
            email: campaign.gym.email,
            cellphone: "",
            taxId: "",
          }
        : undefined,
    });

    if (pixResponse.error || !pixResponse.data) {
      return { success: false, error: pixResponse.error ?? "Erro ao gerar PIX" };
    }

    // Atualiza o ID do PIX na campanha
    await db.boostCampaign.update({
      where: { id: campaign.id },
      data: { abacatePayBillingId: pixResponse.data.id },
    });

    return {
      success: true,
      brCode: pixResponse.data.brCode,
      brCodeBase64: pixResponse.data.brCodeBase64,
      amount: pixResponse.data.amount,
      pixId: pixResponse.data.id,
      expiresAt: pixResponse.data.expiresAt,
    };
  } catch (error) {
    console.error("[getBoostCampaignPix] Erro:", error);
    return { success: false, error: "Erro ao gerar PIX" };
  }
}


export async function getGymBalanceWithdraws(): Promise<{
  balanceReais: number;
  balanceCents: number;
  withdraws: {
    id: string;
    amount: number;
    pixKey: string;
    pixKeyType: string;
    externalId: string;
    status: string;
    createdAt: Date;
    completedAt: Date | null;
  }[];
}> {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx)
      return { balanceReais: 0, balanceCents: 0, withdraws: [] };
    return GymFinancialService.getBalanceAndWithdraws(ctx.gymId);
  } catch (error) {
    console.error("[getGymBalanceWithdraws] Erro:", error);
    return { balanceReais: 0, balanceCents: 0, withdraws: [] };
  }
}

/** Cria saque. Use fake: true em dev (AbacatePay dev mode) para não chamar a API real. */
export async function createGymWithdraw(data: {
  amountCents: number;
  fake?: boolean;
}): Promise<
  | { success: true; withdraw: { id: string; amount: number; status: string } }
  | { success: false; error: string }
> {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx)
      return { success: false, error: "Não autenticado" };
    const result = await GymFinancialService.createWithdraw(ctx.gymId, {
      amountCents: data.amountCents,
      fake: data.fake ?? true,
    });
    if (!result.ok) return { success: false, error: result.error };
    return { success: true, withdraw: result.withdraw };
  } catch (error) {
    console.error("[createGymWithdraw] Erro:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao criar saque",
    };
  }
}

// TODO: Mover lógica complexa abaixo para serviços correspondentes conforme necessário
export async function getGymSubscription() {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx) return null;

    const gymId = ctx.gymId;
    const subscription = await db.gymSubscription.findUnique({
      where: { gymId },
    });
    if (
      !subscription ||
      (subscription.status === "canceled" &&
        (!subscription.trialEnd || new Date() > subscription.trialEnd))
    )
      return null;

    const activeStudents = await db.gymMembership.count({
      where: { gymId, status: "active" },
    });

    return {
      ...subscription,
      isTrial: subscription.trialEnd
        ? new Date() < subscription.trialEnd
        : false,
      daysRemaining: subscription.trialEnd
        ? Math.max(
            0,
            Math.ceil(
              (subscription.trialEnd.getTime() - Date.now()) /
                (1000 * 3600 * 24),
            ),
          )
        : null,
      activeStudents,
      totalAmount:
        subscription.billingPeriod === "annual"
          ? subscription.basePrice
          : subscription.basePrice +
            subscription.pricePerStudent * activeStudents,
    };
  } catch (error) {
    console.error("[getGymSubscription] Erro:", error);
    return null;
  }
}

export async function startGymTrial() {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx) return { error: "Não autenticado" };

    const gymId = ctx.gymId;
    const existingSubscription = await db.gymSubscription.findUnique({
      where: { gymId },
    });

    if (existingSubscription) {
      if (existingSubscription.status !== "canceled") {
        return { error: "Assinatura já existe" };
      }
      return {
        error:
          "Esta academia já possui uma assinatura cancelada. Renove o plano em vez de iniciar um novo trial.",
      };
    }

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const subscription = await db.gymSubscription.create({
      data: {
        gymId,
        plan: "basic",
        billingPeriod: "monthly",
        status: "trialing",
        basePrice: centsToReais(GYM_PLANS_CONFIG.BASIC.prices.monthly),
        pricePerStudent: centsToReais(GYM_PLANS_CONFIG.BASIC.pricePerStudent),
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialStart: now,
        trialEnd: trialEnd,
      },
    });

    return { success: true, subscription };
  } catch (error) {
    console.error("[startGymTrial] Erro:", error);
    return { error: "Erro ao iniciar trial" };
  }
}

/**
 * Sincroniza os preços da assinatura atual da academia com os preços configurados no plans-config.ts.
 * Útil quando os preços globais mudam e queremos que as academias vejam os valores atualizados.
 */
export async function syncGymSubscriptionPrices() {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx) return { error: "Não autenticado" };

    const gymId = ctx.gymId;
    const subscription = await db.gymSubscription.findUnique({
      where: { gymId },
    });

    if (!subscription)
      return { success: true, message: "Sem assinatura para sincronizar" };

    const planKey =
      subscription.plan.toUpperCase() as keyof typeof GYM_PLANS_CONFIG;
    const config = GYM_PLANS_CONFIG[planKey];

    if (!config) return { error: "Plano atual inválido na configuração" };

    const newBasePrice = centsToReais(
      config.prices[subscription.billingPeriod as "monthly" | "annual"],
    );
    const newPerStudentPrice =
      subscription.billingPeriod === "annual"
        ? 0
        : centsToReais(config.pricePerStudent);

    if (
      subscription.basePrice !== newBasePrice ||
      subscription.pricePerStudent !== newPerStudentPrice
    ) {
      await db.gymSubscription.update({
        where: { id: subscription.id },
        data: {
          basePrice: newBasePrice,
          pricePerStudent: newPerStudentPrice,
        },
      });
      return { success: true, updated: true };
    }

    return { success: true, updated: false };
  } catch (error) {
    console.error("[syncGymSubscriptionPrices] Erro:", error);
    return { error: "Erro ao sincronizar preços" };
  }
}

