import type { Meta, StoryObj } from "@storybook/react";
import { BarChart3 } from "lucide-react";
import { expect, within } from "storybook/test";
import { NavigationButtonCard } from "@/components/ui/navigation-button-card";

const meta = {
  title: "UI/NavigationButtonCard",
  component: NavigationButtonCard,
  args: {
    icon: BarChart3,
    title: "Financeiro",
    description: "Acompanhe receita, margem e inadimplencia.",
    color: "duo-blue",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof NavigationButtonCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Financeiro")).toBeVisible();
    await expect(canvas.getByText(/inadimplencia/i)).toBeVisible();
  },
};
