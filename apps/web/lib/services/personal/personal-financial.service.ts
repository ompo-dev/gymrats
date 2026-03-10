import { db } from "@/lib/db";
import type {
  BoostCampaign,
  Coupon,
  Expense,
  FinancialSummary,
} from "@/lib/types";

export class PersonalFinancialService {
  static async getFinancialSummary(
    personalId: string,
  ): Promise<FinancialSummary | null> {
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
      (db as any).personalMembershipPlan.findMany({
        where: { personalId, isActive: true },
        select: { price: true },
      }),
    ]);

    const totalDespesas = expenses._sum.amount ?? 0;
    const totalReceitas = 0; // TODO: Implement when PersonalPayment model exists

    const mrr = (membershipPlans as any[]).reduce(
      (sum: number, plan: any) => sum + plan.price,
      0,
    );
    const totalPayments = 0; // TODO: Implement when PersonalPayment model exists
    const avgTicket = 0;

    return {
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
  }

  static async getExpenses(personalId: string): Promise<Expense[]> {
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

    return expenses.map((expense) => ({
      id: expense.id,
      type: expenseTypeMap[expense.type] || "other",
      description: expense.description || "",
      amount: expense.amount,
      date: expense.date,
      category: expense.category || "",
    }));
  }

  static async getPayments(personalId: string) {
    return [];
  }

  static async getMembershipPlans(personalId: string) {
    const plans = await (db as any).personalMembershipPlan.findMany({
      where: { personalId },
      orderBy: { price: "asc" },
    });
    return (plans as any[]).map((p: any) => {
      let benefits: string[] = [];
      if (typeof p.benefits === "string") {
        try {
          benefits = JSON.parse(p.benefits);
        } catch {
          benefits = [];
        }
      } else if (Array.isArray(p.benefits)) {
        benefits = p.benefits;
      }
      return {
        ...p,
        benefits,
      };
    });
  }

  static async getBoostCampaigns(personalId: string): Promise<BoostCampaign[]> {
    const now = new Date();
    await db.boostCampaign.updateMany({
      where: {
        personalId,
        status: "active",
        endsAt: { lte: now },
      },
      data: { status: "expired" },
    });

    const campaigns = await db.boostCampaign.findMany({
      where: { personalId },
      orderBy: { createdAt: "desc" },
    });
    return campaigns.map((c) => ({
      id: c.id,
      gymId: c.gymId ?? "",
      title: c.title,
      description: c.description,
      primaryColor: c.primaryColor,
      durationHours: c.durationHours,
      amountCents: c.amountCents,
      status: c.status,
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
  }

  static async getCoupons(personalId: string): Promise<Coupon[]> {
    const now = new Date();
    await db.personalCoupon.updateMany({
      where: {
        personalId,
        isActive: true,
        expiresAt: { lt: now },
      },
      data: { isActive: false },
    });

    const limitedCoupons = await db.personalCoupon.findMany({
      where: { personalId, isActive: true, maxUses: { not: -1 } },
      select: { id: true, currentUses: true, maxUses: true },
    });
    const maxedCouponIds = limitedCoupons
      .filter((coupon) => coupon.currentUses >= coupon.maxUses)
      .map((coupon) => coupon.id);
    if (maxedCouponIds.length > 0) {
      await db.personalCoupon.updateMany({
        where: { id: { in: maxedCouponIds } },
        data: { isActive: false },
      });
    }

    const coupons = await db.personalCoupon.findMany({
      where: { personalId },
      orderBy: { createdAt: "desc" },
    });

    return coupons.map((c) => ({
      id: c.id,
      code: c.code,
      type: c.discountType as "percentage" | "fixed",
      value: c.discountValue,
      maxUses: c.maxUses === -1 ? 999999 : c.maxUses,
      currentUses: c.currentUses,
      expiryDate: c.expiresAt ?? new Date(9999, 11, 31),
      isActive: c.isActive,
    }));
  }
}
