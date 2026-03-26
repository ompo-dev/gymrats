import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { SubscriptionStatus } from "@/components/organisms/sections/subscription/subscription-status";

const texts = {
  subscriptionStatusTitle: "Status da assinatura",
  trialDaysRemaining: "dias restantes",
  trialValidUntil: "Valido ate",
  cancelTrialButton: "Cancelar trial",
  cancelSubscriptionButton: "Cancelar assinatura",
  nextRenewal: "Proxima renovacao",
};

const meta = {
  title: "Organisms/Sections/Subscription/SubscriptionStatus",
  component: SubscriptionStatus.Simple,
  tags: ["autodocs"],
  args: {
    subscription: {
      plan: "premium",
      status: "active",
      currentPeriodEnd: "2026-04-26",
      activeStudents: 148,
      activePersonals: 7,
      basePrice: 199,
      pricePerStudent: 7.5,
      pricePerPersonal: 19.9,
      totalAmount: 1445.8,
      billingPeriod: "monthly",
    },
    userType: "gym",
    texts,
    isCanceled: false,
    hasTrial: false,
    isTrialActive: false,
    isPremiumActive: true,
    isPendingPayment: false,
    daysRemaining: null,
    isLoading: false,
    onStartTrial: async () => undefined,
    onCancel: async () => undefined,
  },
} satisfies Meta<typeof SubscriptionStatus.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ActiveGym: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Status da assinatura/i)).toBeVisible();
    await expect(canvas.getByText(/148/)).toBeVisible();
  },
};

export const TrialingStudent: Story = {
  args: {
    subscription: {
      plan: "premium",
      status: "trialing",
      trialEnd: "2026-04-02",
      daysRemaining: 7,
    },
    userType: "student",
    isCanceled: false,
    hasTrial: true,
    isTrialActive: true,
    isPremiumActive: false,
  },
};
