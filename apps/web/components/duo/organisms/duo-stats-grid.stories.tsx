import { Flame, Trophy, Users } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { DuoStatCard, DuoStatsGrid } from "@/components/duo";

const meta = {
  title: "Organisms/DuoStatsGrid",
  component: DuoStatsGrid.Root,
  tags: ["autodocs"],
} satisfies Meta<typeof DuoStatsGrid.Root>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: undefined,
  },
  render: () => (
    <DuoStatsGrid.Root columns={3}>
      <DuoStatCard.Simple badge="+4" icon={Users} label="Alunos ativos" value={164} />
      <DuoStatCard.Simple badge="Atual" icon={Flame} label="Streak" value={21} />
      <DuoStatCard.Simple badge="Top 3" icon={Trophy} label="Ranking" value="#3" />
    </DuoStatsGrid.Root>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("164")).toBeVisible();
    await expect(canvas.getByText("Streak")).toBeVisible();
  },
};
