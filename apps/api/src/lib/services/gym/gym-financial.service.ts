import { getCachedJson, setCachedJson } from "@/lib/cache/resource-cache";
import { db } from "@/lib/db";
import type { Expense, FinancialSummary, Payment } from "@/lib/types";

/** Taxa AbacatePay por transação (recebimento de pagamento e saque). */
const ABACATEPAY_FEE_REAIS = 0.8;
const GYM_FINANCIAL_SUMMARY_CACHE_TTL_SECONDS = 15;
const GYM_FINANCIAL_LIST_CACHE_TTL_SECONDS = 30;
const GYM_WITHDRAWS_CACHE_TTL_SECONDS = 15;

function buildGymFinancialCacheKey(
  gymId: string,
  resource: string,
  params?: Record<string, string | number | boolean | null | undefined>,
) {
  const query = Object.entries(params ?? {})
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&");

  return query.length > 0
    ? `gym:financial:${gymId}:${resource}:${query}`
    : `gym:financial:${gymId}:${resource}`;
}

export interface GymBalanceWithdraws {
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
}

export class GymFinancialService {
  /**
   * Gera o resumo financeiro do mês atual
   */
  static async getFinancialSummary(
    gymId: string,
    options?: { fresh?: boolean },
  ): Promise<FinancialSummary | null> {
    const cacheKey = buildGymFinancialCacheKey(gymId, "summary");

    if (!options?.fresh) {
      const cached = await getCachedJson<FinancialSummary | null>(cacheKey);
      if (cached) {
        return cached as FinancialSummary | null;
      }
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [revenue, expenses, pendingPayments, overduePayments, paidCount] =
      await Promise.all([
        db.payment.aggregate({
          where: { gymId, status: "paid", date: { gte: startOfMonth } },
          _sum: { amount: true },
        }),
        db.expense.aggregate({
          where: { gymId, date: { gte: startOfMonth } },
          _sum: { amount: true },
        }),
        db.payment.aggregate({
          where: { gymId, status: "pending", dueDate: { gte: startOfMonth } },
          _sum: { amount: true },
        }),
        db.payment.aggregate({
          where: { gymId, status: "overdue" },
          _sum: { amount: true },
        }),
        db.payment.count({
          where: { gymId, status: "paid", date: { gte: startOfMonth } },
        }),
      ]);

    const totalRevenue = revenue._sum.amount ?? 0;
    const totalExpenses = expenses._sum.amount ?? 0;
    const netProfit = totalRevenue - totalExpenses;
    const pending = pendingPayments._sum.amount ?? 0;
    const overdue = overduePayments._sum.amount ?? 0;

    const summary = {
      totalRevenue,
      totalExpenses,
      netProfit,
      monthlyRecurring: totalRevenue,
      pendingPayments: pending,
      overduePayments: overdue,
      averageTicket: paidCount > 0 ? totalRevenue / paidCount : 0,
      churnRate: 0,
      revenueGrowth: 0,
    };

    await setCachedJson(
      cacheKey,
      summary,
      GYM_FINANCIAL_SUMMARY_CACHE_TTL_SECONDS,
    );

    return summary;
  }

  /**
   * Lista as despesas da academia
   */
  static async getExpenses(
    gymId: string,
    options?: { fresh?: boolean },
  ): Promise<Expense[]> {
    const cacheKey = buildGymFinancialCacheKey(gymId, "expenses");

    if (!options?.fresh) {
      const cached = await getCachedJson<Expense[]>(cacheKey);
      if (cached) {
        return cached as Expense[];
      }
    }

    const expenses = await db.expense.findMany({
      where: { gymId },
      orderBy: { date: "desc" },
    });

    const expenseTypeMap: Record<string, Expense["type"]> = {
      maintenance: "maintenance",
      equipment: "equipment",
      staff: "staff",
      utilities: "utilities",
      rent: "rent",
      operational: "other",
      marketing: "other",
      other: "other",
    };

    const payload = expenses.map((expense) => ({
      id: expense.id,
      type: expenseTypeMap[expense.type] || "other",
      description: expense.description || "",
      amount: expense.amount,
      date: expense.date,
      category: expense.category || "",
    }));

    await setCachedJson(
      cacheKey,
      payload,
      GYM_FINANCIAL_LIST_CACHE_TTL_SECONDS,
    );

    return payload;
  }

  /**
   * Lista pagamentos de um aluno ou gerais
   */
  static async getPayments(
    gymId: string,
    studentId?: string,
    options?: { fresh?: boolean },
  ): Promise<Payment[]> {
    const cacheKey = buildGymFinancialCacheKey(gymId, "payments", {
      studentId,
    });

    if (!options?.fresh) {
      const cached = await getCachedJson<Payment[]>(cacheKey);
      if (cached) {
        return cached as Payment[];
      }
    }

    const payments = await db.payment.findMany({
      where: {
        gymId,
        ...(studentId ? { studentId } : {}),
      },
      orderBy: { dueDate: "desc" },
      include: {
        plan: true,
      },
    });

    const payload = payments.map((payment) => ({
      id: payment.id,
      studentId: payment.studentId,
      studentName: payment.studentName,
      planId: payment.planId || "",
      planName: payment.plan?.name || "",
      amount: payment.amount,
      date: payment.date,
      dueDate: payment.dueDate,
      status: (payment.withdrawnAt ? "withdrawn" : payment.status) as
        | "paid"
        | "pending"
        | "overdue"
        | "canceled"
        | "withdrawn",
      paymentMethod:
        (payment.paymentMethod as Payment["paymentMethod"]) || "pix",
      reference: payment.reference ?? undefined,
      abacatePayBillingId: payment.abacatePayBillingId ?? undefined,
      withdrawnAt: payment.withdrawnAt ?? undefined,
      withdrawId: payment.withdrawId ?? undefined,
    }));

    await setCachedJson(
      cacheKey,
      payload,
      GYM_FINANCIAL_LIST_CACHE_TTL_SECONDS,
    );

    return payload;
  }

  static async getCoupons(gymId: string, options?: { fresh?: boolean }) {
    const cacheKey = buildGymFinancialCacheKey(gymId, "coupons");

    if (!options?.fresh) {
      const cached =
        await getCachedJson<
          Array<{
            id: string;
            code: string;
            type: "percentage" | "fixed";
            value: number;
            maxUses: number;
            currentUses: number;
            expiryDate: Date | string;
            isActive: boolean;
          }>
        >(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const now = new Date();
    const coupons = await db.gymCoupon.findMany({
      where: { gymId },
      orderBy: { createdAt: "desc" },
    });

    const payload = coupons.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      type: coupon.discountType as "percentage" | "fixed",
      value: coupon.discountValue,
      maxUses: coupon.maxUses === -1 ? 999999 : coupon.maxUses,
      currentUses: coupon.currentUses,
      expiryDate: coupon.expiresAt ?? new Date(9999, 11, 31),
      isActive:
        coupon.isActive &&
        (!coupon.expiresAt || coupon.expiresAt >= now) &&
        (coupon.maxUses === -1 || coupon.currentUses < coupon.maxUses),
    }));

    await setCachedJson(
      cacheKey,
      payload,
      GYM_FINANCIAL_LIST_CACHE_TTL_SECONDS,
    );

    return payload;
  }

