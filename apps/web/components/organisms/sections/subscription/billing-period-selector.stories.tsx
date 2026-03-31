import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { BillingPeriodSelector } from "@/components/organisms/sections/subscription/billing-period-selector";

function BillingPeriodSelectorStory() {
  const [selectedPeriod, setSelectedPeriod] = useState<"monthly" | "annual">(
    "monthly",
  );

  return (
    <BillingPeriodSelector.Simple
      selectedPeriod={selectedPeriod}
      onSelect={setSelectedPeriod}
      monthlyLabel="Mensal"
      annualLabel="Anual"
      perMonth="R$ 99 por mes"
      perYear="R$ 999 por ano"
      annualDiscount={16}
    />
  );
}

const meta = {
  title: "Organisms/Sections/Subscription/BillingPeriodSelector",
  component: BillingPeriodSelectorStory,
  tags: ["autodocs"],
} satisfies Meta<typeof BillingPeriodSelectorStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: () => <BillingPeriodSelectorStory />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Mensal")).toBeVisible();
    await userEvent.click(canvas.getByText("Anual"));
    await expect(canvas.getByText(/Economize 16%/i)).toBeVisible();
  },
};
