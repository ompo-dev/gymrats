import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import {
  createGymDashboardFixture,
  GymDashboardScreen,
} from "@/components/screens/gym";

const meta = {
  title: "Screens/GymDashboardScreen",
  component: GymDashboardScreen,
  tags: ["autodocs"],
  args: createGymDashboardFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GymDashboardScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("gym-dashboard-screen")).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  },
};

export const PastDue: Story = {
  args: createGymDashboardFixture({
    subscription: {
      id: "subscription-1",
      plan: "premium",
      status: "past_due",
      currentPeriodEnd: new Date("2026-04-20T00:00:00.000Z"),
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Assinatura Atrasada/i)).toBeVisible();
  },
};
