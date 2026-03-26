import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { LandingNavbar } from "@/components/marketing/landing-navbar";

const meta = {
  title: "Marketing/LandingNavbar",
  component: LandingNavbar,
  tags: ["autodocs"],
  args: {
    viewMode: "student",
    onViewModeChange: () => {},
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof LandingNavbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const StudentMode: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("GymRats")).toBeVisible();
    await expect(canvas.getByRole("link", { name: /Entrar/i })).toBeVisible();
  },
};

export const GymMode: Story = {
  args: {
    viewMode: "gym",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getAllByRole("button")[1]);
    await expect(canvas.getByRole("link", { name: /Entrar/i })).toBeVisible();
  },
};
