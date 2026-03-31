import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, within } from "storybook/test";
import { Modal } from "./modal";

const meta = {
  title: "Organisms/Modals/Modal",
  component: Modal.Root,
  tags: ["autodocs"],
  args: {
    isOpen: true,
    onClose: fn(),
    children: undefined,
    maxWidth: "max-w-lg",
    zIndex: "z-50",
  },
} satisfies Meta<typeof Modal.Root>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Modal.Root {...args}>
      <Modal.Header title="Editar unidade" onClose={args.onClose}>
        <p className="mt-2 text-sm text-duo-gray-dark">
          Ajuste os dados sem sair do fluxo atual.
        </p>
      </Modal.Header>
      <Modal.Content>
        <div className="space-y-3">
          <div className="rounded-2xl bg-[var(--duo-bg-card)] p-4 ring-1 ring-[var(--duo-border)]">
            Nome da unidade
          </div>
          <div className="rounded-2xl bg-[var(--duo-bg-card)] p-4 ring-1 ring-[var(--duo-border)]">
            Cronograma semanal
          </div>
        </div>
      </Modal.Content>
    </Modal.Root>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Editar unidade/i)).toBeVisible();
    await expect(canvas.getByText(/Cronograma semanal/i)).toBeVisible();
  },
};
