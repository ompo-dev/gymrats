import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { PlansSelector } from "@/components/organisms/sections/subscription/plans-selector";
import type { SubscriptionPlan } from "@/components/organisms/sections/subscription-section";

const plans: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "basic",
    monthlyPrice: 99,
    annualPrice: 999,
    features: ["Check-ins", "Dashboard basico"],
  },
  {
    id: "premium",
    name: "premium",
    monthlyPrice: 199,
    annualPrice: 1899,
    features: ["Tudo do Basic", "Financeiro", "Automacoes"],
  },
  {
    id: "enterprise",
    name: "enterprise",
    monthlyPrice: 399,
    annualPrice: 3990,
    features: ["Tudo do Premium", "Multiunidade", "Suporte dedicado"],
  },
];

function PlansSelectorStory() {
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<
    "monthly" | "annual"
  >("monthly");

  return (
    <div className="max-w-4xl">
      <PlansSelector.Simple
        userType="gym"
        plans={plans}
        selectedPlan={selectedPlan}
        onSelectPlan={setSelectedPlan}
        selectedBillingPeriod={selectedBillingPeriod}
        onSelectBillingPeriod={setSelectedBillingPeriod}
        isPremiumActive={false}
        isTrialActive={false}
        annualDiscount={16}
        texts={{
          upgradeTitle: "Upgrade",
          choosePlanTitle: "Escolha seu plano",
          subscribeButton: "Assinar agora",
          monthlyLabel: "Mensal",
          annualLabel: "Anual",
          perMonth: "por mes",
          perYear: "por ano",
        }}
        isLoading={false}
        onSubscribe={() => undefined}
      />
    </div>
  );
}

const meta = {
  title: "Organisms/Sections/Subscription/PlansSelector",
  component: PlansSelectorStory,
  tags: ["autodocs"],
} satisfies Meta<typeof PlansSelectorStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: () => <PlansSelectorStory />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Escolha seu plano/i)).toBeVisible();
    await userEvent.click(canvas.getByText("Anual"));
    await expect(canvas.getByRole("button", { name: /Assinar agora/i })).toBeVisible();
  },
};
