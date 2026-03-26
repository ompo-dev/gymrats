import type { Meta, StoryObj } from "@storybook/react";
import { PlusCircle } from "lucide-react";
import { expect, within } from "storybook/test";
import { DuoButton } from "@/components/duo";
import { DashboardSection } from "./dashboard-section";

const meta = {
  title: "Organisms/Shared/DashboardSection",
  component: DashboardSection.Root,
  args: {
    title: "Atalhos rapidos",
    description: "Acao operacional de uso diario.",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof DashboardSection.Root>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <DashboardSection.Root
      {...args}
      icon={<PlusCircle className="size-4 text-[var(--duo-primary)]" />}
      action={<DuoButton size="sm">Novo</DuoButton>}
    >
      <DashboardSection.List>
        <div className="rounded-2xl border border-[var(--duo-border)] p-4 text-sm">
          Criar plano promocional
        </div>
        <div className="rounded-2xl border border-[var(--duo-border)] p-4 text-sm">
          Revisar alunos inativos
        </div>
      </DashboardSection.List>
    </DashboardSection.Root>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Atalhos rapidos/i)).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Novo" })).toBeVisible();
  },
};

export const Empty: Story = {
  render: () => (
    <DashboardSection.Root title="Campanhas" description="Nada pendente hoje.">
      <DashboardSection.Empty>Nenhuma campanha configurada.</DashboardSection.Empty>
    </DashboardSection.Root>
  ),
};
