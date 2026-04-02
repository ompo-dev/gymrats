import { getCachedJson, setCachedJson } from "@/lib/cache/resource-cache";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/utils/json";
import type {
  BoostCampaign,
  Coupon,
  Expense,
  FinancialSummary,
} from "@/lib/types";

const PERSONAL_FINANCIAL_SUMMARY_CACHE_TTL_SECONDS = 15;
const PERSONAL_FINANCIAL_LIST_CACHE_TTL_SECONDS = 30;

function buildPersonalFinancialCacheKey(
  personalId: string,
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
    ? `personal:financial:${personalId}:${resource}:${query}`
    : `personal:financial:${personalId}:${resource}`;
}

export class PersonalFinancialService {
  static async getFinancialSummary(
    personalId: string,
    options?: { fresh?: boolean },
  ): Promise<FinancialSummary | null> {
    const cacheKey = buildPersonalFinancialCacheKey(personalId, "summary");

    if (!options?.fresh) {
      const cached = await getCachedJson<FinancialSummary | null>(cacheKey);
      if (cached) {
        return cached as FinancialSummary | null;
      }
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const defaultSummary = {
      pendingPayments: 0,
      overduePayments: 0,
      churnRate: 0,
      revenueGrowth: 0,
    };

    const [expenses, membershipPlans] = await Promise.all([
      db.personalExpense.aggregate({
        where: { personalId, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      db.personalMembershipPlan.findMany({
        where: { personalId, isActive: true },
        select: { price: true },
      }),
    ]);

    const totalDespesas = expenses._sum.amount ?? 0;
    const totalReceitas = 0; // TODO: Implement when PersonalPayment model exists

    const mrr = membershipPlans.reduce((sum, plan) => sum + plan.price, 0);
    const avgTicket = 0;

    const summary = {
      totalRevenue: totalReceitas,
      totalExpenses: totalDespesas,
      netProfit: totalReceitas - totalDespesas,
      monthlyRecurring: mrr,
      pendingPayments: defaultSummary.pendingPayments,
      overduePayments: defaultSummary.overduePayments,
      averageTicket: avgTicket,
      churnRate: defaultSummary.churnRate,
      revenueGrowth: defaultSummary.revenueGrowth,
    };

    await setCachedJson(
      cacheKey,
      summary,
      PERSONAL_FINANCIAL_SUMMARY_CACHE_TTL_SECONDS,
    );

    return summary;
  }

  static async getExpenses(
    personalId: string,
    options?: { fresh?: boolean },
  ): Promise<Expense[]> {
    const cacheKey = buildPersonalFinancialCacheKey(personalId, "expenses");

    if (!options?.fresh) {
      const cached = await getCachedJson<Expense[]>(cacheKey);
      if (cached) {
        return cached as Expense[];
      }
    }

    const expenses = await db.personalExpense.findMany({
      where: { personalId },
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
      PERSONAL_FINANCIAL_LIST_CACHE_TTL_SECONDS,
    );

    return payload;
  }

  static async getPayments(personalId: string, options?: { fresh?: boolean }) {
    const cacheKey = buildPersonalFinancialCacheKey(personalId, "payments");

    if (!options?.fresh) {
      const cached = await getCachedJson<unknown[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const payload: unknown[] = [];
    await setCachedJson(
      cacheKey,
      payload,
      PERSONAL_FINANCIAL_LIST_CACHE_TTL_SECONDS,
    );
    return payload;
  }

  static async getMembershipPlans(
    personalId: string,
    options?: { fresh?: boolean },
  ): Promise<Array<Record<string, unknown>>> {
    const cacheKey = buildPersonalFinancialCacheKey(personalId, "plans");

    if (!options?.fresh) {
      const cached =
        await getCachedJson<Array<Record<string, unknown>>>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const plans = await db.personalMembershipPlan.findMany({
      where: { personalId },
      orderBy: { price: "asc" },
    });
    const payload = plans.map((plan) => ({
      ...plan,
      benefits: Array.isArray(plan.benefits)
        ? plan.benefits
        : parseJsonArray<string>(plan.benefits),
    }));

    await setCachedJson(
      cacheKey,
      payload,
      PERSONAL_FINANCIAL_LIST_CACHE_TTL_SECONDS,
    );

    return payload;
  }

  static async getBoostCampaigns(
    personalId: string,
    options?: { fresh?: boolean },
  ): Promise<BoostCampaign[]> {
    const cacheKey = buildPersonalFinancialCacheKey(personalId, "campaigns");

    if (!options?.fresh) {
      const cached = await getCachedJson<BoostCampaign[]>(cacheKey);
      if (cached) {
        return cached as BoostCampaign[];
      }
    }

    const now = new Date();
    const campaigns = await db.boostCampaign.findMany({
      where: { personalId },
      orderBy: { createdAt: "desc" },
    });
    const payload = campaigns.map((c) => ({
      id: c.id,
      gymId: c.gymId ?? "",
      title: c.title,
      description: c.description,
      primaryColor: c.primaryColor,
      durationHours: c.durationHours,
      amountCents: c.amountCents,
      status:
        c.status === "active" && c.endsAt && c.endsAt <= now
          ? "expired"
          : c.status,
      clicks: c.clicks,
      impressions: c.impressions,
      radiusKm: c.radiusKm,
      linkedCouponId: c.linkedCouponId,
      linkedPlanId: c.linkedPlanId,
      abacatePayBillingId: c.abacatePayBillingId,
      startsAt: c.startsAt,
      endsAt: c.endsAt,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    await setCachedJson(
      cacheKey,
      payload,
      PERSONAL_FINANCIAL_LIST_CACHE_TTL_SECONDS,
    );

    return payload;
  }

  static async getCoupons(
    personalId: string,
    options?: { fresh?: boolean },
  ): Promise<Coupon[]> {
    const cacheKey = buildPersonalFinancialCacheKey(personalId, "coupons");

    if (!options?.fresh) {
      const cached = await getCachedJson<Coupon[]>(cacheKey);
      if (cached) {
        return cached as Coupon[];
      }
    }

    const now = new Date();
    const coupons = await db.personalCoupon.findMany({
      where: { personalId },
      orderBy: { createdAt: "desc" },
    });

    const payload = coupons.map((c) => ({
      id: c.id,
      code: c.code,
      type: c.discountType as "percentage" | "fixed",
      value: c.discountValue,
      maxUses: c.maxUses === -1 ? 999999 : c.maxUses,
      currentUses: c.currentUses,
      expiryDate: c.expiresAt ?? new Date(9999, 11, 31),
      isActive:
        c.isActive &&
        (!c.expiresAt || c.expiresAt >= now) &&
        (c.maxUses === -1 || c.currentUses < c.maxUses),
    }));

    await setCachedJson(
      cacheKey,
      payload,
      PERSONAL_FINANCIAL_LIST_CACHE_TTL_SECONDS,
    );

    return payload;
  }
}
