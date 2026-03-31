import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { PlanCard } from "@/components/organisms/sections/subscription/plan-card";
import type { SubscriptionPlan } from "@/components/organisms/sections/subscription-section";

const premiumPlan: SubscriptionPlan = {
  id: "premium",
  name: "premium",
  monthlyPrice: 199,
  annualPrice: 1899,
  features: ["Analytics", "IA", "CRM"],
  perStudentPrice: 7.5,
  perPersonalPrice: 19.9,
};

const meta = {
  title: "Organisms/Sections/Subscription/PlanCard",
  component: PlanCard.Simple,
  tags: ["autodocs"],
  args: {
    plan: premiumPlan,
    isSelected: true,
    onSelect: () => undefined,
    billingPeriod: "monthly",
    userType: "gym",
    plansCount: 3,
    texts: { perMonth: "por mes" },
  },
} satisfies Meta<typeof PlanCard.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MonthlyGym: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/premium/i)).toBeVisible();
    await expect(canvas.getByText(/R\$ 199/i)).toBeVisible();
  },
};

export const AnnualEnterprise: Story = {
  args: {
    plan: {
      id: "enterprise",
      name: "enterprise",
      monthlyPrice: 599,
      annualPrice: 5990,
      features: ["Tudo do Premium"],
    },
    billingPeriod: "annual",
  },
};
