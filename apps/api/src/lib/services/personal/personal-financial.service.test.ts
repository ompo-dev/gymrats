import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCachedJsonMock,
  setCachedJsonMock,
  personalExpenseAggregateMock,
  personalMembershipPlanFindManyMock,
  personalStudentPaymentAggregateMock,
  personalStudentPaymentFindManyMock,
} = vi.hoisted(() => ({
  getCachedJsonMock: vi.fn(),
  setCachedJsonMock: vi.fn(),
  personalExpenseAggregateMock: vi.fn(),
  personalMembershipPlanFindManyMock: vi.fn(),
  personalStudentPaymentAggregateMock: vi.fn(),
  personalStudentPaymentFindManyMock: vi.fn(),
}));

vi.mock("@/lib/cache/resource-cache", () => ({
  getCachedJson: (...args: unknown[]) => getCachedJsonMock(...args),
  setCachedJson: (...args: unknown[]) => setCachedJsonMock(...args),
}));

vi.mock("@/lib/db", () => ({
  db: {
    personalExpense: {
      aggregate: (...args: unknown[]) => personalExpenseAggregateMock(...args),
    },
    personalMembershipPlan: {
      findMany: (...args: unknown[]) =>
        personalMembershipPlanFindManyMock(...args),
    },
    personalStudentPayment: {
      aggregate: (...args: unknown[]) =>
        personalStudentPaymentAggregateMock(...args),
      findMany: (...args: unknown[]) => personalStudentPaymentFindManyMock(...args),
    },
  },
}));

import { PersonalFinancialService } from "./personal-financial.service";

describe("PersonalFinancialService", () => {
  beforeEach(() => {
    getCachedJsonMock.mockReset();
    setCachedJsonMock.mockReset();
    personalExpenseAggregateMock.mockReset();
    personalMembershipPlanFindManyMock.mockReset();
    personalStudentPaymentAggregateMock.mockReset();
    personalStudentPaymentFindManyMock.mockReset();
    getCachedJsonMock.mockResolvedValue(null);
  });

  it("keeps summary consistent with personalStudentPayment paid/pending aggregates (PAY-05)", async () => {
    personalExpenseAggregateMock.mockResolvedValue({ _sum: { amount: 50 } });
    personalMembershipPlanFindManyMock.mockResolvedValue([
      { price: 99 },
      { price: 101 },
    ]);
    personalStudentPaymentAggregateMock
      .mockResolvedValueOnce({ _sum: { amount: 300 }, _count: { id: 3 } })
      .mockResolvedValueOnce({ _sum: { amount: 120 } });

    const summary = await PersonalFinancialService.getFinancialSummary(
      "personal_1",
      { fresh: true },
    );

    expect(summary).toEqual({
      totalRevenue: 300,
      totalExpenses: 50,
      netProfit: 250,
      monthlyRecurring: 200,
      pendingPayments: 120,
      overduePayments: 0,
      averageTicket: 100,
      churnRate: 0,
      revenueGrowth: 0,
    });
    expect(personalStudentPaymentAggregateMock).toHaveBeenCalledTimes(2);
    expect(personalStudentPaymentAggregateMock).toHaveBeenNthCalledWith(1, {
      where: {
        personalId: "personal_1",
        status: "paid",
        createdAt: { gte: expect.any(Date) },
      },
      _sum: { amount: true },
      _count: { id: true },
    });
    expect(personalStudentPaymentAggregateMock).toHaveBeenNthCalledWith(2, {
      where: { personalId: "personal_1", status: "pending" },
      _sum: { amount: true },
    });
  });

  it("keeps payments list mapped from personalStudentPayment records (PAY-05)", async () => {
    personalStudentPaymentFindManyMock.mockResolvedValue([
      {
        id: "payment_1",
        personalId: "personal_1",
        studentId: "student_1",
        planId: "plan_1",
        amount: 49.9,
        status: "paid",
        createdAt: new Date("2026-05-10T00:00:00.000Z"),
        updatedAt: new Date("2026-05-10T00:00:00.000Z"),
        abacatePayBillingId: "pix_1",
        student: { user: { name: "Aluno 1" } },
        plan: { name: "Plano A" },
      },
      {
        id: "payment_2",
        personalId: "personal_1",
        studentId: "student_2",
        planId: "plan_2",
        amount: 79.9,
        status: "pending",
        createdAt: new Date("2026-05-11T00:00:00.000Z"),
        updatedAt: new Date("2026-05-11T00:00:00.000Z"),
        abacatePayBillingId: null,
        student: { user: { name: "Aluno 2" } },
        plan: { name: "Plano B" },
      },
    ]);

    const payments = await PersonalFinancialService.getPayments("personal_1", {
      fresh: true,
    });

    expect(personalStudentPaymentFindManyMock).toHaveBeenCalledWith({
      where: { personalId: "personal_1" },
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
        plan: {
          select: { name: true },
        },
      },
    });
    expect(payments).toEqual([
      expect.objectContaining({
        id: "payment_1",
        studentName: "Aluno 1",
        planName: "Plano A",
        amount: 49.9,
        status: "paid",
        abacatePayBillingId: "pix_1",
      }),
      expect.objectContaining({
        id: "payment_2",
        studentName: "Aluno 2",
        planName: "Plano B",
        amount: 79.9,
        status: "pending",
        abacatePayBillingId: null,
      }),
    ]);
  });
});

