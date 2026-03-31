import { Flame, TrendingUp, Trophy } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { DuoStatCard } from "@/components/duo";

const meta = {
  title: "Molecules/DuoStatCard",
  component: DuoStatCard.Simple,
  tags: ["autodocs"],
  args: {
    icon: TrendingUp,
    value: 128,
    label: "Treinos no mes",
    badge: "+12%",
  },
} satisfies Meta<typeof DuoStatCard.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("128")).toBeVisible();
    await expect(canvas.getByText(/Treinos no mes/i)).toBeVisible();
  },
};

export const Matrix: Story = {
  render: () => (
    <div className="grid gap-3 md:grid-cols-3">
      <DuoStatCard.Simple
        badge="Recorde"
        icon={Flame}
        iconColor="var(--duo-accent)"
        label="Sequencia"
        value={21}
      />
      <DuoStatCard.Simple
        badge="Meta"
        icon={Trophy}
        iconColor="var(--duo-secondary)"
        label="Nivel"
        value="#7"
      />
      <DuoStatCard.Simple
        badge="+8%"
        icon={TrendingUp}
        iconColor="var(--duo-primary)"
        label="Receita"
        value="R$ 42k"
      />
    </div>
  ),
};
