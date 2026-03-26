import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

const meta = {
  title: "UI/Toast",
  component: Toast,
  tags: ["autodocs"],
} satisfies Meta<typeof Toast>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ToastProvider>
      <Toast open>
        <div className="grid gap-1">
          <ToastTitle>Plano atualizado</ToastTitle>
          <ToastDescription>Seu upgrade foi confirmado com sucesso.</ToastDescription>
        </div>
        <ToastAction altText="Desfazer">Desfazer</ToastAction>
        <ToastClose />
      </Toast>
      <ToastViewport />
    </ToastProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    await expect(canvas.getByText(/Plano atualizado/i)).toBeVisible();
    await expect(canvas.getByText(/upgrade foi confirmado/i)).toBeVisible();
  },
};
