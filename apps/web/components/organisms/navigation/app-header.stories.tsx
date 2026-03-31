import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { AppHeader } from "@/components/organisms/navigation/app-header";

const meta = {
  title: "Organisms/Navigation/AppHeader",
  component: AppHeader.Simple,
  tags: ["autodocs"],
  args: {
    userType: "student",
    stats: {
      streak: 14,
      xp: 1840,
      level: 12,
    },
    showLogo: true,
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AppHeader.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Student: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("GymRats")).toBeVisible();
    await expect(canvas.getByRole("button", { name: /14/i })).toBeVisible();
  },
};

export const Personal: Story = {
  args: {
    userType: "personal",
    stats: {
      streak: 0,
      xp: 3200,
      level: 18,
    },
  },
};
