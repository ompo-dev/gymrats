import { db } from "@/lib/db";
import { FinancialSummary, Expense, Payment } from "@/lib/types";

export class GymFinancialService {
  /**
   * Gera o resumo financeiro do mês atual
   */
  static async getFinancialSummary(gymId: string): Promise<FinancialSummary | null> {
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

    return {
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
  }

  /**
   * Lista as despesas da academia
   */
  static async getExpenses(gymId: string): Promise<Expense[]> {
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

    return expenses.map((expense) => ({
      id: expense.id,
      type: expenseTypeMap[expense.type] || "other",
      description: expense.description || "",
      amount: expense.amount,
      date: expense.date,
      category: expense.category || "",
    }));
  }

  /**
   * Lista pagamentos de um aluno ou gerais
   */
  static async getPayments(gymId: string, studentId?: string): Promise<Payment[]> {
    const payments = await db.payment.findMany({
      where: { 
        gymId,
        ...(studentId ? { studentId } : {})
      },
      orderBy: { dueDate: "desc" },
      include: {
        plan: true,
      },
    });

    return payments.map((payment) => ({
      id: payment.id,
      studentId: payment.studentId,
      studentName: payment.studentName,
      planId: payment.planId || "",
      planName: payment.plan?.name || "",
      amount: payment.amount,
      date: payment.date,
      dueDate: payment.dueDate,
      status: (payment.withdrawnAt
        ? "withdrawn"
        : payment.status) as "paid" | "pending" | "overdue" | "canceled" | "withdrawn",
      paymentMethod: (payment.paymentMethod as string) || "pix",
      reference: payment.reference ?? undefined,
      abacatePayBillingId: payment.abacatePayBillingId ?? undefined,
      withdrawnAt: payment.withdrawnAt ?? undefined,
      withdrawId: payment.withdrawId ?? undefined,
    }));
  }
}
