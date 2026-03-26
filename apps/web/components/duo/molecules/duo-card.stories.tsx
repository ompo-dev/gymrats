import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { DuoBadge, DuoButton, DuoCard } from "@/components/duo";

const meta = {
  title: "Molecules/DuoCard",
  component: DuoCard.Root,
  tags: ["autodocs"],
  args: {
    padding: "md",
  },
} satisfies Meta<typeof DuoCard.Root>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <DuoCard.Root {...args}>
      <DuoCard.Header>
        <h3 className="text-lg font-bold text-[var(--duo-fg)]">Resumo</h3>
        <DuoBadge variant="success">Ativo</DuoBadge>
      </DuoCard.Header>
      <DuoCard.Content>
        <p className="text-sm text-[var(--duo-fg-muted)]">
          Container base para blocos reutilizaveis.
        </p>
      </DuoCard.Content>
    </DuoCard.Root>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Resumo")).toBeVisible();
    await expect(canvas.getByText(/reutilizaveis/i)).toBeVisible();
  },
};

export const WithFooter: Story = {
  render: () => (
    <DuoCard.Root variant="interactive">
      <DuoCard.Header>
        <h3 className="text-lg font-bold text-[var(--duo-fg)]">
          Composicao completa
        </h3>
      </DuoCard.Header>
      <DuoCard.Content>
        <p className="text-sm text-[var(--duo-fg-muted)]">
          Header, content e footer separados.
        </p>
      </DuoCard.Content>
      <DuoCard.Footer>
        <DuoButton size="sm">Salvar</DuoButton>
        <DuoButton size="sm" variant="outline">
          Cancelar
        </DuoButton>
      </DuoCard.Footer>
    </DuoCard.Root>
  ),
};
