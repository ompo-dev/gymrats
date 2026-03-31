import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import { SubscriptionCancelDialog } from "./subscription-cancel-dialog";

const meta = {
  title: "Organisms/Modals/SubscriptionCancelDialog",
  component: SubscriptionCancelDialog.Simple,
  tags: ["autodocs"],
  args: {
    open: true,
    onOpenChange: fn(),
    onConfirm: fn(),
    isTrial: false,
    isLoading: false,
  },
} satisfies Meta<typeof SubscriptionCancelDialog.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SubscriptionCancel: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Cancelar Assinatura/i)).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /Cancelar Assinatura/i }));
    await expect(args.onConfirm).toHaveBeenCalled();
  },
};

export const TrialCancel: Story = {
  args: {
    isTrial: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Cancelar Trial/i)).toBeVisible();
  },
};
