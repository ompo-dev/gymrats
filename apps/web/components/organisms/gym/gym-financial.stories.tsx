import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { createGymFinancialFixture } from "@/components/screens/gym";
import { GymFinancialPage } from "./gym-financial";

function createGymFinancialPageFixture() {
  const fixture = createGymFinancialFixture();

  return {
    financialSummary: fixture.financialSummary,
    payments: fixture.payments,
    coupons: fixture.coupons,
    campaigns: fixture.campaigns,
    plans: fixture.plans,
    expenses: fixture.expenses,
    balanceReais: fixture.balanceWithdraws?.balanceReais ?? 0,
    balanceCents: fixture.balanceWithdraws?.balanceCents ?? 0,
    withdraws: fixture.balanceWithdraws?.withdraws ?? [],
    subscription: fixture.subscription,
  };
}

const meta = {
  title: "Organisms/Gym/GymFinancialPage",
  component: GymFinancialPage,
  args: createGymFinancialPageFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GymFinancialPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Gestao Financeira/i)).toBeVisible();
    await expect(canvas.getByText(/Categoria/i)).toBeVisible();
  },
};

export const EmptyOverview: Story = {
  args: {
    ...createGymFinancialPageFixture(),
    financialSummary: null,
  },
};