  static async getBoostCampaigns(gymId: string, options?: { fresh?: boolean }) {
    const cacheKey = buildGymFinancialCacheKey(gymId, "campaigns");

    if (!options?.fresh) {
      const cached =
        await getCachedJson<
          Array<{
            id: string;
            gymId: string | null;
            title: string;
            description: string;
            primaryColor: string;
            durationHours: number;
            amountCents: number;
            status: string;
            clicks: number;
            impressions: number;
            radiusKm: number | null;
            linkedCouponId: string | null;
            linkedPlanId: string | null;
            abacatePayBillingId: string | null;
            startsAt: Date | string | null;
            endsAt: Date | string | null;
            createdAt: Date | string;
            updatedAt: Date | string;
          }>
        >(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const now = new Date();
    const campaigns = await db.boostCampaign.findMany({
      where: { gymId },
      orderBy: { createdAt: "desc" },
    });

    const payload = campaigns.map((campaign) => ({
      id: campaign.id,
      gymId: campaign.gymId,
      title: campaign.title,
      description: campaign.description,
      primaryColor: campaign.primaryColor,
      durationHours: campaign.durationHours,
      amountCents: campaign.amountCents,
      status:
        campaign.status === "active" &&
        campaign.endsAt &&
        campaign.endsAt <= now
          ? "expired"
          : campaign.status,
      clicks: campaign.clicks,
      impressions: campaign.impressions,
      radiusKm: campaign.radiusKm,
      linkedCouponId: campaign.linkedCouponId,
      linkedPlanId: campaign.linkedPlanId,
      abacatePayBillingId: campaign.abacatePayBillingId,
      startsAt: campaign.startsAt,
      endsAt: campaign.endsAt,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    }));

    await setCachedJson(
      cacheKey,
      payload,
      GYM_FINANCIAL_LIST_CACHE_TTL_SECONDS,
    );

    return payload;
  }

  /**
   * Saldo disponível: (soma dos pagamentos pagos - taxa AbacatePay por pagamento)
   * menos (soma dos saques concluídos + taxa AbacatePay por saque).
   */
  static async getBalanceAndWithdraws(
    gymId: string,
    options?: { fresh?: boolean },
  ): Promise<GymBalanceWithdraws> {
    const cacheKey = buildGymFinancialCacheKey(gymId, "withdraws");

    if (!options?.fresh) {
      const cached = await getCachedJson<GymBalanceWithdraws>(cacheKey);
      if (cached) {
        return cached as GymBalanceWithdraws;
      }
    }

    const [paidAgg, withdraws] = await Promise.all([
      db.payment.aggregate({
        where: { gymId, status: "paid" },
        _sum: { amount: true },
        _count: { id: true },
      }),
      db.gymWithdraw.findMany({
        where: { gymId },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    const paidCount = paidAgg._count.id ?? 0;
    const totalReceivedGross = paidAgg._sum.amount ?? 0;
    const totalReceived = totalReceivedGross - paidCount * ABACATEPAY_FEE_REAIS;

    const completedWithdraws = withdraws.filter(
      (w) => w.status === "complete" || w.status === "completed",
    );
    const totalWithdrawnGross = completedWithdraws.reduce(
      (s, w) => s + w.amount,
      0,
    );
    const totalWithdrawn =
      totalWithdrawnGross + completedWithdraws.length * ABACATEPAY_FEE_REAIS;

    const balanceReais = Math.max(0, totalReceived - totalWithdrawn);
    const balanceCents = Math.floor(balanceReais * 100);

    const payload = {
      balanceReais,
      balanceCents,
      withdraws: withdraws.map((w) => ({
        id: w.id,
        amount: w.amount,
        pixKey: w.pixKey,
        pixKeyType: w.pixKeyType,
        externalId: w.externalId,
        status: w.status,
        createdAt: w.createdAt,
        completedAt: w.completedAt ?? null,
      })),
    };

    await setCachedJson(cacheKey, payload, GYM_WITHDRAWS_CACHE_TTL_SECONDS);

    return payload;
  }

  /**
   * Cria um saque. Se fake=true (ex.: dev mode), apenas persiste no DB com status complete sem chamar AbacatePay.
   */
  static async createWithdraw(
    gymId: string,
    data: {
      amountCents: number;
      fake?: boolean;
    },
  ): Promise<
    | { ok: true; withdraw: GymBalanceWithdraws["withdraws"][0] }
    | { ok: false; error: string }
  > {
    const gym = await db.gym.findUnique({
      where: { id: gymId },
      select: { pixKey: true, pixKeyType: true },
    });
    if (!gym?.pixKey || !gym.pixKeyType) {
      return {
        ok: false,
        error:
          "Cadastre sua chave PIX nas configurações da academia para sacar.",
      };
    }
    const amountReais = data.amountCents / 100;
    if (data.amountCents < 350) {
      return { ok: false, error: "Valor mínimo para saque é R$ 3,50." };
    }

    const { balanceCents } =
      await GymFinancialService.getBalanceAndWithdraws(gymId);
    if (data.amountCents > balanceCents) {
      return { ok: false, error: "Saldo insuficiente." };
    }

    const externalId = `gym-withdraw-${gymId}-${Date.now()}`;

    if (data.fake) {
      const w = await db.gymWithdraw.create({
        data: {
          gymId,
          amount: amountReais,
          pixKey: gym.pixKey,
          pixKeyType: gym.pixKeyType,
          externalId,
          status: "complete",
          completedAt: new Date(),
        },
      });
      return {
        ok: true,
        withdraw: {
          id: w.id,
          amount: w.amount,
          pixKey: w.pixKey,
          pixKeyType: w.pixKeyType,
          externalId: w.externalId,
          status: w.status,
          createdAt: w.createdAt,
          completedAt: w.completedAt,
        },
      };
    }

    const { abacatePay } = await import("@gymrats/api/abacatepay");
    const pixType = gym.pixKeyType.toUpperCase() as
      | "CPF"
      | "CNPJ"
      | "PHONE"
      | "EMAIL"
      | "RANDOM"
      | "BR_CODE";
    const res = await abacatePay.createWithdraw({
      externalId,
      amount: data.amountCents,
      pix: { type: pixType, key: gym.pixKey },
      description: `Saque academia ${gymId}`,
    });
    if (res.error || !res.data) {
      return {
        ok: false,
        error: res.error ?? "Falha ao criar saque na AbacatePay.",
      };
    }

    const w = await db.gymWithdraw.create({
      data: {
        gymId,
        amount: amountReais,
        pixKey: gym.pixKey,
        pixKeyType: gym.pixKeyType,
        externalId,
        abacateId: res.data.id,
        status: res.data.status === "COMPLETE" ? "complete" : "pending",
        completedAt: res.data.status === "COMPLETE" ? new Date() : null,
      },
    });
    return {
      ok: true,
      withdraw: {
        id: w.id,
        amount: w.amount,
        pixKey: w.pixKey,
        pixKeyType: w.pixKeyType,
        externalId: w.externalId,
        status: w.status,
        createdAt: w.createdAt,
        completedAt: w.completedAt,
      },
    };
  }
}
