import type { StudentGymMembership, StudentPayment } from "@/lib/types";
import type { StudentPaymentsScreenProps } from "./student-payments.screen";

export function createStudentPaymentsFixture(
  overrides: Partial<StudentPaymentsScreenProps> = {},
): StudentPaymentsScreenProps {
  const memberships = [
    {
      id: "membership-1",
      gymId: "gym-1",
      gymName: "GymRats Paulista",
      gymAddress: "Av. Paulista, 900 - São Paulo",
      planId: "plan-1",
      planName: "Plano Mensal",
      amount: 129.9,
      status: "active",
      autoRenew: true,
      startDate: new Date("2026-03-01T00:00:00.000Z"),
      nextBillingDate: new Date("2026-04-01T00:00:00.000Z"),
      paymentMethod: {
        brand: "Visa",
        last4: "4242",
      },
    } as StudentGymMembership,
  ];

  const payments = [
    {
      id: "payment-1",
      gymId: "gym-1",
      gymName: "GymRats Paulista",
      planName: "Plano Mensal",
      amount: 129.9,
      status: "pending",
      dueDate: new Date("2026-04-01T00:00:00.000Z"),
      date: new Date("2026-03-25T00:00:00.000Z"),
    } as StudentPayment,
  ];

  return {
    activeTab: "memberships",
    subscription: {
      id: "subscription-1",
      plan: "premium",
      status: "active",
      currentPeriodStart: new Date("2026-03-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2026-04-01T00:00:00.000Z"),
      cancelAtPeriodEnd: false,
      canceledAt: null,
      trialStart: null,
      trialEnd: null,
      isTrial: false,
      daysRemaining: 7,
    },
    membershipsByGym: [
      {
        gymId: "gym-1",
        gymName: "GymRats Paulista",
        gymAddress: "Av. Paulista, 900 - São Paulo",
        memberships,
      },
    ],
    paymentsByGym: [
      {
        gymId: "gym-1",
        gymName: "GymRats Paulista",
        payments,
      },
    ],
    pendingPayments: payments,
    totalMonthly: 129.9,
    availablePlans: [
      {
        id: "premium",
        name: "Premium",
        monthlyPrice: 29.9,
        annualPrice: 299,
        features: ["Planos ilimitados", "Suporte prioritário"],
      },
    ],
    isLoading: false,
    isLoadingPayments: false,
    isStartingTrial: false,
    isCreatingSubscription: false,
    isCancelingSubscription: false,
    isTrialActive: false,
    expandedMembershipId: "membership-1",
    expandedGymIdMemberships: "gym-1",
    expandedGymIdPayments: null,
    changePlanPlans: [
      {
        id: "plan-2",
        name: "Plano Trimestral",
        type: "quarterly",
        price: 99.9,
        duration: 90,
      },
    ],
    changePlanMembershipId: null,
    isFirstPayment: false,
    cancelDialogOpen: false,
    pixModal: null,
    subscriptionPixModal: null,
    onExpandedMembershipIdChange: () => undefined,
    onExpandedGymIdMembershipsChange: () => undefined,
    onExpandedGymIdPaymentsChange: () => undefined,
    onChangePlanPlansChange: () => undefined,
    onChangePlanMembershipIdChange: () => undefined,
    onCancelDialogOpenChange: () => undefined,
    onPixModalChange: () => undefined,
    onSubscriptionPixModalChange: () => undefined,
    onNavigateToGyms: () => undefined,
    onTabChange: () => undefined,
    onCancelMembership: () => undefined,
    onTrocarPlano: () => undefined,
    onSelectChangePlan: () => undefined,
    onPixConfirmed: async () => undefined,
    onPayNow: () => undefined,
    onCancelPayment: () => undefined,
    onStartTrial: async () => undefined,
    onUpgrade: async () => undefined,
    onApplyReferralStudent: async () => ({ error: "noop" }),
    checkSubscriptionIsActive: async () => true,
    onCancelConfirm: async () => undefined,
    getStudentPaymentStatus: async () => "paid",
    refetchSubscription: async () => undefined,
    ...overrides,
  };
}
