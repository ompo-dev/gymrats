import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, within } from "storybook/test";
import { gymStudentPaymentsFixture } from "./gym-student-detail-story-fixtures";
import { PaymentsTab } from "./payments-tab";

const meta = {
  title: "Organisms/Gym/StudentDetail/PaymentsTab",
  component: PaymentsTab,
  tags: ["autodocs"],
  args: {
    payments: gymStudentPaymentsFixture,
    onSettlePayment: fn(),
  },
} satisfies Meta<typeof PaymentsTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Plano Premium/i)).toBeVisible();
    await expect(canvas.getByText(/Pagamentos e acesso/i)).toBeVisible();
  },
};

export const Empty: Story = {
  args: {
    payments: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Pagamentos/i)).toBeVisible();
  },
};
