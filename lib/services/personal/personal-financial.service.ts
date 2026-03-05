import { db } from "@/lib/db";
import type { Coupon, Expense, FinancialSummary } from "@/lib/types";

export class PersonalFinancialService {
  static async getFinancialSummary(
    personalId: string,
  ): Promise<FinancialSummary | null> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [expenses] = await Promise.all([
      db.personalExpense.aggregate({
        where: { personalId, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
    ]);

    const totalExpenses = expenses._sum.amount ?? 0;

    return {
      totalRevenue: 0,
      totalExpenses,
      netProfit: -totalExpenses,
      monthlyRecurring: 0,
      pendingPayments: 0,
      overduePayments: 0,
      averageTicket: 0,
      churnRate: 0,
      revenueGrowth: 0,
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

  static async getCoupons(personalId: string): Promise<Coupon[]> {
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
