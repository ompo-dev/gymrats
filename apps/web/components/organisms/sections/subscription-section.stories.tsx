import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { SubscriptionSection } from "@/components/organisms/sections/subscription-section";

const plans = [
  {
    id: "basic",
    name: "basic",
    monthlyPrice: 49,
    annualPrice: 490,
    features: ["Check-ins", "Perfil publico"],
  },
  {
    id: "premium",
    name: "premium",
    monthlyPrice: 89,
    annualPrice: 890,
    features: ["Tudo do basic", "Relatorios", "Acesso premium"],
  },
] as Parameters<typeof SubscriptionSection.Simple>[0]["plans"];

const meta = {
  title: "Organisms/Sections/SubscriptionSection",
  component: SubscriptionSection.Simple,
  tags: ["autodocs"],
  args: {
    userType: "student",
    plans,
    onStartTrial: async () => undefined,
    onSubscribe: async () => undefined,
    onCancel: async () => undefined,
  },
} satisfies Meta<typeof SubscriptionSection.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NoSubscription: Story = {
  args: {
    subscription: null,
    showPlansWhen: "always",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Experimente 14 dias/i)).toBeVisible();
    await expect(canvas.getByText(/Escolha seu Plano/i)).toBeVisible();
  },
};

export const ActivePremium: Story = {
  args: {
    userType: "gym",
    subscription: {
      id: "sub-1",
      plan: "premium",
      status: "active",
      currentPeriodEnd: "2026-04-26",
      billingPeriod: "monthly",
      activeStudents: 112,
      activePersonals: 4,
      basePrice: 199,
      pricePerStudent: 7.5,
      pricePerPersonal: 19.9,
      totalAmount: 1118.1,
    } as NonNullable<Parameters<typeof SubscriptionSection.Simple>[0]["subscription"]>,
    plans: [
      {
        id: "premium",
        name: "premium",
        monthlyPrice: 199,
        annualPrice: 1899,
        features: ["Tudo do basic", "Financeiro"],
        perStudentPrice: 7.5,
        perPersonalPrice: 19.9,
      },
      {
        id: "enterprise",
        name: "enterprise",
        monthlyPrice: 399,
        annualPrice: 3990,
        features: ["Tudo do premium", "Multiunidade"],
      },
    ],
  },
};
