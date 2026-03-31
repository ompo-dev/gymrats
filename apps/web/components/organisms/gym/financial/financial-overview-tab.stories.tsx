import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import {
  activeGymSubscriptionFixture,
  gymFinancialFixture,
  gymPaymentsFixture,
} from "./financial-story-fixtures";
import { FinancialOverviewTab } from "./financial-overview-tab";

const meta = {
  title: "Organisms/Gym/Financial/FinancialOverviewTab",
  component: FinancialOverviewTab,
  tags: ["autodocs"],
  args: {
    financialSummary: gymFinancialFixture.financialSummary ?? undefined,
    payments: gymPaymentsFixture,
    subscription: activeGymSubscriptionFixture,
    balanceReais: gymFinancialFixture.balanceWithdraws?.balanceReais ?? 0,
    balanceCents: gymFinancialFixture.balanceWithdraws?.balanceCents ?? 0,
    withdraws: gymFinancialFixture.balanceWithdraws?.withdraws ?? [],
    fakeWithdraw: true,
    showWithdraw: true,
    disableWithdraw: true,
  },
} satisfies Meta<typeof FinancialOverviewTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Saldo disponivel/i)).toBeVisible();
    await expect(canvas.getByText(/Receita Total/i)).toBeVisible();
    await expect(canvas.getByText(/Saques/i)).toBeVisible();
  },
};

export const PastDue: Story = {
  args: {
    subscription: {
      ...activeGymSubscriptionFixture,
      status: "past_due",
    },
    disableWithdraw: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Assinatura Atrasada/i)).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /Sacar/i }));
    await expect(canvas.getByText(/^Sacar$/i)).toBeVisible();
  },
};

export const NoWithdraw: Story = {
  args: {
    showWithdraw: false,
    withdraws: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Metricas do Mes/i)).toBeVisible();
  },
};
