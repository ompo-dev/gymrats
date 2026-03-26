import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import { gymStudentPaymentsFixture } from "./gym-student-detail-story-fixtures";
import { PaymentsTab } from "./payments-tab";

const meta = {
  title: "Organisms/Gym/StudentDetail/PaymentsTab",
  component: PaymentsTab,
  tags: ["autodocs"],
  args: {
    payments: gymStudentPaymentsFixture,
    onTogglePaymentStatus: fn(),
  },
} satisfies Meta<typeof PaymentsTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Plano Premium/i)).toBeVisible();
    await expect(canvas.getByText(/Historico de Pagamentos/i)).toBeVisible();
  },
};

export const Expanded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: /Plano Premium/i }),
    );
    await expect(canvas.getByText(/149\\.90/i)).toBeVisible();
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
