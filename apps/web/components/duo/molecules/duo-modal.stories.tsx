import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { DuoButton, DuoModal } from "@/components/duo";

const meta = {
  title: "Molecules/DuoModal",
  component: DuoModal.Simple,
  tags: ["autodocs"],
  args: {
    isOpen: true,
    onClose: () => {},
    title: "Editar membro",
    children: "Conteudo interno do modal.",
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof DuoModal.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    await expect(canvas.getByRole("dialog")).toBeVisible();
    await expect(canvas.getByText(/Conteudo interno/i)).toBeVisible();
  },
};

export const Composed: Story = {
  render: () => (
    <DuoModal.Root isOpen onClose={() => {}} size="lg">
      <DuoModal.Header onClose={() => {}} title="Fluxo composto" />
      <DuoModal.Content className="space-y-4">
        <p className="text-sm text-[var(--duo-fg-muted)]">
          Slots separados para header e content.
        </p>
        <DuoButton>Acao primaria</DuoButton>
      </DuoModal.Content>
    </DuoModal.Root>
  ),
  parameters: {
    layout: "fullscreen",
  },
};
