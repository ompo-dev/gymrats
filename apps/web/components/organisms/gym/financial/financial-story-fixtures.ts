import type { Payment } from "@/lib/types";
import { createGymFinancialFixture } from "@/components/screens/gym/gym-financial.fixture";
import { createPersonalFinancialFixture } from "@/components/screens/personal/personal-financial.fixture";

export const gymFinancialFixture = createGymFinancialFixture();
const baseGymSubscription = gymFinancialFixture.subscription!;

export const activeGymSubscriptionFixture = {
  ...baseGymSubscription,
};

export const trialGymSubscriptionFixture = {
  ...baseGymSubscription,
  status: "trialing",
  isTrial: true,
  daysRemaining: 9,
  totalAmount: 0,
};

export const canceledGymSubscriptionFixture = {
  ...baseGymSubscription,
  status: "canceled",
  cancelAtPeriodEnd: true,
};

export const gymPaymentsFixture: Payment[] = [
  ...(gymFinancialFixture.payments ?? []),
  {
    id: "payment-3",
    studentId: "student-1",
    studentName: "Ana Souza",
    planId: "plan-2",
    planName: "Plano Trimestral",
    amount: 349.9,
    date: new Date("2026-03-18T14:00:00.000Z"),
    dueDate: new Date("2026-03-15T14:00:00.000Z"),
    status: "withdrawn",
    paymentMethod: "pix",
  },
  {
    id: "payment-4",
    studentId: "student-3",
    studentName: "Beatriz Costa",
    planId: "plan-1",
    planName: "Plano Mensal",
    amount: 129.9,
    date: new Date("2026-03-22T14:00:00.000Z"),
    dueDate: new Date("2026-03-20T14:00:00.000Z"),
    status: "overdue",
    paymentMethod: "credit-card",
  },
];

export const personalFinancialFixture = createPersonalFinancialFixture();
