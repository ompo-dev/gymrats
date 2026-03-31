import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { gymPaymentsFixture } from "./financial-story-fixtures";
import { FinancialPaymentsTab } from "./financial-payments-tab";

const meta = {
  title: "Organisms/Gym/Financial/FinancialPaymentsTab",
  component: FinancialPaymentsTab,
  tags: ["autodocs"],
  args: {
    payments: gymPaymentsFixture,
  },
} satisfies Meta<typeof FinancialPaymentsTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Ana Souza/i)).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /Ana Souza/i }));
    await expect(canvas.getByText(/Plano Trimestral/i)).toBeVisible();
  },
};

export const Empty: Story = {
  args: {
    payments: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(/Nenhum pagamento registrado/i),
    ).toBeVisible();
  },
};
