import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { LandingFooter } from "@/components/marketing/landing-footer";

const meta = {
  title: "Marketing/LandingFooter",
  component: LandingFooter,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof LandingFooter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("GymRats")).toBeVisible();
    await expect(canvas.getByRole("link", { name: /Comecar agora/i })).toBeVisible();
    await expect(canvas.getByRole("link", { name: /Termos/i })).toBeVisible();
  },
};
