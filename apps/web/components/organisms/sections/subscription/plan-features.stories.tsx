import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { PlanFeatures } from "@/components/organisms/sections/subscription/plan-features";

const meta = {
  title: "Organisms/Sections/Subscription/PlanFeatures",
  component: PlanFeatures,
  tags: ["autodocs"],
  args: {
    features: [
      "Dashboard financeiro completo",
      "Treinos com IA",
      "Suporte prioritario",
    ],
  },
} satisfies Meta<typeof PlanFeatures>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Dashboard financeiro completo/i)).toBeVisible();
    await expect(canvas.getByText(/Treinos com IA/i)).toBeVisible();
  },
};
