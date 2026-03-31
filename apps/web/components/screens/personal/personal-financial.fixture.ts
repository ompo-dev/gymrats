import type { PersonalSubscriptionData } from "@gymrats/types/personal-module";
import type {
  BoostCampaign,
  Coupon,
  Expense,
  FinancialSummary,
  Payment,
} from "@/lib/types";
import type { PersonalFinancialScreenProps } from "./personal-financial.screen";

export function createPersonalFinancialFixture(
  overrides: Partial<PersonalFinancialScreenProps> = {},
): PersonalFinancialScreenProps {
  return {
    subscription: {
      id: "personal-subscription-1",
      plan: "pro_ai",
      status: "active",
      basePrice: 79.9,
      effectivePrice: 59.9,
      discountPercent: 25,
      currentPeriodStart: new Date("2026-03-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2026-04-01T00:00:00.000Z"),
      cancelAtPeriodEnd: false,
      canceledAt: null,
    } as PersonalSubscriptionData,
    financialSummary: {
      totalRevenue: 12450,
      totalExpenses: 3180,
      netProfit: 9270,
      monthlyRecurring: 9800,
      pendingPayments: 640,
      overduePayments: 280,
      averageTicket: 196,
      churnRate: 4,
      revenueGrowth: 11,
    } as FinancialSummary,
    payments: [
      {
        id: "payment-1",
        studentId: "student-1",
        studentName: "Ana Souza",
        planId: "plan-1",
        planName: "Consultoria Premium",
        amount: 249.9,
        date: new Date(),
        dueDate: new Date(),
        status: "paid",
        paymentMethod: "pix",
      },
    ] as Payment[],
    coupons: [
      {
        id: "coupon-1",
        code: "PERSONAL10",
        type: "percentage",
        value: 10,
        maxUses: 50,
        currentUses: 12,
        expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ] as Coupon[],
    campaigns: [
      {
        id: "campaign-1",
        gymId: null,
        personalId: "personal-profile-1",
        title: "Avaliação Grátis",
        description: "Impulsione seu perfil na região com uma oferta inicial.",
        primaryColor: "#50D5A1",
        durationHours: 24,
        amountCents: 6000,
        status: "active",
        clicks: 18,
        impressions: 320,
        radiusKm: 5,
        linkedCouponId: "coupon-1",
        linkedPlanId: "plan-1",
        abacatePayBillingId: "billing-personal-1",
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as BoostCampaign[],
    plans: [
      {
        id: "plan-1",
        name: "Consultoria Premium",
      },
    ],
    expenses: [
      {
        id: "expense-1",
        type: "other",
        description: "Ferramentas e assinatura de gestão",
        amount: 320,
        date: new Date(),
        category: "Software",
      },
    ] as Expense[],
    viewMode: "overview",
    onViewModeChange: () => undefined,
    onRefresh: async () => undefined,
    ...overrides,
  };
}
