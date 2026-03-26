import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { DuoCard, DuoTabs } from "@/components/duo";

const meta = {
  title: "Molecules/DuoTabs",
  component: DuoTabs.Simple,
  tags: ["autodocs"],
  args: {
    tabs: [],
  },
} satisfies Meta<typeof DuoTabs.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Simple: Story = {
  args: {
    tabs: [],
  },
  render: () => (
    <DuoTabs.Simple
      variant="pill"
      tabs={[
        {
          id: "overview",
          label: "Visão Geral",
          content: (
            <DuoCard.Root padding="md">
              <p className="text-sm text-[var(--duo-fg-muted)]">
                Estado base para a visão consolidada da unidade.
              </p>
            </DuoCard.Root>
          ),
        },
        {
          id: "activity",
          label: "Atividade",
          content: (
            <DuoCard.Root padding="md">
              <p className="text-sm text-[var(--duo-fg-muted)]">
                Estado detalhado para movimentos recentes e telemetria.
              </p>
            </DuoCard.Root>
          ),
        },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("tab", { name: "Atividade" }));
    await expect(canvas.getByText(/telemetria/i)).toBeVisible();
  },
};

export const Composed: Story = {
  args: {
    tabs: [],
  },
  render: () => (
    <DuoTabs.Root defaultValue="dashboard" variant="underline">
      <DuoTabs.List>
        <DuoTabs.Trigger value="dashboard">Dashboard</DuoTabs.Trigger>
        <DuoTabs.Trigger value="students">Alunos</DuoTabs.Trigger>
      </DuoTabs.List>
      <DuoTabs.Content value="dashboard">
        <DuoCard.Root padding="md">
          <p className="text-sm text-[var(--duo-fg-muted)]">
            Conteúdo do dashboard.
          </p>
        </DuoCard.Root>
      </DuoTabs.Content>
      <DuoTabs.Content value="students">
        <DuoCard.Root padding="md">
          <p className="text-sm text-[var(--duo-fg-muted)]">
            Conteúdo da listagem de alunos.
          </p>
        </DuoCard.Root>
      </DuoTabs.Content>
    </DuoTabs.Root>
  ),
};
