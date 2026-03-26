import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { DuoAlert } from "@/components/duo";

const meta = {
  title: "Atoms/DuoAlert",
  component: DuoAlert,
  tags: ["autodocs"],
  args: {
    variant: "info",
    title: "Aviso operacional",
    children: "A sincronizacao com o painel web foi concluida.",
  },
} satisfies Meta<typeof DuoAlert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toBeVisible();
    await expect(canvas.getByText(/sincronizacao/i)).toBeVisible();
  },
};

export const Variants: Story = {
  render: () => (
    <div className="grid gap-3">
      <DuoAlert variant="info" title="Info">
        Painel carregado com dados atuais.
      </DuoAlert>
      <DuoAlert variant="success" title="Success">
        Treino salvo com sucesso.
      </DuoAlert>
      <DuoAlert variant="warning" title="Warning">
        Alguns dados ainda estao pendentes.
      </DuoAlert>
      <DuoAlert variant="danger" title="Danger">
        Falha ao validar a sessao local.
      </DuoAlert>
    </div>
  ),
};
