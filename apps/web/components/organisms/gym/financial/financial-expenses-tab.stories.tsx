import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { gymFinancialFixture, personalFinancialFixture } from "./financial-story-fixtures";
import { FinancialExpensesTab } from "./financial-expenses-tab";

const meta = {
  title: "Organisms/Gym/Financial/FinancialExpensesTab",
  component: FinancialExpensesTab,
  tags: ["autodocs"],
  args: {
    expenses: gymFinancialFixture.expenses,
    variant: "gym",
  },
} satisfies Meta<typeof FinancialExpensesTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Despesas do Mes/i)).toBeVisible();
    await expect(canvas.getByText(/Aluguel da unidade principal/i)).toBeVisible();
    await expect(canvas.getByText(/Total de Despesas/i)).toBeVisible();
  },
};

export const PersonalVariant: Story = {
  args: {
    expenses: personalFinancialFixture.expenses,
    variant: "personal",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(/Ferramentas e assinatura de gestao/i),
    ).toBeVisible();
  },
};

export const Empty: Story = {
  args: {
    expenses: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(/Nenhuma despesa registrada/i),
    ).toBeVisible();
  },
};
