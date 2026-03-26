import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import {
  createGymDashboardFixture,
} from "@/components/screens/gym";
import {
  GymDashboardPage,
  type GymDashboardPageProps,
} from "./gym-dashboard";

function createGymDashboardPageFixture(
  overrides: Partial<GymDashboardPageProps> = {},
): GymDashboardPageProps {
  const { onOpenCheckIn: _onOpenCheckIn, ...screenArgs } =
    createGymDashboardFixture();

  return {
    ...screenArgs,
    ...overrides,
  };
}

const meta = {
  title: "Organisms/Gym/GymDashboardPage",
  component: GymDashboardPage,
  args: createGymDashboardPageFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GymDashboardPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/GymRats Paulista/i)).toBeVisible();
    await expect(canvas.getByText(/Check-in rapido/i)).toBeVisible();
  },
};

export const WithoutRecentCheckins: Story = {
  args: createGymDashboardPageFixture({
    recentCheckIns: [],
  }),
};
