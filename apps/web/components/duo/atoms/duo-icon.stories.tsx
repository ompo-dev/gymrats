import { Flame, Target, TrendingUp } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { DuoIcon } from "@/components/duo";

const meta = {
  title: "Atoms/DuoIcon",
  component: DuoIcon,
  tags: ["autodocs"],
  args: {
    icon: Target,
    size: "md",
    color: "primary",
    "aria-label": "Target icon",
  },
} satisfies Meta<typeof DuoIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText("Target icon")).toBeVisible();
  },
};

export const SizesAndColors: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <DuoIcon aria-label="xs" color="muted" icon={Target} size="xs" />
      <DuoIcon aria-label="sm" color="secondary" icon={TrendingUp} size="sm" />
      <DuoIcon aria-label="md" color="primary" icon={Target} size="md" />
      <DuoIcon aria-label="lg" color="accent" icon={Flame} size="lg" />
      <DuoIcon aria-label="xl" color="success" icon={TrendingUp} size="xl" />
    </div>
  ),
};
